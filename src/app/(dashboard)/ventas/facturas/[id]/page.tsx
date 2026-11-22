import { obtenerFacturaVenta } from '@/server/queries/ventas';
import { anularFacturaVenta, confirmarFacturaVenta, guardarFacturaVenta } from '@/server/actions/ventas';
import { FormularioDocumento } from '@/components/forms/FormularioDocumento';
import { NoEncontrado } from '@/components/ui/Pagina';
import { docsRel, PanelDocumentosRelacionados } from '@/components/ui/PanelDocumentosRelacionados';
import { leer } from '@/lib/ui/datos';
import { formatoNumeroFactura } from '@/lib/ui/formato';
import { cargarCatalogos, OPC_CONDICION } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';
import { PanelSifen } from './PanelSifen';

export const metadata = { title: 'Factura de venta' };

export default async function FichaFacturaVenta({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [registro, cat] = await Promise.all([cargarFicha(id, obtenerFacturaVenta), cargarCatalogos()]);
  if (id && !registro) return <NoEncontrado volverHref="/ventas/facturas" />;
  const numero = registro ? formatoNumeroFactura(leer(registro, 'establecimiento'), leer(registro, 'punto_expedicion'), leer(registro, 'numero')) : '';
  return (
    <FormularioDocumento
      titulo="Factura de venta"
      numeroVisible={numero || '(borrador)'}
      listaHref="/ventas/facturas"
      registro={registro}
      precio="venta"
      conDescuento
      mostrarStock
      claveFecha="fechaEmision"
      guardar={guardarFacturaVenta}
      confirmar={confirmarFacturaVenta}
      etiquetaConfirmar="Emitir"
      anular={anularFacturaVenta}
      datosFijos={{ presupuestoId: leer(registro, 'presupuesto_id') ?? null }}
      camposCabecera={[
        { clave: 'clienteId', etiqueta: 'Cliente', tipo: 'entidad', entidad: 'cliente', ancho: 2, claveEtiqueta: 'receptor_razon_social', ayuda: 'Vacío = consumidor final (SIN NOMBRE)' },
        { clave: 'condicionOperacion', etiqueta: 'Condición', tipo: 'select', opciones: OPC_CONDICION, requerido: true, defecto: 'contado' },
        { clave: 'depositoId', etiqueta: 'Depósito', tipo: 'select', opciones: cat.depositos, placeholder: 'Por defecto (caja / principal)' },
        { clave: 'condicionPagoId', etiqueta: 'Condición de pago', tipo: 'select', opciones: cat.condicionesPago, siCampo: ['condicionOperacion', 'credito'] },
        { clave: 'cantidadCuotas', etiqueta: 'Cuotas', tipo: 'entero', siCampo: ['condicionOperacion', 'credito'] },
        { clave: 'plazoDias', etiqueta: 'Plazo (días)', tipo: 'entero', siCampo: ['condicionOperacion', 'credito'] },
        { clave: 'observacion', etiqueta: 'Observación', tipo: 'area', ancho: 4 },
      ]}
      lateral={
        registro ? (
          <>
            <PanelSifen factura={registro} />
            <PanelDocumentosRelacionados
              relacionados={{
                origen: docsRel('presupuesto', leer(registro, 'documentosRelacionados.presupuesto') ?? leer(registro, 'presupuesto')),
                destino: [...docsRel('cobro', leer(registro, 'documentosRelacionados.cobros')), ...docsRel('asiento', leer(registro, 'documentosRelacionados.asientos'))],
              }}
            />
          </>
        ) : null
      }
    />
  );
}
