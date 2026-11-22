/**
 * CLI: `npm run db:seed` (tsx src/db/seed/index.ts).
 * Requiere DATABASE_URL (se carga de .env.local / .env si existen) y la migración aplicada.
 */
import { existsSync } from 'node:fs';

for (const archivo of ['.env.local', '.env']) {
  if (!process.env.DATABASE_URL && existsSync(archivo)) {
    process.loadEnvFile(archivo);
  }
}

async function main() {
  const { db } = await import('../index');
  const { seed } = await import('./seed');
  const r = await seed(db);
  console.log(`Seed OK: empresa ${r.empresaId}, sucursales ${r.sucursalIds.join(', ')}`);
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
