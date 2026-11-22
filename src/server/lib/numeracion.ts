import { and, eq, sql } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { DbLike } from '@/db';

/** Claves fijas para pg_advisory_xact_lock (k1) por tipo de correlativo interno. */
const CLAVES = {
  pedidos_compra: 101,
  ordenes_compra: 102,
  recepciones: 103,
  ordenes_pago: 104,
  presupuestos: 201,
  cobros: 202,
  ajustes_stock: 301,
  transferencias_stock: 302,
  asientos_contables: 401,
} as const;

export type TablaCorrelativo = keyof typeof CLAVES;

type TablaNumerada = PgTable & {
  numero: AnyPgColumn;
  empresa_id: AnyPgColumn;
  sucursal_id: AnyPgColumn;
};

/**
 * Siguiente correlativo interno (por empresa + sucursal; asientos: por empresa).
 * Serializa con un advisory lock transaccional: debe llamarse dentro de una transacción.
 */
export async function siguienteNumero(
  tx: DbLike,
  clave: TablaCorrelativo,
  tabla: TablaNumerada,
  empresaId: number,
  sucursalId: number | null,
): Promise<number> {
  const k2 = sucursalId ?? empresaId * -1;
  await tx.execute(sql`select pg_advisory_xact_lock(${CLAVES[clave]}::int, ${k2}::int)`);
  const filtro =
    sucursalId === null
      ? eq(tabla.empresa_id, empresaId)
      : and(eq(tabla.empresa_id, empresaId), eq(tabla.sucursal_id, sucursalId));
  const [fila] = await tx
    .select({ n: sql<number>`coalesce(max(${tabla.numero}), 0)`.mapWith(Number) })
    .from(tabla)
    .where(filtro);
  return (fila?.n ?? 0) + 1;
}
