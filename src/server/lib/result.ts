/**
 * Resultado uniforme de Server Actions. Archivo puro (sin dependencias de servidor):
 * el frontend puede importar los tipos y los helpers.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export const fail = (error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> => ({
  ok: false,
  error,
  ...(fieldErrors ? { fieldErrors } : {}),
});

/** Error de regla de negocio: su mensaje se muestra tal cual al usuario. */
export class ErrorNegocio extends Error {
  readonly fieldErrors?: Record<string, string[]>;
  constructor(mensaje: string, fieldErrors?: Record<string, string[]>) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.fieldErrors = fieldErrors;
  }
}

/** Lanza ErrorNegocio si la condición es falsa. */
export function asegurar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new ErrorNegocio(mensaje);
}
