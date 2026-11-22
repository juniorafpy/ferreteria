import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { DbLike } from '@/db';
import {
  articulos,
  condicionesPago,
  cuentasPagar,
  facturaCompraDetalles,
  facturasCompra,
  historicoCostos,
  ordenCompraDetalles,
  ordenCompraPedidos,
  ordenesCompra,
  ordenesPago,
  ordenPagoDetalles,
  pedidoCompraDetalles,
  pedidosCompra,
  proveedores,
  recepcionDetalles,
  recepciones,
} from '@/db/schema';
import { totalesAColumnas } from '../fiscal/iva';
import { parsearNumeroFactura } from '../fiscal/sifen';
import type { Ctx } from '../lib/contexto';
import { estadoCuenta, generarCuotas } from '../lib/cuotas';
import { siguienteNumero } from '../lib/numeracion';
import { asegurar, ErrorNegocio } from '../lib/result';
import type {
  FacturaCompraInput,
  OrdenCompraInput,
  OrdenPagoInput,
  PedidoCompraInput,
  RecepcionInput,
} from '../validation/compras';
import { generarAsiento, revertirAsientosDeOrigen } from './contabilidad';
import { bloquearStock, depositoPrincipal, obtenerDeposito, registrarEntrada, registrarSalida, stockActual } from './inventario';
import { prepararLineasCompra, sinExtras } from './lineas';

const EPS = 1e-6;
const ahora = () => new Date();

async function proveedorDe(tx: DbLike, ctx: Ctx, proveedorId: number) {
  const [p] = await tx
    .select()
    .from(proveedores)
    .where(and(eq(proveedores.id, proveedorId), eq(proveedores.empresa_id, ctx.empresaId)));
  asegurar(p, 'Proveedor inexistente');
  asegurar(p.estado === 'activo', 'El proveedor está inactivo');
  return p;
}

/* =============================== Pedidos de compra =============================== */

export async function guardarPedidoCompra(tx: DbLike, ctx: Ctx, d: PedidoCompraInput) {
  if (d.proveedorId) await proveedorDe(tx, ctx, d.proveedorId);
  if (d.depositoId) await obtenerDeposito(tx, ctx, d.depositoId);
  const arts = await tx
    .select({ id: articulos.id })
    .from(articulos)
    .where(and(eq(articulos.empresa_id, ctx.empresaId), inArray(articulos.id, d.detalles.map((x) => x.articuloId))));
  asegurar(arts.length === new Set(d.detalles.map((x) => x.articuloId)).size, 'Artículo inexistente');

  const cabecera = {
    fecha: d.fecha,
    proveedor_id: d.proveedorId ?? null,
    deposito_id: d.depositoId ?? null,
    observacion: d.observacion ?? null,
  };
  let id: number;
  if (d.id) {
    const [p] = await tx
      .select()
      .from(pedidosCompra)
      .where(and(eq(pedidosCompra.id, d.id), eq(pedidosCompra.empresa_id, ctx.empresaId)))
      .for('update');
    asegurar(p, 'Pedido inexistente');
    asegurar(p.estado === 'borrador', 'Solo se editan pedidos en borrador');
    await tx.update(pedidosCompra).set(cabecera).where(eq(pedidosCompra.id, p.id));
    await tx.delete(pedidoCompraDetalles).where(eq(pedidoCompraDetalles.pedido_compra_id, p.id));
    id = p.id;
  } else {
    const numero = await siguienteNumero(tx, 'pedidos_compra', pedidosCompra, ctx.empresaId, ctx.sucursalId);
    const [p] = await tx
      .insert(pedidosCompra)
      .values({ ...cabecera, empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, numero, creado_por: ctx.usuarioId })
      .returning({ id: pedidosCompra.id });
    id = p.id;
  }
  await tx.insert(pedidoCompraDetalles).values(
    d.detalles.map((l, i) => ({
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      pedido_compra_id: id,
      linea: i + 1,
      articulo_id: l.articuloId,
      unidad_medida_id: l.unidadMedidaId ?? null,
      cantidad: l.cantidad,
      observacion: l.observacion ?? null,
    })),
  );
  return { id };
}

async function bloquearPedido(tx: DbLike, ctx: Ctx, id: number) {
  const [p] = await tx
    .select()
    .from(pedidosCompra)
    .where(and(eq(pedidosCompra.id, id), eq(pedidosCompra.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(p, 'Pedido inexistente');
  return p;
}

export async function confirmarPedidoCompra(tx: DbLike, ctx: Ctx, id: number) {
  const p = await bloquearPedido(tx, ctx, id);
  asegurar(p.estado === 'borrador', 'El pedido no está en borrador');
  await tx
    .update(pedidosCompra)
    .set({ estado: 'confirmado', confirmado_por: ctx.usuarioId, confirmado_en: ahora() })
    .where(eq(pedidosCompra.id, id));
  return { id };
}

export async function anularPedidoCompra(tx: DbLike, ctx: Ctx, id: number, motivo: string) {
  const p = await bloquearPedido(tx, ctx, id);
  asegurar(p.estado === 'borrador' || p.estado === 'confirmado', 'Solo se anulan pedidos sin órdenes de compra');
  await tx
    .update(pedidosCompra)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
    .where(eq(pedidosCompra.id, id));
  return { id };
}

async function recalcularEstadoPedido(tx: DbLike, pedidoId: number) {
  const det = await tx.select().from(pedidoCompraDetalles).where(eq(pedidoCompraDetalles.pedido_compra_id, pedidoId));
  const total = det.every((x) => x.cantidad_ordenada + EPS >= x.cantidad);
  const alguno = det.some((x) => x.cantidad_ordenada > EPS);
  await tx
    .update(pedidosCompra)
    .set({ estado: total ? 'ordenado' : alguno ? 'ordenado_parcial' : 'confirmado' })
    .where(eq(pedidosCompra.id, pedidoId));
}

/* =============================== Órdenes de compra =============================== */

export async function guardarOrdenCompra(tx: DbLike, ctx: Ctx, d: OrdenCompraInput) {
  await proveedorDe(tx, ctx, d.proveedorId);
  if (d.depositoId) await obtenerDeposito(tx, ctx, d.depositoId);
  const pedidoIds = new Set(d.pedidoIds ?? []);
  let detalles = d.detalles ?? [];

  if (detalles.length === 0 && pedidoIds.size > 0) {
    // Importar pendientes de los pedidos (precio sugerido: costo de referencia + IVA).
    const pend = await tx
      .select({ det: pedidoCompraDetalles, art: articulos, estado: pedidosCompra.estado })
      .from(pedidoCompraDetalles)
      .innerJoin(pedidosCompra, eq(pedidosCompra.id, pedidoCompraDetalles.pedido_compra_id))
      .innerJoin(articulos, eq(articulos.id, pedidoCompraDetalles.articulo_id))
      .where(and(eq(pedidosCompra.empresa_id, ctx.empresaId), inArray(pedidosCompra.id, [...pedidoIds])))
      .orderBy(asc(pedidoCompraDetalles.pedido_compra_id), asc(pedidoCompraDetalles.linea));
    detalles = pend
      .filter((x) => x.det.cantidad - x.det.cantidad_ordenada > EPS)
      .map((x) => ({
        detalleOrigenId: x.det.id,
        articuloId: x.det.articulo_id,
        unidadMedidaId: x.det.unidad_medida_id,
        cantidad: Math.round((x.det.cantidad - x.det.cantidad_ordenada) * 1000) / 1000,
        precioUnitarioGs:
          x.art.tipo_iva === 'exenta'
            ? x.art.costo_referencia_gs
            : Math.round(x.art.costo_referencia_gs * (x.art.tipo_iva === 'iva10' ? 1.1 : 1.05)),
      }));
    asegurar(detalles.length > 0, 'Los pedidos seleccionados no tienen pendientes');
  }

  // Validar orígenes: deben ser de pedidos confirmados de la empresa.
  const origenIds = detalles.map((l) => l.detalleOrigenId).filter((x): x is number => !!x);
  if (origenIds.length) {
    const orig = await tx
      .select({ id: pedidoCompraDetalles.id, pedidoId: pedidoCompraDetalles.pedido_compra_id, estado: pedidosCompra.estado })
      .from(pedidoCompraDetalles)
      .innerJoin(pedidosCompra, eq(pedidosCompra.id, pedidoCompraDetalles.pedido_compra_id))
      .where(and(eq(pedidosCompra.empresa_id, ctx.empresaId), inArray(pedidoCompraDetalles.id, origenIds)));
    asegurar(orig.length === new Set(origenIds).size, 'Detalle de pedido inexistente');
    for (const o of orig) {
      asegurar(o.estado === 'confirmado' || o.estado === 'ordenado_parcial', 'Solo se importan pedidos confirmados con pendientes');
      pedidoIds.add(o.pedidoId);
    }
  }

  const { lineas, totales } = await prepararLineasCompra(tx, ctx, detalles);
  const cabecera = {
    fecha: d.fecha,
    proveedor_id: d.proveedorId,
    condicion_pago_id: d.condicionPagoId ?? null,
    deposito_id: d.depositoId ?? null,
    fecha_entrega_estimada: d.fechaEntregaEstimada ?? null,
    observacion: d.observacion ?? null,
    ...totalesAColumnas(totales),
  };
  let id: number;
  if (d.id) {
    const [o] = await tx
      .select()
      .from(ordenesCompra)
      .where(and(eq(ordenesCompra.id, d.id), eq(ordenesCompra.empresa_id, ctx.empresaId)))
      .for('update');
    asegurar(o, 'Orden inexistente');
    asegurar(o.estado === 'borrador', 'Solo se editan órdenes en borrador');
    await tx.update(ordenesCompra).set(cabecera).where(eq(ordenesCompra.id, o.id));
    await tx.delete(ordenCompraDetalles).where(eq(ordenCompraDetalles.orden_compra_id, o.id));
    await tx.delete(ordenCompraPedidos).where(eq(ordenCompraPedidos.orden_compra_id, o.id));
    id = o.id;
  } else {
    const numero = await siguienteNumero(tx, 'ordenes_compra', ordenesCompra, ctx.empresaId, ctx.sucursalId);
    const [o] = await tx
      .insert(ordenesCompra)
      .values({ ...cabecera, empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, numero, creado_por: ctx.usuarioId })
      .returning({ id: ordenesCompra.id });
    id = o.id;
  }
  await tx.insert(ordenCompraDetalles).values(
    lineas.map((l) => ({ ...sinExtras(l), empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, orden_compra_id: id })),
  );
  if (pedidoIds.size) {
    await tx.insert(ordenCompraPedidos).values(
      [...pedidoIds].map((p) => ({ empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, orden_compra_id: id, pedido_compra_id: p })),
    );
  }
  return { id };
}

async function bloquearOrden(tx: DbLike, ctx: Ctx, id: number) {
  const [o] = await tx
    .select()
    .from(ordenesCompra)
    .where(and(eq(ordenesCompra.id, id), eq(ordenesCompra.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(o, 'Orden de compra inexistente');
  return o;
}

export async function confirmarOrdenCompra(tx: DbLike, ctx: Ctx, id: number) {
  const o = await bloquearOrden(tx, ctx, id);
  asegurar(o.estado === 'borrador', 'La orden no está en borrador');
  const det = await tx.select().from(ordenCompraDetalles).where(eq(ordenCompraDetalles.orden_compra_id, id));
  const origen = det.filter((l) => l.detalle_origen_id).sort((a, b) => a.detalle_origen_id! - b.detalle_origen_id!);
  const pedidosAfectados = new Set<number>();
  for (const l of origen) {
    const [pd] = await tx
      .select()
      .from(pedidoCompraDetalles)
      .where(eq(pedidoCompraDetalles.id, l.detalle_origen_id!))
      .for('update');
    asegurar(pd && pd.articulo_id === l.articulo_id, `Línea ${l.linea}: origen inválido`);
    const pendiente = pd.cantidad - pd.cantidad_ordenada;
    if (l.cantidad > pendiente + EPS) {
      throw new ErrorNegocio(`Línea ${l.linea}: la cantidad (${l.cantidad}) supera el pendiente del pedido (${pendiente})`);
    }
    await tx
      .update(pedidoCompraDetalles)
      .set({ cantidad_ordenada: sql`${pedidoCompraDetalles.cantidad_ordenada} + ${l.cantidad}` })
      .where(eq(pedidoCompraDetalles.id, pd.id));
    pedidosAfectados.add(pd.pedido_compra_id);
  }
  for (const p of [...pedidosAfectados].sort((a, b) => a - b)) {
    const ped = await bloquearPedido(tx, ctx, p);
    asegurar(ped.estado === 'confirmado' || ped.estado === 'ordenado_parcial', `El pedido N° ${ped.numero} no admite órdenes`);
    await recalcularEstadoPedido(tx, p);
  }
  await tx
    .update(ordenesCompra)
    .set({ estado: 'confirmado', confirmado_por: ctx.usuarioId, confirmado_en: ahora() })
    .where(eq(ordenesCompra.id, id));
  return { id };
}

export async function anularOrdenCompra(tx: DbLike, ctx: Ctx, id: number, motivo: string) {
  const o = await bloquearOrden(tx, ctx, id);
  asegurar(o.estado === 'borrador' || o.estado === 'confirmado', 'Solo se anulan órdenes sin facturar');
  if (o.estado === 'confirmado') {
    const det = await tx.select().from(ordenCompraDetalles).where(eq(ordenCompraDetalles.orden_compra_id, id));
    asegurar(det.every((l) => l.cantidad_facturada <= EPS), 'La orden tiene facturas asociadas');
    const pedidos = new Set<number>();
    for (const l of det.filter((x) => x.detalle_origen_id).sort((a, b) => a.detalle_origen_id! - b.detalle_origen_id!)) {
      const [pd] = await tx.select().from(pedidoCompraDetalles).where(eq(pedidoCompraDetalles.id, l.detalle_origen_id!)).for('update');
      await tx
        .update(pedidoCompraDetalles)
        .set({ cantidad_ordenada: Math.max(0, Math.round((pd.cantidad_ordenada - l.cantidad) * 1000) / 1000) })
        .where(eq(pedidoCompraDetalles.id, pd.id));
      pedidos.add(pd.pedido_compra_id);
    }
    for (const p of pedidos) await recalcularEstadoPedido(tx, p);
  }
  await tx
    .update(ordenesCompra)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
    .where(eq(ordenesCompra.id, id));
  return { id };
}

async function recalcularEstadoOrden(tx: DbLike, ordenId: number) {
  const det = await tx.select().from(ordenCompraDetalles).where(eq(ordenCompraDetalles.orden_compra_id, ordenId));
  const total = det.every((x) => x.cantidad_facturada + EPS >= x.cantidad);
  const alguno = det.some((x) => x.cantidad_facturada > EPS);
  await tx
    .update(ordenesCompra)
    .set({ estado: total ? 'facturado' : alguno ? 'facturado_parcial' : 'confirmado' })
    .where(eq(ordenesCompra.id, ordenId));
}

/* =============================== Facturas de compra =============================== */

export async function guardarFacturaCompra(tx: DbLike, ctx: Ctx, d: FacturaCompraInput) {
  const prov = await proveedorDe(tx, ctx, d.proveedorId);
  const comp = parsearNumeroFactura(d.numeroComprobante);
  asegurar(comp, 'Número de comprobante inválido');
  if (d.depositoId) await obtenerDeposito(tx, ctx, d.depositoId);
  let detalles = d.detalles ?? [];
  let depositoSugerido = d.depositoId ?? null;

  if (d.ordenCompraId) {
    const [oc] = await tx
      .select()
      .from(ordenesCompra)
      .where(and(eq(ordenesCompra.id, d.ordenCompraId), eq(ordenesCompra.empresa_id, ctx.empresaId)));
    asegurar(oc, 'Orden de compra inexistente');
    asegurar(oc.proveedor_id === d.proveedorId, 'La orden pertenece a otro proveedor');
    asegurar(oc.estado === 'confirmado' || oc.estado === 'facturado_parcial', 'La orden no tiene pendientes de facturar');
    depositoSugerido ??= oc.deposito_id;
    if (detalles.length === 0) {
      const det = await tx
        .select()
        .from(ordenCompraDetalles)
        .where(eq(ordenCompraDetalles.orden_compra_id, oc.id))
        .orderBy(asc(ordenCompraDetalles.linea));
      detalles = det
        .filter((l) => l.cantidad - l.cantidad_facturada > EPS)
        .map((l) => {
          const pendiente = Math.round((l.cantidad - l.cantidad_facturada) * 1000) / 1000;
          return {
            detalleOrigenId: l.id,
            articuloId: l.articulo_id,
            descripcion: l.descripcion,
            unidadMedidaId: l.unidad_medida_id,
            factorConversion: l.factor_conversion,
            cantidad: pendiente,
            precioUnitarioGs: l.precio_unitario_gs,
            descuentoGs: Math.round((l.descuento_gs * pendiente) / l.cantidad),
            tipoIva: l.tipo_iva,
          };
        });
      asegurar(detalles.length > 0, 'La orden no tiene pendientes de facturar');
    }
  }
  const origenIds = detalles.map((l) => l.detalleOrigenId).filter((x): x is number => !!x);
  if (origenIds.length) {
    const orig = await tx
      .select({ id: ordenCompraDetalles.id, prov: ordenesCompra.proveedor_id, oc: ordenesCompra.id })
      .from(ordenCompraDetalles)
      .innerJoin(ordenesCompra, eq(ordenesCompra.id, ordenCompraDetalles.orden_compra_id))
      .where(and(eq(ordenesCompra.empresa_id, ctx.empresaId), inArray(ordenCompraDetalles.id, origenIds)));
    asegurar(orig.length === new Set(origenIds).size, 'Detalle de orden inexistente');
    asegurar(orig.every((o) => o.prov === d.proveedorId), 'Hay líneas de órdenes de otro proveedor');
    if (d.ordenCompraId) asegurar(orig.every((o) => o.oc === d.ordenCompraId), 'Hay líneas de otra orden de compra');
  }

  const { lineas, totales } = await prepararLineasCompra(tx, ctx, detalles);
  const cabecera = {
    proveedor_id: d.proveedorId,
    orden_compra_id: d.ordenCompraId ?? null,
    timbrado: d.timbrado,
    timbrado_vencimiento: d.timbradoVencimiento ?? null,
    establecimiento: comp.establecimiento,
    punto_expedicion: comp.puntoExpedicion,
    numero: comp.numero,
    cdc: d.cdc ?? null,
    fecha_emision: d.fechaEmision,
    condicion_operacion: d.condicionOperacion,
    condicion_pago_id: d.condicionPagoId ?? (d.condicionOperacion === 'credito' ? prov.condicion_pago_id : null),
    fecha_vencimiento: d.fechaVencimiento ?? null,
    deposito_id: depositoSugerido,
    observacion: d.observacion ?? null,
    ...totalesAColumnas(totales),
  };
  if (d.timbradoVencimiento) asegurar(d.timbradoVencimiento >= d.fechaEmision, 'El timbrado estaba vencido a la fecha de emisión');

  let id: number;
  if (d.id) {
    const [f] = await tx
      .select()
      .from(facturasCompra)
      .where(and(eq(facturasCompra.id, d.id), eq(facturasCompra.empresa_id, ctx.empresaId)))
      .for('update');
    asegurar(f, 'Factura inexistente');
    asegurar(f.estado === 'borrador', 'Solo se editan facturas en borrador');
    await tx.update(facturasCompra).set(cabecera).where(eq(facturasCompra.id, f.id));
    await tx.delete(facturaCompraDetalles).where(eq(facturaCompraDetalles.factura_compra_id, f.id));
    id = f.id;
  } else {
    const [f] = await tx
      .insert(facturasCompra)
      .values({ ...cabecera, empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, creado_por: ctx.usuarioId })
      .returning({ id: facturasCompra.id });
    id = f.id;
  }
  await tx.insert(facturaCompraDetalles).values(
    lineas.map((l) => {
      const neto = l.total_linea_gs - l.iva_gs;
      return {
        ...sinExtras(l),
        empresa_id: ctx.empresaId,
        sucursal_id: ctx.sucursalId,
        factura_compra_id: id,
        costo_unitario_gs: Math.round(neto / (l.cantidad * l.factor_conversion)),
      };
    }),
  );
  return { id };
}

async function bloquearFacturaCompra(tx: DbLike, ctx: Ctx, id: number) {
  const [f] = await tx
    .select()
    .from(facturasCompra)
    .where(and(eq(facturasCompra.id, id), eq(facturasCompra.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(f, 'Factura de compra inexistente');
  return f;
}

/**
 * Confirma la factura de compra: controla pendientes de la OC, genera Cuentas a Pagar,
 * histórico de costos (una fila por detalle; restricción única) y asiento de compra. NO mueve stock.
 */
export async function confirmarFacturaCompra(tx: DbLike, ctx: Ctx, id: number) {
  const f = await bloquearFacturaCompra(tx, ctx, id);
  asegurar(f.estado === 'borrador', 'La factura no está en borrador');
  asegurar(f.total_gs > 0, 'La factura no tiene importe');
  const det = await tx
    .select()
    .from(facturaCompraDetalles)
    .where(eq(facturaCompraDetalles.factura_compra_id, id))
    .orderBy(asc(facturaCompraDetalles.linea));
  asegurar(det.length > 0, 'La factura no tiene líneas');

  // 1) Pendientes de OC
  const ordenes = new Set<number>();
  for (const l of det.filter((x) => x.detalle_origen_id).sort((a, b) => a.detalle_origen_id! - b.detalle_origen_id!)) {
    const [od] = await tx.select().from(ordenCompraDetalles).where(eq(ordenCompraDetalles.id, l.detalle_origen_id!)).for('update');
    asegurar(od && od.articulo_id === l.articulo_id, `Línea ${l.linea}: origen inválido`);
    const pendiente = od.cantidad - od.cantidad_facturada;
    if (l.cantidad > pendiente + EPS) {
      throw new ErrorNegocio(`Línea ${l.linea}: la cantidad (${l.cantidad}) supera el pendiente de la OC (${pendiente})`);
    }
    await tx
      .update(ordenCompraDetalles)
      .set({ cantidad_facturada: sql`${ordenCompraDetalles.cantidad_facturada} + ${l.cantidad}` })
      .where(eq(ordenCompraDetalles.id, od.id));
    ordenes.add(od.orden_compra_id);
  }
  for (const o of [...ordenes].sort((a, b) => a - b)) {
    const oc = await bloquearOrden(tx, ctx, o);
    asegurar(oc.estado === 'confirmado' || oc.estado === 'facturado_parcial', `La OC N° ${oc.numero} no admite facturas`);
    await recalcularEstadoOrden(tx, o);
  }

  // 2) Cuentas a pagar
  let cuotas: { numero: number; fechaVencimiento: string; montoGs: number }[];
  if (f.condicion_operacion === 'contado') {
    cuotas = [{ numero: 1, fechaVencimiento: f.fecha_vencimiento ?? f.fecha_emision, montoGs: f.total_gs }];
  } else {
    const [cp] = f.condicion_pago_id
      ? await tx.select().from(condicionesPago).where(eq(condicionesPago.id, f.condicion_pago_id))
      : [];
    if (cp && cp.cantidad_cuotas > 1) {
      cuotas = generarCuotas(f.total_gs, cp.cantidad_cuotas, f.fecha_emision, cp.dias_plazo, cp.dias_entre_cuotas);
    } else {
      cuotas = generarCuotas(f.total_gs, 1, f.fecha_emision, cp?.dias_plazo ?? 30, 30);
      if (f.fecha_vencimiento) cuotas[0].fechaVencimiento = f.fecha_vencimiento;
    }
  }
  await tx.insert(cuentasPagar).values(
    cuotas.map((c) => ({
      empresa_id: ctx.empresaId,
      sucursal_id: f.sucursal_id,
      proveedor_id: f.proveedor_id,
      factura_compra_id: f.id,
      numero_cuota: c.numero,
      fecha_vencimiento: c.fechaVencimiento,
      monto_gs: c.montoGs,
      saldo_gs: c.montoGs,
    })),
  );
  await tx
    .update(proveedores)
    .set({ saldo_gs: sql`${proveedores.saldo_gs} + ${f.total_gs}` })
    .where(eq(proveedores.id, f.proveedor_id));

  // 3) Histórico de costos (una sola vez por detalle; promedio proyectado del depósito destino)
  const deposito = f.deposito_id ?? (await depositoPrincipal(tx, ctx, f.sucursal_id)).id;
  for (const l of det) {
    const s = await stockActual(tx, deposito, l.articulo_id);
    const saldo = Number(s?.cantidad ?? 0);
    const promAnt = s?.costo_promedio_gs ?? 0;
    const cantBase = l.cantidad * l.factor_conversion;
    const promNuevo = saldo > EPS ? Math.round((saldo * promAnt + cantBase * l.costo_unitario_gs) / (saldo + cantBase)) : l.costo_unitario_gs;
    await tx
      .insert(historicoCostos)
      .values({
        empresa_id: ctx.empresaId,
        sucursal_id: f.sucursal_id,
        articulo_id: l.articulo_id,
        deposito_id: deposito,
        proveedor_id: f.proveedor_id,
        detalle_factura_compra_id: l.id,
        fecha: f.fecha_emision,
        cantidad: cantBase,
        costo_unitario_gs: l.costo_unitario_gs,
        costo_promedio_anterior_gs: promAnt,
        costo_promedio_nuevo_gs: promNuevo,
        creado_por: ctx.usuarioId,
      })
      .onConflictDoNothing({ target: historicoCostos.detalle_factura_compra_id });
  }

  // 4) Asiento de compra
  const asiento = await generarAsiento(tx, ctx, {
    fecha: f.fecha_emision,
    concepto: `Factura de compra ${f.establecimiento}-${f.punto_expedicion}-${String(f.numero).padStart(7, '0')}`,
    origenTipo: 'factura_compra',
    origenId: f.id,
    sucursalId: f.sucursal_id,
    partidas: [
      { operacion: 'compra', concepto: 'mercaderias_transito', montoGs: f.total_gs - f.total_iva_gs },
      { operacion: 'compra', concepto: 'iva_credito', montoGs: f.total_iva_gs },
      { operacion: 'compra', concepto: 'proveedores', montoGs: f.total_gs },
    ],
  });

  await tx
    .update(facturasCompra)
    .set({ estado: 'confirmado', confirmado_por: ctx.usuarioId, confirmado_en: ahora(), deposito_id: deposito })
    .where(eq(facturasCompra.id, id));
  return { id, asientoId: asiento?.id ?? null };
}

export async function anularFacturaCompra(tx: DbLike, ctx: Ctx, id: number, motivo: string) {
  const f = await bloquearFacturaCompra(tx, ctx, id);
  if (f.estado === 'borrador') {
    await tx
      .update(facturasCompra)
      .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
      .where(eq(facturasCompra.id, id));
    return { id };
  }
  asegurar(f.estado === 'confirmado', 'La factura tiene recepciones: anule primero las recepciones');
  const det = await tx.select().from(facturaCompraDetalles).where(eq(facturaCompraDetalles.factura_compra_id, id));
  asegurar(det.every((l) => l.cantidad_recibida <= EPS), 'La factura tiene mercadería recibida');
  const cxp = await tx
    .select()
    .from(cuentasPagar)
    .where(eq(cuentasPagar.factura_compra_id, id))
    .orderBy(asc(cuentasPagar.id))
    .for('update');
  asegurar(
    cxp.every((c) => c.estado !== 'anulado' && c.saldo_gs === c.monto_gs),
    'La factura tiene pagos registrados: anule primero las órdenes de pago',
  );
  await tx.update(cuentasPagar).set({ estado: 'anulado', saldo_gs: 0 }).where(eq(cuentasPagar.factura_compra_id, id));
  await tx
    .update(proveedores)
    .set({ saldo_gs: sql`${proveedores.saldo_gs} - ${f.total_gs}` })
    .where(eq(proveedores.id, f.proveedor_id));

  const ordenes = new Set<number>();
  for (const l of det.filter((x) => x.detalle_origen_id).sort((a, b) => a.detalle_origen_id! - b.detalle_origen_id!)) {
    const [od] = await tx.select().from(ordenCompraDetalles).where(eq(ordenCompraDetalles.id, l.detalle_origen_id!)).for('update');
    await tx
      .update(ordenCompraDetalles)
      .set({ cantidad_facturada: Math.max(0, Math.round((od.cantidad_facturada - l.cantidad) * 1000) / 1000) })
      .where(eq(ordenCompraDetalles.id, od.id));
    ordenes.add(od.orden_compra_id);
  }
  for (const o of ordenes) await recalcularEstadoOrden(tx, o);
  await revertirAsientosDeOrigen(tx, ctx, 'factura_compra', id, motivo);
  await tx
    .update(facturasCompra)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
    .where(eq(facturasCompra.id, id));
  return { id };
}

async function recalcularEstadoFacturaCompra(tx: DbLike, facturaId: number) {
  const det = await tx.select().from(facturaCompraDetalles).where(eq(facturaCompraDetalles.factura_compra_id, facturaId));
  const total = det.every((x) => x.cantidad_recibida + EPS >= x.cantidad);
  const alguno = det.some((x) => x.cantidad_recibida > EPS);
  await tx
    .update(facturasCompra)
    .set({ estado: total ? 'recibido' : alguno ? 'recibido_parcial' : 'confirmado' })
    .where(eq(facturasCompra.id, facturaId));
}

/* =============================== Recepciones =============================== */

export async function guardarRecepcion(tx: DbLike, ctx: Ctx, d: RecepcionInput) {
  const [f] = await tx
    .select()
    .from(facturasCompra)
    .where(and(eq(facturasCompra.id, d.facturaCompraId), eq(facturasCompra.empresa_id, ctx.empresaId)));
  asegurar(f, 'Factura de compra inexistente');
  asegurar(f.estado === 'confirmado' || f.estado === 'recibido_parcial', 'La factura no tiene pendientes de recepción');
  const dep = await obtenerDeposito(tx, ctx, d.depositoId);
  asegurar(dep.sucursal_id === ctx.sucursalId, 'El depósito debe pertenecer a la sucursal actual');
  const fdet = await tx
    .select()
    .from(facturaCompraDetalles)
    .where(eq(facturaCompraDetalles.factura_compra_id, f.id))
    .orderBy(asc(facturaCompraDetalles.linea));
  const porId = new Map(fdet.map((x) => [x.id, x]));
  const pedidas =
    d.detalles && d.detalles.length > 0
      ? d.detalles
      : fdet
          .filter((x) => x.cantidad - x.cantidad_recibida > EPS)
          .map((x) => ({ detalleOrigenId: x.id, cantidad: Math.round((x.cantidad - x.cantidad_recibida) * 1000) / 1000 }));
  asegurar(pedidas.length > 0, 'No hay cantidades pendientes de recibir');
  const lineas = pedidas.map((p, i) => {
    const fd = porId.get(p.detalleOrigenId);
    asegurar(fd, `Línea ${i + 1}: el detalle no pertenece a la factura`);
    const pendiente = fd.cantidad - fd.cantidad_recibida;
    if (p.cantidad > pendiente + EPS) {
      throw new ErrorNegocio(`Línea ${i + 1}: la cantidad (${p.cantidad}) supera lo pendiente de recibir (${pendiente})`);
    }
    const neto = fd.total_linea_gs - fd.iva_gs;
    return {
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      linea: i + 1,
      detalle_origen_id: fd.id,
      articulo_id: fd.articulo_id,
      cantidad: p.cantidad,
      factor_conversion: fd.factor_conversion,
      cantidad_base: Math.round(p.cantidad * fd.factor_conversion * 1000) / 1000,
      costo_unitario_gs: fd.costo_unitario_gs,
      total_costo_gs: Math.round((neto * p.cantidad) / fd.cantidad),
    };
  });
  const total = lineas.reduce((a, l) => a + l.total_costo_gs, 0);
  const cabecera = {
    fecha: d.fecha,
    factura_compra_id: f.id,
    deposito_id: d.depositoId,
    observacion: d.observacion ?? null,
    total_costo_gs: total,
  };
  let id: number;
  if (d.id) {
    const [r] = await tx
      .select()
      .from(recepciones)
      .where(and(eq(recepciones.id, d.id), eq(recepciones.empresa_id, ctx.empresaId)))
      .for('update');
    asegurar(r, 'Recepción inexistente');
    asegurar(r.estado === 'borrador', 'Solo se editan recepciones en borrador');
    await tx.update(recepciones).set(cabecera).where(eq(recepciones.id, r.id));
    await tx.delete(recepcionDetalles).where(eq(recepcionDetalles.recepcion_id, r.id));
    id = r.id;
  } else {
    const numero = await siguienteNumero(tx, 'recepciones', recepciones, ctx.empresaId, ctx.sucursalId);
    const [r] = await tx
      .insert(recepciones)
      .values({ ...cabecera, empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, numero, creado_por: ctx.usuarioId })
      .returning({ id: recepciones.id });
    id = r.id;
  }
  await tx.insert(recepcionDetalles).values(lineas.map((l) => ({ ...l, recepcion_id: id })));
  return { id };
}

async function bloquearRecepcion(tx: DbLike, ctx: Ctx, id: number) {
  const [r] = await tx
    .select()
    .from(recepciones)
    .where(and(eq(recepciones.id, id), eq(recepciones.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(r, 'Recepción inexistente');
  return r;
}

/** Confirma recepción: suma stock (kardex, costo promedio, último costo) y controla recibido <= facturado. */
export async function confirmarRecepcion(tx: DbLike, ctx: Ctx, id: number) {
  const r = await bloquearRecepcion(tx, ctx, id);
  asegurar(r.estado === 'borrador', 'La recepción no está en borrador');
  const f = await bloquearFacturaCompra(tx, ctx, r.factura_compra_id);
  asegurar(f.estado === 'confirmado' || f.estado === 'recibido_parcial', 'La factura no admite recepciones');
  const det = await tx.select().from(recepcionDetalles).where(eq(recepcionDetalles.recepcion_id, id)).orderBy(asc(recepcionDetalles.linea));
  asegurar(det.length > 0, 'La recepción no tiene líneas');

  for (const l of [...det].sort((a, b) => a.detalle_origen_id - b.detalle_origen_id)) {
    const [fd] = await tx.select().from(facturaCompraDetalles).where(eq(facturaCompraDetalles.id, l.detalle_origen_id)).for('update');
    asegurar(fd && fd.factura_compra_id === f.id, `Línea ${l.linea}: detalle de factura inválido`);
    const pendiente = fd.cantidad - fd.cantidad_recibida;
    if (l.cantidad > pendiente + EPS) {
      throw new ErrorNegocio(`Línea ${l.linea}: cantidad recibida (${l.cantidad}) supera lo facturado pendiente (${pendiente})`);
    }
    await tx
      .update(facturaCompraDetalles)
      .set({ cantidad_recibida: sql`${facturaCompraDetalles.cantidad_recibida} + ${l.cantidad}` })
      .where(eq(facturaCompraDetalles.id, fd.id));
  }

  const arts = await tx
    .select({ id: articulos.id, controla: articulos.controla_stock })
    .from(articulos)
    .where(inArray(articulos.id, det.map((l) => l.articulo_id)));
  const controla = new Map(arts.map((a) => [a.id, a.controla]));
  const conStock = det.filter((l) => controla.get(l.articulo_id));
  await bloquearStock(tx, ctx, conStock.map((l) => ({ depositoId: r.deposito_id, articuloId: l.articulo_id })));
  for (const l of conStock) {
    await registrarEntrada(tx, ctx, {
      depositoId: r.deposito_id,
      articuloId: l.articulo_id,
      cantidad: l.cantidad_base,
      costoUnitarioGs: l.costo_unitario_gs,
      actualizarUltimoCosto: true,
      tipoMovimiento: 'entrada_compra',
      origenTipo: 'recepcion',
      origenId: r.id,
      origenDetalleId: l.id,
    });
  }
  await recalcularEstadoFacturaCompra(tx, f.id);

  const total = det.reduce((a, l) => a + l.total_costo_gs, 0);
  await generarAsiento(tx, ctx, {
    fecha: r.fecha,
    concepto: `Recepción N° ${r.numero} (factura ${f.establecimiento}-${f.punto_expedicion}-${String(f.numero).padStart(7, '0')})`,
    origenTipo: 'recepcion',
    origenId: r.id,
    sucursalId: r.sucursal_id,
    partidas: [
      { operacion: 'recepcion', concepto: 'mercaderias', montoGs: total },
      { operacion: 'recepcion', concepto: 'mercaderias_transito', montoGs: total },
    ],
  });
  await tx
    .update(recepciones)
    .set({ estado: 'confirmado', confirmado_por: ctx.usuarioId, confirmado_en: ahora(), total_costo_gs: total })
    .where(eq(recepciones.id, id));
  return { id };
}

export async function anularRecepcion(tx: DbLike, ctx: Ctx, id: number, motivo: string) {
  const r = await bloquearRecepcion(tx, ctx, id);
  if (r.estado === 'borrador') {
    await tx
      .update(recepciones)
      .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
      .where(eq(recepciones.id, id));
    return { id };
  }
  asegurar(r.estado === 'confirmado', 'La recepción ya está anulada');
  const f = await bloquearFacturaCompra(tx, ctx, r.factura_compra_id);
  const det = await tx.select().from(recepcionDetalles).where(eq(recepcionDetalles.recepcion_id, id));
  for (const l of [...det].sort((a, b) => a.detalle_origen_id - b.detalle_origen_id)) {
    const [fd] = await tx.select().from(facturaCompraDetalles).where(eq(facturaCompraDetalles.id, l.detalle_origen_id)).for('update');
    await tx
      .update(facturaCompraDetalles)
      .set({ cantidad_recibida: Math.max(0, Math.round((fd.cantidad_recibida - l.cantidad) * 1000) / 1000) })
      .where(eq(facturaCompraDetalles.id, fd.id));
  }
  const arts = await tx
    .select({ id: articulos.id, controla: articulos.controla_stock })
    .from(articulos)
    .where(inArray(articulos.id, det.map((l) => l.articulo_id)));
  const controla = new Map(arts.map((a) => [a.id, a.controla]));
  const conStock = det.filter((l) => controla.get(l.articulo_id));
  await bloquearStock(tx, ctx, conStock.map((l) => ({ depositoId: r.deposito_id, articuloId: l.articulo_id })));
  for (const l of conStock) {
    await registrarSalida(tx, ctx, {
      depositoId: r.deposito_id,
      articuloId: l.articulo_id,
      cantidad: l.cantidad_base,
      costoUnitarioGs: l.costo_unitario_gs,
      tipoMovimiento: 'anulacion_compra',
      origenTipo: 'recepcion',
      origenId: r.id,
      origenDetalleId: l.id,
      descripcion: 'anulación de recepción',
    });
  }
  await recalcularEstadoFacturaCompra(tx, f.id);
  await revertirAsientosDeOrigen(tx, ctx, 'recepcion', id, motivo);
  await tx
    .update(recepciones)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
    .where(eq(recepciones.id, id));
  return { id };
}

/* =============================== Órdenes de pago =============================== */

export async function registrarOrdenPago(tx: DbLike, ctx: Ctx, d: OrdenPagoInput) {
  await proveedorDe(tx, ctx, d.proveedorId);
  const ids = d.cuentas.map((c) => c.cuentaPagarId);
  asegurar(new Set(ids).size === ids.length, 'Cuenta a pagar repetida');
  const cuentas = await tx
    .select()
    .from(cuentasPagar)
    .where(and(eq(cuentasPagar.empresa_id, ctx.empresaId), inArray(cuentasPagar.id, ids)))
    .orderBy(asc(cuentasPagar.id))
    .for('update');
  asegurar(cuentas.length === ids.length, 'Cuenta a pagar inexistente');
  const porId = new Map(cuentas.map((c) => [c.id, c]));
  for (const x of d.cuentas) {
    const c = porId.get(x.cuentaPagarId)!;
    asegurar(c.proveedor_id === d.proveedorId, 'Hay cuentas de otro proveedor');
    asegurar(c.estado === 'pendiente' || c.estado === 'parcial', `La cuota ${c.numero_cuota} no tiene saldo`);
    if (x.montoGs > c.saldo_gs) throw new ErrorNegocio(`El pago (${x.montoGs}) supera el saldo de la cuota (${c.saldo_gs})`);
  }
  const total = d.cuentas.reduce((a, x) => a + x.montoGs, 0);
  const numero = await siguienteNumero(tx, 'ordenes_pago', ordenesPago, ctx.empresaId, ctx.sucursalId);
  const [op] = await tx
    .insert(ordenesPago)
    .values({
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      numero,
      fecha: d.fecha,
      proveedor_id: d.proveedorId,
      medio_pago: d.medioPago,
      referencia: d.referencia ?? null,
      banco: d.banco ?? null,
      observacion: d.observacion ?? null,
      total_gs: total,
      estado: 'confirmado',
      creado_por: ctx.usuarioId,
      confirmado_por: ctx.usuarioId,
      confirmado_en: ahora(),
    })
    .returning({ id: ordenesPago.id, numero: ordenesPago.numero });
  await tx.insert(ordenPagoDetalles).values(
    d.cuentas.map((x) => ({
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      orden_pago_id: op.id,
      cuenta_pagar_id: x.cuentaPagarId,
      monto_gs: x.montoGs,
    })),
  );
  for (const x of d.cuentas) {
    const c = porId.get(x.cuentaPagarId)!;
    const saldo = c.saldo_gs - x.montoGs;
    await tx.update(cuentasPagar).set({ saldo_gs: saldo, estado: estadoCuenta(c.monto_gs, saldo) }).where(eq(cuentasPagar.id, c.id));
  }
  await tx
    .update(proveedores)
    .set({ saldo_gs: sql`${proveedores.saldo_gs} - ${total}` })
    .where(eq(proveedores.id, d.proveedorId));
  await generarAsiento(tx, ctx, {
    fecha: d.fecha,
    concepto: `Orden de pago N° ${op.numero}`,
    origenTipo: 'orden_pago',
    origenId: op.id,
    partidas: [
      { operacion: 'pago', concepto: 'proveedores', montoGs: total },
      { operacion: 'pago', concepto: d.medioPago, montoGs: total },
    ],
  });
  return { id: op.id, numero: op.numero };
}

export async function anularOrdenPago(tx: DbLike, ctx: Ctx, id: number, motivo: string) {
  const [op] = await tx
    .select()
    .from(ordenesPago)
    .where(and(eq(ordenesPago.id, id), eq(ordenesPago.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(op, 'Orden de pago inexistente');
  asegurar(op.estado === 'confirmado', 'La orden de pago no está confirmada');
  const det = await tx.select().from(ordenPagoDetalles).where(eq(ordenPagoDetalles.orden_pago_id, id));
  const cuentas = await tx
    .select()
    .from(cuentasPagar)
    .where(inArray(cuentasPagar.id, det.map((x) => x.cuenta_pagar_id)))
    .orderBy(asc(cuentasPagar.id))
    .for('update');
  const porId = new Map(cuentas.map((c) => [c.id, c]));
  for (const x of det) {
    const c = porId.get(x.cuenta_pagar_id)!;
    asegurar(c.estado !== 'anulado', 'Una cuenta asociada está anulada');
    const saldo = c.saldo_gs + x.monto_gs;
    await tx.update(cuentasPagar).set({ saldo_gs: saldo, estado: estadoCuenta(c.monto_gs, saldo) }).where(eq(cuentasPagar.id, c.id));
  }
  await tx
    .update(proveedores)
    .set({ saldo_gs: sql`${proveedores.saldo_gs} + ${op.total_gs}` })
    .where(eq(proveedores.id, op.proveedor_id));
  await revertirAsientosDeOrigen(tx, ctx, 'orden_pago', id, motivo);
  await tx
    .update(ordenesPago)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
    .where(eq(ordenesPago.id, id));
  return { id };
}

