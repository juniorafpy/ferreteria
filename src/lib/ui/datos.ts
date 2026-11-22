/* Utilidades de datos tolerantes a la forma devuelta por el backend
 * (snake_case de Drizzle o camelCase de DTOs, arrays u objetos envoltorio). */

export type Fila = Record<string, unknown>;

/** Resultado estructural compatible con ActionResult<T> del backend. */
export type ResultadoAccion =
  | { ok: true; data?: unknown }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/** Acción de servidor genérica que la UI puede invocar. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AccionUI = (...args: any[]) => Promise<ResultadoAccion>;

/** Acción de servidor de solo lectura (devuelve datos sin envoltorio). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConsultaUI = (...args: any[]) => Promise<unknown>;

export type Opcion = { valor: string; etiqueta: string };

export const aCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
export const aSnake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

function leerUno(obj: unknown, k: string): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') return undefined;
  const o = obj as Fila;
  if (k in o) return o[k];
  const c = aCamel(k);
  if (c in o) return o[c];
  const s = aSnake(k);
  if (s in o) return o[s];
  return undefined;
}

/** Lee una ruta con puntos ("persona.razon_social") probando snake_case y camelCase. */
export function leer(obj: unknown, ruta: string): unknown {
  let actual: unknown = obj;
  for (const parte of ruta.split('.')) {
    actual = leerUno(actual, parte);
    if (actual === undefined) return undefined;
  }
  return actual;
}

/** Primer valor no vacío entre varias rutas. */
export function leerPrimero(obj: unknown, ...rutas: string[]): unknown {
  for (const r of rutas) {
    const v = leer(obj, r);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

export function texto(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

export function num(v: unknown, def = 0): number {
  if (v === null || v === undefined || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function numONulo(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Normaliza un listado: array directo o { filas | items | data | rows }. */
export function comoFilas(x: unknown): Fila[] {
  if (Array.isArray(x)) return x as Fila[];
  if (x && typeof x === 'object') {
    for (const k of ['filas', 'items', 'data', 'rows', 'resultados']) {
      const v = (x as Fila)[k];
      if (Array.isArray(v)) return v as Fila[];
    }
  }
  return [];
}

export function comoRegistro(x: unknown): Fila | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const o = x as Fila;
  if ('ok' in o && 'data' in o && o.data && typeof o.data === 'object') return o.data as Fila;
  return o;
}

/** Convierte filas a opciones de select. */
export function opciones(filas: unknown, etiqueta: string | ((f: Fila) => string) = 'nombre', valor = 'id'): Opcion[] {
  return comoFilas(filas).map((f) => ({
    valor: texto(leer(f, valor)),
    etiqueta: typeof etiqueta === 'function' ? etiqueta(f) : texto(leerPrimero(f, etiqueta, 'nombre', 'descripcion', 'codigo')),
  }));
}

/** Nombre a mostrar para persona/cliente/proveedor/artículo. */
export function etiquetaEntidad(f: unknown): string {
  const nombre = texto(
    leerPrimero(
      f,
      'razon_social',
      'persona.razon_social',
      'nombre',
      'descripcion',
      'persona_razon_social',
      'cliente_razon_social',
      'proveedor_razon_social',
    ),
  );
  const doc = texto(leerPrimero(f, 'numero_documento', 'persona.numero_documento', 'ruc', 'codigo'));
  const dv = texto(leerPrimero(f, 'dv', 'persona.dv'));
  const docTxt = doc ? (dv ? `${doc}-${dv}` : doc) : '';
  return docTxt ? `${nombre} · ${docTxt}` : nombre;
}

/** Interpola "{campo}" de una plantilla con los valores de una fila. */
export function interpolar(plantilla: string, fila: Fila): string {
  return plantilla.replace(/\{([\w.]+)\}/g, (_, k: string) => encodeURIComponent(texto(leer(fila, k))));
}

/** Mapea fieldErrors (snake o camel) a un dict por clave camelCase. */
export function erroresPorCampo(r: ResultadoAccion | null): Record<string, string> {
  if (!r || r.ok || !r.fieldErrors) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(r.fieldErrors)) {
    if (v && v.length) out[aCamel(k)] = v.join(' ');
  }
  return out;
}

/** Extrae el id del data devuelto por una acción ({ id } o número). */
export function idDeResultado(r: ResultadoAccion): number | null {
  if (!r.ok) return null;
  const d = r.data;
  if (typeof d === 'number') return d;
  return numONulo(leer(d, 'id'));
}

export function primerParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Filtros genéricos desde searchParams (strings no vacíos; ids numéricos convertidos). */
export function filtrosDesdeParams(sp: Record<string, string | string[] | undefined>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(sp)) {
    const s = primerParam(v);
    if (s === undefined || s === '') continue;
    out[k] = /Id$/.test(k) && /^\d+$/.test(s) ? Number(s) : s;
  }
  return out;
}

export type FiltroListaUI = {
  q?: string;
  desde?: string;
  hasta?: string;
  estado?: string;
  proveedorId?: number;
  clienteId?: number;
};

/** Filtro tipado de listados (compatible con FiltroListado del backend). */
export function filtroLista(sp: Record<string, string | string[] | undefined>): FiltroListaUI {
  const f: FiltroListaUI = {};
  const s = (k: string) => {
    const v = primerParam(sp[k]);
    return v && v.trim() ? v.trim() : undefined;
  };
  const n = (k: string) => {
    const v = s(k);
    return v && /^\d+$/.test(v) ? Number(v) : undefined;
  };
  if (s('q')) f.q = s('q');
  if (s('desde')) f.desde = s('desde');
  if (s('hasta')) f.hasta = s('hasta');
  if (s('estado')) f.estado = s('estado');
  if (n('proveedorId')) f.proveedorId = n('proveedorId');
  if (n('clienteId')) f.clienteId = n('clienteId');
  return f;
}

/** Valores string de searchParams (para inicializar filtros en cliente). */
export function valoresParams(sp: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const s = primerParam(v);
    if (s) out[k] = s;
  }
  return out;
}
