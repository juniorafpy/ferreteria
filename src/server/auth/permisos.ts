import { ErrorNegocio } from '../lib/result';
import { requireSesion, type Sesion } from './session';

export const tienePermiso = (s: Pick<Sesion, 'permisos'>, codigo: string) => s.permisos.includes(codigo);

/** Exige sesión y permiso (cualquiera de los códigos si se pasa un arreglo). */
export async function requirePermiso(codigo: string | string[]): Promise<Sesion> {
  const s = await requireSesion();
  const codigos = Array.isArray(codigo) ? codigo : [codigo];
  if (!codigos.some((c) => s.permisos.includes(c))) {
    throw new ErrorNegocio(`No tiene permiso para esta operación (${codigos.join(' / ')})`);
  }
  return s;
}
