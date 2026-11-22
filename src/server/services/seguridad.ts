import { and, eq, isNull, or } from 'drizzle-orm';
import type { DbLike } from '@/db';
import {
  empresas,
  permisos,
  roles,
  rolPermisos,
  sucursales,
  usuarioRoles,
  usuarios,
} from '@/db/schema';
import { verifyPassword } from '@/db/utils/password';
import { ErrorNegocio } from '../lib/result';

export type Sesion = {
  usuarioId: number;
  login: string;
  nombre: string;
  empresaId: number;
  sucursalId: number;
  permisos: string[];
  descuentoManualMaxPct: number;
  /** Extras (no exigidos por el contrato). */
  empresaNombre: string;
  sucursalNombre: string;
};

/**
 * Carga la sesión efectiva: permisos de los roles activos del usuario válidos en la sucursal
 * (usuario_roles.sucursal_id NULL o igual a la sucursal) y tope de descuento manual = máximo de esos roles.
 * Devuelve null si el usuario/sucursal no es válido o está inactivo.
 */
export async function cargarSesion(
  db: DbLike,
  usuarioId: number,
  empresaId: number,
  sucursalId: number,
): Promise<Sesion | null> {
  const [u] = await db
    .select({
      id: usuarios.id,
      login: usuarios.usuario,
      nombre: usuarios.nombre,
      empresa_id: usuarios.empresa_id,
      estado: usuarios.estado,
      empresaNombre: empresas.razon_social,
    })
    .from(usuarios)
    .innerJoin(empresas, eq(empresas.id, usuarios.empresa_id))
    .where(eq(usuarios.id, usuarioId));
  if (!u || u.estado !== 'activo' || u.empresa_id !== empresaId) return null;

  const [suc] = await db
    .select({ id: sucursales.id, nombre: sucursales.nombre, estado: sucursales.estado })
    .from(sucursales)
    .where(and(eq(sucursales.id, sucursalId), eq(sucursales.empresa_id, empresaId)));
  if (!suc || suc.estado !== 'activo') return null;

  const filtroRol = and(
    eq(usuarioRoles.usuario_id, usuarioId),
    or(isNull(usuarioRoles.sucursal_id), eq(usuarioRoles.sucursal_id, sucursalId)),
    eq(roles.estado, 'activo'),
  );
  const rolesUsuario = await db
    .select({ id: roles.id, max: roles.descuento_manual_max_pct })
    .from(usuarioRoles)
    .innerJoin(roles, eq(roles.id, usuarioRoles.rol_id))
    .where(filtroRol);
  if (rolesUsuario.length === 0) return null;

  const filasPermisos = await db
    .selectDistinct({ codigo: permisos.codigo })
    .from(usuarioRoles)
    .innerJoin(roles, eq(roles.id, usuarioRoles.rol_id))
    .innerJoin(rolPermisos, eq(rolPermisos.rol_id, roles.id))
    .innerJoin(permisos, eq(permisos.id, rolPermisos.permiso_id))
    .where(filtroRol);

  return {
    usuarioId: u.id,
    login: u.login,
    nombre: u.nombre,
    empresaId,
    sucursalId,
    permisos: filasPermisos.map((p) => p.codigo).sort(),
    descuentoManualMaxPct: Math.max(0, ...rolesUsuario.map((r) => Number(r.max))),
    empresaNombre: u.empresaNombre,
    sucursalNombre: suc.nombre,
  };
}

/** Valida credenciales y devuelve la sesión inicial (sucursal predeterminada o la primera habilitada). */
export async function autenticar(db: DbLike, login: string, password: string): Promise<Sesion> {
  const [u] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.usuario, login.trim().toLowerCase()));
  if (!u || u.estado !== 'activo' || !verifyPassword(password, u.password_hash)) {
    throw new ErrorNegocio('Usuario o contraseña incorrectos');
  }
  const candidatas = await sucursalesHabilitadas(db, u.id, u.empresa_id);
  if (candidatas.length === 0) throw new ErrorNegocio('El usuario no tiene roles asignados en ninguna sucursal');
  const sucursalId =
    u.sucursal_predeterminada_id && candidatas.some((s) => s.id === u.sucursal_predeterminada_id)
      ? u.sucursal_predeterminada_id
      : candidatas[0].id;
  const sesion = await cargarSesion(db, u.id, u.empresa_id, sucursalId);
  if (!sesion) throw new ErrorNegocio('No se pudo iniciar la sesión');
  await db.update(usuarios).set({ ultimo_acceso_en: new Date() }).where(eq(usuarios.id, u.id));
  return sesion;
}

/** Sucursales activas de la empresa en las que el usuario tiene al menos un rol. */
export async function sucursalesHabilitadas(db: DbLike, usuarioId: number, empresaId: number) {
  return db
    .selectDistinct({ id: sucursales.id, codigo: sucursales.codigo, nombre: sucursales.nombre })
    .from(sucursales)
    .innerJoin(
      usuarioRoles,
      and(
        eq(usuarioRoles.usuario_id, usuarioId),
        or(isNull(usuarioRoles.sucursal_id), eq(usuarioRoles.sucursal_id, sucursales.id)),
      ),
    )
    .where(and(eq(sucursales.empresa_id, empresaId), eq(sucursales.estado, 'activo')))
    .orderBy(sucursales.codigo);
}

