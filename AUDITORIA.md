# Auditoría QA — ERP ferretero

Fecha: 2026-11-22 · Alcance: reglas de negocio críticas del backend, integridad en BD y
consistencia de la UI con los permisos/validaciones del servidor.

## Resultado global

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` | ✅ sin errores |
| `npm run build` | ✅ 51 rutas compiladas |
| `npm run lint` | ✅ 0 errores (5 warnings de variables no usadas) |
| `npm test` (PGlite en memoria) | ✅ **49/49 pruebas**, 12 suites |
| `npx tsx src/db/seed/verificar-pglite.ts` | ✅ migraciones + seed idempotente + restricciones |

Las pruebas corren contra **PGlite** aplicando las migraciones reales de `./drizzle` y el seed
demo, por lo que no requieren un PostgreSQL levantado.

## Hallazgos corregidos

| # | Severidad | Ubicación | Hallazgo y corrección |
| --- | --- | --- | --- |
| 1 | Alta | `src/server/services/caja.ts:75` | **Cierre de caja ajeno.** La condición `usuario_id === ctx.usuarioId \|\| ctx.permisos.includes('caja.sesion.cerrar')` era siempre verdadera (la acción ya exige ese permiso), así que cualquier cajero cerraba sesiones de otros usuarios y de otras sucursales. Ahora solo el titular, o un supervisor (`caja.cobro.anular`) de la **misma sucursal**. |
| 2 | Alta | `src/server/services/seguridad.ts:78` | **Tope de descuento manual inflado.** Se tomaba el máximo de **todos** los roles del usuario, aunque no otorgaran `ventas.descuento_manual`. Ahora el tope se calcula solo con los roles que conceden ese permiso. |
| 3 | Media | `src/server/services/compras.ts:622` | **Recepción con arreglo vacío.** `detalles: []` se interpretaba como “recibir todo lo pendiente”. Ahora un arreglo vacío explícito se rechaza; solo `detalles` omitido/null recibe el total pendiente. La UI (`FormularioRecepcion.tsx`) valida antes de enviar. |
| 4 | Media | `src/server/services/lineas.ts:127` | **Prorrateo de descuento en facturación parcial.** Se redondeaba el descuento por línea sin considerar lo ya facturado, pudiendo superar el descuento pactado. Ahora la porción que completa el saldo recibe el remanente y la suma coincide con el pactado (tolerancia de 1 Gs por redondeo). |
| 5 | Media | `src/server/validation/definiciones.ts:115`, `src/server/services/definiciones.ts:243` | **Estado del descuento descartado.** El formulario enviaba `estado` y Zod lo eliminaba en silencio; ahora se valida y persiste. |
| 6 | Media | `src/app/(dashboard)/layout.tsx:21` | **Selector de sucursal mostraba sucursales ajenas.** El layout usaba `listarSucursales()` (todas las de la empresa); ahora usa `listarMisSucursales()` y cae al listado completo solo si el usuario no tiene asignaciones. |
| 7 | Media | `src/components/ui/GrillaDetalle.tsx:182,185` | **UI más permisiva que el backend.** Se consideraba el comodín `'*'` (la sesión nunca lo contiene) y no se bloqueaba editar el precio de venta sin `articulos.precio.modificar`. Ahora la grilla refleja exactamente las validaciones del servidor. |
| 8 | Baja | `src/app/(dashboard)/_acciones/busqueda.ts:75,78` | **Cobros/pagos aplicaban cuentas ya saldadas.** Las búsquedas de CxC/CxP no filtraban pendientes; ahora usan `soloPendientes: true`. |
| 9 | Baja | `src/server/services/reportes.ts:718`, `src/server/queries/reportes.ts:55` | **Resolución de reportes.** Se agregó `resolverNombreReporte()` para aceptar tanto el nombre camelCase de la función como el slug kebab-case de la URL, con alias (`presupuestosPendientes` → `presupuestosPendientesVsFacturados`). |
| 10 | Baja | UI (varias pantallas) | Columnas y etiquetas alineadas a las claves reales del backend (`numero_comprobante`, `proveedor_nombre`, `stock_sucursal`, `stock_deposito`, sucursal configurada de SIFEN, documentos relacionados por lista) y tipos de acción sin `as never`. |

## Cobertura de pruebas

| Archivo | Qué protege |
| --- | --- |
| `tests/personas.test.ts` | Persona única con rol cliente/proveedor, documento duplicado, RUC/DV, aislamiento por empresa. |
| `tests/descuentos.test.ts` | Vigencia, sucursal, cantidad mínima, prioridad/acumulación/tope, descuento inactivo, persistencia de estado, permiso y tope de descuento manual, prorrateo en facturación parcial. |
| `tests/iva.test.ts` | IVA incluido (10/5/exento) en Gs enteros, cantidades decimales, propiedad sobre 500 documentos. |
| `tests/compras.test.ts` | Pedido → OC → Factura → Recepción; doble facturación/recepción, duplicados, costos, CxP, asientos, anulaciones, multiempresa y recepción vacía. |
| `tests/ventas.test.ts` | Presupuesto → factura, facturación parcial, stock negativo, numeración/CDC, anulaciones con cobros, límite de crédito. |
| `tests/caja.test.ts` | Cierre de sesión: solo titular o supervisor de la misma sucursal; doble cierre rechazado. |
| `tests/contabilidad-reportes.test.ts` | Partida doble (servicio y trigger diferido), anulación con contra-asiento, inventario/anulaciones, libros IVA, mayor, sumas y saldos, kardex, CSV. |

## Riesgos y pendientes (no bloqueantes)

1. **SIFEN simulado.** `src/server/services/sifen/adaptador.ts` es un stub que aprueba todo CDC válido con código 0260. Falta el adaptador real (firma XML, SOAP/REST de la SET, contingencia).
2. **Catálogos SET de referencia.** Códigos de departamentos/ciudades, unidades de medida y actividades económicas del seed son de ejemplo; validar contra la tabla oficial antes de producción.
3. **PostgreSQL local no disponible** en el entorno de auditoría (`localhost:5432` cerrado). Las pruebas usan PGlite; antes de desplegar ejecutar `npm run db:migrate && npm run db:seed` contra PostgreSQL real.
4. **Warnings de lint** por variables no usadas (`_clave`, `_x`, `_c`, `_o`); no afectan la ejecución.

## Reproducción

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx tsx src/db/seed/verificar-pglite.ts
```
