import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { auditoriaDocumento, montoGsNulo, pk } from './_comunes';
import { articulos } from './articulos';
import { estadoRegistroEnum, tipoDescuentoEnum } from './enums';
import { empresas, sucursales } from './organizacion';
import { usuarios } from './seguridad';

/**
 * Descuento automático. Resolución (backend): para sucursal S, artículo A, fecha F y cantidad Q:
 * descuentos activos con fecha_desde <= F <= fecha_hasta, (todas_sucursales OR S en descuento_sucursales),
 * A en descuento_articulos con cantidad_minima <= Q; se elige menor `prioridad` (1 = más alta),
 * desempate por mayor beneficio. No acumulable salvo `acumulable = true`.
 */
export const descuentos = pgTable(
  'descuentos',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    codigo: varchar('codigo', { length: 30 }).notNull(),
    nombre: varchar('nombre', { length: 120 }).notNull(),
    descripcion: text('descripcion'),
    tipo: tipoDescuentoEnum('tipo').notNull(),
    fecha_desde: date('fecha_desde', { mode: 'string' }).notNull(),
    fecha_hasta: date('fecha_hasta', { mode: 'string' }).notNull(),
    prioridad: smallint('prioridad').notNull().default(100),
    acumulable: boolean('acumulable').notNull().default(false),
    todas_sucursales: boolean('todas_sucursales').notNull().default(false),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...auditoriaDocumento(() => usuarios.id),
  },
  (t) => [
    unique('descuentos_empresa_codigo_uq').on(t.empresa_id, t.codigo),
    index('descuentos_vigencia_idx').on(t.empresa_id, t.estado, t.fecha_desde, t.fecha_hasta),
    check('descuentos_vigencia', sql`${t.fecha_hasta} >= ${t.fecha_desde}`),
    check('descuentos_prioridad_pos', sql`${t.prioridad} >= 1`),
  ],
);

export const descuentoSucursales = pgTable(
  'descuento_sucursales',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    descuento_id: integer('descuento_id')
      .notNull()
      .references(() => descuentos.id, { onDelete: 'cascade' }),
    sucursal_id: integer('sucursal_id')
      .notNull()
      .references(() => sucursales.id),
  },
  (t) => [
    unique('descuento_sucursales_uq').on(t.descuento_id, t.sucursal_id),
    index('descuento_sucursales_sucursal_idx').on(t.sucursal_id, t.descuento_id),
  ],
);

/** Valor por artículo: porcentaje (tipo porcentaje) o monto_gs por unidad (tipo monto). */
export const descuentoArticulos = pgTable(
  'descuento_articulos',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    descuento_id: integer('descuento_id')
      .notNull()
      .references(() => descuentos.id, { onDelete: 'cascade' }),
    articulo_id: integer('articulo_id')
      .notNull()
      .references(() => articulos.id),
    porcentaje: numeric('porcentaje', { precision: 5, scale: 2, mode: 'number' }),
    monto_gs: montoGsNulo('monto_gs'),
    cantidad_minima: numeric('cantidad_minima', { precision: 14, scale: 3, mode: 'number' })
      .notNull()
      .default(1),
    /** Tope de descuento por línea en Gs (null = sin tope). */
    tope_gs: montoGsNulo('tope_gs'),
  },
  (t) => [
    unique('descuento_articulos_uq').on(t.descuento_id, t.articulo_id),
    index('descuento_articulos_articulo_idx').on(t.articulo_id, t.descuento_id),
    check(
      'descuento_articulos_valor_unico',
      sql`(${t.porcentaje} IS NOT NULL) <> (${t.monto_gs} IS NOT NULL)`,
    ),
    check(
      'descuento_articulos_valor_rango',
      sql`(${t.porcentaje} IS NULL OR (${t.porcentaje} > 0 AND ${t.porcentaje} <= 100)) AND (${t.monto_gs} IS NULL OR ${t.monto_gs} > 0) AND (${t.tope_gs} IS NULL OR ${t.tope_gs} > 0) AND ${t.cantidad_minima} > 0`,
    ),
  ],
);

export type Descuento = typeof descuentos.$inferSelect;
export type NuevoDescuento = typeof descuentos.$inferInsert;
export type DescuentoSucursal = typeof descuentoSucursales.$inferSelect;
export type NuevoDescuentoSucursal = typeof descuentoSucursales.$inferInsert;
export type DescuentoArticulo = typeof descuentoArticulos.$inferSelect;
export type NuevoDescuentoArticulo = typeof descuentoArticulos.$inferInsert;
