import { listarEmpresas } from '@/server/queries/ajustes';
import { DataTable } from '@/components/ui/DataTable';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';

export const metadata = { title: 'Empresas' };

export default async function Empresas() {
  const filas = comoFilas(await seguro(() => listarEmpresas(), []));
  return (
    <>
      <EncabezadoPagina titulo="Empresas" nuevoHref="/ajustes/empresas/nuevo" />
      <DataTable
        filas={filas}
        enlace="/ajustes/empresas/{id}"
        exportar="empresas"
        columnas={[
          { clave: 'razon_social', titulo: 'Razón social' },
          { clave: 'nombre_fantasia', titulo: 'Fantasía' },
          { clave: 'ruc', titulo: 'RUC', tipo: 'mono' },
          { clave: 'dv', titulo: 'DV' },
          { clave: 'telefono', titulo: 'Teléfono' },
          { clave: 'email', titulo: 'Email' },
          { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
        ]}
      />
    </>
  );
}
