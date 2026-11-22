'use server';

/* Envoltorios "use server" de consultas de lectura del backend para poder
 * invocarlas desde Client Components (buscadores, importaciones, descuentos).
 * No contienen lógica de negocio: delegan en @/server/queries/*. */

import {
  listarArticulos,
  listarClientes,
  listarPersonas,
  listarProveedores,
  listarReferenciales,
} from '@/server/queries/definiciones';
import { buscarArticulosVenta, resolverDescuento } from '@/server/queries/ventas';
import {
  facturasPendientesRecepcion,
  listarCuentasPagar,
  obtenerFacturaCompra,
  obtenerOrdenCompra,
  obtenerPedidoCompra,
  ordenesPendientesFacturar,
  pedidosAprobadosPendientes,
} from '@/server/queries/compras';
import { listarCuentasCobrar } from '@/server/queries/caja';

async function seguro<T>(fn: () => Promise<T>, def: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error('[busqueda]', e);
    return def;
  }
}

export async function buscarPersonasUI(q: string) {
  return seguro(() => listarPersonas(q), [] as unknown);
}
export async function buscarClientesUI(q: string) {
  return seguro(() => listarClientes(q), [] as unknown);
}
export async function buscarProveedoresUI(q: string) {
  return seguro(() => listarProveedores(q), [] as unknown);
}
export async function buscarArticulosVentaUI(q: string) {
  return seguro(() => buscarArticulosVenta(q), [] as unknown);
}
export async function buscarArticulosUI(q: string) {
  return seguro(() => listarArticulos(q), [] as unknown);
}
export async function referencialesUI() {
  return seguro(() => listarReferenciales(), null as unknown);
}
export async function resolverDescuentoUI(args: { articuloId: number; cantidad: number; fecha: string; sucursalId?: number }) {
  return seguro(() => resolverDescuento(args), null as unknown);
}
export async function pedidosPendientesUI(proveedorId?: number) {
  return seguro(() => pedidosAprobadosPendientes(proveedorId), [] as unknown);
}
export async function ordenesPendientesUI(proveedorId?: number) {
  return seguro(() => ordenesPendientesFacturar(proveedorId), [] as unknown);
}
export async function facturasPendientesRecepcionUI() {
  return seguro(() => facturasPendientesRecepcion(), [] as unknown);
}
export async function obtenerPedidoCompraUI(id: number) {
  return seguro(() => obtenerPedidoCompra(id), null as unknown);
}
export async function obtenerOrdenCompraUI(id: number) {
  return seguro(() => obtenerOrdenCompra(id), null as unknown);
}
export async function obtenerFacturaCompraUI(id: number) {
  return seguro(() => obtenerFacturaCompra(id), null as unknown);
}
export async function cuentasCobrarUI(clienteId?: number) {
  return seguro(() => listarCuentasCobrar({ clienteId }), [] as unknown);
}
export async function cuentasPagarUI(proveedorId?: number) {
  return seguro(() => listarCuentasPagar({ proveedorId }), [] as unknown);
}
