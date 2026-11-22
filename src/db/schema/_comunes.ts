import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  integer,
  numeric,
  smallint,
  text,
  timestamp,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { origenDescuentoEnum, tipoIvaEnum } from './enums';

/* ---------------------------------------------------------------------------
 * Helpers de columnas. Cada helper devuelve builders NUEVOS (nunca reutilizar
 * la misma instancia entre tablas).
 * Convenciones:
 *  - PK: integer identity "id".
 *  - Dinero: bigint (mode number) en Guaraníes enteros, sufijo _gs.
 *  - Cantidades: numeric(14,3) mode number (soporta metro/kg).
 *  - Porcentajes: numeric(5,2) mode number.
 *  - Timestamps con zona horaria, mode Date.
 * ------------------------------------------------------------------------- */

export const pk = () => integer('id').primaryKey().generatedByDefaultAsIdentity();

export const montoGs = (nombre: string) => bigint(nombre, { mode: 'number' }).notNull().default(0);
export const montoGsNulo = (nombre: string) => bigint(nombre, { mode: 'number' });

export const cantidad = (nombre: string) =>
  numeric(nombre, { precision: 14, scale: 3, mode: 'number' }).notNull().default(0);

export const porcentaje = (nombre: string) =>
  numeric(nombre, { precision: 5, scale: 2, mode: 'number' }).notNull().default(0);

export const marcaTiempo = (nombre: string) => timestamp(nombre, { withTimezone: true, mode: 'date' });

export const timestamps = () => ({
  creado_en: marcaTiempo('creado_en').notNull().defaultNow(),
  actualizado_en: marcaTiempo('actualizado_en')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Auditoría de documentos transaccionales (creación, confirmación, anulación).
 * Las FK a usuarios se declaran con callbacks perezosos para evitar ciclos.
 */
export const auditoriaDocumento = (usuarios: () => AnyPgColumn) => ({
  creado_por: integer('creado_por')
    .notNull()
    .references(usuarios),
  ...timestamps(),
  confirmado_por: integer('confirmado_por').references(usuarios),
  confirmado_en: marcaTiempo('confirmado_en'),
  anulado_por: integer('anulado_por').references(usuarios),
  anulado_en: marcaTiempo('anulado_en'),
  motivo_anulacion: text('motivo_anulacion'),
});

/** Totales de cabecera (IVA incluido, como se factura en Paraguay). */
export const totalesCabecera = () => ({
  gravada_10_gs: montoGs('gravada_10_gs'),
  gravada_5_gs: montoGs('gravada_5_gs'),
  exenta_gs: montoGs('exenta_gs'),
  iva_10_gs: montoGs('iva_10_gs'),
  iva_5_gs: montoGs('iva_5_gs'),
  total_iva_gs: montoGs('total_iva_gs'),
  total_descuento_gs: montoGs('total_descuento_gs'),
  total_gs: montoGs('total_gs'),
});

/** Campos de línea de documento comercial. */
export const camposLinea = (
  articulos: () => AnyPgColumn,
  unidades: () => AnyPgColumn,
  descuentos: () => AnyPgColumn,
) => ({
  linea: smallint('linea').notNull(),
  articulo_id: integer('articulo_id').notNull().references(articulos),
  descripcion: varchar('descripcion', { length: 200 }).notNull(),
  unidad_medida_id: integer('unidad_medida_id').references(unidades),
  /** Cantidad en unidad base por cada unidad del documento (1 si es unidad base). */
  factor_conversion: numeric('factor_conversion', { precision: 14, scale: 3, mode: 'number' })
    .notNull()
    .default(1),
  cantidad: cantidad('cantidad'),
  precio_unitario_gs: montoGs('precio_unitario_gs'),
  descuento_gs: montoGs('descuento_gs'),
  origen_descuento: origenDescuentoEnum('origen_descuento').notNull().default('ninguno'),
  descuento_id: integer('descuento_id').references(descuentos),
  tipo_iva: tipoIvaEnum('tipo_iva').notNull(),
  /** cantidad * precio_unitario - descuento (IVA incluido). */
  total_linea_gs: montoGs('total_linea_gs'),
  /** IVA contenido en total_linea_gs: /11 (10%), /21 (5%), 0 exenta. */
  iva_gs: montoGs('iva_gs'),
});

type ColsLinea = {
  cantidad: AnyPgColumn;
  precio_unitario_gs: AnyPgColumn;
  descuento_gs: AnyPgColumn;
  origen_descuento: AnyPgColumn;
  descuento_id: AnyPgColumn;
  total_linea_gs: AnyPgColumn;
  iva_gs: AnyPgColumn;
  tipo_iva: AnyPgColumn;
  factor_conversion: AnyPgColumn;
};

export const checksLinea = (tabla: string, t: ColsLinea) => [
  check(`${tabla}_cantidad_pos`, sql`${t.cantidad} > 0`),
  check(`${tabla}_factor_pos`, sql`${t.factor_conversion} > 0`),
  check(
    `${tabla}_montos_no_neg`,
    sql`${t.precio_unitario_gs} >= 0 AND ${t.descuento_gs} >= 0 AND ${t.total_linea_gs} >= 0 AND ${t.iva_gs} >= 0`,
  ),
  check(
    `${tabla}_descuento_origen`,
    sql`(${t.origen_descuento} <> 'ninguno' OR ${t.descuento_gs} = 0) AND (${t.origen_descuento} <> 'automatico' OR ${t.descuento_id} IS NOT NULL)`,
  ),
  check(`${tabla}_iva_exenta`, sql`${t.tipo_iva} <> 'exenta' OR ${t.iva_gs} = 0`),
];

type ColsTotales = {
  gravada_10_gs: AnyPgColumn;
  gravada_5_gs: AnyPgColumn;
  exenta_gs: AnyPgColumn;
  iva_10_gs: AnyPgColumn;
  iva_5_gs: AnyPgColumn;
  total_iva_gs: AnyPgColumn;
  total_gs: AnyPgColumn;
};

export const checksTotales = (tabla: string, t: ColsTotales) => [
  check(
    `${tabla}_total_cuadra`,
    sql`${t.total_gs} = ${t.gravada_10_gs} + ${t.gravada_5_gs} + ${t.exenta_gs}`,
  ),
  check(`${tabla}_iva_cuadra`, sql`${t.total_iva_gs} = ${t.iva_10_gs} + ${t.iva_5_gs}`),
  check(
    `${tabla}_totales_no_neg`,
    sql`${t.gravada_10_gs} >= 0 AND ${t.gravada_5_gs} >= 0 AND ${t.exenta_gs} >= 0 AND ${t.iva_10_gs} >= 0 AND ${t.iva_5_gs} >= 0`,
  ),
];
