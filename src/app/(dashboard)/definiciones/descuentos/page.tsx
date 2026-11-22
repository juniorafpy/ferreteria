import { listarDescuentos } from '@/server/queries/definiciones';
import { DataTable, type ColumnaDef } from '@/components/ui/DataTable';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';

export const metadata = { title: 'Descuentos' };

const COLUMNAS: ColumnaDef[] = [
  { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
  { clave: 'nombre', titulo: 'Nombre' },
  { clave: 'tipo', titulo: 'Tipo' },
  { clave: 'fecha_desde', titulo: 'Desde', tipo: 'fecha' },
  { clave: 'fecha_hasta', titulo: 'Hasta', tipo: 'fecha' },
  { clave: 'prioridad', titulo: 'Prioridad', tipo: 'numero' },
  { clave: 'acumulable', titulo: 'Acumulable', tipo: 'bool' },
  { clave: 'todas_sucursales', titulo: 'Todas suc.', tipo: 'bool' },
  { clave: 'cantidad_articulos', titulo: 'Artículos', tipo: 'numero' },
  { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
];

export default async function Descuentos() {
  const filas = comoFilas(await seguro(() => listarDescuentos(), []));
  return (
    <>
      <EncabezadoPagina
        titulo="Descuentos automáticos"
        descripcion="Se aplican por vigencia, sucursal, artículo y cantidad mínima. Menor prioridad = se evalúa primero."
        nuevoHref="/definiciones/descuentos/nuevo"
      />
      <DataTable columnas={COLUMNAS} filas={filas} enlace="/definiciones/descuentos/{id}" exportar="descuentos" />
    </>
  );
}
