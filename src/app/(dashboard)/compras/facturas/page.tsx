import { listarFacturasCompra } from '@/server/queries/compras';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Facturas de compra' };

export default async function FacturasCompra({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarFacturasCompra(filtroLista(sp)), []));
  return (
    <ListadoDocumentos
      titulo="Facturas de compra"
      nuevoHref="/compras/facturas/nuevo"
      enlace="/compras/facturas/{id}"
      filtros={['fechas', 'estado', 'proveedor']}
      estados={['borrador', 'confirmado', 'recibido_parcial', 'recibido', 'anulado']}
      valores={valoresParams(sp)}
      filas={filas}
      columnas={[
        { clave: 'numero', titulo: 'Comprobante', tipo: 'factura' },
        { clave: 'fecha_emision', titulo: 'Emisión', tipo: 'fecha' },
        { clave: 'proveedor', titulo: 'Proveedor', alternativas: ['proveedor.razon_social', 'proveedor_razon_social'] },
        { clave: 'timbrado', titulo: 'Timbrado', tipo: 'mono' },
        { clave: 'condicion_operacion', titulo: 'Condición' },
        { clave: 'total_iva_gs', titulo: 'IVA', tipo: 'gs' },
        { clave: 'total_gs', titulo: 'Total', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
