import { and, asc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import type { DbLike } from '@/db';
import {
  cajas,
  clientes,
  cobroDetalles,
  cobros,
  condicionesPago,
  cuentasCobrar,
  cuotasVenta,
  establecimientos,
  facturasVenta,
  facturaVentaDetalles,
  kardex,
  numeracionesDocumento,
  paises,
  parametrosGenerales,
  personas,
  presupuestoDetalles,
  presupuestos,
  puntosExpedicion,
  sesionesCaja,
  timbrados,
  tiposDocumento,
} from '@/db/schema';
import { totalesAColumnas } from '../fiscal/iva';
import { formatearNumeroFactura } from '../fiscal/sifen';
import type { Ctx } from '../lib/contexto';
import { generarCuotas } from '../lib/cuotas';
import { hoyPy, sumarDias } from '../lib/fechas';
import { siguienteNumero } from '../lib/numeracion';
import { asegurar, ErrorNegocio } from '../lib/result';
import type { FacturaVentaInput, PresupuestoInput } from '../validation/ventas';
import { generarAsiento, revertirAsientosDeOrigen } from './contabilidad';
import { bloquearStock, depositoPrincipal, obtenerDeposito, registrarEntrada, registrarSalida } from './inventario';
import { prepararLineasVenta, sinExtras, type LineaEntrada, type ReferenciaOrigen } from './lineas';
import { getAdaptadorSifen, type AdaptadorSifen } from './sifen/adaptador';
import { prepararDocumentoElectronico, registrarEventoSifen } from './sifen';

const EPS = 1e-6;
const ahora = () => new Date();

async function parametro(tx: DbLike, ctx: Ctx, clave: string): Promise<string | null> {
  const filas = await tx
    .select()
    .from(parametrosGenerales)
    .where(
      and(
        eq(parametrosGenerales.empresa_id, ctx.empresaId),
        eq(parametrosGenerales.clave, clave),
        or(isNull(parametrosGenerales.sucursal_id), eq(parametrosGenerales.sucursal_id, ctx.sucursalId)),
      ),
    );
  return (filas.find((f) => f.sucursal_id === ctx.sucursalId) ?? filas[0])?.valor ?? null;
}

async function clienteDe(tx: DbLike, ctx: Ctx, clienteId: number) {
  const [c] = await tx
    .select({ cliente: clientes, persona: personas })
    .from(clientes)
    .innerJoin(personas, eq(personas.id, clientes.persona_id))
    .where(and(eq(clientes.id, clienteId), eq(clientes.empresa_id, ctx.empresaId)));
  asegurar(c, 'Cliente inexistente');
  asegurar(c.cliente.estado === 'activo', 'El cliente está inactivo');
  return c;
}

/* =============================== Presupuestos =============================== */

export async function guardarPresupuesto(tx: DbLike, ctx: Ctx, d: PresupuestoInput) {
  if (d.clienteId) await clienteDe(tx, ctx, d.clienteId);
  const { lineas, totales } = await prepararLineasVenta(tx, ctx, { fecha: d.fecha, sucursalId: ctx.sucursalId, lineas: d.detalles });
  const dias = Number((await parametro(tx, ctx, 'ventas.validez_presupuesto_dias')) ?? 15) || 15;
  const cabecera = {
    fecha: d.fecha,
    fecha_validez: d.fechaValidez ?? sumarDias(d.fecha, dias),
    cliente_id: d.clienteId ?? null,
    vendedor_id: d.vendedorId ?? ctx.usuarioId,
    condicion_operacion: d.condicionOperacion,
    observacion: d.observacion ?? null,
    ...totalesAColumnas(totales),
  };
  let id: number;
  if (d.id) {
    const [p] = await tx
      .select()
      .from(presupuestos)
      .where(and(eq(presupuestos.id, d.id), eq(presupuestos.empresa_id, ctx.empresaId)))
      .for('update');
    asegurar(p, 'Presupuesto inexistente');
    asegurar(p.estado === 'borrador', 'Solo se editan presupuestos en borrador');
    await tx.update(presupuestos).set(cabecera).where(eq(presupuestos.id, p.id));
    await tx.delete(presupuestoDetalles).where(eq(presupuestoDetalles.presupuesto_id, p.id));
    id = p.id;
  } else {
    const numero = await siguienteNumero(tx, 'presupuestos', presupuestos, ctx.empresaId, ctx.sucursalId);
    const [p] = await tx
      .insert(presupuestos)
      .values({ ...cabecera, empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, numero, creado_por: ctx.usuarioId })
      .returning({ id: presupuestos.id });
    id = p.id;
  }
  await tx.insert(presupuestoDetalles).values(
    lineas.map((l) => {
      const { detalle_origen_id: _o, ...resto } = sinExtras(l);
      return { ...resto, empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, presupuesto_id: id };
    }),
  );
  return { id, totalGs: totales.totalGs };
}

async function bloquearPresupuesto(tx: DbLike, ctx: Ctx, id: number) {
  const [p] = await tx
    .select()
    .from(presupuestos)
    .where(and(eq(presupuestos.id, id), eq(presupuestos.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(p, 'Presupuesto inexistente');
  return p;
}

/** Confirma: recalcula descuentos en servidor (y revalida descuentos manuales con el usuario que confirma). */
export async function confirmarPresupuesto(tx: DbLike, ctx: Ctx, id: number) {
  const p = await bloquearPresupuesto(tx, ctx, id);
  asegurar(p.estado === 'borrador', 'El presupuesto no está en borrador');
  const det = await tx.select().from(presupuestoDetalles).where(eq(presupuestoDetalles.presupuesto_id, id)).orderBy(asc(presupuestoDetalles.linea));
  const { lineas, totales } = await prepararLineasVenta(tx, ctx, {
    fecha: p.fecha,
    sucursalId: p.sucursal_id,
    lineas: det.map((l) => ({
      articuloId: l.articulo_id,
      descripcion: l.descripcion,
      unidadMedidaId: l.unidad_medida_id,
      cantidad: l.cantidad,
      precioUnitarioGs: l.precio_unitario_gs,
      descuentoGs: l.descuento_gs,
    })),
  });
  await tx.delete(presupuestoDetalles).where(eq(presupuestoDetalles.presupuesto_id, id));
  await tx.insert(presupuestoDetalles).values(
    lineas.map((l) => {
      const { detalle_origen_id: _o, ...resto } = sinExtras(l);
      return { ...resto, empresa_id: p.empresa_id, sucursal_id: p.sucursal_id, presupuesto_id: id };
    }),
  );
  await tx
    .update(presupuestos)
    .set({ ...totalesAColumnas(totales), estado: 'confirmado', confirmado_por: ctx.usuarioId, confirmado_en: ahora() })
    .where(eq(presupuestos.id, id));
  return { id };
}

export async function anularPresupuesto(tx: DbLike, ctx: Ctx, id: number, motivo: string) {
  const p = await bloquearPresupuesto(tx, ctx, id);
  asegurar(['borrador', 'confirmado', 'vencido'].includes(p.estado), 'Solo se anulan presupuestos sin facturar');
  await tx
    .update(presupuestos)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
    .where(eq(presupuestos.id, id));
  return { id };
}

async function recalcularEstadoPresupuesto(tx: DbLike, presupuestoId: number) {
  const det = await tx.select().from(presupuestoDetalles).where(eq(presupuestoDetalles.presupuesto_id, presupuestoId));
  const total = det.every((x) => x.cantidad_facturada + EPS >= x.cantidad);
  const alguno = det.some((x) => x.cantidad_facturada > EPS);
  await tx
    .update(presupuestos)
    .set({ estado: total ? 'facturado' : alguno ? 'facturado_parcial' : 'confirmado' })
    .where(eq(presupuestos.id, presupuestoId));
}

async function referenciasPresupuesto(tx: DbLike, presupuestoId: number | null | undefined) {
  const refs = new Map<number, ReferenciaOrigen>();
  if (!presupuestoId) return refs;
  const det = await tx.select().from(presupuestoDetalles).where(eq(presupuestoDetalles.presupuesto_id, presupuestoId));
  for (const l of det) {
    refs.set(l.id, {
      precioUnitarioGs: l.precio_unitario_gs,
      cantidad: l.cantidad,
      descuentoGs: l.descuento_gs,
      origenDescuento: l.origen_descuento,
      descuentoId: l.descuento_id,
    });
  }
  return refs;
}

/* =============================== Facturas de venta =============================== */

/** Sesión de caja abierta del usuario en la sucursal (si existe) con su caja. */
export async function sesionAbiertaDe(tx: DbLike, ctx: Ctx) {
  const [s] = await tx
    .select({ sesion: sesionesCaja, caja: cajas })
    .from(sesionesCaja)
    .innerJoin(cajas, eq(cajas.id, sesionesCaja.caja_id))
    .where(
      and(
        eq(sesionesCaja.empresa_id, ctx.empresaId),
        eq(sesionesCaja.sucursal_id, ctx.sucursalId),
        eq(sesionesCaja.usuario_id, ctx.usuarioId),
        eq(sesionesCaja.estado, 'abierta'),
      ),
    );
  return s ?? null;
}

async function snapshotReceptor(tx: DbLike, ctx: Ctx, clienteId: number | null) {
  if (!clienteId) {
    const [inn] = await tx.select().from(tiposDocumento).where(eq(tiposDocumento.codigo, 'INN'));
    return {
      receptor_es_contribuyente: false,
      receptor_tipo_documento_id: inn?.id ?? null,
      receptor_numero_documento: '0',
      receptor_dv: null,
      receptor_razon_social: 'SIN NOMBRE',
      receptor_direccion: null,
      receptor_telefono: null,
      receptor_email: null,
      receptor_pais: 'PRY',
    };
  }
  const { persona } = await clienteDe(tx, ctx, clienteId);
  let pais = 'PRY';
  if (persona.pais_id) {
    const [p] = await tx.select({ iso: paises.codigo_iso }).from(paises).where(eq(paises.id, persona.pais_id));
    pais = p?.iso ?? 'PRY';
  }
  return {
    receptor_es_contribuyente: persona.es_contribuyente && !!persona.dv,
    receptor_tipo_documento_id: persona.tipo_documento_id,
    receptor_numero_documento: persona.numero_documento,
    receptor_dv: persona.dv,
    receptor_razon_social: persona.razon_social,
    receptor_direccion: persona.direccion,
    receptor_telefono: persona.telefono ?? persona.celular,
    receptor_email: persona.email,
    receptor_pais: pais,
  };
}

export async function guardarFacturaVenta(tx: DbLike, ctx: Ctx, d: FacturaVentaInput) {
  const fecha = hoyPy();
  let clienteId = d.clienteId ?? null;
  let presupuesto: typeof presupuestos.$inferSelect | null = null;
  if (d.presupuestoId) {
    const [p] = await tx
      .select()
      .from(presupuestos)
      .where(and(eq(presupuestos.id, d.presupuestoId), eq(presupuestos.empresa_id, ctx.empresaId)));
    asegurar(p, 'Presupuesto inexistente');
    asegurar(p.estado === 'confirmado' || p.estado === 'facturado_parcial', 'El presupuesto no está pendiente de facturar');
    presupuesto = p;
    clienteId ??= p.cliente_id;
  }
  // Las líneas importadas deben pertenecer al presupuesto
  const origenes = d.detalles.map((l) => l.detalleOrigenId).filter((x): x is number => !!x);
  if (origenes.length) {
    asegurar(presupuesto, 'Las líneas con origen requieren presupuestoId');
    const det = await tx
      .select({ id: presupuestoDetalles.id })
      .from(presupuestoDetalles)
      .where(and(eq(presupuestoDetalles.presupuesto_id, presupuesto.id), inArray(presupuestoDetalles.id, origenes)));
    asegurar(det.length === new Set(origenes).size, 'Hay líneas que no pertenecen al presupuesto');
  }

  const sesion = await sesionAbiertaDe(tx, ctx);
  const depositoId = d.depositoId ?? sesion?.caja.deposito_id ?? (await depositoPrincipal(tx, ctx)).id;
  const dep = await obtenerDeposito(tx, ctx, depositoId);
  asegurar(dep.sucursal_id === ctx.sucursalId, 'El depósito no pertenece a la sucursal');
  asegurar(dep.permite_venta, `El depósito ${dep.codigo} no permite ventas`);

  let plazo: number | null = null;
  let cuotas: number | null = null;
  if (d.condicionOperacion === 'credito') {
    asegurar(clienteId, 'La venta a crédito requiere cliente');
    const { cliente } = await clienteDe(tx, ctx, clienteId);
    const cpId = d.condicionPagoId ?? cliente.condicion_pago_id;
    const [cp] = cpId ? await tx.select().from(condicionesPago).where(eq(condicionesPago.id, cpId)) : [];
    cuotas = d.cantidadCuotas ?? (cp?.condicion === 'credito' ? cp.cantidad_cuotas : 1);
    plazo = d.plazoDias ?? (cp?.condicion === 'credito' ? cp.dias_plazo : 30);
  }

  const refs = await referenciasPresupuesto(tx, presupuesto?.id);
  const { lineas, totales } = await prepararLineasVenta(tx, ctx, {
    fecha,
    sucursalId: ctx.sucursalId,
    lineas: d.detalles,
    referencias: refs,
  });
  const receptor = await snapshotReceptor(tx, ctx, clienteId);
  const cabecera = {
    presupuesto_id: presupuesto?.id ?? null,
    cliente_id: clienteId,
    vendedor_id: d.vendedorId ?? presupuesto?.vendedor_id ?? ctx.usuarioId,
    deposito_id: depositoId,
    condicion_operacion: d.condicionOperacion,
    plazo_dias: plazo,
    cantidad_cuotas: cuotas,
    observacion: d.observacion ?? null,
    ...receptor,
    ...totalesAColumnas(totales),
  };
  let id: number;
  if (d.id) {
    const [f] = await tx
      .select()
      .from(facturasVenta)
      .where(and(eq(facturasVenta.id, d.id), eq(facturasVenta.empresa_id, ctx.empresaId)))
      .for('update');
    asegurar(f, 'Factura inexistente');
    asegurar(f.estado === 'borrador', 'Solo se editan facturas en borrador');
    await tx.update(facturasVenta).set(cabecera).where(eq(facturasVenta.id, f.id));
    await tx.delete(facturaVentaDetalles).where(eq(facturaVentaDetalles.factura_venta_id, f.id));
    id = f.id;
  } else {
    const [f] = await tx
      .insert(facturasVenta)
      .values({ ...cabecera, empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, creado_por: ctx.usuarioId })
      .returning({ id: facturasVenta.id });
    id = f.id;
  }
  await tx.insert(facturaVentaDetalles).values(
    lineas.map((l) => ({ ...sinExtras(l), empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, factura_venta_id: id })),
  );
  return { id, totalGs: totales.totalGs };
}

/** Crea una factura borrador con los pendientes del presupuesto (precio y descuento pactados). */
export async function crearFacturaDesdePresupuesto(tx: DbLike, ctx: Ctx, presupuestoId: number) {
  const [p] = await tx
    .select()
    .from(presupuestos)
    .where(and(eq(presupuestos.id, presupuestoId), eq(presupuestos.empresa_id, ctx.empresaId)));
  asegurar(p, 'Presupuesto inexistente');
  asegurar(p.estado === 'confirmado' || p.estado === 'facturado_parcial', 'El presupuesto no está pendiente de facturar');
  if (p.fecha_validez && p.fecha_validez < hoyPy()) throw new ErrorNegocio(`El presupuesto venció el ${p.fecha_validez}`);
  const det = await tx.select().from(presupuestoDetalles).where(eq(presupuestoDetalles.presupuesto_id, p.id)).orderBy(asc(presupuestoDetalles.linea));
  const lineas: LineaEntrada[] = det
    .filter((l) => l.cantidad - l.cantidad_facturada > EPS)
    .map((l) => {
      const pend = Math.round((l.cantidad - l.cantidad_facturada) * 1000) / 1000;
      return {
        detalleOrigenId: l.id,
        articuloId: l.articulo_id,
        descripcion: l.descripcion,
        unidadMedidaId: l.unidad_medida_id,
        cantidad: pend,
        precioUnitarioGs: l.precio_unitario_gs,
        descuentoGs: Math.round((l.descuento_gs * pend) / l.cantidad),
      };
    });
  asegurar(lineas.length > 0, 'El presupuesto no tiene pendientes');
  return guardarFacturaVenta(tx, ctx, {
    presupuestoId: p.id,
    clienteId: p.cliente_id,
    vendedorId: p.vendedor_id,
    condicionOperacion: p.condicion_operacion,
    detalles: lineas,
  });
}

async function siguienteNumeroFactura(tx: DbLike, ctx: Ctx, puntoPreferido: number | null, fecha: string) {
  const candidatos = await tx
    .select({
      id: numeracionesDocumento.id,
      puntoId: numeracionesDocumento.punto_expedicion_id,
    })
    .from(numeracionesDocumento)
    .innerJoin(timbrados, eq(timbrados.id, numeracionesDocumento.timbrado_id))
    .where(
      and(
        eq(numeracionesDocumento.empresa_id, ctx.empresaId),
        eq(numeracionesDocumento.sucursal_id, ctx.sucursalId),
        eq(numeracionesDocumento.tipo_documento, 'factura'),
        eq(numeracionesDocumento.estado, 'activo'),
        eq(timbrados.estado, 'activo'),
        lte(timbrados.fecha_inicio_vigencia, fecha),
        or(isNull(timbrados.fecha_fin_vigencia), gte(timbrados.fecha_fin_vigencia, fecha)),
      ),
    )
    .orderBy(asc(numeracionesDocumento.id));
  const elegido = candidatos.find((c) => c.puntoId === puntoPreferido) ?? candidatos[0];
  asegurar(elegido, 'No hay timbrado vigente / numeración activa para facturar en esta sucursal');
  const [n] = await tx.select().from(numeracionesDocumento).where(eq(numeracionesDocumento.id, elegido.id)).for('update');
  const numero = Math.max(n.numero_actual, n.numero_desde - 1) + 1;
  asegurar(numero <= n.numero_hasta, 'Se agotó el rango de numeración del timbrado');
  await tx.update(numeracionesDocumento).set({ numero_actual: numero }).where(eq(numeracionesDocumento.id, n.id));
  const [t] = await tx.select().from(timbrados).where(eq(timbrados.id, n.timbrado_id));
  const [pe] = await tx
    .select({ codigo: puntosExpedicion.codigo, est: establecimientos.codigo })
    .from(puntosExpedicion)
    .innerJoin(establecimientos, eq(establecimientos.id, puntosExpedicion.establecimiento_id))
    .where(eq(puntosExpedicion.id, n.punto_expedicion_id));
  return {
    numero,
    timbradoId: t.id,
    timbrado: t.numero,
    modalidad: t.modalidad,
    puntoExpedicionId: n.punto_expedicion_id,
    establecimiento: pe.est,
    puntoExpedicion: pe.codigo,
  };
}

async function bloquearFacturaVenta(tx: DbLike, ctx: Ctx, id: number) {
  const [f] = await tx
    .select()
    .from(facturasVenta)
    .where(and(eq(facturasVenta.id, id), eq(facturasVenta.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(f, 'Factura de venta inexistente');
  return f;
}

/**
 * Confirma la factura de venta (atómico):
 * recalcula descuentos, controla saldo pendiente del presupuesto, descuenta stock (kardex, CMV),
 * numera (numeraciones_documento FOR UPDATE), genera CDC/QR, estado SIFEN `pendiente` + evento,
 * Cuenta a Cobrar (contado: 1 cuota al día; crédito: cuotas) y asiento de venta + costo de ventas.
 * El envío a SIFEN se hace luego con `enviarFacturaSifen` (fuera de esta transacción).
 */
export async function confirmarFacturaVenta(tx: DbLike, ctx: Ctx, id: number) {
  const f0 = await bloquearFacturaVenta(tx, ctx, id);
  asegurar(f0.estado === 'borrador', 'La factura no está en borrador');
  asegurar(f0.sucursal_id === ctx.sucursalId, 'La factura pertenece a otra sucursal');
  const fecha = hoyPy();

  // 1) Recalcular líneas/descuentos en servidor
  const det0 = await tx
    .select()
    .from(facturaVentaDetalles)
    .where(eq(facturaVentaDetalles.factura_venta_id, id))
    .orderBy(asc(facturaVentaDetalles.linea));
  asegurar(det0.length > 0, 'La factura no tiene líneas');
  const refs = await referenciasPresupuesto(tx, f0.presupuesto_id);
  const { lineas, totales } = await prepararLineasVenta(tx, ctx, {
    fecha,
    sucursalId: f0.sucursal_id,
    referencias: refs,
    lineas: det0.map((l) => ({
      detalleOrigenId: l.detalle_origen_id,
      articuloId: l.articulo_id,
      descripcion: l.descripcion,
      unidadMedidaId: l.unidad_medida_id,
      cantidad: l.cantidad,
      precioUnitarioGs: l.precio_unitario_gs,
      descuentoGs: l.descuento_gs,
    })),
  });
  asegurar(totales.totalGs > 0, 'La factura no tiene importe');

  // 2) Saldo pendiente del presupuesto por ítem (FOR UPDATE)
  if (f0.presupuesto_id) {
    const p = await bloquearPresupuesto(tx, ctx, f0.presupuesto_id);
    asegurar(p.estado === 'confirmado' || p.estado === 'facturado_parcial', 'El presupuesto no está pendiente de facturar');
    const porOrigen = new Map<number, number>();
    for (const l of lineas) {
      if (l.detalle_origen_id) porOrigen.set(l.detalle_origen_id, (porOrigen.get(l.detalle_origen_id) ?? 0) + l.cantidad);
    }
    for (const [detId, cant] of [...porOrigen.entries()].sort((a, b) => a[0] - b[0])) {
      const [pd] = await tx.select().from(presupuestoDetalles).where(eq(presupuestoDetalles.id, detId)).for('update');
      asegurar(pd && pd.presupuesto_id === p.id, 'Detalle de presupuesto inválido');
      const pendiente = pd.cantidad - pd.cantidad_facturada;
      if (cant > pendiente + EPS) {
        throw new ErrorNegocio(`${pd.descripcion}: la cantidad (${cant}) supera el saldo pendiente del presupuesto (${pendiente})`);
      }
      await tx
        .update(presupuestoDetalles)
        .set({ cantidad_facturada: sql`${presupuestoDetalles.cantidad_facturada} + ${cant}` })
        .where(eq(presupuestoDetalles.id, pd.id));
    }
    await recalcularEstadoPresupuesto(tx, p.id);
  }

  // 3) Reemplazar líneas recalculadas
  await tx.delete(facturaVentaDetalles).where(eq(facturaVentaDetalles.factura_venta_id, id));
  const insertadas = await tx
    .insert(facturaVentaDetalles)
    .values(lineas.map((l) => ({ ...sinExtras(l), empresa_id: f0.empresa_id, sucursal_id: f0.sucursal_id, factura_venta_id: id })))
    .returning();
  const controla = new Map(lineas.map((l) => [l.linea, l.controla_stock]));

  // 4) Stock + kardex (costo promedio → CMV)
  const conStock = insertadas.filter((l) => controla.get(l.linea));
  await bloquearStock(tx, ctx, conStock.map((l) => ({ depositoId: f0.deposito_id, articuloId: l.articulo_id })));
  let totalCosto = 0;
  for (const l of conStock) {
    const cantBase = Math.round(l.cantidad * l.factor_conversion * 1000) / 1000;
    const mov = await registrarSalida(tx, ctx, {
      depositoId: f0.deposito_id,
      articuloId: l.articulo_id,
      cantidad: cantBase,
      tipoMovimiento: 'salida_venta',
      origenTipo: 'factura_venta',
      origenId: id,
      origenDetalleId: l.id,
      descripcion: l.descripcion,
    });
    totalCosto += Math.round(cantBase * mov.costoUnitarioGs);
    await tx.update(facturaVentaDetalles).set({ costo_unitario_gs: mov.costoUnitarioGs }).where(eq(facturaVentaDetalles.id, l.id));
  }

  // 5) Receptor, crédito
  const receptor = await snapshotReceptor(tx, ctx, f0.cliente_id);
  if (f0.condicion_operacion === 'credito') {
    asegurar(f0.cliente_id, 'La venta a crédito requiere cliente');
    const [c] = await tx.select().from(clientes).where(eq(clientes.id, f0.cliente_id)).for('update');
    asegurar(c.limite_credito_gs > 0, 'El cliente no tiene línea de crédito habilitada');
    if (c.saldo_gs + totales.totalGs > c.limite_credito_gs) {
      throw new ErrorNegocio(
        `Límite de crédito excedido: saldo ${c.saldo_gs} + factura ${totales.totalGs} > límite ${c.limite_credito_gs}`,
      );
    }
  }

  // 6) Numeración correlativa
  const sesion = await sesionAbiertaDe(tx, ctx);
  const num = await siguienteNumeroFactura(tx, ctx, sesion?.caja.punto_expedicion_id ?? null, fecha);
  const fNumerada = {
    ...f0,
    ...receptor,
    ...totalesAColumnas(totales),
    timbrado_id: num.timbradoId,
    timbrado: num.timbrado,
    modalidad: num.modalidad,
    punto_expedicion_id: num.puntoExpedicionId,
    establecimiento: num.establecimiento,
    punto_expedicion: num.puntoExpedicion,
    numero: num.numero,
  };

  // 7) SIFEN (CDC + QR) si es electrónica
  let sifen: { cdc: string | null; codigo_seguridad: string | null; qr_url: string | null; xml_firmado: string | null; estado_sifen: 'pendiente' | 'no_aplica' } = {
    cdc: null,
    codigo_seguridad: null,
    qr_url: null,
    xml_firmado: null,
    estado_sifen: 'no_aplica',
  };
  if (num.modalidad === 'electronica') {
    const doc = await prepararDocumentoElectronico(tx, fNumerada, insertadas, fecha);
    sifen = { cdc: doc.cdc, codigo_seguridad: doc.codigoSeguridad, qr_url: doc.qrUrl, xml_firmado: doc.xml, estado_sifen: 'pendiente' };
  }

  await tx
    .update(facturasVenta)
    .set({
      ...receptor,
      ...totalesAColumnas(totales),
      timbrado_id: num.timbradoId,
      timbrado: num.timbrado,
      modalidad: num.modalidad,
      punto_expedicion_id: num.puntoExpedicionId,
      establecimiento: num.establecimiento,
      punto_expedicion: num.puntoExpedicion,
      numero: num.numero,
      fecha_emision: ahora(),
      sesion_caja_id: sesion?.sesion.id ?? f0.sesion_caja_id,
      ...sifen,
      total_costo_gs: totalCosto,
      estado: 'confirmado',
      confirmado_por: ctx.usuarioId,
      confirmado_en: ahora(),
    })
    .where(eq(facturasVenta.id, id));
  if (sifen.cdc) {
    await registrarEventoSifen(tx, { ...f0, cdc: sifen.cdc }, {
      tipo: 'generacion',
      estado: 'pendiente',
      mensaje: 'DE generado, pendiente de envío',
      usuarioId: ctx.usuarioId,
    });
  }

  // 8) Cuentas a cobrar
  const plan =
    f0.condicion_operacion === 'credito'
      ? generarCuotas(totales.totalGs, f0.cantidad_cuotas ?? 1, fecha, f0.plazo_dias ?? 30, 30)
      : [{ numero: 1, fechaVencimiento: fecha, montoGs: totales.totalGs }];
  for (const c of plan) {
    let cuotaId: number | null = null;
    if (f0.condicion_operacion === 'credito') {
      const [cv] = await tx
        .insert(cuotasVenta)
        .values({
          empresa_id: f0.empresa_id,
          sucursal_id: f0.sucursal_id,
          factura_venta_id: id,
          numero_cuota: c.numero,
          fecha_vencimiento: c.fechaVencimiento,
          monto_gs: c.montoGs,
        })
        .returning({ id: cuotasVenta.id });
      cuotaId = cv.id;
    }
    await tx.insert(cuentasCobrar).values({
      empresa_id: f0.empresa_id,
      sucursal_id: f0.sucursal_id,
      cliente_id: f0.cliente_id,
      factura_venta_id: id,
      cuota_venta_id: cuotaId,
      numero_cuota: c.numero,
      fecha_vencimiento: c.fechaVencimiento,
      monto_gs: c.montoGs,
      saldo_gs: c.montoGs,
    });
  }
  if (f0.cliente_id) {
    await tx
      .update(clientes)
      .set({ saldo_gs: sql`${clientes.saldo_gs} + ${totales.totalGs}` })
      .where(eq(clientes.id, f0.cliente_id));
  }

  // 9) Asiento de venta + costo de ventas
  const numeroTxt = formatearNumeroFactura(num.establecimiento, num.puntoExpedicion, num.numero);
  await generarAsiento(tx, ctx, {
    fecha,
    concepto: `Factura de venta ${numeroTxt}`,
    origenTipo: 'factura_venta',
    origenId: id,
    sucursalId: f0.sucursal_id,
    partidas: [
      { operacion: 'venta', concepto: 'deudores', montoGs: totales.totalGs },
      { operacion: 'venta', concepto: 'ventas_10', montoGs: totales.gravada10Gs - totales.iva10Gs },
      { operacion: 'venta', concepto: 'ventas_5', montoGs: totales.gravada5Gs - totales.iva5Gs },
      { operacion: 'venta', concepto: 'ventas_exentas', montoGs: totales.exentaGs },
      { operacion: 'venta', concepto: 'iva_debito', montoGs: totales.totalIvaGs },
      { operacion: 'costo_venta', concepto: 'cmv', montoGs: totalCosto },
      { operacion: 'costo_venta', concepto: 'mercaderias', montoGs: totalCosto },
    ],
  });
  return { id, numero: numeroTxt, cdc: sifen.cdc, totalGs: totales.totalGs, estadoSifen: sifen.estado_sifen };
}

/**
 * Anula una factura de venta confirmada: exige CxC sin cobros, revierte stock (kardex
 * anulacion_venta al costo de la venta), saldo del presupuesto, CxC/cliente, contra-asiento y
 * evento SIFEN de cancelación. Borrador: solo cambia estado.
 */
export async function anularFacturaVenta(
  tx: DbLike,
  ctx: Ctx,
  id: number,
  motivo: string,
  adaptador: AdaptadorSifen = getAdaptadorSifen(),
) {
  const f = await bloquearFacturaVenta(tx, ctx, id);
  if (f.estado === 'borrador') {
    await tx
      .update(facturasVenta)
      .set({ estado: 'anulado', estado_sifen: 'no_aplica', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
      .where(eq(facturasVenta.id, id));
    return { id };
  }
  asegurar(f.estado === 'confirmado', 'La factura ya está anulada');

  // Cuentas a cobrar sin cobros
  const cxc = await tx.select().from(cuentasCobrar).where(eq(cuentasCobrar.factura_venta_id, id)).orderBy(asc(cuentasCobrar.id)).for('update');
  const [conCobro] = await tx
    .select({ id: cobroDetalles.id })
    .from(cobroDetalles)
    .innerJoin(cobros, eq(cobros.id, cobroDetalles.cobro_id))
    .where(and(inArray(cobroDetalles.cuenta_cobrar_id, cxc.map((c) => c.id).concat([-1])), eq(cobros.estado, 'confirmado')))
    .limit(1);
  asegurar(!conCobro && cxc.every((c) => c.saldo_gs === c.monto_gs), 'La factura tiene cobros: anule primero los cobros');
  await tx.update(cuentasCobrar).set({ estado: 'anulado', saldo_gs: 0 }).where(eq(cuentasCobrar.factura_venta_id, id));
  if (f.cliente_id) {
    await tx
      .update(clientes)
      .set({ saldo_gs: sql`${clientes.saldo_gs} - ${f.total_gs}` })
      .where(eq(clientes.id, f.cliente_id));
  }

  // Stock inverso
  const det = await tx.select().from(facturaVentaDetalles).where(eq(facturaVentaDetalles.factura_venta_id, id));
  const movs = await tx
    .select({ detalleId: kardex.origen_detalle_id })
    .from(kardex)
    .where(and(eq(kardex.origen_tipo, 'factura_venta'), eq(kardex.origen_id, id), eq(kardex.tipo_movimiento, 'salida_venta')));
  const conMov = new Set(movs.map((m) => m.detalleId));
  const conStock = det.filter((l) => conMov.has(l.id));
  await bloquearStock(tx, ctx, conStock.map((l) => ({ depositoId: f.deposito_id, articuloId: l.articulo_id })));
  for (const l of conStock) {
    await registrarEntrada(tx, ctx, {
      depositoId: f.deposito_id,
      articuloId: l.articulo_id,
      cantidad: Math.round(l.cantidad * l.factor_conversion * 1000) / 1000,
      costoUnitarioGs: l.costo_unitario_gs,
      tipoMovimiento: 'anulacion_venta',
      origenTipo: 'factura_venta',
      origenId: id,
      origenDetalleId: l.id,
    });
  }

  // Presupuesto: devolver saldo pendiente
  if (f.presupuesto_id) {
    await bloquearPresupuesto(tx, ctx, f.presupuesto_id);
    for (const l of det.filter((x) => x.detalle_origen_id).sort((a, b) => a.detalle_origen_id! - b.detalle_origen_id!)) {
      const [pd] = await tx.select().from(presupuestoDetalles).where(eq(presupuestoDetalles.id, l.detalle_origen_id!)).for('update');
      await tx
        .update(presupuestoDetalles)
        .set({ cantidad_facturada: Math.max(0, Math.round((pd.cantidad_facturada - l.cantidad) * 1000) / 1000) })
        .where(eq(presupuestoDetalles.id, pd.id));
    }
    await recalcularEstadoPresupuesto(tx, f.presupuesto_id);
  }

  await revertirAsientosDeOrigen(tx, ctx, 'factura_venta', id, motivo);

  // SIFEN: evento de cancelación
  let estadoSifen = f.estado_sifen;
  if (f.cdc && f.modalidad === 'electronica') {
    if (f.estado_sifen === 'aprobado' || f.estado_sifen === 'aprobado_con_observacion') {
      const r = await adaptador.cancelar(f.cdc, motivo, 'test');
      asegurar(r.ok, `SIFEN rechazó la cancelación: ${r.mensaje}`);
      await registrarEventoSifen(tx, f, { tipo: 'cancelacion', estado: 'cancelado', codigo: r.codigo, mensaje: r.mensaje, usuarioId: ctx.usuarioId });
    } else {
      await registrarEventoSifen(tx, f, {
        tipo: 'cancelacion',
        estado: 'cancelado',
        mensaje: `Anulada antes de aprobación SIFEN (${f.estado_sifen})`,
        usuarioId: ctx.usuarioId,
      });
    }
    estadoSifen = 'cancelado';
  }
  await tx
    .update(facturasVenta)
    .set({ estado: 'anulado', estado_sifen: estadoSifen, anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
    .where(eq(facturasVenta.id, id));
  return { id, estadoSifen };
}
