import { listarSucursales } from '@/server/queries/ajustes';
import { DataTable } from '@/components/ui/DataTable';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';

export const metadata = { title: 'Sucursales' };

export default async function Sucursales() {
  const filas = comoFilas(await seguro(() => listarSucursales(), []));
  return (
    <>
      <EncabezadoPagina titulo="Sucursales" descripcion="Sucursales, establecimientos SIFEN, puntos de expedición, timbrados y configuración SIFEN." nuevoHref="/ajustes/sucursales/nuevo" />
      <DataTable
        filas={filas}
        enlace="/ajustes/sucursales/{id}"
        exportar="sucursales"
        columnas={[
          { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
          { clave: 'nombre', titulo: 'Nombre' },
          { clave: 'establecimiento', titulo: 'Estab.', alternativas: ['establecimiento.codigo', 'establecimiento_codigo'], tipo: 'mono' },
          { clave: 'direccion', titulo: 'Dirección' },
          { clave: 'telefono', titulo: 'Teléfono' },
          { clave: 'es_casa_matriz', titulo: 'Casa matriz', tipo: 'bool' },
          { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
        ]}
      />
    </>
  );
}
