import { listarOrdenesCompra } from '@/server/queries/compras';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Órdenes de compra' };

export default async function Ordenes({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarOrdenesCompra(filtroLista(sp)), []));
  return (
    <ListadoDocumentos
      titulo="Órdenes de compra"
      nuevoHref="/compras/ordenes/nuevo"
      enlace="/compras/ordenes/{id}"
      filtros={['fechas', 'estado', 'proveedor']}
      estados={['borrador', 'confirmado', 'facturado_parcial', 'facturado', 'anulado']}
      valores={valoresParams(sp)}
      filas={filas}
      columnas={[
        { clave: 'numero', titulo: 'Número', tipo: 'numero' },
        { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
        { clave: 'proveedor', titulo: 'Proveedor', alternativas: ['proveedor.razon_social', 'proveedor_razon_social'] },
        { clave: 'fecha_entrega_estimada', titulo: 'Entrega est.', tipo: 'fecha' },
        { clave: 'total_iva_gs', titulo: 'IVA', tipo: 'gs' },
        { clave: 'total_gs', titulo: 'Total', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
