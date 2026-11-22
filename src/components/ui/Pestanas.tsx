'use client';

import { useId, useRef, type ReactNode } from 'react';

/** Pestañas accesibles (flechas izquierda/derecha cambian de pestaña). */
export function Pestanas({
  pestanas,
  activa,
  onCambiar,
  children,
}: {
  pestanas: { id: string; titulo: string }[];
  activa: string;
  onCambiar: (id: string) => void;
  children: ReactNode;
}) {
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div>
      <div role="tablist" className="no-imprimir mb-3 flex gap-0.5 overflow-x-auto border-b border-borde">
        {pestanas.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${base}-${p.id}`}
            aria-selected={p.id === activa}
            aria-controls={`${base}-panel`}
            tabIndex={p.id === activa ? 0 : -1}
            onClick={() => onCambiar(p.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + pestanas.length) % pestanas.length;
              onCambiar(pestanas[n].id);
              refs.current[n]?.focus();
            }}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-1.5 text-[12.5px] ${
              p.id === activa ? 'border-primario font-semibold text-primario' : 'border-transparent text-tenue hover:text-texto'
            }`}
          >
            {p.titulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-${activa}`}>
        {children}
      </div>
    </div>
  );
}
