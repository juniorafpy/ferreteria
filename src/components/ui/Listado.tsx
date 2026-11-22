import type { ReactNode } from 'react';
import type { Fila, Opcion } from '@/lib/ui/datos';
import { etiquetaEstado } from '@/lib/ui/formato';
import { DataTable, type ColumnaDef } from './DataTable';
import { FiltrosReporte, type FiltroReporte } from './FiltrosReporte';
import { EncabezadoPagina } from './Pagina';

/** Listado de documentos con filtros por URL (fechas/estado/entidad), tabla y CSV. */
export function ListadoDocumentos({
  titulo,
  descripcion,
  nuevoHref,
  columnas,
  filas,
  enlace,
  filtros = ['fechas', 'estado'],
  estados = [],
  valores,
  exportar,
  acciones,
}: {
  titulo: string;
  descripcion?: ReactNode;
  nuevoHref?: string;
  columnas: ColumnaDef[];
  filas: Fila[];
  enlace?: string;
  filtros?: FiltroReporte[];
  estados?: string[];
  valores: Record<string, string>;
  exportar?: string;
  acciones?: ReactNode;
}) {
  const opcEstados: Opcion[] = estados.map((e) => ({ valor: e, etiqueta: etiquetaEstado(e) }));
  return (
    <>
      <EncabezadoPagina titulo={titulo} descripcion={descripcion} nuevoHref={nuevoHref} acciones={acciones} />
      {filtros.length ? (
        <div className="mb-3">
          <FiltrosReporte filtros={filtros} valores={valores} estados={opcEstados} />
        </div>
      ) : null}
      <DataTable columnas={columnas} filas={filas} enlace={enlace} exportar={exportar ?? titulo.toLowerCase().replace(/\s+/g, '-')} totales />
    </>
  );
}
