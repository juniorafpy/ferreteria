import {
  boolean,
  char,
  integer,
  pgTable,
  smallint,
  unique,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_comunes';
import { estadoRegistroEnum } from './enums';
import { empresas } from './organizacion';

/* Catálogos GLOBALES (sin empresa_id): tipos_persona, tipos_documento, paises,
 * departamentos, ciudades, actividades_economicas, unidades_medida.
 * Catálogos POR EMPRESA (con empresa_id): marcas, modelos, categorias_articulo. */

export const tiposPersona = pgTable('tipos_persona', {
  id: pk(),
  codigo: varchar('codigo', { length: 2 }).notNull().unique('tipos_persona_codigo_uq'),
  nombre: varchar('nombre', { length: 60 }).notNull(),
  ...timestamps(),
});

export const tiposDocumento = pgTable('tipos_documento', {
  id: pk(),
  codigo: varchar('codigo', { length: 10 }).notNull().unique('tipos_documento_codigo_uq'),
  nombre: varchar('nombre', { length: 80 }).notNull(),
  /** Código SIFEN iTipIDRec (null para RUC, que va en dRucRec). */
  codigo_sifen: smallint('codigo_sifen'),
  requiere_dv: boolean('requiere_dv').notNull().default(false),
  ...timestamps(),
});

export const paises = pgTable('paises', {
  id: pk(),
  codigo_iso: char('codigo_iso', { length: 3 }).notNull().unique('paises_codigo_iso_uq'),
  nombre: varchar('nombre', { length: 80 }).notNull(),
  nacionalidad: varchar('nacionalidad', { length: 80 }),
  ...timestamps(),
});

export const departamentos = pgTable(
  'departamentos',
  {
    id: pk(),
    pais_id: integer('pais_id')
      .notNull()
      .references(() => paises.id),
    /** Código SIFEN (cDepEmi / cDepRec). */
    codigo: smallint('codigo').notNull(),
    nombre: varchar('nombre', { length: 80 }).notNull(),
    ...timestamps(),
  },
  (t) => [unique('departamentos_pais_codigo_uq').on(t.pais_id, t.codigo)],
);

export const ciudades = pgTable(
  'ciudades',
  {
    id: pk(),
    departamento_id: integer('departamento_id')
      .notNull()
      .references(() => departamentos.id),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    /** Código SIFEN de ciudad (cCiuEmi / cCiuRec). Completar con la tabla oficial SET. */
    codigo_sifen: integer('codigo_sifen'),
    ...timestamps(),
  },
  (t) => [unique('ciudades_depto_nombre_uq').on(t.departamento_id, t.nombre)],
);

export const actividadesEconomicas = pgTable('actividades_economicas', {
  id: pk(),
  codigo: varchar('codigo', { length: 10 }).notNull().unique('actividades_economicas_codigo_uq'),
  descripcion: varchar('descripcion', { length: 255 }).notNull(),
  ...timestamps(),
});

export const unidadesMedida = pgTable('unidades_medida', {
  id: pk(),
  codigo: varchar('codigo', { length: 10 }).notNull().unique('unidades_medida_codigo_uq'),
  nombre: varchar('nombre', { length: 60 }).notNull(),
  /** Código SIFEN cUniMed (completar con la tabla oficial SET). */
  codigo_sifen: smallint('codigo_sifen'),
  permite_decimales: boolean('permite_decimales').notNull().default(false),
  ...timestamps(),
});

export const marcas = pgTable(
  'marcas',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [unique('marcas_empresa_nombre_uq').on(t.empresa_id, t.nombre)],
);

export const modelos = pgTable(
  'modelos',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    marca_id: integer('marca_id')
      .notNull()
      .references(() => marcas.id),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [unique('modelos_marca_nombre_uq').on(t.marca_id, t.nombre)],
);

export const categoriasArticulo = pgTable(
  'categorias_articulo',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    codigo: varchar('codigo', { length: 20 }).notNull(),
    nombre: varchar('nombre', { length: 120 }).notNull(),
    padre_id: integer('padre_id').references((): AnyPgColumn => categoriasArticulo.id),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [unique('categorias_articulo_empresa_codigo_uq').on(t.empresa_id, t.codigo)],
);

export type TipoPersona = typeof tiposPersona.$inferSelect;
export type NuevoTipoPersona = typeof tiposPersona.$inferInsert;
export type TipoDocumento = typeof tiposDocumento.$inferSelect;
export type NuevoTipoDocumento = typeof tiposDocumento.$inferInsert;
export type Pais = typeof paises.$inferSelect;
export type NuevoPais = typeof paises.$inferInsert;
export type Departamento = typeof departamentos.$inferSelect;
export type NuevoDepartamento = typeof departamentos.$inferInsert;
export type Ciudad = typeof ciudades.$inferSelect;
export type NuevaCiudad = typeof ciudades.$inferInsert;
export type ActividadEconomica = typeof actividadesEconomicas.$inferSelect;
export type NuevaActividadEconomica = typeof actividadesEconomicas.$inferInsert;
export type UnidadMedida = typeof unidadesMedida.$inferSelect;
export type NuevaUnidadMedida = typeof unidadesMedida.$inferInsert;
export type Marca = typeof marcas.$inferSelect;
export type NuevaMarca = typeof marcas.$inferInsert;
export type Modelo = typeof modelos.$inferSelect;
export type NuevoModelo = typeof modelos.$inferInsert;
export type CategoriaArticulo = typeof categoriasArticulo.$inferSelect;
export type NuevaCategoriaArticulo = typeof categoriasArticulo.$inferInsert;
