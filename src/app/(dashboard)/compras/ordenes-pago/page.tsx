import { listarOrdenesPago } from '@/server/queries/compras';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Órdenes de pago' };

export default async function OrdenesPago({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarOrdenesPago(filtroLista(sp)), []));
  return (
    <ListadoDocumentos
      titulo="Órdenes de pago"
      nuevoHref="/compras/ordenes-pago/nuevo"
      enlace="/compras/ordenes-pago/{id}"
      filtros={['fechas', 'estado', 'proveedor']}
      estados={['borrador', 'confirmado', 'anulado']}
      valores={valoresParams(sp)}
      filas={filas}
      columnas={[
        { clave: 'numero', titulo: 'Número', tipo: 'numero' },
        { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
        { clave: 'proveedor', titulo: 'Proveedor', alternativas: ['proveedor.razon_social', 'proveedor_razon_social'] },
        { clave: 'medio_pago', titulo: 'Medio' },
        { clave: 'referencia', titulo: 'Referencia' },
        { clave: 'total_gs', titulo: 'Total', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
