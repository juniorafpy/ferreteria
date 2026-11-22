import { obtenerOrdenCompra } from '@/server/queries/compras';
import { anularOrdenCompra, confirmarOrdenCompra, guardarOrdenCompra } from '@/server/actions/compras';
import { FormularioDocumento } from '@/components/forms/FormularioDocumento';
import { NoEncontrado } from '@/components/ui/Pagina';
import { docsRel, PanelDocumentosRelacionados } from '@/components/ui/PanelDocumentosRelacionados';
import { leer } from '@/lib/ui/datos';
import { hoyISO } from '@/lib/ui/formato';
import { cargarCatalogos } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Orden de compra' };

export default async function FichaOrden({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [registro, cat] = await Promise.all([cargarFicha(id, obtenerOrdenCompra), cargarCatalogos()]);
  if (id && !registro) return <NoEncontrado volverHref="/compras/ordenes" />;
  return (
    <FormularioDocumento
      titulo="Orden de compra"
      listaHref="/compras/ordenes"
      registro={registro}
      precio="costo"
      ivaEditable
      mostrarPendiente
      guardar={guardarOrdenCompra}
      confirmar={confirmarOrdenCompra}
      anular={anularOrdenCompra}
      importar={{ etiqueta: 'Importar pedidos', fuente: 'pedidos', campo: 'pedidoIds', multiple: true }}
      camposCabecera={[
        { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
        { clave: 'proveedorId', etiqueta: 'Proveedor', tipo: 'entidad', entidad: 'proveedor', requerido: true, ancho: 2, claveEtiqueta: 'proveedor.razon_social' },
        { clave: 'condicionPagoId', etiqueta: 'Condición de pago', tipo: 'select', opciones: cat.condicionesPago },
        { clave: 'depositoId', etiqueta: 'Depósito destino', tipo: 'select', opciones: cat.depositos },
        { clave: 'fechaEntregaEstimada', etiqueta: 'Entrega estimada', tipo: 'fecha' },
        { clave: 'observacion', etiqueta: 'Observación', tipo: 'area', ancho: 2 },
      ]}
      lateral={id ? <PanelDocumentosRelacionados relacionados={{ origen: docsRel('pedido_compra', leer(registro, 'pedidos'), 'pedido'), destino: docsRel('factura_compra', leer(registro, 'facturas')) }} /> : null}
    />
  );
}
