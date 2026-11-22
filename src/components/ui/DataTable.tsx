'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { BadgeEstado } from './Badge';
import { Icono } from './Icono';
import { interpolar, leer, num, texto, type Fila } from '@/lib/ui/datos';
import {
  etiquetaEstado,
  formatoCantidad,
  formatoFecha,
  formatoFechaHora,
  formatoGs,
  formatoNumeroFactura,
  formatoPct,
} from '@/lib/ui/formato';
import { normalizar } from '@/lib/ui/navegacion';

export type TipoColumna =
  | 'texto'
  | 'gs'
  | 'numero'
  | 'cantidad'
  | 'pct'
  | 'fecha'
  | 'fechaHora'
  | 'estado'
  | 'estadoSifen'
  | 'bool'
  | 'factura'
  | 'mono';

/** Definición serializable de columna (se puede pasar desde Server Components). */
export type ColumnaDef = {
  clave: string;
  titulo: string;
  tipo?: TipoColumna;
  /** Rutas alternativas a probar si `clave` está vacía. */
  alternativas?: string[];
  /** Para tipo `factura`: prefijo de claves establecimiento/punto/numero (por defecto sin prefijo). */
  ancho?: string;
  /** Sumar en el pie (por defecto true para `gs`). */
  sumar?: boolean;
};

export function valorCelda(fila: Fila, c: ColumnaDef): unknown {
  if (c.tipo === 'factura') {
    const ya = leer(fila, 'numero_factura') ?? leer(fila, 'numero_formateado');
    if (ya) return ya;
    return formatoNumeroFactura(leer(fila, 'establecimiento'), leer(fila, 'punto_expedicion'), leer(fila, c.clave));
  }
  let v = leer(fila, c.clave);
  if ((v === undefined || v === null || v === '') && c.alternativas) {
    for (const a of c.alternativas) {
      v = leer(fila, a);
      if (v !== undefined && v !== null && v !== '') break;
    }
  }
  return v;
}

export function formatearCelda(v: unknown, tipo: TipoColumna = 'texto'): string {
  switch (tipo) {
    case 'gs':
      return formatoGs(v);
    case 'numero':
    case 'cantidad':
      return formatoCantidad(v);
    case 'pct':
      return formatoPct(v);
    case 'fecha':
      return formatoFecha(v);
    case 'fechaHora':
      return formatoFechaHora(v);
    case 'estado':
    case 'estadoSifen':
      return etiquetaEstado(v);
    case 'bool':
      return v === true || v === 'true' ? 'Sí' : v === false || v === 'false' ? 'No' : '';
    default:
      return texto(v);
  }
}

const esNumerica = (t?: TipoColumna) => t === 'gs' || t === 'numero' || t === 'cantidad' || t === 'pct';

function renderCelda(fila: Fila, c: ColumnaDef): ReactNode {
  const v = valorCelda(fila, c);
  if (c.tipo === 'estado') return <BadgeEstado estado={v} />;
  if (c.tipo === 'estadoSifen') return <BadgeEstado estado={v} sifen />;
  if (c.tipo === 'mono') return <span className="font-mono text-[12px]">{texto(v)}</span>;
  return formatearCelda(v, c.tipo);
}

/** CSV nativo (separador ;, BOM UTF-8 para Excel). */
export function descargarCsv(nombre: string, columnas: ColumnaDef[], filas: Fila[]) {
  const esc = (s: string) => (/[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const cab = columnas.map((c) => esc(c.titulo)).join(';');
  const cuerpo = filas.map((f) =>
    columnas
      .map((c) => {
        const v = valorCelda(f, c);
        if (esNumerica(c.tipo)) return v === null || v === undefined ? '' : String(v).replace('.', ',');
        return esc(formatearCelda(v, c.tipo));
      })
      .join(';'),
  );
  const blob = new Blob(['﻿' + [cab, ...cuerpo].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre.endsWith('.csv') ? nombre : `${nombre}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataTable({
  columnas,
  filas,
  enlace,
  buscar = true,
  exportar,
  totales = false,
  vacio = 'Sin registros.',
  seleccion,
  onSeleccion,
  claveFila = 'id',
  acciones,
  alturaMax,
  onClicFila,
}: {
  columnas: ColumnaDef[];
  filas: Fila[];
  /** Plantilla de enlace por fila, ej. "/ventas/facturas/{id}". */
  enlace?: string;
  buscar?: boolean;
  /** Nombre de archivo para exportar CSV (si se indica muestra el botón). */
  exportar?: string;
  totales?: boolean;
  vacio?: string;
  seleccion?: string[];
  onSeleccion?: (ids: string[]) => void;
  claveFila?: string;
  /** Contenido extra en la barra (botones). */
  acciones?: ReactNode;
  alturaMax?: string;
  /** Alternativa a `enlace`: acción al hacer clic en la primera celda (p. ej. abrir modal). */
  onClicFila?: (f: Fila) => void;
}) {
  const [q, setQ] = useState('');
  const [orden, setOrden] = useState<{ clave: string; asc: boolean } | null>(null);
  const [compacto, setCompacto] = useState(true);

  const visibles = useMemo(() => {
    let r = filas;
    if (q.trim()) {
      const nq = normalizar(q.trim());
      r = r.filter((f) => columnas.some((c) => normalizar(formatearCelda(valorCelda(f, c), c.tipo)).includes(nq)));
    }
    if (orden) {
      const c = columnas.find((x) => x.clave === orden.clave);
      if (c) {
        const numerica = esNumerica(c.tipo);
        r = [...r].sort((a, b) => {
          const va = valorCelda(a, c);
          const vb = valorCelda(b, c);
          const cmp = numerica ? num(va) - num(vb) : texto(va).localeCompare(texto(vb), 'es', { numeric: true });
          return orden.asc ? cmp : -cmp;
        });
      }
    }
    return r;
  }, [filas, q, orden, columnas]);

  const sumas = useMemo(() => {
    if (!totales) return null;
    const s: Record<string, number> = {};
    for (const c of columnas) {
      if (c.sumar ?? c.tipo === 'gs') s[c.clave] = visibles.reduce((acc, f) => acc + num(valorCelda(f, c)), 0);
    }
    return s;
  }, [totales, columnas, visibles]);

  const idDe = (f: Fila, i: number) => texto(leer(f, claveFila)) || String(i);
  const sel = new Set(seleccion ?? []);
  const toggle = (id: string) => {
    if (!onSeleccion) return;
    const n = new Set(sel);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onSeleccion([...n]);
  };
  const celda = compacto ? 'px-2 py-1' : 'px-3 py-2';

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {buscar || exportar || acciones ? (
        <div className="no-imprimir flex flex-wrap items-center gap-2">
          {buscar ? (
            <div className="relative w-full max-w-xs">
              <Icono nombre="buscar" className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-tenue" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar en la tabla…"
                aria-label="Buscar en la tabla"
                className="h-7 w-full rounded border border-borde bg-panel pl-7 pr-2 text-[12px] focus:border-foco focus:outline-none"
              />
            </div>
          ) : null}
          <span className="text-[11px] text-tenue tabular-nums">
            {visibles.length} de {filas.length}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {acciones}
            <button
              type="button"
              onClick={() => setCompacto((c) => !c)}
              className="inline-flex h-7 items-center gap-1 rounded border border-borde bg-panel px-2 text-[12px] hover:bg-panel-2"
              aria-pressed={compacto}
              title="Densidad compacta"
            >
              <Icono nombre="densidad" className="size-3.5" /> {compacto ? 'Compacta' : 'Normal'}
            </button>
            {exportar ? (
              <button
                type="button"
                onClick={() => descargarCsv(exportar, columnas, visibles)}
                className="inline-flex h-7 items-center gap-1 rounded border border-borde bg-panel px-2 text-[12px] hover:bg-panel-2"
              >
                <Icono nombre="descargar" className="size-3.5" /> CSV
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="overflow-auto rounded border border-borde bg-panel" style={alturaMax ? { maxHeight: alturaMax } : undefined}>
        <table className="w-full border-collapse text-[12.5px]">
          <thead className="sticky top-0 z-10 bg-panel-2">
            <tr>
              {onSeleccion ? (
                <th className={`${celda} w-8 border-b border-borde`}>
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todo"
                    checked={visibles.length > 0 && visibles.every((f, i) => sel.has(idDe(f, i)))}
                    onChange={(e) => onSeleccion(e.target.checked ? visibles.map(idDe) : [])}
                    className="accent-primario"
                  />
                </th>
              ) : null}
              {columnas.map((c) => {
                const activo = orden?.clave === c.clave;
                return (
                  <th
                    key={c.clave + c.titulo}
                    scope="col"
                    style={c.ancho ? { width: c.ancho } : undefined}
                    aria-sort={activo ? (orden!.asc ? 'ascending' : 'descending') : 'none'}
                    className={`${celda} border-b border-borde text-[11px] font-semibold uppercase tracking-wide text-tenue ${esNumerica(c.tipo) ? 'text-right' : 'text-left'}`}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-texto"
                      onClick={() => setOrden(activo ? { clave: c.clave, asc: !orden!.asc } : { clave: c.clave, asc: true })}
                    >
                      {c.titulo}
                      <span aria-hidden className="text-[9px]">
                        {activo ? (orden!.asc ? '▲' : '▼') : ''}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={columnas.length + (onSeleccion ? 1 : 0)} className="px-3 py-6 text-center text-tenue">
                  {vacio}
                </td>
              </tr>
            ) : (
              visibles.map((f, i) => {
                const id = idDe(f, i);
                const href = enlace ? interpolar(enlace, f) : undefined;
                return (
                  <tr key={id} className="border-b border-borde/60 last:border-0 hover:bg-acento/40">
                    {onSeleccion ? (
                      <td className={celda}>
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar fila ${i + 1}`}
                          checked={sel.has(id)}
                          onChange={() => toggle(id)}
                          className="accent-primario"
                        />
                      </td>
                    ) : null}
                    {columnas.map((c, ci) => (
                      <td
                        key={c.clave + c.titulo}
                        className={`${celda} ${esNumerica(c.tipo) ? 'text-right tabular-nums' : ''} ${c.tipo === 'factura' ? 'font-mono text-[12px]' : ''}`}
                      >
                        {href && ci === 0 ? (
                          <Link href={href} className="font-medium text-primario hover:underline">
                            {renderCelda(f, c) || '—'}
                          </Link>
                        ) : onClicFila && ci === 0 ? (
                          <button type="button" onClick={() => onClicFila(f)} className="text-left font-medium text-primario hover:underline">
                            {renderCelda(f, c) || '—'}
                          </button>
                        ) : (
                          renderCelda(f, c)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
          {sumas && visibles.length > 0 ? (
            <tfoot className="sticky bottom-0 bg-panel-2 font-semibold">
              <tr>
                {onSeleccion ? <td /> : null}
                {columnas.map((c, i) => (
                  <td key={c.clave + c.titulo} className={`${celda} border-t border-borde ${esNumerica(c.tipo) ? 'text-right tabular-nums' : ''}`}>
                    {c.clave in sumas ? formatearCelda(sumas[c.clave], c.tipo) : i === 0 ? 'Totales' : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
