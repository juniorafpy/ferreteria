import Link from 'next/link';
import { BadgeEstado } from './Badge';
import { Icono } from './Icono';
import { comoFilas, leer, leerPrimero, texto, type Fila } from '@/lib/ui/datos';
import { formatoFecha, formatoGs } from '@/lib/ui/formato';

/** Ruta de ficha según tipo de documento relacionado. */
const RUTAS: Record<string, string> = {
  presupuesto: '/ventas/presupuestos',
  factura_venta: '/ventas/facturas',
  cobro: '/ventas/cobros',
  pedido_compra: '/compras/pedidos',
  orden_compra: '/compras/ordenes',
  factura_compra: '/compras/facturas',
  recepcion: '/compras/recepciones',
  orden_pago: '/compras/ordenes-pago',
  asiento: '/contabilidad/asientos',
  ajuste_stock: '/ajustes/ajustes-stock',
  transferencia_stock: '/ajustes/transferencias',
};

const NOMBRES: Record<string, string> = {
  presupuesto: 'Presupuesto',
  factura_venta: 'Factura venta',
  cobro: 'Cobro',
  pedido_compra: 'Pedido compra',
  orden_compra: 'Orden compra',
  factura_compra: 'Factura compra',
  recepcion: 'Recepción',
  orden_pago: 'Orden de pago',
  asiento: 'Asiento',
  ajuste_stock: 'Ajuste stock',
  transferencia_stock: 'Transferencia',
};

function Lista({ titulo, docs }: { titulo: string; docs: Fila[] }) {
  return (
    <div>
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-tenue">{titulo}</h3>
      {docs.length === 0 ? (
        <p className="text-[12px] text-tenue">—</p>
      ) : (
        <ul className="grid gap-1">
          {docs.map((d, i) => {
            const tipo = texto(leerPrimero(d, 'tipo', 'tipo_documento', 'origen_tipo'));
            const id = texto(leer(d, 'id'));
            const base = RUTAS[tipo];
            const nombre = `${NOMBRES[tipo] ?? tipo} ${texto(leerPrimero(d, 'numero_formateado', 'numero', 'id'))}`;
            return (
              <li key={`${tipo}-${id}-${i}`} className="flex items-center justify-between gap-2 rounded border border-borde/70 px-2 py-1 text-[12px]">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Icono nombre="enlace" className="size-3 shrink-0 text-tenue" />
                  {base && id ? (
                    <Link href={`${base}/${id}`} className="truncate text-primario hover:underline">
                      {nombre}
                    </Link>
                  ) : (
                    <span className="truncate">{nombre}</span>
                  )}
                  <span className="text-tenue">{formatoFecha(leerPrimero(d, 'fecha', 'fecha_emision'))}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {leer(d, 'total_gs') !== undefined ? <span className="tabular-nums">{formatoGs(leer(d, 'total_gs'))}</span> : null}
                  <BadgeEstado estado={leer(d, 'estado')} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Trazabilidad origen/destino. Acepta `{ origen: [...], destino: [...] }` o una lista
 * plana con `direccion: 'origen' | 'destino'`.
 */
export function PanelDocumentosRelacionados({ relacionados }: { relacionados: unknown }) {
  let origen: Fila[] = [];
  let destino: Fila[] = [];
  if (Array.isArray(relacionados)) {
    origen = (relacionados as Fila[]).filter((d) => leer(d, 'direccion') === 'origen');
    destino = (relacionados as Fila[]).filter((d) => leer(d, 'direccion') !== 'origen');
  } else if (relacionados && typeof relacionados === 'object') {
    origen = comoFilas(leerPrimero(relacionados, 'origen', 'origenes'));
    destino = comoFilas(leerPrimero(relacionados, 'destino', 'destinos'));
  }
  return (
    <section aria-label="Documentos relacionados" className="grid gap-3 rounded border border-borde bg-panel p-3">
      <h2 className="text-[12px] font-semibold">Documentos relacionados</h2>
      <Lista titulo="Origen" docs={origen} />
      <Lista titulo="Destino" docs={destino} />
    </section>
  );
}
