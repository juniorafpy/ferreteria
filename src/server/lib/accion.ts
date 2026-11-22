import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { ErrorNegocio, fail, ok, type ActionResult } from './result';

/** Mensaje legible para errores de PostgreSQL (unique/check/fk/append-only). */
export function mensajeErrorDb(e: unknown): string | null {
  const err = e as { code?: string; constraint?: string; constraint_name?: string; message?: string; cause?: unknown };
  const pg = (err?.cause as typeof err) ?? err;
  const code = pg?.code;
  const constraint = pg?.constraint ?? pg?.constraint_name ?? '';
  if (code === '23505') return `Ya existe un registro con esos datos (${constraint || 'clave única'})`;
  if (code === '23514') return `Datos inválidos: restricción ${constraint || 'de integridad'} (${pg?.message ?? ''})`;
  if (code === '23503') return `Referencia inválida (${constraint || 'clave foránea'})`;
  if (code === '23001' || code === '23000') return pg?.message ?? 'Operación no permitida';
  if (code === '40001' || code === '40P01') return 'Conflicto de concurrencia, reintente la operación';
  return null;
}

export function erroresZod(e: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of e.issues) {
    const k = issue.path.map(String).join('.') || '_';
    (out[k] ??= []).push(issue.message);
  }
  return out;
}

/** Convierte cualquier error en ActionResult fallido (relanza redirect/notFound de Next). */
export function aResultado(e: unknown): ActionResult<never> {
  unstable_rethrow(e);
  if (e instanceof ErrorNegocio) return fail(e.message, e.fieldErrors);
  if (e instanceof z.ZodError) return fail('Datos inválidos', erroresZod(e));
  const msgDb = mensajeErrorDb(e);
  if (msgDb) return fail(msgDb);
  console.error('[accion] error no controlado', e);
  return fail('Error interno del servidor');
}

/** Ejecuta el cuerpo de una Server Action y lo envuelve en ActionResult. */
export async function accion<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    return aResultado(e);
  }
}

/** parse que lanza ZodError (capturado por `accion`). */
export const validar = <S extends z.ZodType>(schema: S, datos: unknown): z.infer<S> => schema.parse(datos);
