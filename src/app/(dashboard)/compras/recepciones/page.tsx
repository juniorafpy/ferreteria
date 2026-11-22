import { listarRecepciones } from '@/server/queries/compras';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Recepciones' };

export default async function Recepciones({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarRecepciones(filtroLista(sp)), []));
  return (
    <ListadoDocumentos
      titulo="Recepciones de mercadería"
      descripcion="Ingreso a depósito de facturas de compra confirmadas (admite recepciones parciales)."
      nuevoHref="/compras/recepciones/nuevo"
      enlace="/compras/recepciones/{id}"
      filtros={['fechas', 'estado', 'proveedor']}
      estados={['borrador', 'confirmado', 'anulado']}
      valores={valoresParams(sp)}
      filas={filas}
      exportar="recepciones"
      columnas={[
        { clave: 'numero', titulo: 'Número', tipo: 'numero' },
        { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
        { clave: 'factura', titulo: 'Factura', alternativas: ['numero_factura', 'facturaCompra.numero'], tipo: 'mono' },
        { clave: 'proveedor', titulo: 'Proveedor', alternativas: ['proveedor.razon_social', 'proveedor_razon_social'] },
        { clave: 'deposito', titulo: 'Depósito', alternativas: ['deposito.nombre', 'deposito_nombre'] },
        { clave: 'total_costo_gs', titulo: 'Costo total', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
