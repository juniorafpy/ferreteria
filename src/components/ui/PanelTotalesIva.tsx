import { formatoGs } from '@/lib/ui/formato';

export type TotalesIva = {
  gravada10Gs: number;
  gravada5Gs: number;
  exentaGs: number;
  iva10Gs: number;
  iva5Gs: number;
  totalIvaGs: number;
  totalDescuentoGs: number;
  totalGs: number;
};

function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: number; fuerte?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${fuerte ? 'border-t border-borde pt-1.5 text-[15px] font-semibold' : ''}`}>
      <dt className={fuerte ? '' : 'text-tenue'}>{etiqueta}</dt>
      <dd className="tabular-nums">{formatoGs(valor)}</dd>
    </div>
  );
}

/** Totales con discriminación de IVA (montos IVA incluido, como se factura en Paraguay). */
export function PanelTotalesIva({ totales, className = '' }: { totales: TotalesIva; className?: string }) {
  return (
    <section aria-label="Totales" className={`rounded border border-borde bg-panel p-3 text-[12.5px] ${className}`}>
      <dl className="grid gap-1">
        <Fila etiqueta="Gravadas 10%" valor={totales.gravada10Gs} />
        <Fila etiqueta="Gravadas 5%" valor={totales.gravada5Gs} />
        <Fila etiqueta="Exentas" valor={totales.exentaGs} />
        <Fila etiqueta="IVA 10%" valor={totales.iva10Gs} />
        <Fila etiqueta="IVA 5%" valor={totales.iva5Gs} />
        <Fila etiqueta="Total IVA" valor={totales.totalIvaGs} />
        {totales.totalDescuentoGs ? <Fila etiqueta="Descuentos" valor={totales.totalDescuentoGs} /> : null}
        <Fila etiqueta="TOTAL" valor={totales.totalGs} fuerte />
      </dl>
    </section>
  );
}
