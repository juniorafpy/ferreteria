# Seed de base de datos (ERP ferretero)

## Comandos

| Acción | Comando |
| --- | --- |
| Generar migración tras cambiar el esquema | `npm run db:generate` |
| Aplicar migraciones (PostgreSQL real, usa `DATABASE_URL`) | `npm run db:migrate` |
| Cargar datos demo | `npm run db:seed` |
| Verificar migraciones + seed sin servidor (PGlite en memoria) | `npx tsx src/db/seed/verificar-pglite.ts` |

El seed es idempotente: se puede correr varias veces. Corre en una sola transacción y
recibe la instancia `db` como parámetro: `seed(db: DbLike)` en `src/db/seed/seed.ts`.

## Credenciales demo (SOLO desarrollo)

Todos los usuarios pertenecen a la empresa **FERRETERÍA DEMO S.A.** (RUC 80012345) y tienen
su rol en todas las sucursales (`usuario_roles.sucursal_id = NULL`).

| Usuario | Contraseña | Rol | Descuento manual máx. |
| --- | --- | --- | --- |
| `admin` | `Admin.Ferre2026` | Administrador (todos los permisos) | 100 % |
| `vendedor` | `Demo.Ferre2026` | Vendedor | 10 % |
| `cajero` | `Demo.Ferre2026` | Cajero | 0 % |
| `compras` | `Demo.Ferre2026` | Compras | 0 % |
| `contador` | `Demo.Ferre2026` | Contador | 0 % |

Las contraseñas se guardan con scrypt (`node:crypto`) en el formato
`scrypt$N$r$p$<saltHex>$<hashHex>`. Para validar un login use
`verifyPassword(password, usuario.password_hash)` de `src/db/utils/password.ts`.
Si un usuario ya existe, el seed NO pisa su contraseña.

**Cambie estas contraseñas antes de cualquier despliegue.**

## Qué carga

- Paraguay + 5 países limítrofes; Capital + 17 departamentos (código SIFEN) y ciudades principales.
- Tipos de persona (F/J), tipos de documento (RUC, CI, PAS, CIE, INN), actividades económicas de ejemplo, unidades de medida.
- Empresa demo con 2 sucursales (001 Casa Matriz – Asunción, 002 San Lorenzo), establecimientos 001/002,
  punto de expedición 001 en cada uno, timbrado electrónico `18000001`, numeraciones (factura, nota de crédito),
  configuración SIFEN en ambiente `test` (los secretos son referencias a variables de entorno `SIFEN_CSC`, `SIFEN_CERT_PASSWORD`),
  parámetros generales, 3 depósitos y 1 caja por sucursal.
- 56 permisos, 5 roles, 5 usuarios.
- Plan de cuentas de ferretería y `configuracion_contable` para todas las operaciones.
- Condiciones de pago (CONTADO, CRED30, CRED-3C), clientes (incluye "SIN NOMBRE" innominado) y un proveedor
  que también es cliente (misma persona, dos roles).
- 10 artículos con presentaciones, stock inicial en ambos depósitos principales (con kardex `inicial`)
  y un descuento vigente `PROMO-HERR-10` (10 % herramientas manuales, tope Gs. 50.000 por línea).

## Pendiente de validar con la SET

Códigos SIFEN de departamentos (orden 17/18), ciudades (solo Asunción = 1 cargado),
unidades de medida (solo UNI = 77) y actividades económicas son de referencia.
