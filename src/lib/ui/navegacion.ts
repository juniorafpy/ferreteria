/* Mapa de navegación del ERP: lo usan el menú lateral, la paleta Ctrl+K y el inicio. */

export type ItemMenu = { titulo: string; href: string; permiso?: string; palabras?: string };
export type ModuloMenu = { id: string; titulo: string; icono: IconoModulo; items: ItemMenu[] };
export type IconoModulo = 'definiciones' | 'compras' | 'ventas' | 'contabilidad' | 'ajustes' | 'reportes';

export const MENU: ModuloMenu[] = [
  {
    id: 'definiciones',
    titulo: 'Definiciones',
    icono: 'definiciones',
    items: [
      { titulo: 'Personas', href: '/definiciones/personas', palabras: 'ruc cedula contacto' },
      { titulo: 'Clientes', href: '/definiciones/clientes' },
      { titulo: 'Proveedores', href: '/definiciones/proveedores' },
      { titulo: 'Artículos', href: '/definiciones/articulos', palabras: 'productos precios' },
      { titulo: 'Descuentos', href: '/definiciones/descuentos', palabras: 'promociones ofertas' },
      { titulo: 'Referenciales', href: '/definiciones/referenciales', palabras: 'marcas categorias unidades ciudades paises depositos' },
    ],
  },
  {
    id: 'compras',
    titulo: 'Compras',
    icono: 'compras',
    items: [
      { titulo: 'Pedidos de compra', href: '/compras/pedidos' },
      { titulo: 'Órdenes de compra', href: '/compras/ordenes', palabras: 'oc' },
      { titulo: 'Facturas de compra', href: '/compras/facturas' },
      { titulo: 'Recepciones', href: '/compras/recepciones', palabras: 'ingreso mercaderia' },
      { titulo: 'Cuentas a pagar', href: '/compras/cuentas-pagar' },
      { titulo: 'Órdenes de pago', href: '/compras/ordenes-pago', palabras: 'pagos' },
    ],
  },
  {
    id: 'ventas',
    titulo: 'Ventas',
    icono: 'ventas',
    items: [
      { titulo: 'Presupuestos', href: '/ventas/presupuestos', palabras: 'cotizacion' },
      { titulo: 'Facturas de venta', href: '/ventas/facturas', palabras: 'sifen electronica cdc' },
      { titulo: 'Caja', href: '/ventas/caja', palabras: 'apertura cierre arqueo' },
      { titulo: 'Cobros', href: '/ventas/cobros', palabras: 'recibos' },
      { titulo: 'Cuentas a cobrar', href: '/ventas/cuentas-cobrar' },
    ],
  },
  {
    id: 'contabilidad',
    titulo: 'Contabilidad',
    icono: 'contabilidad',
    items: [
      { titulo: 'Plan de cuentas', href: '/contabilidad/plan-cuentas' },
      { titulo: 'Configuración contable', href: '/contabilidad/configuracion' },
      { titulo: 'Asientos', href: '/contabilidad/asientos', palabras: 'diario' },
    ],
  },
  {
    id: 'ajustes',
    titulo: 'Ajustes',
    icono: 'ajustes',
    items: [
      { titulo: 'Empresas', href: '/ajustes/empresas' },
      { titulo: 'Sucursales', href: '/ajustes/sucursales', palabras: 'establecimientos timbrados puntos expedicion sifen' },
      { titulo: 'Consulta de stock', href: '/ajustes/stock', palabras: 'existencias inventario' },
      { titulo: 'Ajustes de stock', href: '/ajustes/ajustes-stock', palabras: 'merma sobrante' },
      { titulo: 'Transferencias', href: '/ajustes/transferencias' },
      { titulo: 'Usuarios', href: '/ajustes/usuarios' },
      { titulo: 'Roles y permisos', href: '/ajustes/roles' },
      { titulo: 'Parámetros', href: '/ajustes/parametros' },
    ],
  },
  {
    id: 'reportes',
    titulo: 'Reportes',
    icono: 'reportes',
    items: [
      { titulo: 'Índice de reportes', href: '/reportes' },
      { titulo: 'Libro de compras', href: '/reportes/libro-compras' },
      { titulo: 'Libro de ventas', href: '/reportes/libro-ventas' },
      { titulo: 'Kardex', href: '/reportes/kardex' },
      { titulo: 'Libro diario', href: '/reportes/libro-diario' },
      { titulo: 'Libro mayor', href: '/reportes/libro-mayor' },
      { titulo: 'Balance de sumas y saldos', href: '/reportes/balance-sumas-saldos' },
    ],
  },
];

/** Acciones rápidas (nuevo documento) para paleta de comandos e inicio. */
export const ACCIONES_RAPIDAS: ItemMenu[] = [
  { titulo: 'Nueva factura de venta', href: '/ventas/facturas/nuevo' },
  { titulo: 'Nuevo presupuesto', href: '/ventas/presupuestos/nuevo' },
  { titulo: 'Nuevo cobro', href: '/ventas/cobros/nuevo' },
  { titulo: 'Nuevo pedido de compra', href: '/compras/pedidos/nuevo' },
  { titulo: 'Nueva orden de compra', href: '/compras/ordenes/nuevo' },
  { titulo: 'Nueva factura de compra', href: '/compras/facturas/nuevo' },
  { titulo: 'Nueva recepción', href: '/compras/recepciones/nuevo' },
  { titulo: 'Nueva persona', href: '/definiciones/personas/nuevo' },
  { titulo: 'Nuevo artículo', href: '/definiciones/articulos/nuevo' },
  { titulo: 'Nuevo asiento manual', href: '/contabilidad/asientos/nuevo' },
  { titulo: 'Nuevo ajuste de stock', href: '/ajustes/ajustes-stock/nuevo' },
  { titulo: 'Nueva transferencia', href: '/ajustes/transferencias/nuevo' },
];

export function todosLosDestinos(): (ItemMenu & { modulo: string })[] {
  const out: (ItemMenu & { modulo: string })[] = [];
  for (const m of MENU) for (const i of m.items) out.push({ ...i, modulo: m.titulo });
  for (const a of ACCIONES_RAPIDAS) out.push({ ...a, modulo: 'Acciones' });
  return out;
}

/** Normaliza texto para búsquedas (sin acentos, minúsculas). */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
