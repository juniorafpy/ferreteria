/**
 * Entorno de pruebas de integración: PGlite en memoria + migraciones de ./drizzle + seed demo.
 * Cada archivo de test crea su propio entorno (aislado) con `crearEntorno()`.
 */
import { PGlite } from '@electric-sql/pglite';
import { and, asc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import assert from 'node:assert/strict';
import path from 'node:path';
import type { DbLike } from '@/db';
import * as s from '@/db/schema';
import { seed } from '@/db/seed/seed';
import type { Ctx } from '@/server/lib/contexto';
import { hoyPy } from '@/server/lib/fechas';
import { autenticar } from '@/server/services/seguridad';

export { s };

export type Entorno = Awaited<ReturnType<typeof crearEntorno>>;

export async function crearEntorno() {
  const client = new PGlite();
  const pg = drizzle({ client, schema: s });
  const db = pg as unknown as DbLike;
  await migrate(pg, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  const r = await seed(db);
  const [matriz, sanLorenzo] = r.sucursalIds;

  /** Ejecuta `fn` en una transacción (como lo hacen las Server Actions). */
  const tx = <T>(fn: (t: DbLike) => Promise<T>) => db.transaction((t) => fn(t as unknown as DbLike));

  const sesion = async (usuario: string, password: string): Promise<Ctx> => {
    const x = await autenticar(db, usuario, password);
    return {
      usuarioId: x.usuarioId,
      empresaId: x.empresaId,
      sucursalId: x.sucursalId,
      permisos: x.permisos,
      descuentoManualMaxPct: x.descuentoManualMaxPct,
    };
  };
  const admin = await sesion('admin', 'Admin.Ferre2026');
  const vendedor = await sesion('vendedor', 'Demo.Ferre2026');
  const cajero = await sesion('cajero', 'Demo.Ferre2026');

  const art = async (codigo: string) => {
    const [a] = await db.select().from(s.articulos).where(eq(s.articulos.codigo, codigo));
    assert.ok(a, `artículo ${codigo}`);
    return a;
  };
  const [proveedor] = await db.select().from(s.proveedores).where(eq(s.proveedores.codigo, 'PRO-0001'));
  const [cliente] = await db.select().from(s.clientes).where(eq(s.clientes.codigo, 'CLI-0002'));
  const depPrincipal = async (sucursalId: number) => {
    const [d] = await db
      .select()
      .from(s.depositos)
      .where(and(eq(s.depositos.sucursal_id, sucursalId), eq(s.depositos.es_principal, true)));
    return d;
  };
  const depMatriz = await depPrincipal(matriz);
  const depSL = await depPrincipal(sanLorenzo);

  const stockDe = async (depositoId: number, articuloId: number) => {
    const [x] = await db
      .select()
      .from(s.stock)
      .where(and(eq(s.stock.deposito_id, depositoId), eq(s.stock.articulo_id, articuloId)));
    return { cantidad: Number(x?.cantidad ?? 0), costoPromedio: x?.costo_promedio_gs ?? 0, ultimoCosto: x?.ultimo_costo_gs ?? 0 };
  };
  const kardexDe = (origen: NonNullable<(typeof s.kardex.$inferSelect)['origen_tipo']>, id: number) =>
    db
      .select()
      .from(s.kardex)
      .where(and(eq(s.kardex.origen_tipo, origen), eq(s.kardex.origen_id, id)))
      .orderBy(asc(s.kardex.id));
  const asientosDe = (origen: NonNullable<(typeof s.asientosContables.$inferSelect)['origen_tipo']>, id: number) =>
    db
      .select()
      .from(s.asientosContables)
      .where(and(eq(s.asientosContables.origen_tipo, origen), eq(s.asientosContables.origen_id, id)))
      .orderBy(asc(s.asientosContables.id));

  /** Verifica que TODOS los asientos de la BD cumplan Debe = Haber = cabecera y >= 2 líneas. */
  const verificarPartidaDoble = async () => {
    const filas = await db
      .select({
        id: s.asientosContables.id,
        cabD: s.asientosContables.total_debe_gs,
        cabH: s.asientosContables.total_haber_gs,
        d: sql<number>`coalesce(sum(${s.detallesAsientoContable.debe_gs}), 0)`.mapWith(Number),
        h: sql<number>`coalesce(sum(${s.detallesAsientoContable.haber_gs}), 0)`.mapWith(Number),
        n: sql<number>`count(${s.detallesAsientoContable.id})`.mapWith(Number),
      })
      .from(s.asientosContables)
      .leftJoin(s.detallesAsientoContable, eq(s.detallesAsientoContable.asiento_id, s.asientosContables.id))
      .groupBy(s.asientosContables.id);
    for (const a of filas) {
      assert.equal(a.d, a.h, `asiento ${a.id}: Debe ${a.d} ≠ Haber ${a.h}`);
      assert.equal(a.d, a.cabD, `asiento ${a.id}: cabecera debe`);
      assert.equal(a.h, a.cabH, `asiento ${a.id}: cabecera haber`);
      assert.ok(a.n >= 2, `asiento ${a.id}: menos de dos líneas`);
    }
    return filas.length;
  };

  return {
    client,
    db,
    tx,
    r,
    matriz,
    sanLorenzo,
    admin,
    vendedor,
    cajero,
    sesion,
    art,
    proveedor,
    cliente,
    depMatriz,
    depSL,
    depPrincipal,
    stockDe,
    kardexDe,
    asientosDe,
    verificarPartidaDoble,
    hoy: hoyPy(),
    cerrar: () => client.close(),
  };
}

/** Mensaje de error (incluye la causa de PostgreSQL envuelta por Drizzle). */
export function mensajeDe(e: unknown): string {
  const x = e as { message?: string; cause?: { message?: string } };
  return [x?.message, x?.cause?.message].filter(Boolean).join(' | ');
}

/** Espera que `fn` falle y que el mensaje (o su causa) coincida con `patron`. */
export async function rechaza(fn: () => Promise<unknown>, patron: RegExp) {
  let error: unknown;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  assert.ok(error, `se esperaba un error que coincida con ${patron}`);
  assert.match(mensajeDe(error), patron);
}
