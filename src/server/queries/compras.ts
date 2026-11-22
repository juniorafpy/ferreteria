/** Consultas de Compras (Server Components). */
import { and, asc, desc, eq, gte, ilike, inArray, lte, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import {
  cuentasPagar,
  facturasCompra,
  ordenesCompra,
  ordenesPago,
  pedidoCompraDetalles,
  pedidosCompra,
  personas,
  proveedores,
  recepciones,
  depositos,
} from '@/db/schema';
import { requireSesion, type Sesion } from '../auth/session';
import { formatearNumeroFactura } from '../fiscal/sifen';
import { filtroCompras, type FiltroCompras } from '../validation/compras';

const EPS = 1e-6;
const nroCompra = (f: { establecimiento: string; punto_expedicion: string; numero: number }) =>
  formatearNumeroFactura(f.establecimiento, f.punto_expedicion, f.numero);

function comunes(
  s: Sesion,
  x: NonNullable<FiltroCompras>,
  t: { empresa_id: AnyPgColumn; sucursal_id: AnyPgColumn; estado: AnyPgColumn; proveedor_id?: AnyPgColumn },
  fecha: AnyPgColumn,
): (SQL | undefined)[] {
  return [
    eq(t.empresa_id, s.empresaId),
    eq(t.sucursal_id, s.sucursalId),
    x.desde ? gte(fecha, x.desde) : undefined,
    x.hasta ? lte(fecha, x.hasta) : undefined,
    x.estado ? sql`${t.estado}::text = ${x.estado}` : undefined,
    x.proveedorId && t.proveedor_id ? eq(t.proveedor_id, x.proveedorId) : undefined,
    x.q ? ilike(personas.razon_social, `%${x.q}%`) : undefined,
  ];
}

export async function listarPedidosCompra(f?: FiltroCompras) {
  const s = await requireSesion();
  const x = filtroCompras.parse(f) ?? {};
  return db
    .select({
      id: pedidosCompra.id,
      numero: pedidosCompra.numero,
      fecha: pedidosCompra.fecha,
      proveedor_id: pedidosCompra.proveedor_id,
      proveedor: personas.razon_social,
      deposito_id: pedidosCompra.deposito_id,
      estado: pedidosCompra.estado,
      observacion: pedidosCompra.observacion,
      items: sql<number>`(select count(*) from ${pedidoCompraDetalles} d where d.pedido_compra_id = ${pedidosCompra.id})`.mapWith(Number),
    })
    .from(pedidosCompra)
    .leftJoin(proveedores, eq(proveedores.id, pedidosCompra.proveedor_id))
    .leftJoin(personas, eq(personas.id, proveedores.persona_id))
    .where(and(...comunes(s, x, pedidosCompra, pedidosCompra.fecha)))
    .orderBy(desc(pedidosCompra.fecha), desc(pedidosCompra.numero))
    .limit(x.limite ?? 200);
}

export async function listarOrdenesCompra(f?: FiltroCompras) {
  const s = await requireSesion();
  const x = filtroCompras.parse(f) ?? {};
  return db
    .select({
      id: ordenesCompra.id,
      numero: ordenesCompra.numero,
      fecha: ordenesCompra.fecha,
      proveedor_id: ordenesCompra.proveedor_id,
      proveedor: personas.razon_social,
      fecha_entrega_estimada: ordenesCompra.fecha_entrega_estimada,
      total_gs: ordenesCompra.total_gs,
      estado: ordenesCompra.estado,
    })
    .from(ordenesCompra)
    .innerJoin(proveedores, eq(proveedores.id, ordenesCompra.proveedor_id))
    .innerJoin(personas, eq(personas.id, proveedores.persona_id))
    .where(and(...comunes(s, x, ordenesCompra, ordenesCompra.fecha)))
    .orderBy(desc(ordenesCompra.fecha), desc(ordenesCompra.numero))
    .limit(x.limite ?? 200);
}

export async function listarFacturasCompra(f?: FiltroCompras) {
  const s = await requireSesion();
  const x = filtroCompras.parse(f) ?? {};
  const filas = await db
    .select({
      id: facturasCompra.id,
      proveedor_id: facturasCompra.proveedor_id,
      proveedor: personas.razon_social,
      ruc: personas.numero_documento,
      dv: personas.dv,
      orden_compra_id: facturasCompra.orden_compra_id,
      timbrado: facturasCompra.timbrado,
      establecimiento: facturasCompra.establecimiento,
      punto_expedicion: facturasCompra.punto_expedicion,
      numero: facturasCompra.numero,
      fecha_emision: facturasCompra.fecha_emision,
      condicion_operacion: facturasCompra.condicion_operacion,
      total_iva_gs: facturasCompra.total_iva_gs,
      total_gs: facturasCompra.total_gs,
      estado: facturasCompra.estado,
      saldo_gs: sql<number>`coalesce((select sum(c.saldo_gs) from ${cuentasPagar} c where c.factura_compra_id = ${facturasCompra.id} and c.estado <> 'anulado'), 0)`.mapWith(Number),
    })
    .from(facturasCompra)
    .innerJoin(proveedores, eq(proveedores.id, facturasCompra.proveedor_id))
    .innerJoin(personas, eq(personas.id, proveedores.persona_id))
    .where(and(...comunes(s, x, facturasCompra, facturasCompra.fecha_emision)))
    .orderBy(desc(facturasCompra.fecha_emision), desc(facturasCompra.id))
    .limit(x.limite ?? 200);
  return filas.map((r) => ({ ...r, numero_comprobante: nroCompra(r) }));
}

export async function listarRecepciones(f?: FiltroCompras) {
  const s = await requireSesion();
  const x = filtroCompras.parse(f) ?? {};
  const filas = await db
    .select({
      id: recepciones.id,
      numero: recepciones.numero,
      fecha: recepciones.fecha,
      factura_compra_id: recepciones.factura_compra_id,
      establecimiento: facturasCompra.establecimiento,
      punto_expedicion: facturasCompra.punto_expedicion,
      numero_factura: facturasCompra.numero,
      proveedor: personas.razon_social,
      deposito_id: recepciones.deposito_id,
      deposito: depositos.nombre,
      total_costo_gs: recepciones.total_costo_gs,
      estado: recepciones.estado,
    })
    .from(recepciones)
    .innerJoin(facturasCompra, eq(facturasCompra.id, recepciones.factura_compra_id))
    .innerJoin(proveedores, eq(proveedores.id, facturasCompra.proveedor_id))
    .innerJoin(personas, eq(personas.id, proveedores.persona_id))
    .innerJoin(depositos, eq(depositos.id, recepciones.deposito_id))
    .where(and(...comunes(s, x, { ...recepciones, proveedor_id: facturasCompra.proveedor_id }, recepciones.fecha)))
    .orderBy(desc(recepciones.fecha), desc(recepciones.numero))
    .limit(x.limite ?? 200);
  return filas.map((r) => ({
    ...r,
    numero_comprobante: formatearNumeroFactura(r.establecimiento, r.punto_expedicion, r.numero_factura),
  }));
}

export async function listarCuentasPagar(f?: FiltroCompras) {
  const s = await requireSesion();
  const x = filtroCompras.parse(f) ?? {};
  const filas = await db
    .select({
      id: cuentasPagar.id,
      proveedor_id: cuentasPagar.proveedor_id,
      proveedor: personas.razon_social,
      factura_compra_id: cuentasPagar.factura_compra_id,
      establecimiento: facturasCompra.establecimiento,
      punto_expedicion: facturasCompra.punto_expedicion,
      numero: facturasCompra.numero,
      fecha_emision: facturasCompra.fecha_emision,
      numero_cuota: cuentasPagar.numero_cuota,
      fecha_vencimiento: cuentasPagar.fecha_vencimiento,
      monto_gs: cuentasPagar.monto_gs,
      saldo_gs: cuentasPagar.saldo_gs,
      estado: cuentasPagar.estado,
      vencida: sql<boolean>`${cuentasPagar.fecha_vencimiento} < current_date and ${cuentasPagar.saldo_gs} > 0`,
    })
    .from(cuentasPagar)
    .innerJoin(facturasCompra, eq(facturasCompra.id, cuentasPagar.factura_compra_id))
    .innerJoin(proveedores, eq(proveedores.id, cuentasPagar.proveedor_id))
    .innerJoin(personas, eq(personas.id, proveedores.persona_id))
    .where(
      and(
        eq(cuentasPagar.empresa_id, s.empresaId),
        x.proveedorId ? eq(cuentasPagar.proveedor_id, x.proveedorId) : undefined,
        x.soloPendientes ? inArray(cuentasPagar.estado, ['pendiente', 'parcial']) : undefined,
        x.estado ? sql`${cuentasPagar.estado}::text = ${x.estado}` : undefined,
        x.desde ? gte(cuentasPagar.fecha_vencimiento, x.desde) : undefined,
        x.hasta ? lte(cuentasPagar.fecha_vencimiento, x.hasta) : undefined,
        x.q ? ilike(personas.razon_social, `%${x.q}%`) : undefined,
      ),
    )
    .orderBy(asc(cuentasPagar.fecha_vencimiento), asc(cuentasPagar.id))
    .limit(x.limite ?? 500);
  return filas.map((r) => ({ ...r, numero_comprobante: nroCompra(r) }));
}

export async function listarOrdenesPago(f?: FiltroCompras) {
  const s = await requireSesion();
  const x = filtroCompras.parse(f) ?? {};
  return db
    .select({
      id: ordenesPago.id,
      numero: ordenesPago.numero,
      fecha: ordenesPago.fecha,
      proveedor_id: ordenesPago.proveedor_id,
      proveedor: personas.razon_social,
      medio_pago: ordenesPago.medio_pago,
      referencia: ordenesPago.referencia,
      total_gs: ordenesPago.total_gs,
      estado: ordenesPago.estado,
    })
    .from(ordenesPago)
    .innerJoin(proveedores, eq(proveedores.id, ordenesPago.proveedor_id))
    .innerJoin(personas, eq(personas.id, proveedores.persona_id))
    .where(and(...comunes(s, x, ordenesPago, ordenesPago.fecha)))
    .orderBy(desc(ordenesPago.fecha), desc(ordenesPago.numero))
    .limit(x.limite ?? 200);
}

/* ------------------------------ Fichas ------------------------------ */

export async function obtenerPedidoCompra(id: number) {
  const s = await requireSesion();
  const p = await db.query.pedidosCompra.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: {
      proveedor: { with: { persona: true } },
      deposito: true,
      detalles: { orderBy: (d, { asc: a }) => [a(d.linea)], with: { articulo: { columns: { codigo: true, descripcion: true, tipo_iva: true, costo_referencia_gs: true } } } },
      ordenes: { with: { orden: { columns: { id: true, numero: true, estado: true } } } },
    },
  });
  if (!p) return null;
  return {
    ...p,
    detalles: p.detalles.map((d) => ({
      ...d,
      codigo: d.articulo.codigo,
      descripcion: d.articulo.descripcion,
      cantidadPendiente: Math.round((d.cantidad - d.cantidad_ordenada) * 1000) / 1000,
    })),
  };
}

export async function obtenerOrdenCompra(id: number) {
  const s = await requireSesion();
  const o = await db.query.ordenesCompra.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: {
      proveedor: { with: { persona: true } },
      condicionPago: true,
      deposito: true,
      detalles: { orderBy: (d, { asc: a }) => [a(d.linea)], with: { articulo: { columns: { codigo: true } } } },
      pedidos: { with: { pedido: { columns: { id: true, numero: true, fecha: true, estado: true } } } },
      facturas: { columns: { id: true, establecimiento: true, punto_expedicion: true, numero: true, estado: true, total_gs: true } },
    },
  });
  if (!o) return null;
  return {
    ...o,
    detalles: o.detalles.map((d) => ({
      ...d,
      codigo: d.articulo.codigo,
      cantidadPendiente: Math.round((d.cantidad - d.cantidad_facturada) * 1000) / 1000,
    })),
    facturas: o.facturas.map((f) => ({ ...f, numero_comprobante: nroCompra(f) })),
  };
}

export async function obtenerFacturaCompra(id: number) {
  const s = await requireSesion();
  const f = await db.query.facturasCompra.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: {
      proveedor: { with: { persona: true } },
      ordenCompra: { columns: { id: true, numero: true, estado: true } },
      condicionPago: true,
      deposito: true,
      detalles: { orderBy: (d, { asc: a }) => [a(d.linea)], with: { articulo: { columns: { codigo: true } } } },
      recepciones: { columns: { id: true, numero: true, fecha: true, estado: true, total_costo_gs: true } },
      cuentasPagar: { orderBy: (c, { asc: a }) => [a(c.numero_cuota)] },
    },
  });
  if (!f) return null;
  return {
    ...f,
    numero_comprobante: nroCompra(f),
    detalles: f.detalles.map((d) => ({
      ...d,
      codigo: d.articulo.codigo,
      cantidadPendiente: Math.round((d.cantidad - d.cantidad_recibida) * 1000) / 1000,
    })),
  };
}

export async function obtenerRecepcion(id: number) {
  const s = await requireSesion();
  const r = await db.query.recepciones.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: {
      factura: { with: { proveedor: { with: { persona: true } } } },
      deposito: true,
      detalles: { orderBy: (d, { asc: a }) => [a(d.linea)], with: { articulo: { columns: { codigo: true, descripcion: true } } } },
    },
  });
  if (!r) return null;
  return { ...r, numero_comprobante: nroCompra(r.factura) };
}

/* ------------------------------ Pendientes para importar ------------------------------ */

/** Pedidos confirmados/parciales con líneas pendientes de ordenar (incluye detalles pendientes). */
export async function pedidosAprobadosPendientes(proveedorId?: number | null) {
  const s = await requireSesion();
  const pedidos = await db.query.pedidosCompra.findMany({
    where: (t, { and: y, eq: e, inArray: i, or: o, isNull: n }) =>
      y(
        e(t.empresa_id, s.empresaId),
        e(t.sucursal_id, s.sucursalId),
        i(t.estado, ['confirmado', 'ordenado_parcial']),
        proveedorId ? o(e(t.proveedor_id, proveedorId), n(t.proveedor_id)) : undefined,
      ),
    with: {
      proveedor: { with: { persona: { columns: { razon_social: true } } } },
      detalles: { orderBy: (d, { asc: a }) => [a(d.linea)], with: { articulo: { columns: { codigo: true, descripcion: true, tipo_iva: true, costo_referencia_gs: true } } } },
    },
    orderBy: (t, { asc: a }) => [a(t.fecha), a(t.numero)],
  });
  return pedidos
    .map((p) => ({
      ...p,
      proveedor_nombre: p.proveedor?.persona.razon_social ?? null,
      detalles: p.detalles
        .map((d) => ({ ...d, codigo: d.articulo.codigo, descripcion: d.articulo.descripcion, cantidadPendiente: Math.round((d.cantidad - d.cantidad_ordenada) * 1000) / 1000 }))
        .filter((d) => d.cantidadPendiente > EPS),
    }))
    .filter((p) => p.detalles.length > 0);
}

/** Órdenes confirmadas/parciales con pendientes de facturar. */
export async function ordenesPendientesFacturar(proveedorId?: number | null) {
  const s = await requireSesion();
  const ordenes = await db.query.ordenesCompra.findMany({
    where: (t, { and: y, eq: e, inArray: i }) =>
      y(
        e(t.empresa_id, s.empresaId),
        e(t.sucursal_id, s.sucursalId),
        i(t.estado, ['confirmado', 'facturado_parcial']),
        proveedorId ? e(t.proveedor_id, proveedorId) : undefined,
      ),
    with: {
      proveedor: { with: { persona: { columns: { razon_social: true } } } },
      detalles: { orderBy: (d, { asc: a }) => [a(d.linea)] },
    },
    orderBy: (t, { asc: a }) => [a(t.fecha), a(t.numero)],
  });
  return ordenes
    .map((o) => ({
      ...o,
      proveedor_nombre: o.proveedor.persona.razon_social,
      detalles: o.detalles
        .map((d) => ({ ...d, cantidadPendiente: Math.round((d.cantidad - d.cantidad_facturada) * 1000) / 1000 }))
        .filter((d) => d.cantidadPendiente > EPS),
    }))
    .filter((o) => o.detalles.length > 0);
}

/** Facturas de compra confirmadas con mercadería pendiente de recepción. */
export async function facturasPendientesRecepcion() {
  const s = await requireSesion();
  const facturas = await db.query.facturasCompra.findMany({
    where: (t, { and: y, eq: e, inArray: i }) =>
      y(e(t.empresa_id, s.empresaId), e(t.sucursal_id, s.sucursalId), i(t.estado, ['confirmado', 'recibido_parcial'])),
    with: {
      proveedor: { with: { persona: { columns: { razon_social: true } } } },
      detalles: { orderBy: (d, { asc: a }) => [a(d.linea)] },
    },
    orderBy: (t, { asc: a }) => [a(t.fecha_emision), a(t.id)],
  });
  return facturas
    .map((f) => ({
      ...f,
      numero_comprobante: nroCompra(f),
      proveedor_nombre: f.proveedor.persona.razon_social,
      detalles: f.detalles
        .map((d) => ({ ...d, cantidadPendiente: Math.round((d.cantidad - d.cantidad_recibida) * 1000) / 1000 }))
        .filter((d) => d.cantidadPendiente > EPS),
    }))
    .filter((f) => f.detalles.length > 0);
}

