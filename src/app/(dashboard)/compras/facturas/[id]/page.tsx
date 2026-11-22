import Link from 'next/link';
import { obtenerFacturaCompra } from '@/server/queries/compras';
import { anularFacturaCompra, confirmarFacturaCompra, guardarFacturaCompra } from '@/server/actions/compras';
import { FormularioDocumento } from '@/components/forms/FormularioDocumento';
import { NoEncontrado } from '@/components/ui/Pagina';
import { docsRel, PanelDocumentosRelacionados } from '@/components/ui/PanelDocumentosRelacionados';
import { leer } from '@/lib/ui/datos';
import { formatoNumeroFactura, hoyISO } from '@/lib/ui/formato';
import { cargarCatalogos, OPC_CONDICION } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Factura de compra' };

export default async function FichaFacturaCompra({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [base, cat] = await Promise.all([cargarFicha(id, obtenerFacturaCompra), cargarCatalogos()]);
  if (id && !base) return <NoEncontrado volverHref="/compras/facturas" />;

  const numero = base ? formatoNumeroFactura(leer(base, 'establecimiento'), leer(base, 'punto_expedicion'), leer(base, 'numero')) : '';
  const registro = base
    ? { ...base, numeroComprobante: numero, modalidad: leer(base, 'cdc') ? 'electronica' : (leer(base, 'modalidad') ?? 'preimpreso') }
    : null;

  return (
    <FormularioDocumento
      titulo="Factura de compra"
      numeroVisible={numero}
      listaHref="/compras/facturas"
      registro={registro}
      precio="costo"
      ivaEditable
      mostrarPendiente
      claveFecha="fechaEmision"
      guardar={guardarFacturaCompra}
      confirmar={confirmarFacturaCompra}
      anular={anularFacturaCompra}
      importar={{
        etiqueta: 'Desde OC',
        fuente: 'ordenes',
        campo: 'ordenCompraId',
        multiple: false,
        copiarCabecera: ['proveedorId', 'condicionPagoId', 'depositoId'],
      }}
      camposCabecera={[
        { clave: 'proveedorId', etiqueta: 'Proveedor', tipo: 'entidad', entidad: 'proveedor', requerido: true, ancho: 2, claveEtiqueta: 'proveedor.razon_social' },
        {
          clave: 'modalidad',
          etiqueta: 'Modalidad',
          tipo: 'select',
          defecto: 'electronica',
          opciones: [
            { valor: 'electronica', etiqueta: 'Documento electrónico (DE)' },
            { valor: 'autoimpresor', etiqueta: 'Autoimpresor' },
            { valor: 'preimpreso', etiqueta: 'Preimpresa' },
          ],
        },
        { clave: 'fechaEmision', etiqueta: 'Fecha de emisión', tipo: 'fecha', requerido: true, defecto: hoyISO() },
        { clave: 'timbrado', etiqueta: 'Timbrado', requerido: true, maxLength: 8, placeholder: '12345678' },
        { clave: 'timbradoVencimiento', etiqueta: 'Vencimiento timbrado', tipo: 'fecha', ayuda: 'Fin de vigencia (preimpresa)' },
        { clave: 'numeroComprobante', etiqueta: 'Nro. comprobante', requerido: true, placeholder: '001-001-0000001', maxLength: 15 },
        { clave: 'cdc', etiqueta: 'CDC (44 dígitos)', ancho: 4, maxLength: 44, siCampo: ['modalidad', 'electronica'], placeholder: 'Código de control del DE' },
        { clave: 'condicionOperacion', etiqueta: 'Condición', tipo: 'select', opciones: OPC_CONDICION, requerido: true, defecto: 'contado' },
        { clave: 'condicionPagoId', etiqueta: 'Condición de pago', tipo: 'select', opciones: cat.condicionesPago, siCampo: ['condicionOperacion', 'credito'] },
        { clave: 'fechaVencimiento', etiqueta: 'Vencimiento', tipo: 'fecha', siCampo: ['condicionOperacion', 'credito'] },
        { clave: 'depositoId', etiqueta: 'Depósito recepción', tipo: 'select', opciones: cat.depositos },
        { clave: 'observacion', etiqueta: 'Observación', tipo: 'area', ancho: 4 },
      ]}
      extras={
        id && ['confirmado', 'recibido_parcial'].includes(String(leer(base, 'estado'))) ? (
          <Link
            href={`/compras/recepciones/nuevo?factura=${id}`}
            className="inline-flex h-7 items-center rounded border border-borde bg-panel px-2 text-[12px] font-medium hover:bg-panel-2"
          >
            Recepcionar factura
          </Link>
        ) : null
      }
      lateral={id ? <PanelDocumentosRelacionados relacionados={{ origen: docsRel('orden_compra', leer(base, 'ordenCompra')), destino: docsRel('recepcion', leer(base, 'recepciones')) }} /> : null}
    />
  );
}
