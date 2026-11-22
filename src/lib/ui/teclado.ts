'use client';

import { useEffect, useRef } from 'react';

export type MapaAtajos = Partial<Record<string, (e: KeyboardEvent) => void>>;

/** Convierte un evento a una combinación normalizada: "ctrl+s", "alt+n", "f10", "escape". */
export function combinacion(e: KeyboardEvent): string {
  const partes: string[] = [];
  if (e.ctrlKey || e.metaKey) partes.push('ctrl');
  if (e.altKey) partes.push('alt');
  if (e.shiftKey) partes.push('shift');
  partes.push(e.key.toLowerCase());
  return partes.join('+');
}

/** Registra atajos globales de teclado mientras el componente está montado. */
export function useAtajos(mapa: MapaAtajos, activo = true) {
  const ref = useRef(mapa);
  ref.current = mapa;
  useEffect(() => {
    if (!activo) return;
    const h = (e: KeyboardEvent) => {
      const fn = ref.current[combinacion(e)];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [activo]);
}
