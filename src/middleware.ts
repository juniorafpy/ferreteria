import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge middleware: exige cookie de sesión válida (firma HMAC verificada con Web Crypto y
 * expiración). No accede a la BD; los permisos se validan en cada acción/consulta del servidor.
 */
const COOKIE_SESION = 'ferre_sesion';
const PUBLICAS = ['/login'];

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  return 'dev-solo-desarrollo-secreto-inseguro';
}

function desdeB64url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function tokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [cuerpo, firma] = token.split('.');
  if (!cuerpo || !firma) return false;
  try {
    const enc = new TextEncoder();
    const clave = await crypto.subtle.importKey('raw', enc.encode(secreto()), { name: 'HMAC', hash: 'SHA-256' }, false, [
      'verify',
    ]);
    const ok = await crypto.subtle.verify('HMAC', clave, desdeB64url(firma), enc.encode(cuerpo));
    if (!ok) return false;
    const payload = JSON.parse(new TextDecoder().decode(desdeB64url(cuerpo))) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const esPublica = PUBLICAS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const valida = await tokenValido(req.cookies.get(COOKIE_SESION)?.value);

  if (esPublica) {
    if (valida && pathname === '/login') return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }
  if (!valida) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const url = new URL('/login', req.url);
    if (pathname !== '/') url.searchParams.set('next', pathname);
    const res = NextResponse.redirect(url);
    if (req.cookies.get(COOKIE_SESION)) res.cookies.delete(COOKIE_SESION);
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt)$).*)'],
};
