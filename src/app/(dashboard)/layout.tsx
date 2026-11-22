import { redirect } from 'next/navigation';
import { getSesion } from '@/server/auth/session';
import { listarEmpresas, listarMisSucursales, listarSucursales } from '@/server/queries/ajustes';
import { Shell, type ContextoUI } from '@/components/layout/Shell';
import { comoFilas, leer, leerPrimero, texto } from '@/lib/ui/datos';

async function cargar<T>(fn: () => Promise<T>): Promise<T | []> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getSesion();
  if (!sesion) redirect('/login');

  const [empresas, misSucursales, sucursales] = await Promise.all([
    cargar(() => listarEmpresas()),
    cargar(() => listarMisSucursales()),
    cargar(() => listarSucursales()),
  ]);
  const filasEmp = comoFilas(empresas);
  const filasSuc = comoFilas(misSucursales).length ? comoFilas(misSucursales) : comoFilas(sucursales);
  const emp = filasEmp.find((e) => Number(leer(e, 'id')) === sesion.empresaId);
  const suc = filasSuc.find((s) => Number(leer(s, 'id')) === sesion.sucursalId);

  const contexto: ContextoUI = {
    empresa: texto(leer(sesion, 'empresaNombre')) || texto(leerPrimero(emp, 'nombre_fantasia', 'razon_social')) || `Empresa #${sesion.empresaId}`,
    sucursal: suc
      ? `${texto(leer(suc, 'codigo'))} · ${texto(leer(suc, 'nombre'))}`
      : texto(leer(sesion, 'sucursalNombre')) || `Sucursal #${sesion.sucursalId}`,
    empresas: filasEmp.map((e) => ({ valor: texto(leer(e, 'id')), etiqueta: texto(leerPrimero(e, 'nombre_fantasia', 'razon_social')) })),
    sucursales: filasSuc.map((s) => ({
      valor: texto(leer(s, 'id')),
      etiqueta: `${texto(leer(s, 'codigo'))} · ${texto(leer(s, 'nombre'))}`,
      empresaId: texto(leer(s, 'empresa_id')),
    })),
  };

  return (
    <Shell
      sesion={{
        usuarioId: sesion.usuarioId,
        login: sesion.login,
        nombre: sesion.nombre,
        empresaId: sesion.empresaId,
        sucursalId: sesion.sucursalId,
        permisos: sesion.permisos,
        descuentoManualMaxPct: sesion.descuentoManualMaxPct,
      }}
      contexto={contexto}
    >
      {children}
    </Shell>
  );
}
