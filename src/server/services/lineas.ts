import { and, eq, inArray } from 'drizzle-orm';
import type { DbLike } from '@/db';
import { articulos, articuloUnidades } from '@/db/schema';
import { calcularLinea, calcularTotales, type TipoIva, type Totales } from '../fiscal/iva';
import { tienePermisoCtx, type Ctx } from '../lib/contexto';
import { asegurar, ErrorNegocio } from '../lib/result';
import { resolverDescuento } from './descuentos';

export type LineaEntrada = {
  detalleOrigenId?: number | null;
  articuloId: number;
  descripcion?: string | null;
  unidadMedidaId?: number | null;
  factorConversion?: number | null;
  cantidad: number;
  precioUnitarioGs?: number | null;
  descuentoGs?: number | null;
  tipoIva?: TipoIva | null;
};

export type LineaPreparada = {
  linea: number;
  detalle_origen_id: number | null;
  articulo_id: number;
  descripcion: string;
  unidad_medida_id: number | null;
  factor_conversion: number;
  cantidad: number;
  precio_unitario_gs: number;
  descuento_gs: number;
  origen_descuento: 'automatico' | 'manual' | 'ninguno';
  descuento_id: number | null;
  tipo_iva: TipoIva;
  total_linea_gs: number;
  iva_gs: number;
  /** No persistido: si el artículo controla stock. */
  controla_stock: boolean;
};

/** Referencia del documento origen (p. ej. presupuesto) para respetar precio/descuento pactados. */
export type ReferenciaOrigen = {
  precioUnitarioGs: number;
  cantidad: number;
  descuentoGs: number;
  /** Cantidad ya facturada del ítem origen (facturas confirmadas). */
  cantidadFacturada?: number;
  /** Descuento ya facturado del ítem origen (facturas confirmadas). */
  descuentoFacturadoGs?: number;
  origenDescuento: 'automatico' | 'manual' | 'ninguno';
  descuentoId: number | null;
};

type ArticuloInfo = typeof articulos.$inferSelect;

export async function cargarArticulos(tx: DbLike, empresaId: number, ids: number[]) {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return { arts: new Map<number, ArticuloInfo>(), pres: new Map<string, typeof articuloUnidades.$inferSelect>() };
  const filas = await tx
    .select()
    .from(articulos)
    .where(and(eq(articulos.empresa_id, empresaId), inArray(articulos.id, unicos)));
  const arts = new Map(filas.map((a) => [a.id, a]));
  for (const i of unicos) asegurar(arts.has(i), `Artículo ${i} inexistente`);
  const presFilas = await tx
    .select()
    .from(articuloUnidades)
    .where(and(eq(articuloUnidades.empresa_id, empresaId), inArray(articuloUnidades.articulo_id, unicos)));
  const pres = new Map(presFilas.map((p) => [`${p.articulo_id}|${p.unidad_medida_id}`, p]));
  return { arts, pres };
}

/** Precio de lista (IVA incl.) y factor de la presentación indicada. */
export function precioLista(
  a: ArticuloInfo,
  pres: Map<string, typeof articuloUnidades.$inferSelect>,
  unidadMedidaId?: number | null,
): { precio: number; factor: number; unidadMedidaId: number } {
  if (!unidadMedidaId || unidadMedidaId === a.unidad_medida_id) {
    return { precio: a.precio_venta_gs, factor: 1, unidadMedidaId: a.unidad_medida_id };
  }
  const p = pres.get(`${a.id}|${unidadMedidaId}`);
  if (!p || p.estado !== 'activo') throw new ErrorNegocio(`Presentación no válida para ${a.codigo}`);
  return {
    precio: p.precio_venta_gs ?? Math.round(a.precio_venta_gs * p.factor_conversion),
    factor: p.factor_conversion,
    unidadMedidaId,
  };
}

/**
 * Prepara líneas de venta (presupuesto / factura): precio de lista, descuento automático recalculado
 * en servidor y control de descuento manual:
 *  - descuentoGs omitido o igual al automático → `automatico` (o `ninguno` si no hay).
 *  - descuentoGs = 0 → `ninguno` (quitar un descuento no requiere permiso).
 *  - otro valor → `manual`: exige `ventas.descuento_manual` y % <= descuentoManualMaxPct.
 * Un precio distinto al de lista exige `articulos.precio.modificar`.
 * Si la línea trae una referencia de origen (presupuesto), se respetan su precio y su descuento prorrateado.
 */
export async function prepararLineasVenta(
  tx: DbLike,
  ctx: Ctx,
  p: { fecha: string; sucursalId: number; lineas: LineaEntrada[]; referencias?: Map<number, ReferenciaOrigen> },
): Promise<{ lineas: LineaPreparada[]; totales: Totales }> {
  asegurar(p.lineas.length > 0, 'El documento no tiene líneas');
  const { arts, pres } = await cargarArticulos(tx, ctx.empresaId, p.lineas.map((l) => l.articuloId));
  const out: LineaPreparada[] = [];

  for (const [i, l0] of p.lineas.entries()) {
    let l = l0;
    const a = arts.get(l.articuloId)!;
    asegurar(a.estado === 'activo', `El artículo ${a.codigo} está inactivo`);
    if (!a.permite_decimales) {
      asegurar(Number.isInteger(l.cantidad), `El artículo ${a.codigo} no admite cantidades decimales`);
    }
    const lista = precioLista(a, pres, l.unidadMedidaId);
    const ref = l.detalleOrigenId ? p.referencias?.get(l.detalleOrigenId) : undefined;
    const precioReferencia = ref ? ref.precioUnitarioGs : lista.precio;
    const precio = l.precioUnitarioGs ?? precioReferencia;
    if (precio !== precioReferencia && !tienePermisoCtx(ctx, 'articulos.precio.modificar')) {
      throw new ErrorNegocio(`Línea ${i + 1}: no tiene permiso para modificar el precio de ${a.codigo}`);
    }
    const bruto = Math.round(l.cantidad * precio);

    // Descuento de referencia: el del origen prorrateado, o el automático vigente.
    let auto: { gs: number; id: number | null; origen: LineaPreparada['origen_descuento'] };
    if (ref && precio === ref.precioUnitarioGs) {
      // QA: prorrateo del descuento pactado. La porción que completa el saldo del ítem recibe el
      // remanente (descuento pactado − ya facturado) para que la suma nunca difiera del pactado.
      const pendiente = ref.cantidad - (ref.cantidadFacturada ?? 0);
      const prorrateo =
        l.cantidad + 1e-6 >= pendiente && ref.descuentoFacturadoGs !== undefined
          ? Math.max(0, ref.descuentoGs - ref.descuentoFacturadoGs)
          : Math.round((ref.descuentoGs * l.cantidad) / ref.cantidad);
      auto = {
        gs: Math.min(bruto, prorrateo),
        id: ref.descuentoId,
        origen: ref.origenDescuento,
      };
      // Diferencias de 1 Gs por redondeo del prorrateo (borradores calculados antes de otra
      // facturación parcial) no constituyen un descuento manual.
      if (l.descuentoGs != null && Math.abs(l.descuentoGs - auto.gs) <= 1) l = { ...l, descuentoGs: auto.gs };
    } else {
      const r = await resolverDescuento(tx, {
        empresaId: ctx.empresaId,
        sucursalId: p.sucursalId,
        articuloId: a.id,
        cantidad: l.cantidad * lista.factor,
        fecha: p.fecha,
        precioUnitarioGs: precio / lista.factor,
      });
      auto = r ? { gs: Math.min(bruto, r.descuentoGs), id: r.descuentoId, origen: 'automatico' } : { gs: 0, id: null, origen: 'ninguno' };
    }

    let descuento = auto.gs;
    let origen: LineaPreparada['origen_descuento'] = auto.gs > 0 ? auto.origen : 'ninguno';
    let descuentoId = auto.gs > 0 ? auto.id : null;
    if (l.descuentoGs != null && l.descuentoGs !== auto.gs) {
      if (l.descuentoGs === 0) {
        descuento = 0;
        origen = 'ninguno';
        descuentoId = null;
      } else {
        if (!tienePermisoCtx(ctx, 'ventas.descuento_manual')) {
          throw new ErrorNegocio(`Línea ${i + 1} (${a.codigo}): el descuento manual requiere el permiso ventas.descuento_manual`);
        }
        asegurar(l.descuentoGs <= bruto, `Línea ${i + 1}: el descuento supera el importe`);
        const pct = bruto > 0 ? (l.descuentoGs / bruto) * 100 : 100;
        if (pct > ctx.descuentoManualMaxPct + 1e-9) {
          throw new ErrorNegocio(
            `Línea ${i + 1} (${a.codigo}): descuento ${pct.toFixed(2)}% supera el máximo permitido (${ctx.descuentoManualMaxPct}%)`,
          );
        }
        descuento = l.descuentoGs;
        origen = 'manual';
        descuentoId = null;
      }
    }
    // Si el origen era automático pero sin id (no debería), degradar a manual para cumplir el CHECK.
    if (origen === 'automatico' && descuentoId === null) origen = 'manual';

    const calc = calcularLinea({ cantidad: l.cantidad, precioUnitarioGs: precio, descuentoGs: descuento, tipoIva: a.tipo_iva });
    out.push({
      linea: i + 1,
      detalle_origen_id: l.detalleOrigenId ?? null,
      articulo_id: a.id,
      descripcion: (l.descripcion?.trim() || a.descripcion).slice(0, 200),
      unidad_medida_id: lista.unidadMedidaId,
      factor_conversion: lista.factor,
      cantidad: l.cantidad,
      precio_unitario_gs: precio,
      descuento_gs: descuento,
      origen_descuento: origen,
      descuento_id: descuentoId,
      tipo_iva: a.tipo_iva,
      total_linea_gs: calc.totalLineaGs,
      iva_gs: calc.ivaGs,
      controla_stock: a.controla_stock,
    });
  }
  const totales = calcularTotales(
    out.map((l) => ({ totalLineaGs: l.total_linea_gs, ivaGs: l.iva_gs, tipoIva: l.tipo_iva, descuentoGs: l.descuento_gs })),
  );
  return { lineas: out, totales };
}

/**
 * Líneas de compra: precio del comprobante del proveedor (IVA incluido), descuento del proveedor
 * (origen `manual` si > 0) y tipo de IVA del artículo salvo que se indique.
 */
export async function prepararLineasCompra(tx: DbLike, ctx: Ctx, lineas: (LineaEntrada & { precioUnitarioGs: number })[]) {
  asegurar(lineas.length > 0, 'El documento no tiene líneas');
  const { arts, pres } = await cargarArticulos(tx, ctx.empresaId, lineas.map((l) => l.articuloId));
  const out = lineas.map((l, i) => {
    const a = arts.get(l.articuloId)!;
    let factor = 1;
    let unidad = a.unidad_medida_id;
    if (l.unidadMedidaId && l.unidadMedidaId !== a.unidad_medida_id) {
      const pr = pres.get(`${a.id}|${l.unidadMedidaId}`);
      factor = pr?.factor_conversion ?? l.factorConversion ?? 1;
      unidad = l.unidadMedidaId;
    } else if (l.factorConversion) {
      factor = l.factorConversion;
    }
    const tipoIva = l.tipoIva ?? a.tipo_iva;
    const descuento = l.descuentoGs ?? 0;
    const calc = calcularLinea({ cantidad: l.cantidad, precioUnitarioGs: l.precioUnitarioGs, descuentoGs: descuento, tipoIva });
    return {
      linea: i + 1,
      detalle_origen_id: l.detalleOrigenId ?? null,
      articulo_id: a.id,
      descripcion: (l.descripcion?.trim() || a.descripcion).slice(0, 200),
      unidad_medida_id: unidad,
      factor_conversion: factor,
      cantidad: l.cantidad,
      precio_unitario_gs: l.precioUnitarioGs,
      descuento_gs: descuento,
      origen_descuento: (descuento > 0 ? 'manual' : 'ninguno') as LineaPreparada['origen_descuento'],
      descuento_id: null as number | null,
      tipo_iva: tipoIva,
      total_linea_gs: calc.totalLineaGs,
      iva_gs: calc.ivaGs,
      controla_stock: a.controla_stock,
    } satisfies LineaPreparada;
  });
  const totales = calcularTotales(
    out.map((l) => ({ totalLineaGs: l.total_linea_gs, ivaGs: l.iva_gs, tipoIva: l.tipo_iva, descuentoGs: l.descuento_gs })),
  );
  return { lineas: out, totales };
}

/** Quita campos no persistidos. */
export const sinExtras = <T extends { controla_stock: boolean }>({ controla_stock: _c, ...resto }: T) => resto;
