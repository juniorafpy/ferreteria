import { listarFacturasVenta } from '@/server/queries/ventas';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, primerParam, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Facturas de venta' };

export default async function FacturasVenta({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const estadoSifen = primerParam(sp.estadoSifen);
  const filas = comoFilas(await seguro(() => listarFacturasVenta({ ...filtroLista(sp), ...(estadoSifen ? { estadoSifen } : {}) }), []));
  return (
    <ListadoDocumentos
      titulo="Facturas de venta"
      descripcion="Documentos electrónicos SIFEN y comprobantes de venta."
      nuevoHref="/ventas/facturas/nuevo"
      enlace="/ventas/facturas/{id}"
      filtros={['fechas', 'estado', 'cliente']}
      estados={['borrador', 'confirmado', 'anulado']}
      valores={valoresParams(sp)}
      filas={filas}
      columnas={[
        { clave: 'numero', titulo: 'Número', tipo: 'factura' },
        { clave: 'fecha_emision', titulo: 'Emisión', tipo: 'fecha' },
        { clave: 'receptor_razon_social', titulo: 'Cliente', alternativas: ['cliente.razon_social', 'cliente_razon_social'] },
        { clave: 'receptor_numero_documento', titulo: 'RUC/CI', tipo: 'mono' },
        { clave: 'condicion_operacion', titulo: 'Condición' },
        { clave: 'total_iva_gs', titulo: 'IVA', tipo: 'gs' },
        { clave: 'total_gs', titulo: 'Total', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
        { clave: 'estado_sifen', titulo: 'SIFEN', tipo: 'estadoSifen' },
      ]}
    />
  );
}
