import { and, asc, eq, sql } from 'drizzle-orm';
import type { DbLike } from '@/db';
import { articulos, depositos, kardex, stock } from '@/db/schema';
import type { Ctx } from '../lib/contexto';
import { asegurar, ErrorNegocio } from '../lib/result';

type TipoMovimiento = (typeof kardex.$inferInsert)['tipo_movimiento'];
type OrigenTipo = (typeof kardex.$inferInsert)['origen_tipo'];

const EPS = 1e-6;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export async function obtenerDeposito(tx: DbLike, ctx: Ctx, depositoId: number) {
  const [d] = await tx
    .select()
    .from(depositos)
    .where(and(eq(depositos.id, depositoId), eq(depositos.empresa_id, ctx.empresaId)));
  asegurar(d, 'Depósito inexistente');
  asegurar(d.estado === 'activo', `El depósito ${d.codigo} está inactivo`);
  return d;
}

/** Depósito principal (que permite venta) de la sucursal. */
export async function depositoPrincipal(tx: DbLike, ctx: Ctx, sucursalId = ctx.sucursalId) {
  const filas = await tx
    .select()
    .from(depositos)
    .where(and(eq(depositos.empresa_id, ctx.empresaId), eq(depositos.sucursal_id, sucursalId), eq(depositos.estado, 'activo')))
    .orderBy(sql`${depositos.es_principal} desc`, asc(depositos.id));
  asegurar(filas.length > 0, 'La sucursal no tiene depósitos activos');
  return filas[0];
}

/**
 * Bloquea (FOR UPDATE) las filas de stock en orden determinista (depósito, artículo) para evitar
 * deadlocks; crea las filas faltantes en 0.
 */
export async function bloquearStock(tx: DbLike, ctx: Ctx, pares: { depositoId: number; articuloId: number }[]) {
  const unicos = [...new Map(pares.map((p) => [`${p.depositoId}|${p.articuloId}`, p])).values()].sort(
    (a, b) => a.depositoId - b.depositoId || a.articuloId - b.articuloId,
  );
  for (const p of unicos) await filaStock(tx, ctx, p.depositoId, p.articuloId);
}

async function filaStock(tx: DbLike, ctx: Ctx, depositoId: number, articuloId: number) {
  const sel = () =>
    tx
      .select()
      .from(stock)
      .where(and(eq(stock.deposito_id, depositoId), eq(stock.articulo_id, articuloId)))
      .for('update');
  let [fila] = await sel();
  if (!fila) {
    const dep = await obtenerDeposito(tx, ctx, depositoId);
    const [art] = await tx
      .select({ costo: articulos.costo_referencia_gs })
      .from(articulos)
      .where(and(eq(articulos.id, articuloId), eq(articulos.empresa_id, ctx.empresaId)));
    asegurar(art, 'Artículo inexistente');
    await tx
      .insert(stock)
      .values({
        empresa_id: ctx.empresaId,
        sucursal_id: dep.sucursal_id,
        deposito_id: depositoId,
        articulo_id: articuloId,
        cantidad: 0,
        costo_promedio_gs: 0,
        ultimo_costo_gs: 0,
      })
      .onConflictDoNothing();
    [fila] = await sel();
  }
  return fila;
}

export type MovimientoBase = {
  depositoId: number;
  articuloId: number;
  /** Cantidad en unidad base (> 0). */
  cantidad: number;
  tipoMovimiento: NonNullable<TipoMovimiento>;
  origenTipo: NonNullable<OrigenTipo>;
  origenId: number;
  origenDetalleId?: number | null;
};

export type ResultadoMovimiento = {
  kardexId: number;
  costoUnitarioGs: number;
  costoPromedioAnteriorGs: number;
  costoPromedioNuevoGs: number;
  saldoCantidad: number;
};

/**
 * Entrada de stock con costo promedio ponderado:
 * nuevo = round((saldo*prom + cant*costo) / (saldo+cant)). `actualizarUltimoCosto` en compras.
 */
export async function registrarEntrada(
  tx: DbLike,
  ctx: Ctx,
  m: MovimientoBase & { costoUnitarioGs: number; actualizarUltimoCosto?: boolean },
): Promise<ResultadoMovimiento> {
  asegurar(m.cantidad > 0, 'Cantidad de movimiento inválida');
  const s = await filaStock(tx, ctx, m.depositoId, m.articuloId);
  const saldoAnt = Number(s.cantidad);
  const promAnt = s.costo_promedio_gs;
  const saldo = r3(saldoAnt + m.cantidad);
  const prom =
    saldoAnt > EPS ? Math.round((saldoAnt * promAnt + m.cantidad * m.costoUnitarioGs) / saldo) : Math.round(m.costoUnitarioGs);
  await tx
    .update(stock)
    .set({
      cantidad: saldo,
      costo_promedio_gs: prom,
      ...(m.actualizarUltimoCosto ? { ultimo_costo_gs: Math.round(m.costoUnitarioGs) } : {}),
    })
    .where(eq(stock.id, s.id));
  const [k] = await tx
    .insert(kardex)
    .values({
      empresa_id: ctx.empresaId,
      sucursal_id: s.sucursal_id,
      deposito_id: m.depositoId,
      articulo_id: m.articuloId,
      tipo_movimiento: m.tipoMovimiento,
      origen_tipo: m.origenTipo,
      origen_id: m.origenId,
      origen_detalle_id: m.origenDetalleId ?? null,
      cantidad_entrada: m.cantidad,
      cantidad_salida: 0,
      saldo_cantidad: saldo,
      costo_unitario_gs: Math.round(m.costoUnitarioGs),
      costo_promedio_gs: prom,
      saldo_valorizado_gs: Math.round(saldo * prom),
      usuario_id: ctx.usuarioId,
    })
    .returning({ id: kardex.id });
  return {
    kardexId: k.id,
    costoUnitarioGs: Math.round(m.costoUnitarioGs),
    costoPromedioAnteriorGs: promAnt,
    costoPromedioNuevoGs: prom,
    saldoCantidad: saldo,
  };
}

/**
 * Salida de stock. Nunca deja stock negativo. Por defecto sale a costo promedio (no lo altera).
 * Con `costoUnitarioGs` (reversión de una entrada) recalcula el promedio retirando ese valor.
 */
export async function registrarSalida(
  tx: DbLike,
  ctx: Ctx,
  m: MovimientoBase & { costoUnitarioGs?: number; descripcion?: string },
): Promise<ResultadoMovimiento> {
  asegurar(m.cantidad > 0, 'Cantidad de movimiento inválida');
  const s = await filaStock(tx, ctx, m.depositoId, m.articuloId);
  const saldoAnt = Number(s.cantidad);
  if (saldoAnt + EPS < m.cantidad) {
    const [a] = await tx.select({ codigo: articulos.codigo }).from(articulos).where(eq(articulos.id, m.articuloId));
    throw new ErrorNegocio(
      `Stock insuficiente de ${a?.codigo ?? m.articuloId}${m.descripcion ? ` (${m.descripcion})` : ''}: disponible ${saldoAnt}, requerido ${m.cantidad}`,
    );
  }
  const promAnt = s.costo_promedio_gs;
  const saldo = r3(saldoAnt - m.cantidad);
  const costo = m.costoUnitarioGs ?? promAnt;
  let prom = promAnt;
  if (m.costoUnitarioGs !== undefined) {
    const valor = saldoAnt * promAnt - m.cantidad * m.costoUnitarioGs;
    prom = saldo > EPS && valor > 0 ? Math.round(valor / saldo) : promAnt;
  }
  await tx.update(stock).set({ cantidad: saldo, costo_promedio_gs: prom }).where(eq(stock.id, s.id));
  const [k] = await tx
    .insert(kardex)
    .values({
      empresa_id: ctx.empresaId,
      sucursal_id: s.sucursal_id,
      deposito_id: m.depositoId,
      articulo_id: m.articuloId,
      tipo_movimiento: m.tipoMovimiento,
      origen_tipo: m.origenTipo,
      origen_id: m.origenId,
      origen_detalle_id: m.origenDetalleId ?? null,
      cantidad_entrada: 0,
      cantidad_salida: m.cantidad,
      saldo_cantidad: saldo,
      costo_unitario_gs: Math.round(costo),
      costo_promedio_gs: prom,
      saldo_valorizado_gs: Math.round(saldo * prom),
      usuario_id: ctx.usuarioId,
    })
    .returning({ id: kardex.id });
  return {
    kardexId: k.id,
    costoUnitarioGs: Math.round(costo),
    costoPromedioAnteriorGs: promAnt,
    costoPromedioNuevoGs: prom,
    saldoCantidad: saldo,
  };
}

/** Stock actual (sin bloqueo) de un artículo en un depósito. */
export async function stockActual(tx: DbLike, depositoId: number, articuloId: number) {
  const [s] = await tx
    .select()
    .from(stock)
    .where(and(eq(stock.deposito_id, depositoId), eq(stock.articulo_id, articuloId)));
  return s ?? null;
}
