import { listarAsientos } from '@/server/queries/contabilidad';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Asientos' };

export default async function Asientos({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const { q, desde, hasta, estado } = filtroLista(sp);
  const f = { q, desde, hasta, estado };
  const filas = comoFilas(await seguro(() => listarAsientos(f), []));
  return (
    <ListadoDocumentos
      titulo="Asientos contables"
      descripcion="Asientos automáticos de los documentos y asientos manuales."
      nuevoHref="/contabilidad/asientos/nuevo"
      enlace="/contabilidad/asientos/{id}"
      filtros={['fechas', 'estado']}
      estados={['borrador', 'confirmado', 'anulado']}
      valores={valoresParams(sp)}
      filas={filas}
      columnas={[
        { clave: 'numero', titulo: 'Número', tipo: 'numero' },
        { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
        { clave: 'concepto', titulo: 'Concepto' },
        { clave: 'origen_tipo', titulo: 'Origen' },
        { clave: 'total_debe_gs', titulo: 'Debe', tipo: 'gs' },
        { clave: 'total_haber_gs', titulo: 'Haber', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
