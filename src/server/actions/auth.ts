'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { borrarCookieSesion, escribirCookieSesion, requireSesion, type Sesion } from '../auth/session';
import { accion, validar } from '../lib/accion';
import { ErrorNegocio, type ActionResult } from '../lib/result';
import { autenticar, cargarSesion } from '../services/seguridad';
import { cambiarContextoInput, loginInput, type CambiarContextoInput, type LoginInput } from '../validation/auth';

/** Inicia sesión: valida credenciales y escribe la cookie firmada. Devuelve la sesión. */
export async function login(input: LoginInput): Promise<ActionResult<Sesion>> {
  return accion(async () => {
    const d = validar(loginInput, input);
    const s = await autenticar(db, d.usuario, d.password);
    await escribirCookieSesion(s.usuarioId, s.empresaId, s.sucursalId);
    return s;
  });
}

export async function logout(): Promise<ActionResult<null>> {
  return accion(async () => {
    await borrarCookieSesion();
    return null;
  });
}

/** Cambia empresa/sucursal activa (el usuario debe tener roles en esa sucursal). */
export async function cambiarContexto(input: CambiarContextoInput): Promise<ActionResult<Sesion>> {
  return accion(async () => {
    const actual = await requireSesion();
    const d = validar(cambiarContextoInput, input);
    const nueva = await cargarSesion(db, actual.usuarioId, d.empresaId, d.sucursalId);
    if (!nueva) throw new ErrorNegocio('No tiene acceso a esa empresa/sucursal');
    await escribirCookieSesion(nueva.usuarioId, nueva.empresaId, nueva.sucursalId);
    revalidatePath('/', 'layout');
    return nueva;
  });
}

/** Sesión actual (para Client Components). */
export async function obtenerSesion(): Promise<ActionResult<Sesion>> {
  return accion(async () => requireSesion());
}
