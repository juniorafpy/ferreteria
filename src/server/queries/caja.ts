/** Consultas de Caja (Server Components). */
import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { cajas, cobros, cuentasCobrar, facturasVenta, puntosExpedicion, sesionesCaja, usuarios } from '@/db/schema';
import { ctxDe, requireSesion } from '../auth/session';
import { formatearNumeroFactura } from '../fiscal/sifen';
import { totalesSesion } from '../services/caja';
import { sesionAbiertaDe } from '../services/ventas';
import { filtroCuentasCobrar, type FiltroCuentasCobrar } from '../validation/caja';

/** Cajas de la sucursal con su sesión abierta (si hay). */
export async function listarCajas() {
  const s = await requireSesion();
  return db
    .select({
      id: cajas.id,
      codigo: cajas.codigo,
      nombre: cajas.nombre,
      punto_expedicion_id: cajas.punto_expedicion_id,
      punto_expedicion: puntosExpedicion.codigo,
      deposito_id: cajas.deposito_id,
      estado: cajas.estado,
      sesion_abierta_id: sesionesCaja.id,
      sesion_usuario_id: sesionesCaja.usuario_id,
      sesion_usuario: usuarios.nombre,
      sesion_abierta_en: sesionesCaja.abierta_en,
    })
    .from(cajas)
    .leftJoin(puntosExpedicion, eq(puntosExpedicion.id, cajas.punto_expedicion_id))
    .leftJoin(sesionesCaja, and(eq(sesionesCaja.caja_id, cajas.id), eq(sesionesCaja.estado, 'abierta')))
    .leftJoin(usuarios, eq(usuarios.id, sesionesCaja.usuario_id))
    .where(and(eq(cajas.empresa_id, s.empresaId), eq(cajas.sucursal_id, s.sucursalId)))
    .orderBy(asc(cajas.codigo));
}

/** Sesión abierta del usuario en la sucursal con totales por medio y cobros; null si no hay. */
export async function sesionCajaActual() {
  const s = await requireSesion();
  const r = await sesionAbiertaDe(db, ctxDe(s));
  if (!r) return null;
  const totales = await totalesSesion(db, r.sesion.id);
  const listaCobros = await db
    .select({
      id: cobros.id,
      numero: cobros.numero,
      fecha: cobros.fecha,
      cliente_id: cobros.cliente_id,
      total_gs: cobros.total_gs,
      vuelto_gs: cobros.vuelto_gs,
      estado: cobros.estado,
    })
    .from(cobros)
    .where(eq(cobros.sesion_caja_id, r.sesion.id))
    .orderBy(desc(cobros.id));
  return {
    ...r.sesion,
    caja: r.caja,
    totales,
    efectivoEsperadoGs: r.sesion.monto_apertura_gs + totales.efectivo,
    cobros: listaCobros,
  };
}

export async function listarCuentasCobrar(f?: FiltroCuentasCobrar) {
  const s = await requireSesion();
  const x = filtroCuentasCobrar.parse(f) ?? {};
  const filas = await db
    .select({
      id: cuentasCobrar.id,
      cliente_id: cuentasCobrar.cliente_id,
      cliente: facturasVenta.receptor_razon_social,
      documento: facturasVenta.receptor_numero_documento,
      factura_venta_id: cuentasCobrar.factura_venta_id,
      establecimiento: facturasVenta.establecimiento,
      punto_expedicion: facturasVenta.punto_expedicion,
      numero: facturasVenta.numero,
      condicion_operacion: facturasVenta.condicion_operacion,
      fecha_emision: facturasVenta.fecha_emision,
      numero_cuota: cuentasCobrar.numero_cuota,
      fecha_vencimiento: cuentasCobrar.fecha_vencimiento,
      monto_gs: cuentasCobrar.monto_gs,
      saldo_gs: cuentasCobrar.saldo_gs,
      estado: cuentasCobrar.estado,
      vencida: sql<boolean>`${cuentasCobrar.fecha_vencimiento} < current_date and ${cuentasCobrar.saldo_gs} > 0`,
    })
    .from(cuentasCobrar)
    .innerJoin(facturasVenta, eq(facturasVenta.id, cuentasCobrar.factura_venta_id))
    .where(
      and(
        eq(cuentasCobrar.empresa_id, s.empresaId),
        x.clienteId ? eq(cuentasCobrar.cliente_id, x.clienteId) : undefined,
        x.soloPendientes ? inArray(cuentasCobrar.estado, ['pendiente', 'parcial']) : undefined,
        x.vencidas ? sql`${cuentasCobrar.fecha_vencimiento} < current_date and ${cuentasCobrar.saldo_gs} > 0` : undefined,
        x.q ? ilike(facturasVenta.receptor_razon_social, `%${x.q}%`) : undefined,
      ),
    )
    .orderBy(asc(cuentasCobrar.fecha_vencimiento), asc(cuentasCobrar.id))
    .limit(x.limite ?? 500);
  return filas.map((r) => ({
    ...r,
    numero_completo: r.numero ? formatearNumeroFactura(r.establecimiento!, r.punto_expedicion!, r.numero) : null,
  }));
}
