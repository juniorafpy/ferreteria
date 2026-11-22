'use client';

import { MoneyInput } from '@/components/ui/Campos';
import { BadgeEstado } from '@/components/ui/Badge';
import { leer, leerPrimero, num, texto, type Fila } from '@/lib/ui/datos';
import { formatoFecha, formatoGs, formatoNumeroFactura } from '@/lib/ui/formato';

/** Selección de cuentas (a cobrar / a pagar) con monto a aplicar por cuenta. */
export function TablaAplicacion({
  cuentas,
  aplicado,
  onCambiar,
  soloLectura = false,
}: {
  cuentas: Fila[];
  /** id de cuenta → monto aplicado (0 = no seleccionada). */
  aplicado: Record<string, number>;
  onCambiar: (a: Record<string, number>) => void;
  soloLectura?: boolean;
}) {
  const total = Object.values(aplicado).reduce((a, b) => a + b, 0);
  const todas = cuentas.length > 0 && cuentas.every((c) => (aplicado[texto(leer(c, 'id'))] ?? 0) > 0);
  return (
    <div className="overflow-x-auto rounded border border-borde bg-panel">
      <table className="w-full min-w-[720px] text-[12.5px]">
        <thead className="bg-panel-2 text-[11px] uppercase tracking-wide text-tenue">
          <tr>
            <th className="w-8 px-2 py-1">
              <input
                type="checkbox"
                aria-label="Seleccionar todas"
                disabled={soloLectura}
                checked={todas}
                onChange={(e) => {
                  const n: Record<string, number> = {};
                  if (e.target.checked) for (const c of cuentas) n[texto(leer(c, 'id'))] = num(leer(c, 'saldo_gs'));
                  onCambiar(n);
                }}
                className="accent-primario"
              />
            </th>
            <th className="px-2 py-1 text-left">Documento</th>
            <th className="px-2 py-1 text-right">Cuota</th>
            <th className="px-2 py-1 text-left">Vencimiento</th>
            <th className="px-2 py-1 text-right">Monto</th>
            <th className="px-2 py-1 text-right">Saldo</th>
            <th className="px-2 py-1 text-left">Estado</th>
            <th className="w-40 px-2 py-1 text-right">A aplicar</th>
          </tr>
        </thead>
        <tbody>
          {cuentas.map((c) => {
            const id = texto(leer(c, 'id'));
            const saldo = num(leer(c, 'saldo_gs'));
            const sel = (aplicado[id] ?? 0) > 0;
            const vencida = texto(leer(c, 'fecha_vencimiento')) < new Date().toISOString().slice(0, 10);
            const doc =
              texto(leerPrimero(c, 'numero_completo', 'numero_comprobante', 'numero_factura')) ||
              formatoNumeroFactura(leerPrimero(c, 'establecimiento', 'factura.establecimiento'), leerPrimero(c, 'punto_expedicion', 'factura.punto_expedicion'), leerPrimero(c, 'numero', 'factura.numero')) ||
              `#${id}`;
            return (
              <tr key={id} className={`border-b border-borde/60 ${sel ? 'bg-acento/40' : ''}`}>
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${doc}`}
                    disabled={soloLectura}
                    checked={sel}
                    onChange={(e) => onCambiar({ ...aplicado, [id]: e.target.checked ? saldo : 0 })}
                    className="accent-primario"
                  />
                </td>
                <td className="px-2 py-1 font-mono text-[12px]">{doc}</td>
                <td className="px-2 py-1 text-right tabular-nums">{texto(leer(c, 'numero_cuota'))}</td>
                <td className={`px-2 py-1 tabular-nums ${vencida ? 'text-peligro' : ''}`}>{formatoFecha(leer(c, 'fecha_vencimiento'))}</td>
                <td className="px-2 py-1 text-right tabular-nums">{formatoGs(leer(c, 'monto_gs'))}</td>
                <td className="px-2 py-1 text-right tabular-nums">{formatoGs(saldo)}</td>
                <td className="px-2 py-1">
                  <BadgeEstado estado={leer(c, 'estado')} />
                </td>
                <td className="px-1 py-1">
                  <MoneyInput
                    value={aplicado[id] ?? 0}
                    disabled={soloLectura}
                    aria-label={`Monto a aplicar ${doc}`}
                    aria-invalid={(aplicado[id] ?? 0) > saldo}
                    onChange={(v) => onCambiar({ ...aplicado, [id]: v })}
                  />
                </td>
              </tr>
            );
          })}
          {cuentas.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-2 py-6 text-center text-tenue">
                No hay cuentas pendientes.
              </td>
            </tr>
          ) : null}
        </tbody>
        <tfoot className="bg-panel-2 font-semibold">
          <tr>
            <td colSpan={7} className="px-2 py-1 text-right">
              Total a aplicar
            </td>
            <td className="px-2 py-1 text-right tabular-nums">{formatoGs(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
