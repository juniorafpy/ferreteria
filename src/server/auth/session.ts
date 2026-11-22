import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/db';
import { cargarSesion, type Sesion } from '../services/seguridad';
import type { Ctx } from '../lib/contexto';
import { COOKIE_SESION, DURACION_SESION_S, firmarSesion, verificarSesion } from './token';

export type { Sesion } from '../services/seguridad';

/** Sesión del request actual (memoizada por request). Null si no hay cookie válida. */
export const getSesion = cache(async (): Promise<Sesion | null> => {
  const jar = await cookies();
  const payload = verificarSesion(jar.get(COOKIE_SESION)?.value);
  if (!payload) return null;
  return cargarSesion(db, payload.u, payload.e, payload.s);
});

/** Sesión obligatoria: redirige a /login si no existe. */
export async function requireSesion(): Promise<Sesion> {
  const s = await getSesion();
  if (!s) redirect('/login');
  return s;
}

/** Escribe la cookie httpOnly firmada (solo en Server Actions / Route Handlers). */
export async function escribirCookieSesion(usuarioId: number, empresaId: number, sucursalId: number) {
  const jar = await cookies();
  jar.set(COOKIE_SESION, firmarSesion({ u: usuarioId, e: empresaId, s: sucursalId }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACION_SESION_S,
  });
}

export async function borrarCookieSesion() {
  const jar = await cookies();
  jar.delete(COOKIE_SESION);
}

/** Contexto para los servicios de dominio. */
export const ctxDe = (s: Sesion): Ctx => ({
  usuarioId: s.usuarioId,
  empresaId: s.empresaId,
  sucursalId: s.sucursalId,
  permisos: s.permisos,
  descuentoManualMaxPct: s.descuentoManualMaxPct,
});
