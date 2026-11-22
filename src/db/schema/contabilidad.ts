import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  smallint,
  unique,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { auditoriaDocumento, montoGs, pk, timestamps } from './_comunes';
import {
  estadoDocumentoEnum,
  estadoRegistroEnum,
  ladoAsientoEnum,
  operacionContableEnum,
  origenDocumentoEnum,
  tipoCuentaContableEnum,
} from './enums';
import { empresas, sucursales } from './organizacion';
import { usuarios } from './seguridad';

export const planCuentas = pgTable(
  'plan_cuentas',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    codigo: varchar('codigo', { length: 20 }).notNull(),
    nombre: varchar('nombre', { length: 150 }).notNull(),
    padre_id: integer('padre_id').references((): AnyPgColumn => planCuentas.id),
    nivel: smallint('nivel').notNull(),
    tipo: tipoCuentaContableEnum('tipo').notNull(),
    /** Solo las cuentas imputables reciben movimientos. */
    imputable: boolean('imputable').notNull().default(false),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('plan_cuentas_empresa_codigo_uq').on(t.empresa_id, t.codigo),
    index('plan_cuentas_padre_idx').on(t.padre_id),
    check('plan_cuentas_nivel_pos', sql`${t.nivel} >= 1`),
  ],
);

/**
 * Mapeo operación -> cuenta. Cada (operacion, concepto) define una pata del asiento automático.
 * Conceptos usados por el seed (contrato con backend): ver src/db/seed/contabilidad.ts.
 */
export const configuracionContable = pgTable(
  'configuracion_contable',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    operacion: operacionContableEnum('operacion').notNull(),
    concepto: varchar('concepto', { length: 40 }).notNull(),
    lado: ladoAsientoEnum('lado').notNull(),
    cuenta_id: integer('cuenta_id')
      .notNull()
      .references(() => planCuentas.id),
    descripcion: varchar('descripcion', { length: 255 }),
    ...timestamps(),
  },
  (t) => [unique('configuracion_contable_uq').on(t.empresa_id, t.operacion, t.concepto)],
);

export const asientosContables = pgTable(
  'asientos_contables',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    sucursal_id: integer('sucursal_id')
      .notNull()
      .references(() => sucursales.id),
    numero: integer('numero').notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    concepto: varchar('concepto', { length: 255 }).notNull(),
    origen_tipo: origenDocumentoEnum('origen_tipo').notNull().default('manual'),
    origen_id: integer('origen_id'),
    /** Asiento revertido por este (anulación contable por contraasiento). */
    asiento_revertido_id: integer('asiento_revertido_id').references((): AnyPgColumn => asientosContables.id),
    total_debe_gs: montoGs('total_debe_gs'),
    total_haber_gs: montoGs('total_haber_gs'),
    estado: estadoDocumentoEnum('estado').notNull().default('borrador'),
    ...auditoriaDocumento(() => usuarios.id),
  },
  (t) => [
    unique('asientos_contables_numero_uq').on(t.empresa_id, t.numero),
    index('asientos_contables_origen_idx').on(t.origen_tipo, t.origen_id),
    index('asientos_contables_fecha_idx').on(t.empresa_id, t.fecha),
    check('asientos_contables_partida_doble', sql`${t.total_debe_gs} = ${t.total_haber_gs}`),
    check('asientos_contables_no_neg', sql`${t.total_debe_gs} >= 0`),
  ],
);

export const detallesAsientoContable = pgTable(
  'detalles_asiento_contable',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    sucursal_id: integer('sucursal_id')
      .notNull()
      .references(() => sucursales.id),
    asiento_id: integer('asiento_id')
      .notNull()
      .references(() => asientosContables.id, { onDelete: 'cascade' }),
    linea: smallint('linea').notNull(),
    cuenta_id: integer('cuenta_id')
      .notNull()
      .references(() => planCuentas.id),
    debe_gs: montoGs('debe_gs'),
    haber_gs: montoGs('haber_gs'),
    glosa: varchar('glosa', { length: 255 }),
  },
  (t) => [
    unique('detalles_asiento_linea_uq').on(t.asiento_id, t.linea),
    index('detalles_asiento_cuenta_idx').on(t.cuenta_id),
    check(
      'detalles_asiento_debe_xor_haber',
      sql`${t.debe_gs} >= 0 AND ${t.haber_gs} >= 0 AND ((${t.debe_gs} > 0) <> (${t.haber_gs} > 0))`,
    ),
  ],
);

export type PlanCuenta = typeof planCuentas.$inferSelect;
export type NuevoPlanCuenta = typeof planCuentas.$inferInsert;
export type ConfiguracionContable = typeof configuracionContable.$inferSelect;
export type NuevaConfiguracionContable = typeof configuracionContable.$inferInsert;
export type AsientoContable = typeof asientosContables.$inferSelect;
export type NuevoAsientoContable = typeof asientosContables.$inferInsert;
export type DetalleAsientoContable = typeof detallesAsientoContable.$inferSelect;
export type NuevoDetalleAsientoContable = typeof detallesAsientoContable.$inferInsert;
