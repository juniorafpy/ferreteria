import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { cantidad, montoGs, montoGsNulo, pk, timestamps } from './_comunes';
import { estadoRegistroEnum, tipoIvaEnum } from './enums';
import { empresas, sucursales } from './organizacion';
import { categoriasArticulo, marcas, modelos, unidadesMedida } from './referenciales';

export const depositos = pgTable(
  'depositos',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    sucursal_id: integer('sucursal_id')
      .notNull()
      .references(() => sucursales.id),
    codigo: varchar('codigo', { length: 20 }).notNull(),
    nombre: varchar('nombre', { length: 120 }).notNull(),
    es_principal: boolean('es_principal').notNull().default(false),
    permite_venta: boolean('permite_venta').notNull().default(true),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('depositos_empresa_codigo_uq').on(t.empresa_id, t.codigo),
    // Un solo depósito principal por sucursal
    uniqueIndex('depositos_principal_uq')
      .on(t.sucursal_id)
      .where(sql`${t.es_principal} = true`),
  ],
);

export const articulos = pgTable(
  'articulos',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    codigo: varchar('codigo', { length: 30 }).notNull(),
    codigo_barras: varchar('codigo_barras', { length: 50 }),
    descripcion: varchar('descripcion', { length: 200 }).notNull(),
    descripcion_larga: text('descripcion_larga'),
    categoria_id: integer('categoria_id').references(() => categoriasArticulo.id),
    marca_id: integer('marca_id').references(() => marcas.id),
    modelo_id: integer('modelo_id').references(() => modelos.id),
    /** Unidad base de stock. */
    unidad_medida_id: integer('unidad_medida_id')
      .notNull()
      .references(() => unidadesMedida.id),
    tipo_iva: tipoIvaEnum('tipo_iva').notNull().default('iva10'),
    /** Precio de venta (IVA incluido) por unidad base. */
    precio_venta_gs: montoGs('precio_venta_gs'),
    /** Costo de referencia (sin IVA) para artículos sin stock aún. El costo real vive en stock. */
    costo_referencia_gs: montoGs('costo_referencia_gs'),
    controla_stock: boolean('controla_stock').notNull().default(true),
    permite_decimales: boolean('permite_decimales').notNull().default(false),
    stock_minimo: cantidad('stock_minimo'),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('articulos_empresa_codigo_uq').on(t.empresa_id, t.codigo),
    uniqueIndex('articulos_empresa_barras_uq')
      .on(t.empresa_id, t.codigo_barras)
      .where(sql`${t.codigo_barras} IS NOT NULL`),
    index('articulos_descripcion_idx').on(t.empresa_id, t.descripcion),
    index('articulos_categoria_idx').on(t.categoria_id),
    check('articulos_precio_no_neg', sql`${t.precio_venta_gs} >= 0 AND ${t.costo_referencia_gs} >= 0`),
  ],
);

/** Presentaciones alternativas (caja x100, rollo x100 m, etc.). */
export const articuloUnidades = pgTable(
  'articulo_unidades',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    articulo_id: integer('articulo_id')
      .notNull()
      .references(() => articulos.id, { onDelete: 'cascade' }),
    unidad_medida_id: integer('unidad_medida_id')
      .notNull()
      .references(() => unidadesMedida.id),
    /** Cuántas unidades base contiene esta presentación. */
    factor_conversion: numeric('factor_conversion', { precision: 14, scale: 3, mode: 'number' }).notNull(),
    codigo_barras: varchar('codigo_barras', { length: 50 }),
    /** Precio específico de la presentación (IVA incl.). Null = factor * precio base. */
    precio_venta_gs: montoGsNulo('precio_venta_gs'),
    es_predeterminada: boolean('es_predeterminada').notNull().default(false),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('articulo_unidades_uq').on(t.articulo_id, t.unidad_medida_id),
    uniqueIndex('articulo_unidades_barras_uq')
      .on(t.empresa_id, t.codigo_barras)
      .where(sql`${t.codigo_barras} IS NOT NULL`),
    check('articulo_unidades_factor_pos', sql`${t.factor_conversion} > 0`),
  ],
);

export type Deposito = typeof depositos.$inferSelect;
export type NuevoDeposito = typeof depositos.$inferInsert;
export type Articulo = typeof articulos.$inferSelect;
export type NuevoArticulo = typeof articulos.$inferInsert;
export type ArticuloUnidad = typeof articuloUnidades.$inferSelect;
export type NuevoArticuloUnidad = typeof articuloUnidades.$inferInsert;
