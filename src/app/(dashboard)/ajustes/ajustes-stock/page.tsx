import { listarAjustesStock } from '@/server/queries/ajustes';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Ajustes de stock' };

export default async function AjustesStock({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarAjustesStock(), []));
  return (
    <ListadoDocumentos
      titulo="Ajustes de stock"
      descripcion="Mermas y sobrantes de inventario."
      nuevoHref="/ajustes/ajustes-stock/nuevo"
      enlace="/ajustes/ajustes-stock/{id}"
      filtros={[]}
      valores={valoresParams(sp)}
      filas={filas}
      columnas={[
        { clave: 'numero', titulo: 'Número', tipo: 'numero' },
        { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
        { clave: 'tipo_ajuste', titulo: 'Tipo' },
        { clave: 'deposito', titulo: 'Depósito', alternativas: ['deposito.nombre', 'deposito_nombre'] },
        { clave: 'motivo', titulo: 'Motivo' },
        { clave: 'total_costo_gs', titulo: 'Costo', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
