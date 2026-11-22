import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Hash de contraseñas con scrypt (node:crypto).
 * Formato almacenado en usuarios.password_hash:  scrypt$N$r$p$<saltHex>$<hashHex>
 */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('hex'), hash.toString('hex')].join('$');
}

export function verifyPassword(password: string, almacenado: string): boolean {
  const partes = almacenado.split('$');
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false;
  const [, n, r, p, saltHex, hashHex] = partes;
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = scryptSync(password, Buffer.from(saltHex, 'hex'), esperado.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
}
