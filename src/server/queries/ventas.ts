/** Consultas de Ventas (Server Components). */
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  articulos,
  articuloUnidades,
  asientosContables,
  clientes,
  cobroDetalles,
  cobros,
  cuentasCobrar,
  facturasVenta,
  personas,
  presupuestos,
  stock,
  unidadesMedida,
  usuarios,
} from '@/db/schema';
import { requireSesion } from '../auth/session';
import { formatearNumeroFactura } from '../fiscal/sifen';
import { resolverDescuento as resolverDescuentoSvc, type DescuentoResuelto } from '../services/descuentos';
import { depositoPrincipal } from '../services/inventario';
import { ctxDe } from '../auth/session';
import { filtroDocumentosVenta, resolverDescuentoInput, type FiltroDocumentosVenta, type ResolverDescuentoInput } from '../validation/ventas';

export async function listarPresupuestos(f?: FiltroDocumentosVenta) {
  const s = await requireSesion();
  const x = filtroDocumentosVenta.parse(f) ?? {};
  return db
    .select({
      id: presupuestos.id,
      numero: presupuestos.numero,
      fecha: presupuestos.fecha,
      fecha_validez: presupuestos.fecha_validez,
      cliente_id: presupuestos.cliente_id,
      cliente: sql<string>`coalesce(${personas.razon_social}, 'SIN NOMBRE')`,
      vendedor: usuarios.nombre,
      condicion_operacion: presupuestos.condicion_operacion,
      total_gs: presupuestos.total_gs,
      estado: presupuestos.estado,
      vencido: sql<boolean>`${presupuestos.fecha_validez} < current_date and ${presupuestos.estado} in ('borrador','confirmado','facturado_parcial')`,
    })
    .from(presupuestos)
    .leftJoin(clientes, eq(clientes.id, presupuestos.cliente_id))
    .leftJoin(personas, eq(personas.id, clientes.persona_id))
    .leftJoin(usuarios, eq(usuarios.id, presupuestos.vendedor_id))
    .where(
      and(
        eq(presupuestos.empresa_id, s.empresaId),
        eq(presupuestos.sucursal_id, s.sucursalId),
        x.desde ? gte(presupuestos.fecha, x.desde) : undefined,
        x.hasta ? lte(presupuestos.fecha, x.hasta) : undefined,
        x.clienteId ? eq(presupuestos.cliente_id, x.clienteId) : undefined,
        x.estado ? sql`${presupuestos.estado}::text = ${x.estado}` : undefined,
        x.q ? or(ilike(personas.razon_social, `%${x.q}%`), sql`${presupuestos.numero}::text = ${x.q}`) : undefined,
      ),
    )
    .orderBy(desc(presupuestos.fecha), desc(presupuestos.numero))
    .limit(x.limite ?? 200);
}

/** Presupuesto con detalles y `cantidadPendiente` (= cantidad − cantidad_facturada) por ítem. */
export async function obtenerPresupuesto(id: number) {
  const s = await requireSesion();
  const p = await db.query.presupuestos.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: {
      cliente: { with: { persona: true } },
      vendedor: { columns: { id: true, nombre: true } },
      detalles: { orderBy: (d, { asc: a }) => [a(d.linea)], with: { articulo: { columns: { codigo: true, descripcion: true, tipo_iva: true } } } },
      facturas: { columns: { id: true, numero: true, establecimiento: true, punto_expedicion: true, estado: true, total_gs: true } },
    },
  });
  if (!p) return null;
  return {
    ...p,
    cliente_nombre: p.cliente?.persona.razon_social ?? 'SIN NOMBRE',
    detalles: p.detalles.map((d) => ({
      ...d,
      codigo: d.articulo.codigo,
      cantidadPendiente: Math.round((d.cantidad - d.cantidad_facturada) * 1000) / 1000,
    })),
    facturas: p.facturas.map((f) => ({
      ...f,
      numero_completo: f.numero ? formatearNumeroFactura(f.establecimiento!, f.punto_expedicion!, f.numero) : null,
    })),
  };
}

export async function listarFacturasVenta(f?: FiltroDocumentosVenta) {
  const s = await requireSesion();
  const x = filtroDocumentosVenta.parse(f) ?? {};
  const fecha = sql`(${facturasVenta.fecha_emision} at time zone 'America/Asuncion')::date`;
  const filas = await db
    .select({
      id: facturasVenta.id,
      presupuesto_id: facturasVenta.presupuesto_id,
      fecha_emision: facturasVenta.fecha_emision,
      establecimiento: facturasVenta.establecimiento,
      punto_expedicion: facturasVenta.punto_expedicion,
      numero: facturasVenta.numero,
      timbrado: facturasVenta.timbrado,
      cdc: facturasVenta.cdc,
      cliente_id: facturasVenta.cliente_id,
      receptor_razon_social: facturasVenta.receptor_razon_social,
      receptor_numero_documento: facturasVenta.receptor_numero_documento,
      condicion_operacion: facturasVenta.condicion_operacion,
      total_gs: facturasVenta.total_gs,
      total_iva_gs: facturasVenta.total_iva_gs,
      estado: facturasVenta.estado,
      estado_sifen: facturasVenta.estado_sifen,
      saldo_gs: sql<number>`coalesce((select sum(cc.saldo_gs) from ${cuentasCobrar} cc where cc.factura_venta_id = ${facturasVenta.id} and cc.estado <> 'anulado'), 0)`.mapWith(Number),
    })
    .from(facturasVenta)
    .where(
      and(
        eq(facturasVenta.empresa_id, s.empresaId),
        eq(facturasVenta.sucursal_id, s.sucursalId),
        x.desde ? sql`${fecha} >= ${x.desde}::date` : undefined,
        x.hasta ? sql`${fecha} <= ${x.hasta}::date` : undefined,
        x.clienteId ? eq(facturasVenta.cliente_id, x.clienteId) : undefined,
        x.estado ? sql`${facturasVenta.estado}::text = ${x.estado}` : undefined,
        x.estadoSifen ? sql`${facturasVenta.estado_sifen}::text = ${x.estadoSifen}` : undefined,
        x.q
          ? or(
              ilike(facturasVenta.receptor_razon_social, `%${x.q}%`),
              ilike(facturasVenta.receptor_numero_documento, `%${x.q}%`),
              sql`${facturasVenta.numero}::text = ${x.q.replace(/^.*-0*/, '')}`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(facturasVenta.id))
    .limit(x.limite ?? 200);
  return filas.map((r) => ({
    ...r,
    numero_completo: r.numero ? formatearNumeroFactura(r.establecimiento!, r.punto_expedicion!, r.numero) : null,
  }));
}

/** Factura con detalles, cuotas, CxC, cobros, eventos SIFEN y documentos relacionados (presupuesto, asientos). */
export async function obtenerFacturaVenta(id: number) {
  const s = await requireSesion();
  const f = await db.query.facturasVenta.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: {
      cliente: { with: { persona: true } },
      vendedor: { columns: { id: true, nombre: true } },
      deposito: true,
      detalles: { orderBy: (d, { asc: a }) => [a(d.linea)], with: { articulo: { columns: { codigo: true } }, unidadMedida: true } },
      cuotas: { orderBy: (c, { asc: a }) => [a(c.numero_cuota)] },
      cuentasCobrar: { orderBy: (c, { asc: a }) => [a(c.numero_cuota)] },
      eventosSifen: { orderBy: (e, { desc: d }) => [d(e.id)], columns: { request_xml: false, response_xml: false } },
      presupuesto: { columns: { id: true, numero: true, fecha: true, estado: true, total_gs: true } },
    },
  });
  if (!f) return null;
  const cxcIds = f.cuentasCobrar.map((c) => c.id);
  const cobrosRel = cxcIds.length
    ? await db
        .selectDistinct({ id: cobros.id, numero: cobros.numero, fecha: cobros.fecha, total_gs: cobros.total_gs, estado: cobros.estado })
        .from(cobros)
        .innerJoin(cobroDetalles, eq(cobroDetalles.cobro_id, cobros.id))
        .where(inArray(cobroDetalles.cuenta_cobrar_id, cxcIds))
    : [];
  const asientos = await db
    .select({ id: asientosContables.id, numero: asientosContables.numero, fecha: asientosContables.fecha, estado: asientosContables.estado, total_debe_gs: asientosContables.total_debe_gs, asiento_revertido_id: asientosContables.asiento_revertido_id })
    .from(asientosContables)
    .where(and(eq(asientosContables.origen_tipo, 'factura_venta'), eq(asientosContables.origen_id, f.id)))
    .orderBy(asc(asientosContables.numero));
  const { xml_firmado: _x, ...resto } = f;
  return {
    ...resto,
    numero_completo: f.numero ? formatearNumeroFactura(f.establecimiento!, f.punto_expedicion!, f.numero) : null,
    eventos: f.eventosSifen,
    documentosRelacionados: { presupuesto: f.presupuesto, cobros: cobrosRel, asientos },
  };
}

/** Descuento automático vigente para la línea (sucursal de la sesión por defecto). */
export async function resolverDescuento(args: ResolverDescuentoInput): Promise<DescuentoResuelto | null> {
  const s = await requireSesion();
  const x = resolverDescuentoInput.parse(args);
  return resolverDescuentoSvc(db, {
    empresaId: s.empresaId,
    sucursalId: x.sucursalId ?? s.sucursalId,
    articuloId: x.articuloId,
    cantidad: x.cantidad,
    fecha: x.fecha,
    precioUnitarioGs: x.precioUnitarioGs ?? undefined,
  });
}

/** Artículos activos con precio, IVA, presentaciones y stock en la sucursal (y en el depósito de venta). */
export async function buscarArticulosVenta(q: string) {
  const s = await requireSesion();
  const p = `%${(q ?? '').trim()}%`;
  const dep = await depositoPrincipal(db, ctxDe(s)).catch(() => null);
  const filas = await db
    .select({
      id: articulos.id,
      codigo: articulos.codigo,
      codigo_barras: articulos.codigo_barras,
      descripcion: articulos.descripcion,
      unidad_medida_id: articulos.unidad_medida_id,
      unidad: unidadesMedida.codigo,
      tipo_iva: articulos.tipo_iva,
      precio_venta_gs: articulos.precio_venta_gs,
      permite_decimales: articulos.permite_decimales,
      controla_stock: articulos.controla_stock,
      stock_sucursal: sql<number>`coalesce((select sum(st.cantidad) from ${stock} st where st.articulo_id = ${articulos.id} and st.sucursal_id = ${s.sucursalId}), 0)`.mapWith(Number),
      stock_deposito: sql<number>`coalesce((select st.cantidad from ${stock} st where st.articulo_id = ${articulos.id} and st.deposito_id = ${dep?.id ?? 0}), 0)`.mapWith(Number),
    })
    .from(articulos)
    .innerJoin(unidadesMedida, eq(unidadesMedida.id, articulos.unidad_medida_id))
    .where(
      and(
        eq(articulos.empresa_id, s.empresaId),
        eq(articulos.estado, 'activo'),
        q && q.trim() ? or(ilike(articulos.codigo, p), ilike(articulos.descripcion, p), eq(articulos.codigo_barras, q.trim())) : undefined,
      ),
    )
    .orderBy(asc(articulos.descripcion))
    .limit(50);
  const ids = filas.map((f) => f.id);
  const pres = ids.length
    ? await db
        .select({
          articulo_id: articuloUnidades.articulo_id,
          unidad_medida_id: articuloUnidades.unidad_medida_id,
          unidad: unidadesMedida.codigo,
          factor_conversion: articuloUnidades.factor_conversion,
          precio_venta_gs: articuloUnidades.precio_venta_gs,
        })
        .from(articuloUnidades)
        .innerJoin(unidadesMedida, eq(unidadesMedida.id, articuloUnidades.unidad_medida_id))
        .where(and(inArray(articuloUnidades.articulo_id, ids), eq(articuloUnidades.estado, 'activo')))
    : [];
  return filas.map((f) => ({
    ...f,
    deposito_id: dep?.id ?? null,
    presentaciones: pres
      .filter((x) => x.articulo_id === f.id)
      .map((x) => ({ ...x, precio_venta_gs: x.precio_venta_gs ?? Math.round(f.precio_venta_gs * x.factor_conversion) })),
  }));
}

