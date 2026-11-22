import { comoRegistro, type Fila } from '@/lib/ui/datos';

export type ParamsBusqueda = Record<string, string | string[] | undefined>;
export type PropsLista = { searchParams: Promise<ParamsBusqueda> };
export type PropsFicha = { params: Promise<{ id: string }>; searchParams: Promise<ParamsBusqueda> };

/** Resuelve el id de la ruta: null si es "nuevo". */
export function idRuta(id: string): number | null {
  if (id === 'nuevo') return null;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Carga un registro por id (o null si es nuevo / falla). */
export async function cargarFicha(id: number | null, fn: (id: number) => Promise<unknown>): Promise<Fila | null> {
  if (!id) return null;
  try {
    return comoRegistro(await fn(id));
  } catch (e) {
    console.error('[ficha]', e);
    return null;
  }
}
