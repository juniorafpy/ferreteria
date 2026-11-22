import { listarArticulos } from '@/server/queries/definiciones';
import { DataTable, type ColumnaDef } from '@/components/ui/DataTable';
import { BusquedaServidor, EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas, primerParam } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Artículos' };

const COLUMNAS: ColumnaDef[] = [
  { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
  { clave: 'descripcion', titulo: 'Descripción' },
  { clave: 'codigo_barras', titulo: 'Cód. barras', tipo: 'mono' },
  { clave: 'categoria', titulo: 'Categoría', alternativas: ['categoria.nombre', 'categoria_nombre'] },
  { clave: 'marca', titulo: 'Marca', alternativas: ['marca.nombre', 'marca_nombre'] },
  { clave: 'unidad', titulo: 'Unidad', alternativas: ['unidadMedida.codigo', 'unidad_codigo'] },
  { clave: 'tipo_iva', titulo: 'IVA' },
  { clave: 'precio_venta_gs', titulo: 'Precio venta', tipo: 'gs', sumar: false },
  { clave: 'stock', titulo: 'Stock', tipo: 'cantidad', alternativas: ['stock_total', 'existencia'] },
  { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
];

export default async function Articulos({ searchParams }: PropsLista) {
  const q = primerParam((await searchParams).q);
  const filas = comoFilas(await seguro(() => listarArticulos(q), []));
  return (
    <>
      <EncabezadoPagina titulo="Artículos" nuevoHref="/definiciones/articulos/nuevo" />
      <BusquedaServidor q={q} placeholder="Código, barras o descripción…" />
      <DataTable columnas={COLUMNAS} filas={filas} enlace="/definiciones/articulos/{id}" exportar="articulos" />
    </>
  );
}
