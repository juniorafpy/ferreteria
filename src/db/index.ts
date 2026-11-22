import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import * as schema from './schema';

export { schema };

/** Base de datos tipada con el esquema completo (cliente postgres.js). */
export type DB = PostgresJsDatabase<typeof schema> & { $client: postgres.Sql };

/** Transacción obtenida con `db.transaction(async (tx) => ...)`. */
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];

/**
 * Cualquier base Drizzle/PostgreSQL con este esquema (postgres.js, PGlite, transacciones).
 * Úsalo en funciones de repositorio que deban aceptar `db` o `tx` indistintamente.
 */
export type DbLike = PgDatabase<PgQueryResultHKT, typeof schema>;

type GlobalDb = typeof globalThis & {
  __ferreSql?: ReturnType<typeof postgres>;
  __ferreDb?: DB;
};

function crearDb(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL no está definida');
  }
  const g = globalThis as GlobalDb;
  const client =
    g.__ferreSql ??
    postgres(url, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      prepare: true,
    });
  const instancia = drizzle(client, { schema });
  // Singleton en desarrollo para sobrevivir a HMR de Next.js
  if (process.env.NODE_ENV !== 'production') {
    g.__ferreSql = client;
    g.__ferreDb = instancia;
  }
  return instancia;
}

const g = globalThis as GlobalDb;

/** Cliente Drizzle compartido (server-only). */
export const db: DB = g.__ferreDb ?? crearDb();
