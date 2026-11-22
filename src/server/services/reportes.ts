import { and, asc, desc, eq, gte, inArray, lt, lte, ne, notInArray, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import type { DbLike } from '@/db';
import {
  articulos,
  asientosContables,
  clientes,
  cuentasCobrar,
  cuentasPagar,
  depositos,
  detallesAsientoContable,
  facturaCompraDetalles,
  facturasCompra,
  facturasVenta,
  facturaVentaDetalles,
  historicoCostos as historicoT,
  kardex as kardexT,
  personas,
  planCuentas,
  presupuestoDetalles,
  presupuestos,
  proveedores,
  sucursales,
} from '@/db/schema';
import type { Ctx } from '../lib/contexto';
import { hoyPy } from '../lib/fechas';
import { asegurar } from '../lib/result';
import type { ColumnaReporte, FiltroReporte, Reporte } from '../validation/reportes';

type Filtro = Omit<FiltroReporte, 'sucursalId'> & { sucursalId?: number | null };
type C = Pick<Ctx, 'empresaId' | 'sucursalId'>;

const n = (expr: SQL) => sql<number>`coalesce(${expr}, 0)`.mapWith(Number);
const sumN = (col: AnyPgColumn | SQL) => n(sql`sum(${col})`);
const fechaPy = (col: AnyPgColumn) => sql`(${col} at time zone 'America/Asuncion')::date`;
const nroFactura = (est: AnyPgColumn, pto: AnyPgColumn, num: AnyPgColumn) =>
  sql<string>`${est} || '-' || ${pto} || '-' || lpad(${num}::text, 7, '0')`;

/** Sucursal efectiva: undefined/null → la de la sesión; 0 → todas. */
const suc = (ctx: C, f: Filtro) => (f.sucursalId === 0 ? null : (f.sucursalId ?? ctx.sucursalId));
const filtroSuc = (col: AnyPgColumn, ctx: C, f: Filtro) => {
  const s = suc(ctx, f);
  return s === null ? undefined : eq(col, s);
};

function totalizar<F extends Record<string, unknown>>(filas: F[], claves: string[]) {
  const t: Record<string, number> = {};
  for (const k of claves) t[k] = filas.reduce((a, x) => a + Number(x[k] ?? 0), 0);
  return t;
}

const col = (key: string, label: string, tipo: ColumnaReporte['tipo'] = 'texto'): ColumnaReporte => ({ key, label, tipo });

/* =============================== Compras =============================== */

const estadosFcValidos = notInArray(facturasCompra.estado, ['borrador', 'anulado']);

export async function libroCompras(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const filas = await db
    .select({
      fecha: facturasCompra.fecha_emision,
      comprobante: nroFactura(facturasCompra.establecimiento, facturasCompra.punto_expedicion, facturasCompra.numero),
      timbrado: facturasCompra.timbrado,
      ruc: sql<string>`${personas.numero_documento} || coalesce('-' || ${personas.dv}, '')`,
      proveedor: personas.razon_social,
      condicion: facturasCompra.condicion_operacion,
      base_10_gs: sql<number>`${facturasCompra.gravada_10_gs} - ${facturasCompra.iva_10_gs}`.mapWith(Number),
      iva_10_gs: facturasCompra.iva_10_gs,
      base_5_gs: sql<number>`${facturasCompra.gravada_5_gs} - ${facturasCompra.iva_5_gs}`.mapWith(Number),
      iva_5_gs: facturasCompra.iva_5_gs,
      exenta_gs: facturasCompra.exenta_gs,
      total_gs: facturasCompra.total_gs,
    })
    .from(facturasCompra)
    .innerJoin(proveedores, eq(proveedores.id, facturasCompra.proveedor_id))
    .innerJoin(personas, eq(personas.id, proveedores.persona_id))
    .where(
      and(
        eq(facturasCompra.empresa_id, ctx.empresaId),
        filtroSuc(facturasCompra.sucursal_id, ctx, f),
        estadosFcValidos,
        gte(facturasCompra.fecha_emision, f.desde),
        lte(facturasCompra.fecha_emision, f.hasta),
        f.proveedorId ? eq(facturasCompra.proveedor_id, f.proveedorId) : undefined,
      ),
    )
    .orderBy(asc(facturasCompra.fecha_emision), asc(facturasCompra.id));
  const montos = ['base_10_gs', 'iva_10_gs', 'base_5_gs', 'iva_5_gs', 'exenta_gs', 'total_gs'];
  return {
    titulo: 'Libro IVA Compras',
    columnas: [
      col('fecha', 'Fecha', 'fecha'),
      col('comprobante', 'Comprobante'),
      col('timbrado', 'Timbrado'),
      col('ruc', 'RUC'),
      col('proveedor', 'Proveedor'),
      col('condicion', 'Condición'),
      col('base_10_gs', 'Gravada 10%', 'monto'),
      col('iva_10_gs', 'IVA 10%', 'monto'),
      col('base_5_gs', 'Gravada 5%', 'monto'),
      col('iva_5_gs', 'IVA 5%', 'monto'),
      col('exenta_gs', 'Exenta', 'monto'),
      col('total_gs', 'Total', 'monto'),
    ],
    filas,
    totales: totalizar(filas, montos),
  };
}

export async function comprasPorProveedor(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const filas = await db
    .select({
      proveedor_id: proveedores.id,
      proveedor: personas.razon_social,
      ruc: sql<string>`${personas.numero_documento} || coalesce('-' || ${personas.dv}, '')`,
      facturas: sql<number>`count(*)`.mapWith(Number),
      iva_gs: sumN(facturasCompra.total_iva_gs),
      total_gs: sumN(facturasCompra.total_gs),
    })
    .from(facturasCompra)
    .innerJoin(proveedores, eq(proveedores.id, facturasCompra.proveedor_id))
    .innerJoin(personas, eq(personas.id, proveedores.persona_id))
    .where(
      and(
        eq(facturasCompra.empresa_id, ctx.empresaId),
        filtroSuc(facturasCompra.sucursal_id, ctx, f),
        estadosFcValidos,
        gte(facturasCompra.fecha_emision, f.desde),
        lte(facturasCompra.fecha_emision, f.hasta),
      ),
    )
    .groupBy(proveedores.id, personas.razon_social, personas.numero_documento, personas.dv)
    .orderBy(desc(sql`sum(${facturasCompra.total_gs})`));
  return {
    titulo: 'Compras por proveedor',
    columnas: [col('proveedor', 'Proveedor'), col('ruc', 'RUC'), col('facturas', 'Facturas', 'numero'), col('iva_gs', 'IVA', 'monto'), col('total_gs', 'Total', 'monto')],
    filas,
    totales: totalizar(filas, ['facturas', 'iva_gs', 'total_gs']),
  };
}

export async function comprasPorArticulo(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const filas = await db
    .select({
      articulo_id: articulos.id,
      codigo: articulos.codigo,
      descripcion: articulos.descripcion,
      cantidad: sumN(sql`${facturaCompraDetalles.cantidad} * ${facturaCompraDetalles.factor_conversion}`),
      neto_gs: sumN(sql`${facturaCompraDetalles.total_linea_gs} - ${facturaCompraDetalles.iva_gs}`),
      total_gs: sumN(facturaCompraDetalles.total_linea_gs),
    })
    .from(facturaCompraDetalles)
    .innerJoin(facturasCompra, eq(facturasCompra.id, facturaCompraDetalles.factura_compra_id))
    .innerJoin(articulos, eq(articulos.id, facturaCompraDetalles.articulo_id))
    .where(
      and(
        eq(facturasCompra.empresa_id, ctx.empresaId),
        filtroSuc(facturasCompra.sucursal_id, ctx, f),
        estadosFcValidos,
        gte(facturasCompra.fecha_emision, f.desde),
        lte(facturasCompra.fecha_emision, f.hasta),
        f.proveedorId ? eq(facturasCompra.proveedor_id, f.proveedorId) : undefined,
        f.articuloId ? eq(facturaCompraDetalles.articulo_id, f.articuloId) : undefined,
      ),
    )
    .groupBy(articulos.id, articulos.codigo, articulos.descripcion)
    .orderBy(asc(articulos.codigo));
  const conCosto = filas.map((x) => ({ ...x, costo_medio_gs: x.cantidad > 0 ? Math.round(x.neto_gs / x.cantidad) : 0 }));
  return {
    titulo: 'Compras por artículo',
    columnas: [
      col('codigo', 'Código'),
      col('descripcion', 'Artículo'),
      col('cantidad', 'Cantidad', 'cantidad'),
      col('costo_medio_gs', 'Costo medio (sin IVA)', 'monto'),
      col('neto_gs', 'Neto', 'monto'),
      col('total_gs', 'Total (IVA incl.)', 'monto'),
    ],
    filas: conCosto,
    totales: totalizar(conCosto, ['cantidad', 'neto_gs', 'total_gs']),
  };
}

export async function historicoCostos(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const filas = await db
    .select({
      fecha: historicoT.fecha,
      codigo: articulos.codigo,
      descripcion: articulos.descripcion,
      proveedor: personas.razon_social,
      comprobante: nroFactura(facturasCompra.establecimiento, facturasCompra.punto_expedicion, facturasCompra.numero),
      cantidad: historicoT.cantidad,
      costo_unitario_gs: historicoT.costo_unitario_gs,
      costo_promedio_anterior_gs: historicoT.costo_promedio_anterior_gs,
      costo_promedio_nuevo_gs: historicoT.costo_promedio_nuevo_gs,
    })
    .from(historicoT)
    .innerJoin(articulos, eq(articulos.id, historicoT.articulo_id))
    .innerJoin(facturaCompraDetalles, eq(facturaCompraDetalles.id, historicoT.detalle_factura_compra_id))
    .innerJoin(facturasCompra, eq(facturasCompra.id, facturaCompraDetalles.factura_compra_id))
    .leftJoin(proveedores, eq(proveedores.id, historicoT.proveedor_id))
    .leftJoin(personas, eq(personas.id, proveedores.persona_id))
    .where(
      and(
        eq(historicoT.empresa_id, ctx.empresaId),
        filtroSuc(historicoT.sucursal_id, ctx, f),
        ne(facturasCompra.estado, 'anulado'),
        gte(historicoT.fecha, f.desde),
        lte(historicoT.fecha, f.hasta),
        f.articuloId ? eq(historicoT.articulo_id, f.articuloId) : undefined,
        f.proveedorId ? eq(historicoT.proveedor_id, f.proveedorId) : undefined,
      ),
    )
    .orderBy(asc(articulos.codigo), asc(historicoT.fecha), asc(historicoT.id));
  return {
    titulo: 'Histórico de costos',
    columnas: [
      col('fecha', 'Fecha', 'fecha'),
      col('codigo', 'Código'),
      col('descripcion', 'Artículo'),
      col('proveedor', 'Proveedor'),
      col('comprobante', 'Comprobante'),
      col('cantidad', 'Cantidad', 'cantidad'),
      col('costo_unitario_gs', 'Costo unitario', 'monto'),
      col('costo_promedio_anterior_gs', 'Promedio anterior', 'monto'),
      col('costo_promedio_nuevo_gs', 'Promedio nuevo', 'monto'),
    ],
    filas,
    totales: totalizar(filas, ['cantidad']),
  };
}

export async function estadoCuentasPagar(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const hoy = hoyPy();
  const filas = await db
    .select({
      proveedor: personas.razon_social,
      comprobante: nroFactura(facturasCompra.establecimiento, facturasCompra.punto_expedicion, facturasCompra.numero),
      fecha_emision: facturasCompra.fecha_emision,
      cuota: cuentasPagar.numero_cuota,
      vencimiento: cuentasPagar.fecha_vencimiento,
      monto_gs: cuentasPagar.monto_gs,
      saldo_gs: cuentasPagar.saldo_gs,
      dias_atraso: sql<number>`greatest(0, ${hoy}::date - ${cuentasPagar.fecha_vencimiento})`.mapWith(Number),
      estado: cuentasPagar.estado,
    })
    .from(cuentasPagar)
    .innerJoin(facturasCompra, eq(facturasCompra.id, cuentasPagar.factura_compra_id))
    .innerJoin(proveedores, eq(proveedores.id, cuentasPagar.proveedor_id))
    .innerJoin(personas, eq(personas.id, proveedores.persona_id))
    .where(
      and(
        eq(cuentasPagar.empresa_id, ctx.empresaId),
        filtroSuc(cuentasPagar.sucursal_id, ctx, f),
        inArray(cuentasPagar.estado, ['pendiente', 'parcial']),
        lte(facturasCompra.fecha_emision, f.hasta),
        f.proveedorId ? eq(cuentasPagar.proveedor_id, f.proveedorId) : undefined,
      ),
    )
    .orderBy(asc(personas.razon_social), asc(cuentasPagar.fecha_vencimiento));
  return {
    titulo: 'Estado de cuentas a pagar',
    columnas: [
      col('proveedor', 'Proveedor'),
      col('comprobante', 'Comprobante'),
      col('fecha_emision', 'Emisión', 'fecha'),
      col('cuota', 'Cuota', 'numero'),
      col('vencimiento', 'Vencimiento', 'fecha'),
      col('monto_gs', 'Monto', 'monto'),
      col('saldo_gs', 'Saldo', 'monto'),
      col('dias_atraso', 'Días atraso', 'numero'),
    ],
    filas,
    totales: totalizar(filas, ['monto_gs', 'saldo_gs']),
  };
}

/* =============================== Ventas =============================== */

const fvValida = (ctx: C, f: Filtro) =>
  and(
    eq(facturasVenta.empresa_id, ctx.empresaId),
    filtroSuc(facturasVenta.sucursal_id, ctx, f),
    eq(facturasVenta.estado, 'confirmado'),
    sql`${fechaPy(facturasVenta.fecha_emision)} between ${f.desde}::date and ${f.hasta}::date`,
    f.clienteId ? eq(facturasVenta.cliente_id, f.clienteId) : undefined,
  );

export async function libroVentas(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const filas = await db
    .select({
      fecha: sql<string>`to_char(${fechaPy(facturasVenta.fecha_emision)}, 'YYYY-MM-DD')`,
      comprobante: nroFactura(facturasVenta.establecimiento, facturasVenta.punto_expedicion, facturasVenta.numero),
      timbrado: facturasVenta.timbrado,
      cdc: facturasVenta.cdc,
      documento: sql<string>`${facturasVenta.receptor_numero_documento} || coalesce('-' || ${facturasVenta.receptor_dv}, '')`,
      cliente: facturasVenta.receptor_razon_social,
      condicion: facturasVenta.condicion_operacion,
      base_10_gs: sql<number>`${facturasVenta.gravada_10_gs} - ${facturasVenta.iva_10_gs}`.mapWith(Number),
      iva_10_gs: facturasVenta.iva_10_gs,
      base_5_gs: sql<number>`${facturasVenta.gravada_5_gs} - ${facturasVenta.iva_5_gs}`.mapWith(Number),
      iva_5_gs: facturasVenta.iva_5_gs,
      exenta_gs: facturasVenta.exenta_gs,
      total_gs: facturasVenta.total_gs,
      estado_sifen: facturasVenta.estado_sifen,
    })
    .from(facturasVenta)
    .where(fvValida(ctx, f))
    .orderBy(asc(facturasVenta.fecha_emision), asc(facturasVenta.numero));
  const montos = ['base_10_gs', 'iva_10_gs', 'base_5_gs', 'iva_5_gs', 'exenta_gs', 'total_gs'];
  return {
    titulo: 'Libro IVA Ventas',
    columnas: [
      col('fecha', 'Fecha', 'fecha'),
      col('comprobante', 'Comprobante'),
      col('timbrado', 'Timbrado'),
      col('documento', 'RUC / CI'),
      col('cliente', 'Cliente'),
      col('condicion', 'Condición'),
      col('base_10_gs', 'Gravada 10%', 'monto'),
      col('iva_10_gs', 'IVA 10%', 'monto'),
      col('base_5_gs', 'Gravada 5%', 'monto'),
      col('iva_5_gs', 'IVA 5%', 'monto'),
      col('exenta_gs', 'Exenta', 'monto'),
      col('total_gs', 'Total', 'monto'),
      col('estado_sifen', 'SIFEN'),
    ],
    filas,
    totales: totalizar(filas, montos),
  };
}

export async function ventasPorCliente(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const filas = await db
    .select({
      cliente_id: facturasVenta.cliente_id,
      cliente: facturasVenta.receptor_razon_social,
      facturas: sql<number>`count(*)`.mapWith(Number),
      iva_gs: sumN(facturasVenta.total_iva_gs),
      total_gs: sumN(facturasVenta.total_gs),
      costo_gs: sumN(facturasVenta.total_costo_gs),
    })
    .from(facturasVenta)
    .where(fvValida(ctx, f))
    .groupBy(facturasVenta.cliente_id, facturasVenta.receptor_razon_social)
    .orderBy(desc(sql`sum(${facturasVenta.total_gs})`));
  const conMargen = filas.map((x) => ({ ...x, margen_gs: x.total_gs - x.iva_gs - x.costo_gs }));
  return {
    titulo: 'Ventas por cliente',
    columnas: [
      col('cliente', 'Cliente'),
      col('facturas', 'Facturas', 'numero'),
      col('total_gs', 'Total', 'monto'),
      col('iva_gs', 'IVA', 'monto'),
      col('costo_gs', 'Costo', 'monto'),
      col('margen_gs', 'Margen', 'monto'),
    ],
    filas: conMargen,
    totales: totalizar(conMargen, ['facturas', 'total_gs', 'iva_gs', 'costo_gs', 'margen_gs']),
  };
}

export async function ventasPorArticulo(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const cantBase = sql`${facturaVentaDetalles.cantidad} * ${facturaVentaDetalles.factor_conversion}`;
  const filas = await db
    .select({
      articulo_id: articulos.id,
      codigo: articulos.codigo,
      descripcion: articulos.descripcion,
      cantidad: sumN(cantBase),
      descuento_gs: sumN(facturaVentaDetalles.descuento_gs),
      neto_gs: sumN(sql`${facturaVentaDetalles.total_linea_gs} - ${facturaVentaDetalles.iva_gs}`),
      total_gs: sumN(facturaVentaDetalles.total_linea_gs),
      costo_gs: n(sql`round(sum(${cantBase} * ${facturaVentaDetalles.costo_unitario_gs}))`),
    })
    .from(facturaVentaDetalles)
    .innerJoin(facturasVenta, eq(facturasVenta.id, facturaVentaDetalles.factura_venta_id))
    .innerJoin(articulos, eq(articulos.id, facturaVentaDetalles.articulo_id))
    .where(and(fvValida(ctx, f), f.articuloId ? eq(facturaVentaDetalles.articulo_id, f.articuloId) : undefined))
    .groupBy(articulos.id, articulos.codigo, articulos.descripcion)
    .orderBy(asc(articulos.codigo));
  const conMargen = filas.map((x) => ({ ...x, margen_gs: x.neto_gs - x.costo_gs }));
  return {
    titulo: 'Ventas por artículo',
    columnas: [
      col('codigo', 'Código'),
      col('descripcion', 'Artículo'),
      col('cantidad', 'Cantidad', 'cantidad'),
      col('descuento_gs', 'Descuentos', 'monto'),
      col('total_gs', 'Total (IVA incl.)', 'monto'),
      col('neto_gs', 'Neto', 'monto'),
      col('costo_gs', 'Costo', 'monto'),
      col('margen_gs', 'Margen', 'monto'),
    ],
    filas: conMargen,
    totales: totalizar(conMargen, ['cantidad', 'descuento_gs', 'total_gs', 'neto_gs', 'costo_gs', 'margen_gs']),
  };
}

export async function presupuestosPendientesVsFacturados(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const filas = await db
    .select({
      presupuesto_id: presupuestos.id,
      numero: presupuestos.numero,
      fecha: presupuestos.fecha,
      fecha_validez: presupuestos.fecha_validez,
      cliente: sql<string>`coalesce(${personas.razon_social}, 'SIN NOMBRE')`,
      estado: presupuestos.estado,
      total_gs: presupuestos.total_gs,
      facturado_gs: n(
        sql`round(sum(${presupuestoDetalles.total_linea_gs} * ${presupuestoDetalles.cantidad_facturada} / ${presupuestoDetalles.cantidad}))`,
      ),
    })
    .from(presupuestos)
    .innerJoin(presupuestoDetalles, eq(presupuestoDetalles.presupuesto_id, presupuestos.id))
    .leftJoin(clientes, eq(clientes.id, presupuestos.cliente_id))
    .leftJoin(personas, eq(personas.id, clientes.persona_id))
    .where(
      and(
        eq(presupuestos.empresa_id, ctx.empresaId),
        filtroSuc(presupuestos.sucursal_id, ctx, f),
        notInArray(presupuestos.estado, ['borrador', 'anulado']),
        gte(presupuestos.fecha, f.desde),
        lte(presupuestos.fecha, f.hasta),
        f.clienteId ? eq(presupuestos.cliente_id, f.clienteId) : undefined,
      ),
    )
    .groupBy(presupuestos.id, personas.razon_social)
    .orderBy(asc(presupuestos.fecha), asc(presupuestos.numero));
  const conPend = filas.map((x) => ({ ...x, pendiente_gs: x.total_gs - x.facturado_gs }));
  return {
    titulo: 'Presupuestos: pendiente vs. facturado',
    columnas: [
      col('numero', 'N°', 'numero'),
      col('fecha', 'Fecha', 'fecha'),
      col('fecha_validez', 'Validez', 'fecha'),
      col('cliente', 'Cliente'),
      col('estado', 'Estado'),
      col('total_gs', 'Total', 'monto'),
      col('facturado_gs', 'Facturado', 'monto'),
      col('pendiente_gs', 'Pendiente', 'monto'),
    ],
    filas: conPend,
    totales: totalizar(conPend, ['total_gs', 'facturado_gs', 'pendiente_gs']),
  };
}

export async function estadoCuentasCobrar(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const hoy = hoyPy();
  const filas = await db
    .select({
      cliente: facturasVenta.receptor_razon_social,
      comprobante: nroFactura(facturasVenta.establecimiento, facturasVenta.punto_expedicion, facturasVenta.numero),
      cuota: cuentasCobrar.numero_cuota,
      vencimiento: cuentasCobrar.fecha_vencimiento,
      monto_gs: cuentasCobrar.monto_gs,
      saldo_gs: cuentasCobrar.saldo_gs,
      dias_atraso: sql<number>`greatest(0, ${hoy}::date - ${cuentasCobrar.fecha_vencimiento})`.mapWith(Number),
      estado: cuentasCobrar.estado,
    })
    .from(cuentasCobrar)
    .innerJoin(facturasVenta, eq(facturasVenta.id, cuentasCobrar.factura_venta_id))
    .where(
      and(
        eq(cuentasCobrar.empresa_id, ctx.empresaId),
        filtroSuc(cuentasCobrar.sucursal_id, ctx, f),
        inArray(cuentasCobrar.estado, ['pendiente', 'parcial']),
        sql`${fechaPy(facturasVenta.fecha_emision)} <= ${f.hasta}::date`,
        f.clienteId ? eq(cuentasCobrar.cliente_id, f.clienteId) : undefined,
      ),
    )
    .orderBy(asc(facturasVenta.receptor_razon_social), asc(cuentasCobrar.fecha_vencimiento));
  return {
    titulo: 'Estado de cuentas a cobrar',
    columnas: [
      col('cliente', 'Cliente'),
      col('comprobante', 'Comprobante'),
      col('cuota', 'Cuota', 'numero'),
      col('vencimiento', 'Vencimiento', 'fecha'),
      col('monto_gs', 'Monto', 'monto'),
      col('saldo_gs', 'Saldo', 'monto'),
      col('dias_atraso', 'Días atraso', 'numero'),
    ],
    filas,
    totales: totalizar(filas, ['monto_gs', 'saldo_gs']),
  };
}

/* =============================== Inventario =============================== */

/** Kardex de un artículo (opcionalmente por depósito) con saldo inicial por depósito. */
export async function kardex(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  asegurar(f.articuloId, 'Indique el artículo');
  const cond = and(
    eq(kardexT.empresa_id, ctx.empresaId),
    eq(kardexT.articulo_id, f.articuloId),
    f.depositoId ? eq(kardexT.deposito_id, f.depositoId) : filtroSuc(kardexT.sucursal_id, ctx, f),
  );
  const iniciales = await db
    .selectDistinctOn([kardexT.deposito_id], {
      deposito_id: kardexT.deposito_id,
      saldo: kardexT.saldo_cantidad,
      valor: kardexT.saldo_valorizado_gs,
    })
    .from(kardexT)
    .where(and(cond, sql`${fechaPy(kardexT.fecha)} < ${f.desde}::date`))
    .orderBy(kardexT.deposito_id, desc(kardexT.id));
  const filas = await db
    .select({
      id: kardexT.id,
      fecha: sql<string>`to_char(${kardexT.fecha} at time zone 'America/Asuncion', 'YYYY-MM-DD HH24:MI')`,
      deposito: depositos.nombre,
      tipo_movimiento: kardexT.tipo_movimiento,
      origen_tipo: kardexT.origen_tipo,
      origen_id: kardexT.origen_id,
      entrada: kardexT.cantidad_entrada,
      salida: kardexT.cantidad_salida,
      saldo: kardexT.saldo_cantidad,
      costo_unitario_gs: kardexT.costo_unitario_gs,
      costo_promedio_gs: kardexT.costo_promedio_gs,
      saldo_valorizado_gs: kardexT.saldo_valorizado_gs,
    })
    .from(kardexT)
    .innerJoin(depositos, eq(depositos.id, kardexT.deposito_id))
    .where(and(cond, sql`${fechaPy(kardexT.fecha)} between ${f.desde}::date and ${f.hasta}::date`))
    .orderBy(asc(kardexT.deposito_id), asc(kardexT.id));
  return {
    titulo: 'Kardex',
    columnas: [
      col('fecha', 'Fecha', 'fecha'),
      col('deposito', 'Depósito'),
      col('tipo_movimiento', 'Movimiento'),
      col('origen_tipo', 'Origen'),
      col('origen_id', 'Doc.', 'numero'),
      col('entrada', 'Entrada', 'cantidad'),
      col('salida', 'Salida', 'cantidad'),
      col('saldo', 'Saldo', 'cantidad'),
      col('costo_unitario_gs', 'Costo unit.', 'monto'),
      col('costo_promedio_gs', 'Costo prom.', 'monto'),
      col('saldo_valorizado_gs', 'Saldo valorizado', 'monto'),
    ],
    filas,
    totales: totalizar(filas, ['entrada', 'salida']),
    extra: {
      saldoInicial: iniciales.reduce((a, x) => a + Number(x.saldo), 0),
      saldoInicialValorizadoGs: iniciales.reduce((a, x) => a + Number(x.valor), 0),
      saldosInicialesPorDeposito: iniciales,
    },
  };
}

/* =============================== Contabilidad =============================== */

/** Asientos que cuentan en los libros: confirmados y anulados (estos últimos neteados por su contra-asiento). */
const asientoContable = (ctx: C) =>
  and(eq(asientosContables.empresa_id, ctx.empresaId), ne(asientosContables.estado, 'borrador'));

export async function libroDiario(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const filas = await db
    .select({
      asiento_id: asientosContables.id,
      numero: asientosContables.numero,
      fecha: asientosContables.fecha,
      concepto: asientosContables.concepto,
      origen_tipo: asientosContables.origen_tipo,
      estado: asientosContables.estado,
      linea: detallesAsientoContable.linea,
      cuenta_codigo: planCuentas.codigo,
      cuenta: planCuentas.nombre,
      sucursal: sucursales.codigo,
      glosa: detallesAsientoContable.glosa,
      debe_gs: detallesAsientoContable.debe_gs,
      haber_gs: detallesAsientoContable.haber_gs,
    })
    .from(detallesAsientoContable)
    .innerJoin(asientosContables, eq(asientosContables.id, detallesAsientoContable.asiento_id))
    .innerJoin(planCuentas, eq(planCuentas.id, detallesAsientoContable.cuenta_id))
    .innerJoin(sucursales, eq(sucursales.id, detallesAsientoContable.sucursal_id))
    .where(
      and(
        asientoContable(ctx),
        filtroSuc(asientosContables.sucursal_id, ctx, f),
        gte(asientosContables.fecha, f.desde),
        lte(asientosContables.fecha, f.hasta),
      ),
    )
    .orderBy(asc(asientosContables.fecha), asc(asientosContables.numero), asc(detallesAsientoContable.linea));
  return {
    titulo: 'Libro diario',
    columnas: [
      col('numero', 'Asiento', 'numero'),
      col('fecha', 'Fecha', 'fecha'),
      col('concepto', 'Concepto'),
      col('cuenta_codigo', 'Cuenta'),
      col('cuenta', 'Nombre'),
      col('glosa', 'Glosa'),
      col('debe_gs', 'Debe', 'monto'),
      col('haber_gs', 'Haber', 'monto'),
    ],
    filas,
    totales: totalizar(filas, ['debe_gs', 'haber_gs']),
  };
}

/** Libro mayor de una cuenta: saldo inicial (antes de `desde`), movimientos y saldo acumulado (Debe − Haber). */
export async function libroMayor(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  asegurar(f.cuentaId, 'Indique la cuenta');
  const [cuenta] = await db
    .select()
    .from(planCuentas)
    .where(and(eq(planCuentas.id, f.cuentaId), eq(planCuentas.empresa_id, ctx.empresaId)));
  asegurar(cuenta, 'Cuenta inexistente');
  const base = and(asientoContable(ctx), eq(detallesAsientoContable.cuenta_id, cuenta.id), filtroSuc(detallesAsientoContable.sucursal_id, ctx, f));
  const [ini] = await db
    .select({ saldo: sumN(sql`${detallesAsientoContable.debe_gs} - ${detallesAsientoContable.haber_gs}`) })
    .from(detallesAsientoContable)
    .innerJoin(asientosContables, eq(asientosContables.id, detallesAsientoContable.asiento_id))
    .where(and(base, lt(asientosContables.fecha, f.desde)));
  const saldoInicial = ini?.saldo ?? 0;
  const filas = await db
    .select({
      fecha: asientosContables.fecha,
      numero: asientosContables.numero,
      concepto: asientosContables.concepto,
      glosa: detallesAsientoContable.glosa,
      debe_gs: detallesAsientoContable.debe_gs,
      haber_gs: detallesAsientoContable.haber_gs,
      saldo_gs: sql<number>`${saldoInicial}::bigint + sum(${detallesAsientoContable.debe_gs} - ${detallesAsientoContable.haber_gs}) over (order by ${asientosContables.fecha}, ${asientosContables.numero}, ${detallesAsientoContable.linea} rows unbounded preceding)`.mapWith(
        Number,
      ),
    })
    .from(detallesAsientoContable)
    .innerJoin(asientosContables, eq(asientosContables.id, detallesAsientoContable.asiento_id))
    .where(and(base, gte(asientosContables.fecha, f.desde), lte(asientosContables.fecha, f.hasta)))
    .orderBy(asc(asientosContables.fecha), asc(asientosContables.numero), asc(detallesAsientoContable.linea));
  const totales = totalizar(filas, ['debe_gs', 'haber_gs']);
  return {
    titulo: `Libro mayor ${cuenta.codigo} ${cuenta.nombre}`,
    columnas: [
      col('fecha', 'Fecha', 'fecha'),
      col('numero', 'Asiento', 'numero'),
      col('concepto', 'Concepto'),
      col('glosa', 'Glosa'),
      col('debe_gs', 'Debe', 'monto'),
      col('haber_gs', 'Haber', 'monto'),
      col('saldo_gs', 'Saldo', 'monto'),
    ],
    filas,
    totales: { ...totales, saldo_inicial_gs: saldoInicial, saldo_final_gs: saldoInicial + totales.debe_gs - totales.haber_gs },
    extra: { cuenta: { id: cuenta.id, codigo: cuenta.codigo, nombre: cuenta.nombre, tipo: cuenta.tipo }, saldoInicialGs: saldoInicial },
  };
}

/** Balance de sumas y saldos del período por cuenta imputable. */
export async function balanceSumasSaldos(db: DbLike, ctx: C, f: Filtro): Promise<Reporte> {
  const filas = await db
    .select({
      cuenta_id: planCuentas.id,
      codigo: planCuentas.codigo,
      cuenta: planCuentas.nombre,
      tipo: planCuentas.tipo,
      debe_gs: sumN(detallesAsientoContable.debe_gs),
      haber_gs: sumN(detallesAsientoContable.haber_gs),
    })
    .from(detallesAsientoContable)
    .innerJoin(asientosContables, eq(asientosContables.id, detallesAsientoContable.asiento_id))
    .innerJoin(planCuentas, eq(planCuentas.id, detallesAsientoContable.cuenta_id))
    .where(
      and(
        asientoContable(ctx),
        filtroSuc(detallesAsientoContable.sucursal_id, ctx, f),
        gte(asientosContables.fecha, f.desde),
        lte(asientosContables.fecha, f.hasta),
      ),
    )
    .groupBy(planCuentas.id, planCuentas.codigo, planCuentas.nombre, planCuentas.tipo)
    .orderBy(asc(planCuentas.codigo));
  const conSaldo = filas.map((x) => ({
    ...x,
    saldo_deudor_gs: Math.max(0, x.debe_gs - x.haber_gs),
    saldo_acreedor_gs: Math.max(0, x.haber_gs - x.debe_gs),
  }));
  return {
    titulo: 'Balance de sumas y saldos',
    columnas: [
      col('codigo', 'Código'),
      col('cuenta', 'Cuenta'),
      col('debe_gs', 'Sumas Debe', 'monto'),
      col('haber_gs', 'Sumas Haber', 'monto'),
      col('saldo_deudor_gs', 'Saldo deudor', 'monto'),
      col('saldo_acreedor_gs', 'Saldo acreedor', 'monto'),
    ],
    filas: conSaldo,
    totales: totalizar(conSaldo, ['debe_gs', 'haber_gs', 'saldo_deudor_gs', 'saldo_acreedor_gs']),
  };
}

/** Registro de reportes (usado por la exportación CSV). */
export const REPORTES = {
  libroCompras,
  comprasPorProveedor,
  comprasPorArticulo,
  historicoCostos,
  estadoCuentasPagar,
  libroVentas,
  ventasPorCliente,
  ventasPorArticulo,
  presupuestosPendientesVsFacturados,
  estadoCuentasCobrar,
  kardex,
  libroDiario,
  libroMayor,
  balanceSumasSaldos,
} as const;
export type NombreReporte = keyof typeof REPORTES;

/** Permiso requerido por reporte. */
export const PERMISO_REPORTE: Record<NombreReporte, string> = {
  libroCompras: 'reportes.compras.ver',
  comprasPorProveedor: 'reportes.compras.ver',
  comprasPorArticulo: 'reportes.compras.ver',
  historicoCostos: 'reportes.compras.ver',
  estadoCuentasPagar: 'reportes.compras.ver',
  libroVentas: 'reportes.ventas.ver',
  ventasPorCliente: 'reportes.ventas.ver',
  ventasPorArticulo: 'reportes.ventas.ver',
  presupuestosPendientesVsFacturados: 'reportes.ventas.ver',
  estadoCuentasCobrar: 'reportes.ventas.ver',
  kardex: 'inventario.kardex.consultar',
  libroDiario: 'contabilidad.reportes.ver',
  libroMayor: 'contabilidad.reportes.ver',
  balanceSumasSaldos: 'contabilidad.reportes.ver',
};
