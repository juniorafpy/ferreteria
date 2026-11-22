import { obtenerPresupuesto } from '@/server/queries/ventas';
import { anularPresupuesto, confirmarPresupuesto, guardarPresupuesto } from '@/server/actions/ventas';
import { FormularioDocumento } from '@/components/forms/FormularioDocumento';
import { NoEncontrado } from '@/components/ui/Pagina';
import { docsRel, PanelDocumentosRelacionados } from '@/components/ui/PanelDocumentosRelacionados';
import { leer, texto } from '@/lib/ui/datos';
import { hoyISO } from '@/lib/ui/formato';
import { OPC_CONDICION } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';
import { BotonFacturar } from './BotonFacturar';

export const metadata = { title: 'Presupuesto' };

export default async function FichaPresupuesto({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const registro = await cargarFicha(id, obtenerPresupuesto);
  if (id && !registro) return <NoEncontrado volverHref="/ventas/presupuestos" />;
  const estado = texto(leer(registro, 'estado'));
  return (
    <FormularioDocumento
      titulo="Presupuesto"
      listaHref="/ventas/presupuestos"
      registro={registro}
      precio="venta"
      conDescuento
      mostrarStock
      mostrarPendiente={Boolean(id)}
      guardar={guardarPresupuesto}
      confirmar={confirmarPresupuesto}
      anular={anularPresupuesto}
      extras={id && ['confirmado', 'facturado_parcial'].includes(estado) ? <BotonFacturar presupuestoId={id} /> : null}
      camposCabecera={[
        { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
        { clave: 'fechaValidez', etiqueta: 'Válido hasta', tipo: 'fecha' },
        { clave: 'condicionOperacion', etiqueta: 'Condición', tipo: 'select', opciones: OPC_CONDICION, requerido: true, defecto: 'contado' },
        { clave: 'clienteId', etiqueta: 'Cliente', tipo: 'entidad', entidad: 'cliente', ancho: 2, claveEtiqueta: 'cliente.razon_social' },
        { clave: 'observacion', etiqueta: 'Observación', tipo: 'area', ancho: 2 },
      ]}
      lateral={id ? <PanelDocumentosRelacionados relacionados={{ origen: [], destino: docsRel('factura_venta', leer(registro, 'facturas')) }} /> : null}
    />
  );
}
