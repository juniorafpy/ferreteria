import { listarRoles } from '@/server/queries/ajustes';
import { DataTable } from '@/components/ui/DataTable';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';

export const metadata = { title: 'Roles' };

export default async function Roles() {
  const filas = comoFilas(await seguro(() => listarRoles(), [])).map((r) => ({
    ...r,
    cantidad_permisos: Array.isArray((r as Record<string, unknown>).permisos) ? ((r as Record<string, unknown>).permisos as unknown[]).length : undefined,
  }));
  return (
    <>
      <EncabezadoPagina titulo="Roles y permisos" nuevoHref="/ajustes/roles/nuevo" />
      <DataTable
        filas={filas}
        enlace="/ajustes/roles/{id}"
        exportar="roles"
        columnas={[
          { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
          { clave: 'nombre', titulo: 'Nombre' },
          { clave: 'descripcion', titulo: 'Descripción' },
          { clave: 'descuento_manual_max_pct', titulo: 'Tope desc. manual', tipo: 'pct' },
          { clave: 'cantidad_permisos', titulo: 'Permisos', tipo: 'numero' },
          { clave: 'es_sistema', titulo: 'Sistema', tipo: 'bool' },
          { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
        ]}
      />
    </>
  );
}
