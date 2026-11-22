# ERP Ferretero

ERP para ferretería con facturación electrónica paraguaya (SIFEN), inventario multi-depósito,
compras, ventas, caja, cuentas corrientes y contabilidad de partida doble.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + React 19 + TypeScript
- **PostgreSQL** con **Drizzle ORM** y migraciones SQL versionadas
- **Zod** para validación de entrada
- **Tailwind CSS 4**
- Pruebas de integración con **PGlite** (PostgreSQL en memoria) y `node:test`

## Puesta en marcha

```bash
npm install
cp .env.example .env.local        # ajuste DATABASE_URL y SESSION_SECRET
npm run db:migrate                # aplica ./drizzle
npm run db:seed                   # datos demo (idempotente)
npm run dev                       # http://localhost:3000
```

Variables de entorno:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `SESSION_SECRET` | Secreto HMAC para la cookie de sesión |
| `SIFEN_CSC`, `SIFEN_CERT_PASSWORD` | Referencias usadas por la configuración SIFEN (no se guardan en la BD) |

Credenciales demo y detalle del seed: [`src/db/seed/README.md`](src/db/seed/README.md)
(usuario `admin` / `Admin.Ferre2026`).

## Estructura

```
src/
  app/(dashboard)/        Pantallas por módulo (definiciones, compras, ventas, caja,
                          contabilidad, ajustes, reportes)
  app/api/                Route Handlers (CSV de reportes, consulta SIFEN)
  components/             UI reutilizable (grillas, formularios, tablas, layout)
  db/schema/              Esquema Drizzle (fuente de verdad)
  db/seed/                Catálogos, empresa demo, seguridad y contabilidad
  lib/ui/                 Formato, navegación, columnas y helpers de cliente
  server/actions/         Server Actions ("use server") por módulo
  server/queries/         Consultas de lectura para Server Components
  server/services/        Reglas de negocio y transacciones atómicas
  server/fiscal/          IVA, RUC/DV, CDC y formato SIFEN
  server/validation/      Esquemas Zod compartidos con el frontend
tests/                    Pruebas de integración sobre PGlite
drizzle/                  Migraciones SQL + triggers de integridad
docs/CONTRATO.md          Contrato backend ↔ frontend
AUDITORIA.md              Informe de la auditoría QA
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y ejecución de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Suite de integración (PGlite, sin servidor externo) |
| `npm run db:generate` | Genera migración tras cambiar el esquema |
| `npm run db:migrate` | Aplica migraciones a PostgreSQL |
| `npm run db:push` | Sincroniza el esquema sin migraciones (desarrollo) |
| `npm run db:seed` | Carga/actualiza datos demo |

Verificación completa sin PostgreSQL:

```bash
npx tsx src/db/seed/verificar-pglite.ts
```

## Reglas de negocio cubiertas

- Persona única que puede ser cliente y proveedor; RUC con DV validado.
- IVA incluido en guaraníes enteros, con desglose por línea que suma exactamente al total.
- Descuentos automáticos por artículo, sucursal, fecha, cantidad mínima, prioridad y tope;
  descuento manual limitado por permiso y porcentaje del rol, revalidado en el servidor.
- Documentos numerados sin huecos, CDC único de 44 dígitos.
- Stock por transacción atómica, sin negativos; kardex append-only.
- Anulaciones que revierten stock, saldos, cuentas y asientos (sin borrado físico).
- Asientos con `Debe = Haber` validado en servicio y con trigger diferido en la BD.
- Reportes de libros IVA, mayor, sumas y saldos y kardex que cuadran con las transacciones.

## Estado de SIFEN

El adaptador de `src/server/services/sifen/` es un **stub de desarrollo** que aprueba documentos
con CDC válido. Para producción debe implementarse la firma XML y la integración real con la SET.
