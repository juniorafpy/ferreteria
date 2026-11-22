import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit no carga .env.local por sí solo.
for (const archivo of ['.env.local', '.env']) {
  if (existsSync(archivo)) process.loadEnvFile(archivo);
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    // Supabase: usar la conexión directa / Session pooler (5432) para migrar,
    // no el Transaction pooler (6543).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/ferre',
  },
  strict: true,
  verbose: true,
});
