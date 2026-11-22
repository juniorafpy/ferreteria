import { formatearCelda, type TipoColumna } from '@/lib/ui/celdas';

/** Formatea un total/extra por nombre de clave cuando no hay tipo explícito. */
export function formatearCeldaServidor(clave: string, v: unknown, tipo?: TipoColumna): string {
  const t: TipoColumna = tipo ?? (/gs$|Gs$|monto|total|saldo|debe|haber/i.test(clave) ? 'gs' : typeof v === 'number' ? 'numero' : 'texto');
  return formatearCelda(v, t);
}
