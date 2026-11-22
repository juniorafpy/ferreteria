import { listarPedidosCompra } from '@/server/queries/compras';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Pedidos de compra' };

export default async function Pedidos({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarPedidosCompra(filtroLista(sp)), []));
  return (
    <ListadoDocumentos
      titulo="Pedidos de compra"
      descripcion="Solicitudes internas de reposición. Confirmados quedan disponibles para importar en órdenes de compra."
      nuevoHref="/compras/pedidos/nuevo"
      enlace="/compras/pedidos/{id}"
      filtros={['fechas', 'estado', 'proveedor']}
      estados={['borrador', 'confirmado', 'ordenado_parcial', 'ordenado', 'anulado']}
      valores={valoresParams(sp)}
      filas={filas}
      columnas={[
        { clave: 'numero', titulo: 'Número', tipo: 'numero' },
        { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
        { clave: 'proveedor', titulo: 'Proveedor', alternativas: ['proveedor.razon_social', 'proveedor_razon_social'] },
        { clave: 'deposito', titulo: 'Depósito', alternativas: ['deposito.nombre', 'deposito_nombre'] },
        { clave: 'cantidad_items', titulo: 'Ítems', tipo: 'numero' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
