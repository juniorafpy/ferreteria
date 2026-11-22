/* Catálogo de reportes del contrato (slug de URL ↔ función de @/server/queries/reportes). */

export type FiltroRep = 'fechas' | 'sucursal' | 'proveedor' | 'cliente' | 'articulo' | 'cuenta' | 'deposito';

export type DefReporte = {
  slug: string;
  /** Nombre de la función exportada por @/server/queries/reportes. */
  funcion: string;
  titulo: string;
  grupo: 'Compras' | 'Ventas' | 'Inventario' | 'Contabilidad';
  descripcion: string;
  filtros: FiltroRep[];
  requeridos?: string[];
};

export const REPORTES: DefReporte[] = [
  { slug: 'libro-compras', funcion: 'libroCompras', titulo: 'Libro de compras', grupo: 'Compras', descripcion: 'Facturas de compra con discriminación de IVA (formato SET).', filtros: ['fechas', 'sucursal', 'proveedor'] },
  { slug: 'compras-por-proveedor', funcion: 'comprasPorProveedor', titulo: 'Compras por proveedor', grupo: 'Compras', descripcion: 'Totales comprados agrupados por proveedor.', filtros: ['fechas', 'sucursal', 'proveedor'] },
  { slug: 'compras-por-articulo', funcion: 'comprasPorArticulo', titulo: 'Compras por artículo', grupo: 'Compras', descripcion: 'Cantidades y montos comprados por artículo.', filtros: ['fechas', 'sucursal', 'articulo', 'proveedor'] },
  { slug: 'historico-costos', funcion: 'historicoCostos', titulo: 'Histórico de costos', grupo: 'Compras', descripcion: 'Evolución del costo unitario y promedio por artículo.', filtros: ['fechas', 'sucursal', 'articulo'] },
  { slug: 'estado-cuentas-pagar', funcion: 'estadoCuentasPagar', titulo: 'Estado de cuentas a pagar', grupo: 'Compras', descripcion: 'Saldos pendientes por proveedor y vencimiento.', filtros: ['fechas', 'sucursal', 'proveedor'] },
  { slug: 'libro-ventas', funcion: 'libroVentas', titulo: 'Libro de ventas', grupo: 'Ventas', descripcion: 'Comprobantes de venta con discriminación de IVA (formato SET).', filtros: ['fechas', 'sucursal', 'cliente'] },
  { slug: 'ventas-por-cliente', funcion: 'ventasPorCliente', titulo: 'Ventas por cliente', grupo: 'Ventas', descripcion: 'Totales vendidos agrupados por cliente.', filtros: ['fechas', 'sucursal', 'cliente'] },
  { slug: 'ventas-por-articulo', funcion: 'ventasPorArticulo', titulo: 'Ventas por artículo', grupo: 'Ventas', descripcion: 'Cantidades, montos y margen por artículo.', filtros: ['fechas', 'sucursal', 'articulo', 'cliente'] },
  { slug: 'presupuestos-pendientes', funcion: 'presupuestosPendientesVsFacturados', titulo: 'Presupuestos pendientes vs facturados', grupo: 'Ventas', descripcion: 'Seguimiento de conversión de presupuestos.', filtros: ['fechas', 'sucursal', 'cliente'] },
  { slug: 'estado-cuentas-cobrar', funcion: 'estadoCuentasCobrar', titulo: 'Estado de cuentas a cobrar', grupo: 'Ventas', descripcion: 'Saldos pendientes por cliente y vencimiento.', filtros: ['fechas', 'sucursal', 'cliente'] },
  { slug: 'kardex', funcion: 'kardex', titulo: 'Kardex', grupo: 'Inventario', descripcion: 'Movimientos valorizados de un artículo por depósito.', filtros: ['fechas', 'sucursal', 'articulo', 'deposito'], requeridos: ['articuloId'] },
  { slug: 'libro-diario', funcion: 'libroDiario', titulo: 'Libro diario', grupo: 'Contabilidad', descripcion: 'Asientos confirmados en orden cronológico.', filtros: ['fechas', 'sucursal'] },
  { slug: 'libro-mayor', funcion: 'libroMayor', titulo: 'Libro mayor', grupo: 'Contabilidad', descripcion: 'Saldo inicial, debe, haber y saldo acumulado de una cuenta.', filtros: ['fechas', 'sucursal', 'cuenta'], requeridos: ['cuentaId'] },
  { slug: 'balance-sumas-saldos', funcion: 'balanceSumasSaldos', titulo: 'Balance de sumas y saldos', grupo: 'Contabilidad', descripcion: 'Sumas del debe/haber y saldos por cuenta.', filtros: ['fechas', 'sucursal'] },
];

export const reportePorSlug = (slug: string) => REPORTES.find((r) => r.slug === slug);
