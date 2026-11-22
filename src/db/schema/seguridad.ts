import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { marcaTiempo, pk, porcentaje, timestamps } from './_comunes';
import { estadoRegistroEnum } from './enums';
import { empresas, sucursales } from './organizacion';

export const usuarios = pgTable(
  'usuarios',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    /** Login (único global, en minúsculas). */
    usuario: varchar('usuario', { length: 60 }).notNull(),
    nombre: varchar('nombre', { length: 150 }).notNull(),
    email: varchar('email', { length: 150 }),
    /** Formato: scrypt$<N>$<r>$<p>$<saltHex>$<hashHex> (ver src/db/utils/password.ts). */
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    sucursal_predeterminada_id: integer('sucursal_predeterminada_id').references(() => sucursales.id),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ultimo_acceso_en: marcaTiempo('ultimo_acceso_en'),
    ...timestamps(),
  },
  (t) => [
    unique('usuarios_usuario_uq').on(t.usuario),
    check('usuarios_usuario_minus', sql`${t.usuario} = lower(${t.usuario})`),
  ],
);

export const roles = pgTable(
  'roles',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    codigo: varchar('codigo', { length: 30 }).notNull(),
    nombre: varchar('nombre', { length: 80 }).notNull(),
    descripcion: varchar('descripcion', { length: 255 }),
    /** Tope de descuento manual por línea (%). Requiere además el permiso ventas.descuento_manual. */
    descuento_manual_max_pct: porcentaje('descuento_manual_max_pct'),
    es_sistema: boolean('es_sistema').notNull().default(false),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('roles_empresa_codigo_uq').on(t.empresa_id, t.codigo),
    check(
      'roles_descuento_rango',
      sql`${t.descuento_manual_max_pct} >= 0 AND ${t.descuento_manual_max_pct} <= 100`,
    ),
  ],
);

/** Catálogo global de permisos. Código estilo modulo.recurso.accion. */
export const permisos = pgTable('permisos', {
  id: pk(),
  codigo: varchar('codigo', { length: 80 }).notNull().unique('permisos_codigo_uq'),
  modulo: varchar('modulo', { length: 40 }).notNull(),
  descripcion: varchar('descripcion', { length: 255 }).notNull(),
  ...timestamps(),
});

export const rolPermisos = pgTable(
  'rol_permisos',
  {
    rol_id: integer('rol_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permiso_id: integer('permiso_id')
      .notNull()
      .references(() => permisos.id, { onDelete: 'cascade' }),
    creado_en: marcaTiempo('creado_en').notNull().defaultNow(),
  },
  (t) => [primaryKey({ name: 'rol_permisos_pk', columns: [t.rol_id, t.permiso_id] })],
);

/** Asignación de rol a usuario. sucursal_id NULL = el rol aplica en todas las sucursales. */
export const usuarioRoles = pgTable(
  'usuario_roles',
  {
    id: pk(),
    usuario_id: integer('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    rol_id: integer('rol_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    sucursal_id: integer('sucursal_id').references(() => sucursales.id),
    creado_en: marcaTiempo('creado_en').notNull().defaultNow(),
  },
  (t) => [
    unique('usuario_roles_uq').on(t.usuario_id, t.rol_id, t.sucursal_id).nullsNotDistinct(),
  ],
);

export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
export type Rol = typeof roles.$inferSelect;
export type NuevoRol = typeof roles.$inferInsert;
export type Permiso = typeof permisos.$inferSelect;
export type NuevoPermiso = typeof permisos.$inferInsert;
export type RolPermiso = typeof rolPermisos.$inferSelect;
export type NuevoRolPermiso = typeof rolPermisos.$inferInsert;
export type UsuarioRol = typeof usuarioRoles.$inferSelect;
export type NuevoUsuarioRol = typeof usuarioRoles.$inferInsert;
