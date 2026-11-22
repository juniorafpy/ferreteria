/**
 * Reportes (Server Components / Route Handlers). Todos reciben `{ desde, hasta, sucursalId?, ... }`
 * (fechas YYYY-MM-DD; si se omiten: desde = 1° de enero del año en curso, hasta = hoy;
 * en kardex e histórico de costos `desde` por defecto es el inicio de los registros).
 * `sucursalId` omitido = sucursal de la sesión; 0 = todas. Devuelven `{ titulo, columnas, filas, totales, extra? }`.
 */
import { db } from '@/db';
import { requirePermiso } from '../auth/permisos';
import { hoyPy } from '../lib/fechas';
import * as svc from '../services/reportes';
import { filtroReporte, type Reporte } from '../validation/reportes';

export type FiltroReporteEntrada = {
  desde?: string | null;
  hasta?: string | null;
  sucursalId?: number | null;
  proveedorId?: number | null;
  clienteId?: number | null;
  articuloId?: number | null;
  depositoId?: number | null;
  cuentaId?: number | null;
};

async function ejecutar(nombre: svc.NombreReporte, f: FiltroReporteEntrada = {}, desdeHistorico = false): Promise<Reporte> {
  const s = await requirePermiso(svc.PERMISO_REPORTE[nombre]);
  const hoy = hoyPy();
  const x = filtroReporte.parse({
    ...f,
    desde: f.desde || (desdeHistorico ? '1900-01-01' : `${hoy.slice(0, 4)}-01-01`),
    hasta: f.hasta || hoy,
  });
  return svc.REPORTES[nombre](db, s, x);
}

export const libroCompras = async (f: FiltroReporteEntrada = {}) => ejecutar('libroCompras', f);
export const comprasPorProveedor = async (f: FiltroReporteEntrada = {}) => ejecutar('comprasPorProveedor', f);
export const comprasPorArticulo = async (f: FiltroReporteEntrada = {}) => ejecutar('comprasPorArticulo', f);
export const historicoCostos = async (f: FiltroReporteEntrada = {}) => ejecutar('historicoCostos', f, true);
export const estadoCuentasPagar = async (f: FiltroReporteEntrada = {}) => ejecutar('estadoCuentasPagar', f, true);
export const libroVentas = async (f: FiltroReporteEntrada = {}) => ejecutar('libroVentas', f);
export const ventasPorCliente = async (f: FiltroReporteEntrada = {}) => ejecutar('ventasPorCliente', f);
export const ventasPorArticulo = async (f: FiltroReporteEntrada = {}) => ejecutar('ventasPorArticulo', f);
export const presupuestosPendientesVsFacturados = async (f: FiltroReporteEntrada = {}) =>
  ejecutar('presupuestosPendientesVsFacturados', f);
export const estadoCuentasCobrar = async (f: FiltroReporteEntrada = {}) => ejecutar('estadoCuentasCobrar', f, true);
export const kardex = async (f: FiltroReporteEntrada & { articuloId: number }) => ejecutar('kardex', f, true);
export const libroDiario = async (f: FiltroReporteEntrada = {}) => ejecutar('libroDiario', f);
export const libroMayor = async (f: FiltroReporteEntrada & { cuentaId: number }) => ejecutar('libroMayor', f);
export const balanceSumasSaldos = async (f: FiltroReporteEntrada = {}) => ejecutar('balanceSumasSaldos', f);

/**
 * Ejecuta un reporte por nombre (exportación CSV). Acepta el nombre de la función (`libroVentas`)
 * o el slug kebab-case de la UI (`libro-ventas`).
 */
export async function ejecutarReporte(nombre: string, f: FiltroReporteEntrada): Promise<Reporte | null> {
  const resuelto = svc.resolverNombreReporte(nombre);
  if (!resuelto) return null;
  const historico = ['historicoCostos', 'estadoCuentasPagar', 'estadoCuentasCobrar', 'kardex'].includes(resuelto);
  return ejecutar(resuelto, f, historico);
}

export type { Reporte } from '../validation/reportes';
