# Contrato backend ↔ frontend (Fase 2)

Fuente de verdad del esquema: `src/db/schema/**` (solo lectura para ambos).

## Propiedad de carpetas
| Agente | Carpetas exclusivas |
|---|---|
| backend | `src/server/**`, `src/app/api/**`, `src/middleware.ts` |
| frontend | `src/components/**`, `src/lib/ui/**`, `src/app/(dashboard)/**`, `src/app/login/**`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` |

## Convenciones
- Las **Server Actions** viven en `src/server/actions/<modulo>.ts` (con `"use server"`). Las **consultas de lectura** (para Server Components) viven en `src/server/queries/<modulo>.ts`. Módulos: `auth`, `definiciones`, `compras`, `ventas`, `caja`, `contabilidad`, `ajustes`, `reportes`.
- Todo resultado de acción usa `ActionResult<T>` de `src/server/lib/result.ts`:
  ```ts
  export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
  ```
- Los esquemas Zod de entrada se exportan en `src/server/validation/<modulo>.ts` (por ejemplo `personaInput` y el tipo `PersonaInput = z.infer<...>`), de modo que el frontend pueda importar los **tipos**.
- La sesión se obtiene con `src/server/auth/session.ts` → `getSesion(): Promise<Sesion | null>` y `requireSesion()`.
  - `Sesion = { usuarioId, login, nombre, empresaId, sucursalId, permisos: string[], descuentoManualMaxPct: number }`.
  - Usa una cookie httpOnly firmada con HMAC (`node:crypto`, secreto `SESSION_SECRET`).
  - Acciones de sesión: `login`, `logout` y `cambiarContexto({ empresaId, sucursalId })` en `actions/auth.ts`.
- Los permisos se verifican en el servidor con `requirePermiso(codigo)` (`src/server/auth/permisos.ts`). En la UI solo se ocultan o deshabilitan controles usando `sesion.permisos`.
- Los montos se manejan como `number` entero en Gs. Las cantidades son `number` y las fechas son strings `YYYY-MM-DD`.
- Funciones puras compartidas que puede importar el frontend en Client Components, porque no tocan la BD:
  - `src/server/fiscal/iva.ts`: `calcularLinea({cantidad, precioUnitarioGs, descuentoGs, tipoIva})` → `{ totalLineaGs, ivaGs }`, y `calcularTotales(lineas)` → `{ gravada10Gs, gravada5Gs, exentaGs, iva10Gs, iva5Gs, totalIvaGs, totalDescuentoGs, totalGs }`.
  - `src/server/fiscal/ruc.ts`: `validarRuc(ruc, dv)`.
  - `src/server/fiscal/sifen.ts`: `formatearNumeroFactura(est, pto, nro)` → `001-001-0000001`.

## Firmas mínimas que backend DEBE exportar (el frontend programa contra estos nombres)
Las consultas reciben filtros opcionales; el contexto empresa/sucursal se toma siempre de la sesión.

**definiciones**
- Queries:
  - Listados: `listarPersonas(q?)`, `listarClientes(q?)`, `listarProveedores(q?)`, `listarArticulos(q?)`, `listarDescuentos()`.
  - Fichas: `obtenerPersona(id)`, `obtenerCliente(id)`, `obtenerProveedor(id)`, `obtenerArticulo(id)`, `obtenerDescuento(id)`.
  - Catálogos: `listarReferenciales()` → `{ tiposPersona, tiposDocumento, paises, departamentos, ciudades, actividadesEconomicas, marcas, modelos, categorias, unidadesMedida, condicionesPago, depositos, sucursales }`.
- Actions:
  - Guardar: `guardarPersona`, `guardarCliente`, `guardarProveedor`, `guardarArticulo`, `guardarDescuento` (cabecera + `sucursalIds[]` + `articulos[]`), `guardarReferencial(tabla, datos)`.
  - Cambio de estado: `cambiarEstado(entidad, id, estado)`.

**ventas**
- Queries:
  - Presupuestos: `listarPresupuestos(f)`, `obtenerPresupuesto(id)` (con detalles y `cantidadPendiente` por ítem).
  - Facturas: `listarFacturasVenta(f)`, `obtenerFacturaVenta(id)` (con eventos SIFEN y documentos relacionados).
  - Descuentos: `resolverDescuento({ articuloId, cantidad, fecha, sucursalId? })` → `{ descuentoId, tipo, valor, descuentoGs } | null`.
  - Búsqueda: `buscarArticulosVenta(q)` (con precio, tipo de IVA y stock de la sucursal).
- Actions:
  - Presupuestos: `guardarPresupuesto`, `confirmarPresupuesto(id)`, `anularPresupuesto(id, motivo)`.
  - Facturas: `crearFacturaDesdePresupuesto(presupuestoId)` → borrador, `guardarFacturaVenta`, `confirmarFacturaVenta(id)`, `anularFacturaVenta(id, motivo)`.
  - SIFEN: `reenviarSifen(id)`.

**caja**
- Queries: `listarCajas()`, `sesionCajaActual()`, `listarCuentasCobrar(f)`.
- Actions: `abrirCaja`, `cerrarCaja` (con arqueo), `registrarCobro` (cuentas + medios), `anularCobro`.

**compras**
- Queries:
  - Listados: `listarPedidosCompra`, `listarOrdenesCompra`, `listarFacturasCompra`, `listarRecepciones`, `listarCuentasPagar`, `listarOrdenesPago`, cada uno con `(f)`.
  - Fichas: `obtenerPedidoCompra(id)`, `obtenerOrdenCompra(id)`, `obtenerFacturaCompra(id)`, `obtenerRecepcion(id)`.
  - Pendientes para importar: `pedidosAprobadosPendientes(proveedorId?)`, `ordenesPendientesFacturar(proveedorId?)`, `facturasPendientesRecepcion()`.
- Actions:
  - Pedidos: `guardarPedidoCompra`, `confirmarPedidoCompra`.
  - Órdenes: `guardarOrdenCompra` (admite `pedidoIds[]` importados), `confirmarOrdenCompra`.
  - Facturas: `guardarFacturaCompra` (admite `ordenCompraId`), `confirmarFacturaCompra`, `anularFacturaCompra`.
  - Recepciones: `guardarRecepcion`, `confirmarRecepcion`, `anularRecepcion`.
  - Pagos: `registrarOrdenPago`, `anularOrdenPago`.

**contabilidad**
- Queries: `listarPlanCuentas()`, `listarConfiguracionContable()`, `listarAsientos(f)`, `obtenerAsiento(id)`.
- Actions: `guardarCuenta`, `guardarConfiguracionContable`, `guardarAsientoManual` (valida Debe = Haber), `anularAsiento`.

**ajustes**
- Queries:
  - Organización: `listarEmpresas`, `listarSucursales`, `listarTimbrados`, `listarPuntosExpedicion`.
  - Seguridad: `listarUsuarios`, `listarRoles` (con permisos), `listarPermisos`.
  - Sistema: `obtenerParametros`, `listarAjustesStock`, `listarTransferencias`, `consultarStock(f)`.
- Actions:
  - Organización: `guardarEmpresa`, `guardarSucursal`, `guardarTimbrado`, `guardarPuntoExpedicion`, `guardarConfiguracionSifen`.
  - Seguridad: `guardarUsuario`, `guardarRol` (permisos + `descuentoManualMaxPct`).
  - Sistema: `guardarParametros`.
  - Stock: `guardarAjusteStock`, `confirmarAjusteStock`, `anularAjusteStock`, `guardarTransferencia`, `enviarTransferencia`, `recibirTransferencia`, `anularTransferencia`.

**reportes** (todos reciben `{ desde, hasta, sucursalId?, ... }` y devuelven `{ columnas, filas, totales }` o filas tipadas)
- Compras: `libroCompras`, `comprasPorProveedor`, `comprasPorArticulo`, `historicoCostos({ articuloId? })`, `estadoCuentasPagar`.
- Ventas: `libroVentas`, `ventasPorCliente`, `ventasPorArticulo`, `presupuestosPendientesVsFacturados`, `estadoCuentasCobrar`.
- Inventario y contabilidad: `kardex({ articuloId, depositoId? })`, `libroDiario`, `libroMayor({ cuentaId })` (saldo inicial, debe, haber, saldo acumulado), `balanceSumasSaldos`.

Si un agente necesita algo fuera de este contrato, lo agrega en SU carpeta y lo informa en su entrega final; el orquestador reconcilia.
