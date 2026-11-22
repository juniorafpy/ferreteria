import { BadgeEstado } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { Icono } from '@/components/ui/Icono';
import { comoFilas, leer, leerPrimero, texto, type Fila } from '@/lib/ui/datos';
import { formatoCdc, formatoFechaHora, formatoNumeroFactura } from '@/lib/ui/formato';
import { ReenviarSifen } from './ReenviarSifen';

const TIPO_DOC: Record<string, string> = {
  factura: 'Factura electrónica',
  autofactura: 'Autofactura',
  nota_credito: 'Nota de crédito',
  nota_debito: 'Nota de débito',
  nota_remision: 'Nota de remisión',
};

function Dato({ etiqueta, children, mono }: { etiqueta: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 py-0.5">
      <dt className="text-tenue">{etiqueta}</dt>
      <dd className={`min-w-0 break-all ${mono ? 'font-mono text-[11.5px]' : ''}`}>{children || '—'}</dd>
    </div>
  );
}

/** Datos SIFEN del DE: estado, CDC, QR/URL, receptor y bitácora de eventos. */
export function PanelSifen({ factura }: { factura: Fila }) {
  const id = Number(leer(factura, 'id'));
  const estadoSifen = texto(leer(factura, 'estado_sifen'));
  const qr = texto(leer(factura, 'qr_url'));
  const eventos = comoFilas(leerPrimero(factura, 'eventos', 'eventosSifen', 'sifenEventos'));
  const numero = formatoNumeroFactura(leer(factura, 'establecimiento'), leer(factura, 'punto_expedicion'), leer(factura, 'numero'));
  const reenviable = ['pendiente', 'rechazado'].includes(estadoSifen) && texto(leer(factura, 'estado')) === 'confirmado';

  return (
    <section aria-label="Facturación electrónica" className="grid gap-3 rounded border border-borde bg-panel p-3 text-[12px]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[12px] font-semibold">SIFEN</h2>
        <BadgeEstado estado={estadoSifen} sifen />
      </div>
      <dl>
        <Dato etiqueta="Documento">{TIPO_DOC[texto(leer(factura, 'tipo_documento'))] ?? texto(leer(factura, 'tipo_documento'))}</Dato>
        <Dato etiqueta="Modalidad">{texto(leer(factura, 'modalidad'))}</Dato>
        <Dato etiqueta="Número" mono>{numero}</Dato>
        <Dato etiqueta="Timbrado" mono>{texto(leer(factura, 'timbrado'))}</Dato>
        <Dato etiqueta="CDC" mono>{formatoCdc(leer(factura, 'cdc'))}</Dato>
        <Dato etiqueta="Cód. seguridad" mono>{texto(leer(factura, 'codigo_seguridad'))}</Dato>
        <Dato etiqueta="Emisión">{texto(leer(factura, 'tipo_emision'))}</Dato>
        <Dato etiqueta="Transacción">{texto(leer(factura, 'tipo_transaccion')).replace(/_/g, ' ')}</Dato>
        <Dato etiqueta="Moneda">{texto(leer(factura, 'moneda'))}</Dato>
        <Dato etiqueta="Respuesta">
          {texto(leer(factura, 'sifen_codigo_respuesta'))} {texto(leer(factura, 'sifen_mensaje'))}
        </Dato>
        <Dato etiqueta="Aprobado">{formatoFechaHora(leer(factura, 'sifen_aprobado_en'))}</Dato>
        <Dato etiqueta="Lote" mono>{texto(leer(factura, 'sifen_lote'))}</Dato>
      </dl>
      {qr ? (
        <a href={qr} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primario hover:underline">
          <Icono nombre="qr" className="size-4" /> Consultar DE (QR / KuDE)
        </a>
      ) : null}
      {qr ? <p className="break-all font-mono text-[10.5px] text-tenue">{qr}</p> : null}
      {reenviable ? <ReenviarSifen facturaId={id} /> : null}

      <div>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-tenue">Receptor</h3>
        <dl>
          <Dato etiqueta="Razón social">{texto(leer(factura, 'receptor_razon_social'))}</Dato>
          <Dato etiqueta="Documento" mono>
            {texto(leer(factura, 'receptor_numero_documento'))}
            {leer(factura, 'receptor_dv') ? `-${texto(leer(factura, 'receptor_dv'))}` : ''}
          </Dato>
          <Dato etiqueta="Contribuyente">{leer(factura, 'receptor_es_contribuyente') ? 'Sí' : 'No'}</Dato>
          <Dato etiqueta="Dirección">{texto(leer(factura, 'receptor_direccion'))}</Dato>
          <Dato etiqueta="Email">{texto(leer(factura, 'receptor_email'))}</Dato>
        </dl>
      </div>

      <div>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-tenue">Bitácora de eventos</h3>
        <DataTable
          buscar={false}
          filas={eventos}
          vacio="Sin eventos."
          columnas={[
            { clave: 'creado_en', titulo: 'Fecha', tipo: 'fechaHora' },
            { clave: 'tipo_evento', titulo: 'Evento' },
            { clave: 'estado_sifen_resultante', titulo: 'Estado', tipo: 'estadoSifen' },
            { clave: 'mensaje', titulo: 'Mensaje', alternativas: ['codigo_respuesta'] },
          ]}
        />
      </div>
    </section>
  );
}
