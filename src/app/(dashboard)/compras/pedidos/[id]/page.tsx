import { obtenerPedidoCompra } from '@/server/queries/compras';
import { confirmarPedidoCompra, guardarPedidoCompra } from '@/server/actions/compras';
import { FormularioDocumento } from '@/components/forms/FormularioDocumento';
import { NoEncontrado } from '@/components/ui/Pagina';
import { PanelDocumentosRelacionados } from '@/components/ui/PanelDocumentosRelacionados';
import { leerPrimero } from '@/lib/ui/datos';
import { hoyISO } from '@/lib/ui/formato';
import { cargarCatalogos } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Pedido de compra' };

export default async function FichaPedido({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [registro, cat] = await Promise.all([cargarFicha(id, obtenerPedidoCompra), cargarCatalogos()]);
  if (id && !registro) return <NoEncontrado volverHref="/compras/pedidos" />;
  return (
    <FormularioDocumento
      titulo="Pedido de compra"
      listaHref="/compras/pedidos"
      registro={registro}
      modo="cantidad"
      precio="costo"
      guardar={guardarPedidoCompra}
      confirmar={confirmarPedidoCompra}
      camposCabecera={[
        { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
        { clave: 'proveedorId', etiqueta: 'Proveedor sugerido', tipo: 'entidad', entidad: 'proveedor', ancho: 2, claveEtiqueta: 'proveedor.razon_social' },
        { clave: 'depositoId', etiqueta: 'Depósito destino', tipo: 'select', opciones: cat.depositos },
        { clave: 'observacion', etiqueta: 'Observación', tipo: 'area', ancho: 4 },
      ]}
      lateral={id ? <PanelDocumentosRelacionados relacionados={leerPrimero(registro, 'relacionados', 'documentosRelacionados')} /> : null}
    />
  );
}
