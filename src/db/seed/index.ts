/**
 * CLI: `npm run db:seed` (tsx src/db/seed/index.ts).
 * Requiere DATABASE_URL (o DIRECT_URL en Supabase) y la migración aplicada.
 */
import { existsSync } from 'node:fs';

for (const archivo of ['.env.local', '.env']) {
  if (existsSync(archivo)) process.loadEnvFile(archivo);
}

// En Supabase, migrar y sembrar por la conexión directa (5432), no por el Transaction pooler.
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;

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
