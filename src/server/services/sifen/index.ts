import { createHash, randomInt } from 'node:crypto';
import { and, asc, desc, eq, isNull, or } from 'drizzle-orm';
import type { DbLike } from '@/db';
import {
  configuracionSifen,
  empresas,
  facturasVenta,
  facturaVentaDetalles,
  sifenEventos,
  sucursales,
  cuotasVenta,
} from '@/db/schema';
import { formatearNumeroFactura, generarCdc, parametrosQr } from '../../fiscal/sifen';
import type { Ctx } from '../../lib/contexto';
import { asegurar } from '../../lib/result';
import { getAdaptadorSifen, type AdaptadorSifen } from './adaptador';

type FacturaVenta = typeof facturasVenta.$inferSelect;
type EstadoSifen = FacturaVenta['estado_sifen'];

export async function configuracionSifenDe(db: DbLike, empresaId: number, sucursalId: number) {
  const filas = await db
    .select()
    .from(configuracionSifen)
    .where(
      and(
        eq(configuracionSifen.empresa_id, empresaId),
        eq(configuracionSifen.activo, true),
        or(isNull(configuracionSifen.sucursal_id), eq(configuracionSifen.sucursal_id, sucursalId)),
      ),
    );
  return filas.find((f) => f.sucursal_id === sucursalId) ?? filas.find((f) => f.sucursal_id === null) ?? null;
}

/** Código de seguridad aleatorio de 9 dígitos (no secuencial). */
export const codigoSeguridad = () => String(randomInt(1, 999_999_999)).padStart(9, '0');

const escaparXml = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** XML simplificado del DE (sin firma): placeholder para el adaptador real. */
export function construirXmlDe(
  f: FacturaVenta,
  empresa: typeof empresas.$inferSelect,
  items: (typeof facturaVentaDetalles.$inferSelect)[],
): string {
  const it = items
    .map(
      (i) =>
        `<gCamItem><dCodInt>${i.articulo_id}</dCodInt><dDesProSer>${escaparXml(i.descripcion)}</dDesProSer><dCantProSer>${i.cantidad}</dCantProSer><dPUniProSer>${i.precio_unitario_gs}</dPUniProSer><dDescItem>${i.descuento_gs}</dDescItem><dTotOpeItem>${i.total_linea_gs}</dTotOpeItem><dLiqIVAItem>${i.iva_gs}</dLiqIVAItem></gCamItem>`,
    )
    .join('');
  return (
    `<?xml version="1.0" encoding="UTF-8"?><rDE><DE Id="${f.cdc}"><dFecFirma>${new Date().toISOString()}</dFecFirma>` +
    `<gTimb><iTiDE>1</iTiDE><dNumTim>${f.timbrado}</dNumTim><dEst>${f.establecimiento}</dEst><dPunExp>${f.punto_expedicion}</dPunExp><dNumDoc>${String(f.numero).padStart(7, '0')}</dNumDoc></gTimb>` +
    `<gEmis><dRucEm>${empresa.ruc}</dRucEm><dDVEmi>${empresa.dv}</dDVEmi><dNomEmi>${escaparXml(empresa.razon_social)}</dNomEmi></gEmis>` +
    `<gDatRec><dNomRec>${escaparXml(f.receptor_razon_social)}</dNomRec>${f.receptor_es_contribuyente ? `<dRucRec>${f.receptor_numero_documento}</dRucRec><dDVRec>${f.receptor_dv ?? ''}</dDVRec>` : `<dNumIDRec>${f.receptor_numero_documento ?? '0'}</dNumIDRec>`}</gDatRec>` +
    `<gDtipDE>${it}</gDtipDE><gTotSub><dTotGralOpe>${f.total_gs}</dTotGralOpe><dTotIVA>${f.total_iva_gs}</dTotIVA></gTotSub></DE></rDE>`
  );
}

/** Calcula CDC, código de seguridad, URL QR y XML para una factura ya numerada (dentro de la tx de confirmación). */
export async function prepararDocumentoElectronico(
  tx: DbLike,
  f: FacturaVenta,
  items: (typeof facturaVentaDetalles.$inferSelect)[],
  fechaEmision: string,
) {
  const [empresa] = await tx.select().from(empresas).where(eq(empresas.id, f.empresa_id));
  const config = await configuracionSifenDe(tx, f.empresa_id, f.sucursal_id);
  const codSeg = codigoSeguridad();
  const tipoContribuyente: 1 | 2 = /\b(S\.?A\.?|S\.?R\.?L\.?|E\.?A\.?S\.?)\b/i.test(empresa.razon_social) ? 2 : 1;
  const cdc = generarCdc({
    tipoDocumento: f.tipo_documento,
    rucEmisor: empresa.ruc,
    dvEmisor: empresa.dv,
    establecimiento: f.establecimiento!,
    puntoExpedicion: f.punto_expedicion!,
    numero: f.numero!,
    tipoContribuyente,
    fechaEmision,
    tipoEmision: f.tipo_emision === 'contingencia' ? 2 : 1,
    codigoSeguridad: codSeg,
  });
  const conCdc = { ...f, cdc };
  const xml = construirXmlDe(conCdc, empresa, items);
  const digest = createHash('sha256').update(xml).digest('base64');
  const idCsc = config?.id_csc ?? '0001';
  const csc = (config?.csc_ref && process.env[config.csc_ref]) || 'ABCD0000000000000000000000000000';
  const hora = new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Asuncion', hour12: false });
  const params = parametrosQr({
    cdc,
    fechaEmisionIso: `${fechaEmision}T${hora}`,
    rucReceptor: f.receptor_es_contribuyente ? f.receptor_numero_documento : null,
    documentoReceptor: f.receptor_numero_documento,
    totalGs: f.total_gs,
    totalIvaGs: f.total_iva_gs,
    cantidadItems: items.length,
    digestValue: digest,
    idCsc,
  });
  const hash = createHash('sha256').update(params + csc).digest('hex');
  const base = config?.url_qr_base ?? 'https://ekuatia.set.gov.py/consultas-test/qr?';
  return {
    cdc,
    codigoSeguridad: codSeg,
    qrUrl: `${base}${base.endsWith('?') ? '' : '?'}${params}&cHashQR=${hash}`,
    xml,
    ambiente: (config?.ambiente ?? 'test') as 'test' | 'produccion',
  };
}

export async function registrarEventoSifen(
  tx: DbLike,
  f: Pick<FacturaVenta, 'id' | 'empresa_id' | 'sucursal_id' | 'cdc'>,
  e: {
    tipo: (typeof sifenEventos.$inferInsert)['tipo_evento'];
    estado?: EstadoSifen | null;
    codigo?: string | null;
    mensaje?: string | null;
    requestXml?: string | null;
    responseXml?: string | null;
    usuarioId?: number | null;
  },
) {
  await tx.insert(sifenEventos).values({
    empresa_id: f.empresa_id,
    sucursal_id: f.sucursal_id,
    factura_venta_id: f.id,
    cdc: f.cdc,
    tipo_evento: e.tipo,
    estado_sifen_resultante: e.estado ?? null,
    codigo_respuesta: e.codigo ?? null,
    mensaje: e.mensaje ?? null,
    request_xml: e.requestXml ?? null,
    response_xml: e.responseXml ?? null,
    usuario_id: e.usuarioId ?? null,
  });
}

/**
 * Envía (o reenvía) una factura electrónica confirmada a SIFEN por el adaptador.
 * Estados admitidos: pendiente, enviado, rechazado. Registra eventos de envío y respuesta.
 */
export async function enviarFacturaSifen(
  tx: DbLike,
  ctx: Ctx,
  facturaId: number,
  adaptador: AdaptadorSifen = getAdaptadorSifen(),
) {
  const [f] = await tx
    .select()
    .from(facturasVenta)
    .where(and(eq(facturasVenta.id, facturaId), eq(facturasVenta.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(f, 'Factura inexistente');
  asegurar(f.estado === 'confirmado', 'Solo se envían facturas confirmadas');
  asegurar(f.modalidad === 'electronica' && f.cdc, 'La factura no es electrónica');
  asegurar(
    f.estado_sifen === 'pendiente' || f.estado_sifen === 'rechazado' || f.estado_sifen === 'enviado',
    `La factura ya está ${f.estado_sifen} en SIFEN`,
  );
  const config = await configuracionSifenDe(tx, f.empresa_id, f.sucursal_id);
  const xml = f.xml_firmado ?? '';
  await registrarEventoSifen(tx, f, { tipo: 'envio', estado: 'enviado', requestXml: xml, usuarioId: ctx.usuarioId });
  let r;
  try {
    r = await adaptador.enviar({ cdc: f.cdc, xml, ambiente: config?.ambiente ?? 'test' });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    await registrarEventoSifen(tx, f, { tipo: 'error', estado: 'pendiente', mensaje, usuarioId: ctx.usuarioId });
    await tx.update(facturasVenta).set({ estado_sifen: 'pendiente', sifen_mensaje: mensaje }).where(eq(facturasVenta.id, f.id));
    return { id: f.id, estadoSifen: 'pendiente' as EstadoSifen, mensaje };
  }
  await registrarEventoSifen(tx, f, {
    tipo: 'respuesta',
    estado: r.estado,
    codigo: r.codigo,
    mensaje: r.mensaje,
    responseXml: r.responseXml ?? null,
    usuarioId: ctx.usuarioId,
  });
  const aprobado = r.estado === 'aprobado' || r.estado === 'aprobado_con_observacion';
  await tx
    .update(facturasVenta)
    .set({
      estado_sifen: r.estado,
      sifen_codigo_respuesta: r.codigo,
      sifen_mensaje: r.mensaje,
      sifen_lote: r.lote ?? f.sifen_lote,
      sifen_aprobado_en: aprobado ? new Date() : f.sifen_aprobado_en,
    })
    .where(eq(facturasVenta.id, f.id));
  return { id: f.id, estadoSifen: r.estado as EstadoSifen, mensaje: r.mensaje };
}

/** Datos del KuDE (representación gráfica) + bitácora SIFEN, en JSON. */
export async function obtenerKude(db: DbLike, ctx: Pick<Ctx, 'empresaId'>, facturaId: number) {
  const [f] = await db
    .select()
    .from(facturasVenta)
    .where(and(eq(facturasVenta.id, facturaId), eq(facturasVenta.empresa_id, ctx.empresaId)));
  if (!f) return null;
  const [empresa] = await db.select().from(empresas).where(eq(empresas.id, f.empresa_id));
  const [sucursal] = await db.select().from(sucursales).where(eq(sucursales.id, f.sucursal_id));
  const items = await db
    .select()
    .from(facturaVentaDetalles)
    .where(eq(facturaVentaDetalles.factura_venta_id, f.id))
    .orderBy(asc(facturaVentaDetalles.linea));
  const cuotas = await db.select().from(cuotasVenta).where(eq(cuotasVenta.factura_venta_id, f.id)).orderBy(asc(cuotasVenta.numero_cuota));
  const eventos = await db
    .select({
      id: sifenEventos.id,
      tipo_evento: sifenEventos.tipo_evento,
      estado_sifen_resultante: sifenEventos.estado_sifen_resultante,
      codigo_respuesta: sifenEventos.codigo_respuesta,
      mensaje: sifenEventos.mensaje,
      creado_en: sifenEventos.creado_en,
    })
    .from(sifenEventos)
    .where(eq(sifenEventos.factura_venta_id, f.id))
    .orderBy(desc(sifenEventos.id));
  return {
    id: f.id,
    estado: f.estado,
    estadoSifen: f.estado_sifen,
    codigoRespuesta: f.sifen_codigo_respuesta,
    mensaje: f.sifen_mensaje,
    cdc: f.cdc,
    qrUrl: f.qr_url,
    numero: f.numero ? formatearNumeroFactura(f.establecimiento!, f.punto_expedicion!, f.numero) : null,
    timbrado: f.timbrado,
    fechaEmision: f.fecha_emision,
    condicion: f.condicion_operacion,
    emisor: {
      ruc: `${empresa.ruc}-${empresa.dv}`,
      razonSocial: empresa.razon_social,
      nombreFantasia: empresa.nombre_fantasia,
      direccion: sucursal?.direccion ?? empresa.direccion,
      telefono: sucursal?.telefono ?? empresa.telefono,
      email: empresa.email,
    },
    receptor: {
      razonSocial: f.receptor_razon_social,
      documento: f.receptor_es_contribuyente
        ? `${f.receptor_numero_documento}-${f.receptor_dv ?? ''}`
        : f.receptor_numero_documento,
      direccion: f.receptor_direccion,
      email: f.receptor_email,
    },
    items: items.map((i) => ({
      linea: i.linea,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precioUnitarioGs: i.precio_unitario_gs,
      descuentoGs: i.descuento_gs,
      tipoIva: i.tipo_iva,
      totalGs: i.total_linea_gs,
    })),
    cuotas: cuotas.map((c) => ({ numero: c.numero_cuota, vencimiento: c.fecha_vencimiento, montoGs: c.monto_gs })),
    totales: {
      gravada10Gs: f.gravada_10_gs,
      gravada5Gs: f.gravada_5_gs,
      exentaGs: f.exenta_gs,
      iva10Gs: f.iva_10_gs,
      iva5Gs: f.iva_5_gs,
      totalIvaGs: f.total_iva_gs,
      totalDescuentoGs: f.total_descuento_gs,
      totalGs: f.total_gs,
    },
    eventos,
  };
}
