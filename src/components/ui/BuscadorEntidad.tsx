'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { guardarCliente, guardarProveedor } from '@/server/actions/definiciones';
import {
  buscarArticulosUI,
  buscarArticulosVentaUI,
  buscarClientesUI,
  buscarPersonasUI,
  buscarProveedoresUI,
} from '@/app/(dashboard)/_acciones/busqueda';
import { comoFilas, etiquetaEntidad, idDeResultado, leer, leerPrimero, num, texto, type Fila, type ResultadoAccion } from '@/lib/ui/datos';
import { formatoCantidad, formatoGs } from '@/lib/ui/formato';
import { AltaRapidaPersona } from './AltaRapidaPersona';
import { claseInput } from './Campos';
import { Icono } from './Icono';

export type TipoEntidad = 'persona' | 'cliente' | 'proveedor' | 'articulo' | 'articuloVenta';
export type ValorEntidad = { id: number; etiqueta: string } | null;

const BUSCADORES: Record<TipoEntidad, (q: string) => Promise<unknown>> = {
  persona: buscarPersonasUI,
  cliente: buscarClientesUI,
  proveedor: buscarProveedoresUI,
  articulo: buscarArticulosUI,
  articuloVenta: buscarArticulosVentaUI,
};

export function etiquetaArticulo(f: Fila): string {
  const cod = texto(leerPrimero(f, 'codigo', 'articulo.codigo'));
  const desc = texto(leerPrimero(f, 'descripcion', 'articulo.descripcion', 'nombre'));
  return cod ? `${cod} · ${desc}` : desc;
}

/** Combobox con teclado para Persona/Cliente/Proveedor/Artículo, con "+ crear" (alta rápida de Persona). */
export function BuscadorEntidad({
  tipo,
  valor,
  onCambiar,
  id,
  placeholder,
  autoFocus,
  deshabilitado,
  permitirCrear,
  textoInicial,
  invalido,
  compacto,
}: {
  tipo: TipoEntidad;
  valor: ValorEntidad;
  onCambiar: (item: Fila | null) => void;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
  deshabilitado?: boolean;
  permitirCrear?: boolean;
  textoInicial?: string;
  invalido?: boolean;
  compacto?: boolean;
}) {
  const esArticulo = tipo === 'articulo' || tipo === 'articuloVenta';
  const crear = permitirCrear ?? !esArticulo;
  const [q, setQ] = useState<string | null>(textoInicial ?? null);
  const [items, setItems] = useState<Fila[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [alta, setAlta] = useState(false);
  const listaId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (q === null) return;
    const term = q.trim();
    const n = ++seq.current;
    const t = setTimeout(async () => {
      setCargando(true);
      const r = comoFilas(await BUSCADORES[tipo](term));
      if (n === seq.current) {
        setItems(r.slice(0, 50));
        setActivo(0);
        setCargando(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q, tipo]);

  function seleccionar(f: Fila | null) {
    onCambiar(f);
    setQ(null);
    setAbierto(false);
  }

  async function alCrearPersona(p: Fila) {
    setAlta(false);
    if (tipo === 'persona') return seleccionar(p);
    const accion = tipo === 'cliente' ? guardarCliente : guardarProveedor;
    const r = (await accion({ personaId: num(leer(p, 'id')) } as never)) as ResultadoAccion;
    if (r.ok) {
      seleccionar({ ...p, persona_id: leer(p, 'id'), id: idDeResultado(r) ?? leer(p, 'id') });
    } else {
      alert(r.error);
    }
  }

  const mostrado = q ?? valor?.etiqueta ?? '';
  const etiqueta = (f: Fila) => (esArticulo ? etiquetaArticulo(f) : etiquetaEntidad(f));

  return (
    <div className="relative">
      <div className="flex gap-1">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={abierto}
            aria-controls={listaId}
            aria-autocomplete="list"
            aria-activedescendant={abierto && items[activo] ? `${listaId}-${activo}` : undefined}
            aria-invalid={invalido}
            autoFocus={autoFocus}
            disabled={deshabilitado}
            autoComplete="off"
            value={mostrado}
            placeholder={placeholder ?? (esArticulo ? 'Código, barras o descripción (F2)' : 'Buscar por nombre o documento…')}
            onChange={(e) => {
              setQ(e.target.value);
              setAbierto(true);
            }}
            onFocus={(e) => {
              e.target.select();
              if (q === null) setQ('');
              setAbierto(true);
            }}
            onBlur={() =>
              setTimeout(() => {
                setAbierto(false);
                setQ(null);
              }, 150)
            }
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setAbierto(true);
                setActivo((a) => Math.min(a + 1, Math.max(items.length - 1, 0)));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActivo((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter' && abierto) {
                e.preventDefault();
                e.stopPropagation();
                if (items[activo]) seleccionar(items[activo]);
              } else if (e.key === 'Escape' && abierto) {
                e.preventDefault();
                e.stopPropagation();
                setAbierto(false);
                setQ(null);
              } else if (e.key === 'Delete' && e.ctrlKey) {
                seleccionar(null);
              }
            }}
            className={`${claseInput} ${compacto ? 'h-7 border-transparent bg-transparent' : ''} pr-7`}
          />
          <Icono
            nombre="buscar"
            className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-tenue"
          />
        </div>
        {crear && !deshabilitado ? (
          <button
            type="button"
            onClick={() => setAlta(true)}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded border border-borde bg-panel px-2 text-[12px] text-primario hover:bg-panel-2"
            title="Crear persona sin salir del formulario"
          >
            <Icono nombre="mas" className="size-3.5" /> crear
          </button>
        ) : null}
      </div>

      {abierto ? (
        <ul
          id={listaId}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1 max-h-72 min-w-72 overflow-auto rounded border border-borde bg-panel py-1 shadow-xl"
        >
          {cargando && items.length === 0 ? <li className="px-3 py-2 text-[12px] text-tenue">Buscando…</li> : null}
          {!cargando && items.length === 0 ? (
            <li className="px-3 py-2 text-[12px] text-tenue">
              Sin resultados.{crear ? ' Use "+ crear" para dar de alta.' : ''}
            </li>
          ) : null}
          {items.map((f, i) => (
            <li
              key={texto(leer(f, 'id')) || i}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={i === activo}
              onMouseDown={(e) => {
                e.preventDefault();
                seleccionar(f);
              }}
              onMouseEnter={() => setActivo(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-[12.5px] ${i === activo ? 'bg-acento' : ''}`}
            >
              <span className="truncate">{etiqueta(f)}</span>
              {esArticulo ? (
                <span className="shrink-0 text-[11px] tabular-nums text-tenue">
                  {leer(f, 'precio_venta_gs') !== undefined ? formatoGs(leerPrimero(f, 'precio_venta_gs', 'precio_gs')) : ''}
                  {leerPrimero(f, 'stock', 'stock_disponible', 'existencia') !== undefined
                    ? ` · Stock ${formatoCantidad(leerPrimero(f, 'stock', 'stock_disponible', 'existencia'))}`
                    : ''}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {crear ? (
        <AltaRapidaPersona abierto={alta} onCerrar={() => setAlta(false)} onCreada={alCrearPersona} textoInicial={q ?? ''} />
      ) : null}
    </div>
  );
}
