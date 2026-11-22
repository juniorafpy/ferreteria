'use client';

import { createContext, useContext, type ReactNode } from 'react';

/** Subconjunto serializable de la sesión disponible para Client Components. */
export type SesionUI = {
  usuarioId: number;
  login: string;
  nombre: string;
  empresaId: number;
  sucursalId: number;
  permisos: string[];
  descuentoManualMaxPct: number;
};

const Ctx = createContext<SesionUI | null>(null);

export function SesionProvider({ sesion, children }: { sesion: SesionUI; children: ReactNode }) {
  return <Ctx.Provider value={sesion}>{children}</Ctx.Provider>;
}

export function useSesion(): SesionUI | null {
  return useContext(Ctx);
}

/** true si la sesión tiene el permiso (o el comodín "*"). Solo para UI: el backend revalida. */
export function useTienePermiso(codigo: string): boolean {
  const s = useContext(Ctx);
  if (!s) return false;
  return s.permisos.includes('*') || s.permisos.includes(codigo);
}
