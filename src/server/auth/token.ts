import { createHmac, timingSafeEqual } from 'node:crypto';

/** Nombre de la cookie de sesión (también la usa src/middleware.ts). */
export const COOKIE_SESION = 'ferre_sesion';
/** Duración de la sesión: 12 h. */
export const DURACION_SESION_S = 12 * 60 * 60;

export type PayloadSesion = {
  /** usuario_id */
  u: number;
  /** empresa_id */
  e: number;
  /** sucursal_id */
  s: number;
  /** expiración (epoch segundos) */
  exp: number;
};

export function secretoSesion(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET no definida (mínimo 16 caracteres)');
  }
  return 'dev-solo-desarrollo-secreto-inseguro';
}

const b64url = (buf: Buffer) => buf.toString('base64url');

export function firmarSesion(p: Omit<PayloadSesion, 'exp'>, duracionS = DURACION_SESION_S): string {
  const payload: PayloadSesion = { ...p, exp: Math.floor(Date.now() / 1000) + duracionS };
  const cuerpo = b64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const firma = b64url(createHmac('sha256', secretoSesion()).update(cuerpo).digest());
  return `${cuerpo}.${firma}`;
}

export function verificarSesion(token: string | undefined | null): PayloadSesion | null {
  if (!token) return null;
  const [cuerpo, firma] = token.split('.');
  if (!cuerpo || !firma) return null;
  const esperada = createHmac('sha256', secretoSesion()).update(cuerpo).digest();
  const recibida = Buffer.from(firma, 'base64url');
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try {
    const p = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8')) as PayloadSesion;
    if (!Number.isInteger(p.u) || !Number.isInteger(p.e) || !Number.isInteger(p.s)) return null;
    if (typeof p.exp !== 'number' || p.exp * 1000 < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}
