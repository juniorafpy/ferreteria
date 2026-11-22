import { sql } from 'drizzle-orm';
import {
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
import { auditoriaDocumento, cantidad, marcaTiempo, montoGs, pk } from './_comunes';
import { articulos, depositos } from './articulos';
import {
  estadoDocumentoEnum,
  estadoTransferenciaEnum,
  origenDocumentoEnum,
  tipoAjusteEnum,
  tipoMovimientoKardexEnum,
} from './enums';
import { empresas, sucursales } from './organizacion';
import { usuarios } from './seguridad';

const ambito = () => ({
  empresa_id: integer('empresa_id')
    .notNull()
    .references(() => empresas.id),
  sucursal_id: integer('sucursal_id')
    .notNull()
    .references(() => sucursales.id),
});

/**
 * Existencia por depósito y artículo, en unidad base. Costos sin IVA.
 * Actualizar SIEMPRE junto con un registro de kardex en la misma transacción.
 */
export const stock = pgTable(
  'stock',
  {
    id: pk(),
    ...ambito(),
    deposito_id: integer('deposito_id')
      .notNull()
      .references(() => depositos.id),
    articulo_id: integer('articulo_id')
      .notNull()
      .references(() => articulos.id),
    cantidad: cantidad('cantidad'),
    /** Reservado por presupuestos/órdenes (informativo). */
    cantidad_reservada: cantidad('cantidad_reservada'),
    costo_promedio_gs: montoGs('costo_promedio_gs'),
    ultimo_costo_gs: montoGs('ultimo_costo_gs'),
    actualizado_en: marcaTiempo('actualizado_en')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique('stock_deposito_articulo_uq').on(t.deposito_id, t.articulo_id),
    index('stock_articulo_idx').on(t.articulo_id),
    check('stock_costos_no_neg', sql`${t.costo_promedio_gs} >= 0 AND ${t.ultimo_costo_gs} >= 0`),
  ],
);

/** Libro de movimientos (append-only: nunca UPDATE/DELETE; las anulaciones generan contramovimiento). */
export const kardex = pgTable(
  'kardex',
  {
    id: pk(),
    ...ambito(),
    deposito_id: integer('deposito_id')
      .notNull()
      .references(() => depositos.id),
    articulo_id: integer('articulo_id')
      .notNull()
      .references(() => articulos.id),
    fecha: marcaTiempo('fecha').notNull().defaultNow(),
    tipo_movimiento: tipoMovimientoKardexEnum('tipo_movimiento').notNull(),
    origen_tipo: origenDocumentoEnum('origen_tipo').notNull(),
    origen_id: integer('origen_id'),
    origen_detalle_id: integer('origen_detalle_id'),
    cantidad_entrada: cantidad('cantidad_entrada'),
    cantidad_salida: cantidad('cantidad_salida'),
    saldo_cantidad: cantidad('saldo_cantidad'),
    costo_unitario_gs: montoGs('costo_unitario_gs'),
    costo_promedio_gs: montoGs('costo_promedio_gs'),
    saldo_valorizado_gs: montoGs('saldo_valorizado_gs'),
    usuario_id: integer('usuario_id').references(() => usuarios.id),
    creado_en: marcaTiempo('creado_en').notNull().defaultNow(),
  },
  (t) => [
    index('kardex_articulo_deposito_fecha_idx').on(t.articulo_id, t.deposito_id, t.fecha),
    index('kardex_origen_idx').on(t.origen_tipo, t.origen_id),
    check(
      'kardex_entrada_xor_salida',
      sql`${t.cantidad_entrada} >= 0 AND ${t.cantidad_salida} >= 0 AND ((${t.cantidad_entrada} > 0) <> (${t.cantidad_salida} > 0))`,
    ),
  ],
);

/* ------------------------------ Ajustes de stock ------------------------------ */

export const ajustesStock = pgTable(
  'ajustes_stock',
  {
    id: pk(),
    ...ambito(),
    numero: integer('numero').notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    deposito_id: integer('deposito_id')
      .notNull()
      .references(() => depositos.id),
    tipo_ajuste: tipoAjusteEnum('tipo_ajuste').notNull(),
    motivo: varchar('motivo', { length: 255 }).notNull(),
    observacion: text('observacion'),
    total_costo_gs: montoGs('total_costo_gs'),
    estado: estadoDocumentoEnum('estado').notNull().default('borrador'),
    ...auditoriaDocumento(() => usuarios.id),
  },
  (t) => [
    unique('ajustes_stock_numero_uq').on(t.empresa_id, t.sucursal_id, t.numero),
    index('ajustes_stock_fecha_idx').on(t.empresa_id, t.sucursal_id, t.fecha),
  ],
);

export const ajusteStockDetalles = pgTable(
  'ajuste_stock_detalles',
  {
    id: pk(),
    ...ambito(),
    ajuste_stock_id: integer('ajuste_stock_id')
      .notNull()
      .references(() => ajustesStock.id, { onDelete: 'cascade' }),
    linea: smallint('linea').notNull(),
    articulo_id: integer('articulo_id')
      .notNull()
      .references(() => articulos.id),
    /** Cantidad (unidad base) siempre positiva; el sentido lo da tipo_ajuste. */
    cantidad: cantidad('cantidad'),
    /** Existencia del sistema al momento del ajuste (referencia de inventario físico). */
    cantidad_sistema: numeric('cantidad_sistema', { precision: 14, scale: 3, mode: 'number' }),
    costo_unitario_gs: montoGs('costo_unitario_gs'),
    total_costo_gs: montoGs('total_costo_gs'),
    observacion: varchar('observacion', { length: 255 }),
  },
  (t) => [
    unique('ajuste_stock_detalles_linea_uq').on(t.ajuste_stock_id, t.linea),
    check(
      'ajuste_stock_detalles_cant',
      sql`${t.cantidad} > 0 AND ${t.costo_unitario_gs} >= 0 AND ${t.total_costo_gs} >= 0`,
    ),
  ],
);

/* ------------------------------ Transferencias ------------------------------ */

/** sucursal_id = sucursal ORIGEN. */
export const transferenciasStock = pgTable(
  'transferencias_stock',
  {
    id: pk(),
    ...ambito(),
    sucursal_destino_id: integer('sucursal_destino_id')
      .notNull()
      .references(() => sucursales.id),
    deposito_origen_id: integer('deposito_origen_id')
      .notNull()
      .references(() => depositos.id),
    deposito_destino_id: integer('deposito_destino_id')
      .notNull()
      .references(() => depositos.id),
    numero: integer('numero').notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    observacion: text('observacion'),
    total_costo_gs: montoGs('total_costo_gs'),
    estado: estadoTransferenciaEnum('estado').notNull().default('borrador'),
    enviado_por: integer('enviado_por').references(() => usuarios.id),
    enviado_en: marcaTiempo('enviado_en'),
    recibido_por: integer('recibido_por').references(() => usuarios.id),
    recibido_en: marcaTiempo('recibido_en'),
    ...auditoriaDocumento(() => usuarios.id),
  },
  (t) => [
    unique('transferencias_stock_numero_uq').on(t.empresa_id, t.sucursal_id, t.numero),
    index('transferencias_stock_destino_idx').on(t.sucursal_destino_id, t.estado),
    check('transferencias_stock_depositos', sql`${t.deposito_origen_id} <> ${t.deposito_destino_id}`),
  ],
);

export const transferenciaStockDetalles = pgTable(
  'transferencia_stock_detalles',
  {
    id: pk(),
    ...ambito(),
    transferencia_stock_id: integer('transferencia_stock_id')
      .notNull()
      .references(() => transferenciasStock.id, { onDelete: 'cascade' }),
    linea: smallint('linea').notNull(),
    articulo_id: integer('articulo_id')
      .notNull()
      .references(() => articulos.id),
    cantidad: cantidad('cantidad'),
    cantidad_recibida: cantidad('cantidad_recibida'),
    costo_unitario_gs: montoGs('costo_unitario_gs'),
  },
  (t) => [
    unique('transferencia_stock_detalles_linea_uq').on(t.transferencia_stock_id, t.linea),
    check(
      'transferencia_stock_detalles_cant',
      sql`${t.cantidad} > 0 AND ${t.cantidad_recibida} >= 0 AND ${t.cantidad_recibida} <= ${t.cantidad}`,
    ),
  ],
);

export type Stock = typeof stock.$inferSelect;
export type NuevoStock = typeof stock.$inferInsert;
export type Kardex = typeof kardex.$inferSelect;
export type NuevoKardex = typeof kardex.$inferInsert;
export type AjusteStock = typeof ajustesStock.$inferSelect;
export type NuevoAjusteStock = typeof ajustesStock.$inferInsert;
export type AjusteStockDetalle = typeof ajusteStockDetalles.$inferSelect;
export type NuevoAjusteStockDetalle = typeof ajusteStockDetalles.$inferInsert;
export type TransferenciaStock = typeof transferenciasStock.$inferSelect;
export type NuevaTransferenciaStock = typeof transferenciasStock.$inferInsert;
export type TransferenciaStockDetalle = typeof transferenciaStockDetalles.$inferSelect;
export type NuevaTransferenciaStockDetalle = typeof transferenciaStockDetalles.$inferInsert;
