import type { DbLike } from '../index';
import { seedCatalogos } from './catalogos';
import { seedContabilidad } from './contabilidad';
import {
  seedArticulosDemo,
  seedEmpresaBase,
  seedOrganizacionDemo,
  seedPersonasDemo,
} from './empresa-demo';
import { seedPermisos, seedRolesYUsuarios } from './seguridad';

export type ResultadoSeed = {
  empresaId: number;
  sucursalIds: number[];
  adminId: number;
};

/**
 * Seed idempotente (onConflictDoNothing + lookups por clave natural).
 * Recibe cualquier instancia Drizzle con el esquema (postgres.js, PGlite o una transacción)
 * y corre todo dentro de UNA transacción.
 */
export async function seed(db: DbLike): Promise<ResultadoSeed> {
  return db.transaction(async (tx) => {
    await seedCatalogos(tx);
    await seedPermisos(tx);
    const ctx = await seedEmpresaBase(tx);
    const { adminId } = await seedRolesYUsuarios(tx, {
      empresaId: ctx.empresaId,
      sucursalPredeterminadaId: ctx.matrizId,
    });
    await seedContabilidad(tx, ctx.empresaId);
    const deps = await seedOrganizacionDemo(tx, ctx);
    await seedPersonasDemo(tx, ctx.empresaId);
    await seedArticulosDemo(tx, { ...ctx, ...deps, adminId });
    return { empresaId: ctx.empresaId, sucursalIds: [ctx.matrizId, ctx.sanLorenzoId], adminId };
  });
}
