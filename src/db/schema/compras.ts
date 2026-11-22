import { sql } from 'drizzle-orm';
import {
  char,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  auditoriaDocumento,
  camposLinea,
  cantidad,
  checksLinea,
  checksTotales,
  marcaTiempo,
  montoGs,
  pk,
  totalesCabecera,
} from './_comunes';
import { articulos, depositos } from './articulos';
import { descuentos } from './descuentos';
import {
  condicionOperacionEnum,
  estadoCuentaEnum,
  estadoDocumentoEnum,
  estadoFacturaCompraEnum,
  estadoOrdenCompraEnum,
  estadoPedidoCompraEnum,
  medioPagoEnum,
} from './enums';
import { empresas, sucursales } from './organizacion';
import { condicionesPago, proveedores } from './personas';
import { unidadesMedida } from './referenciales';
import { usuarios } from './seguridad';

const empresaId = () =>
  integer('empresa_id')
    .notNull()
    .references(() => empresas.id);
const sucursalId = () =>
  integer('sucursal_id')
    .notNull()
    .references(() => sucursales.id);
const ambito = () => ({ empresa_id: empresaId(), sucursal_id: sucursalId() });
const auditoria = () => auditoriaDocumento(() => usuarios.id);
const linea = () =>
  camposLinea(
    () => articulos.id,
    () => unidadesMedida.id,
    () => descuentos.id,
  );

/* ------------------------------ Pedidos de compra ------------------------------ */

export const pedidosCompra = pgTable(
  'pedidos_compra',
  {
    id: pk(),
    ...ambito(),
    /** Correlativo interno por sucursal. */
    numero: integer('numero').notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    proveedor_id: integer('proveedor_id').references(() => proveedores.id),
    deposito_id: integer('deposito_id').references(() => depositos.id),
    observacion: text('observacion'),
    estado: estadoPedidoCompraEnum('estado').notNull().default('borrador'),
    ...auditoria(),
  },
  (t) => [
    unique('pedidos_compra_numero_uq').on(t.empresa_id, t.sucursal_id, t.numero),
    index('pedidos_compra_estado_idx').on(t.empresa_id, t.sucursal_id, t.estado),
  ],
);

export const pedidoCompraDetalles = pgTable(
  'pedido_compra_detalles',
  {
    id: pk(),
    ...ambito(),
    pedido_compra_id: integer('pedido_compra_id')
      .notNull()
      .references(() => pedidosCompra.id, { onDelete: 'cascade' }),
    linea: smallint('linea').notNull(),
    articulo_id: integer('articulo_id')
      .notNull()
      .references(() => articulos.id),
    unidad_medida_id: integer('unidad_medida_id').references(() => unidadesMedida.id),
    cantidad: cantidad('cantidad'),
    /** Cantidad ya incluida en órdenes de compra confirmadas. */
    cantidad_ordenada: cantidad('cantidad_ordenada'),
    observacion: varchar('observacion', { length: 255 }),
  },
  (t) => [
    unique('pedido_compra_detalles_linea_uq').on(t.pedido_compra_id, t.linea),
    check(
      'pedido_compra_detalles_cant',
      sql`${t.cantidad} > 0 AND ${t.cantidad_ordenada} >= 0 AND ${t.cantidad_ordenada} <= ${t.cantidad}`,
    ),
  ],
);

/* ------------------------------ Órdenes de compra ------------------------------ */

export const ordenesCompra = pgTable(
  'ordenes_compra',
  {
    id: pk(),
    ...ambito(),
    numero: integer('numero').notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    proveedor_id: integer('proveedor_id')
      .notNull()
      .references(() => proveedores.id),
    condicion_pago_id: integer('condicion_pago_id').references(() => condicionesPago.id),
    deposito_id: integer('deposito_id').references(() => depositos.id),
    fecha_entrega_estimada: date('fecha_entrega_estimada', { mode: 'string' }),
    observacion: text('observacion'),
    ...totalesCabecera(),
    estado: estadoOrdenCompraEnum('estado').notNull().default('borrador'),
    ...auditoria(),
  },
  (t) => [
    unique('ordenes_compra_numero_uq').on(t.empresa_id, t.sucursal_id, t.numero),
    index('ordenes_compra_proveedor_idx').on(t.empresa_id, t.proveedor_id, t.estado),
    ...checksTotales('ordenes_compra', t),
  ],
);

/** Pedidos consolidados en una OC (N:M). */
export const ordenCompraPedidos = pgTable(
  'orden_compra_pedidos',
  {
    ...ambito(),
    orden_compra_id: integer('orden_compra_id')
      .notNull()
      .references(() => ordenesCompra.id, { onDelete: 'cascade' }),
    pedido_compra_id: integer('pedido_compra_id')
      .notNull()
      .references(() => pedidosCompra.id),
  },
  (t) => [primaryKey({ name: 'orden_compra_pedidos_pk', columns: [t.orden_compra_id, t.pedido_compra_id] })],
);

export const ordenCompraDetalles = pgTable(
  'orden_compra_detalles',
  {
    id: pk(),
    ...ambito(),
    orden_compra_id: integer('orden_compra_id')
      .notNull()
      .references(() => ordenesCompra.id, { onDelete: 'cascade' }),
    /** Detalle de pedido de compra origen (opcional). */
    detalle_origen_id: integer('detalle_origen_id').references(() => pedidoCompraDetalles.id),
    ...linea(),
    /** Cantidad ya facturada por el proveedor (facturas de compra confirmadas). */
    cantidad_facturada: cantidad('cantidad_facturada'),
  },
  (t) => [
    unique('orden_compra_detalles_linea_uq').on(t.orden_compra_id, t.linea),
    index('orden_compra_detalles_origen_idx').on(t.detalle_origen_id),
    ...checksLinea('orden_compra_detalles', t),
    check(
      'orden_compra_detalles_pend',
      sql`${t.cantidad_facturada} >= 0 AND ${t.cantidad_facturada} <= ${t.cantidad}`,
    ),
  ],
);

/* ------------------------------ Facturas de compra ------------------------------ */

export const facturasCompra = pgTable(
  'facturas_compra',
  {
    id: pk(),
    ...ambito(),
    proveedor_id: integer('proveedor_id')
      .notNull()
      .references(() => proveedores.id),
    /** OC origen (opcional; el detalle traza contra orden_compra_detalles). */
    orden_compra_id: integer('orden_compra_id').references(() => ordenesCompra.id),
    timbrado: varchar('timbrado', { length: 8 }).notNull(),
    timbrado_vencimiento: date('timbrado_vencimiento', { mode: 'string' }),
    establecimiento: char('establecimiento', { length: 3 }).notNull(),
    punto_expedicion: char('punto_expedicion', { length: 3 }).notNull(),
    numero: integer('numero').notNull(),
    cdc: char('cdc', { length: 44 }),
    fecha_emision: date('fecha_emision', { mode: 'string' }).notNull(),
    condicion_operacion: condicionOperacionEnum('condicion_operacion').notNull().default('contado'),
    condicion_pago_id: integer('condicion_pago_id').references(() => condicionesPago.id),
    fecha_vencimiento: date('fecha_vencimiento', { mode: 'string' }),
    /** Depósito destino sugerido para la recepción. */
    deposito_id: integer('deposito_id').references(() => depositos.id),
    observacion: text('observacion'),
    ...totalesCabecera(),
    estado: estadoFacturaCompraEnum('estado').notNull().default('borrador'),
    ...auditoria(),
  },
  (t) => [
    unique('facturas_compra_comprobante_uq').on(
      t.empresa_id,
      t.proveedor_id,
      t.timbrado,
      t.establecimiento,
      t.punto_expedicion,
      t.numero,
    ),
    uniqueIndex('facturas_compra_cdc_uq')
      .on(t.cdc)
      .where(sql`${t.cdc} IS NOT NULL`),
    index('facturas_compra_fecha_idx').on(t.empresa_id, t.sucursal_id, t.fecha_emision),
    check('facturas_compra_numero_rango', sql`${t.numero} BETWEEN 1 AND 9999999`),
    ...checksTotales('facturas_compra', t),
  ],
);

export const facturaCompraDetalles = pgTable(
  'factura_compra_detalles',
  {
    id: pk(),
    ...ambito(),
    factura_compra_id: integer('factura_compra_id')
      .notNull()
      .references(() => facturasCompra.id, { onDelete: 'cascade' }),
    /** Detalle de OC origen (opcional). */
    detalle_origen_id: integer('detalle_origen_id').references(() => ordenCompraDetalles.id),
    ...linea(),
    /** Costo unitario sin IVA por unidad base (para stock/histórico de costos). */
    costo_unitario_gs: montoGs('costo_unitario_gs'),
    /** Cantidad ya ingresada al depósito (recepciones confirmadas). */
    cantidad_recibida: cantidad('cantidad_recibida'),
  },
  (t) => [
    unique('factura_compra_detalles_linea_uq').on(t.factura_compra_id, t.linea),
    index('factura_compra_detalles_origen_idx').on(t.detalle_origen_id),
    ...checksLinea('factura_compra_detalles', t),
    check(
      'factura_compra_detalles_pend',
      sql`${t.cantidad_recibida} >= 0 AND ${t.cantidad_recibida} <= ${t.cantidad} AND ${t.costo_unitario_gs} >= 0`,
    ),
  ],
);

/* ------------------------------ Recepciones ------------------------------ */

export const recepciones = pgTable(
  'recepciones',
  {
    id: pk(),
    ...ambito(),
    numero: integer('numero').notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    factura_compra_id: integer('factura_compra_id')
      .notNull()
      .references(() => facturasCompra.id),
    deposito_id: integer('deposito_id')
      .notNull()
      .references(() => depositos.id),
    observacion: text('observacion'),
    total_costo_gs: montoGs('total_costo_gs'),
    estado: estadoDocumentoEnum('estado').notNull().default('borrador'),
    ...auditoria(),
  },
  (t) => [
    unique('recepciones_numero_uq').on(t.empresa_id, t.sucursal_id, t.numero),
    index('recepciones_factura_idx').on(t.factura_compra_id),
  ],
);

export const recepcionDetalles = pgTable(
  'recepcion_detalles',
  {
    id: pk(),
    ...ambito(),
    recepcion_id: integer('recepcion_id')
      .notNull()
      .references(() => recepciones.id, { onDelete: 'cascade' }),
    linea: smallint('linea').notNull(),
    /** Detalle de factura de compra origen. */
    detalle_origen_id: integer('detalle_origen_id')
      .notNull()
      .references(() => facturaCompraDetalles.id),
    articulo_id: integer('articulo_id')
      .notNull()
      .references(() => articulos.id),
    /** Cantidad en unidad del documento origen. */
    cantidad: cantidad('cantidad'),
    factor_conversion: cantidad('factor_conversion').default(1),
    /** Cantidad en unidad base = cantidad * factor_conversion. */
    cantidad_base: cantidad('cantidad_base'),
    costo_unitario_gs: montoGs('costo_unitario_gs'),
    total_costo_gs: montoGs('total_costo_gs'),
  },
  (t) => [
    unique('recepcion_detalles_linea_uq').on(t.recepcion_id, t.linea),
    index('recepcion_detalles_origen_idx').on(t.detalle_origen_id),
    check(
      'recepcion_detalles_cant',
      sql`${t.cantidad} > 0 AND ${t.cantidad_base} > 0 AND ${t.factor_conversion} > 0 AND ${t.costo_unitario_gs} >= 0 AND ${t.total_costo_gs} >= 0`,
    ),
  ],
);

/** Append-only. Un registro por detalle de factura de compra (no duplica costos). */
export const historicoCostos = pgTable(
  'historico_costos',
  {
    id: pk(),
    ...ambito(),
    articulo_id: integer('articulo_id')
      .notNull()
      .references(() => articulos.id),
    deposito_id: integer('deposito_id').references(() => depositos.id),
    proveedor_id: integer('proveedor_id').references(() => proveedores.id),
    detalle_factura_compra_id: integer('detalle_factura_compra_id')
      .notNull()
      .references(() => facturaCompraDetalles.id),
    recepcion_detalle_id: integer('recepcion_detalle_id').references(() => recepcionDetalles.id),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    cantidad: cantidad('cantidad'),
    costo_unitario_gs: montoGs('costo_unitario_gs'),
    costo_promedio_anterior_gs: montoGs('costo_promedio_anterior_gs'),
    costo_promedio_nuevo_gs: montoGs('costo_promedio_nuevo_gs'),
    creado_por: integer('creado_por').references(() => usuarios.id),
    creado_en: marcaTiempo('creado_en').notNull().defaultNow(),
  },
  (t) => [
    unique('historico_costos_detalle_fc_uq').on(t.detalle_factura_compra_id),
    index('historico_costos_articulo_idx').on(t.articulo_id, t.fecha),
  ],
);

/* ------------------------------ Cuentas a pagar / pagos ------------------------------ */

export const cuentasPagar = pgTable(
  'cuentas_pagar',
  {
    id: pk(),
    ...ambito(),
    proveedor_id: integer('proveedor_id')
      .notNull()
      .references(() => proveedores.id),
    factura_compra_id: integer('factura_compra_id')
      .notNull()
      .references(() => facturasCompra.id),
    numero_cuota: smallint('numero_cuota').notNull().default(1),
    fecha_vencimiento: date('fecha_vencimiento', { mode: 'string' }).notNull(),
    monto_gs: montoGs('monto_gs'),
    saldo_gs: montoGs('saldo_gs'),
    estado: estadoCuentaEnum('estado').notNull().default('pendiente'),
    creado_en: marcaTiempo('creado_en').notNull().defaultNow(),
    actualizado_en: marcaTiempo('actualizado_en')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique('cuentas_pagar_cuota_uq').on(t.factura_compra_id, t.numero_cuota),
    index('cuentas_pagar_proveedor_idx').on(t.empresa_id, t.proveedor_id, t.estado),
    index('cuentas_pagar_vencimiento_idx').on(t.empresa_id, t.fecha_vencimiento),
    check('cuentas_pagar_saldo', sql`${t.monto_gs} > 0 AND ${t.saldo_gs} >= 0 AND ${t.saldo_gs} <= ${t.monto_gs}`),
  ],
);

export const ordenesPago = pgTable(
  'ordenes_pago',
  {
    id: pk(),
    ...ambito(),
    numero: integer('numero').notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    proveedor_id: integer('proveedor_id')
      .notNull()
      .references(() => proveedores.id),
    medio_pago: medioPagoEnum('medio_pago').notNull().default('transferencia'),
    referencia: varchar('referencia', { length: 100 }),
    banco: varchar('banco', { length: 100 }),
    observacion: text('observacion'),
    total_gs: montoGs('total_gs'),
    estado: estadoDocumentoEnum('estado').notNull().default('borrador'),
    ...auditoria(),
  },
  (t) => [
    unique('ordenes_pago_numero_uq').on(t.empresa_id, t.sucursal_id, t.numero),
    index('ordenes_pago_proveedor_idx').on(t.empresa_id, t.proveedor_id),
    check('ordenes_pago_total_no_neg', sql`${t.total_gs} >= 0`),
  ],
);

export const ordenPagoDetalles = pgTable(
  'orden_pago_detalles',
  {
    id: pk(),
    ...ambito(),
    orden_pago_id: integer('orden_pago_id')
      .notNull()
      .references(() => ordenesPago.id, { onDelete: 'cascade' }),
    cuenta_pagar_id: integer('cuenta_pagar_id')
      .notNull()
      .references(() => cuentasPagar.id),
    monto_gs: montoGs('monto_gs'),
  },
  (t) => [
    unique('orden_pago_detalles_uq').on(t.orden_pago_id, t.cuenta_pagar_id),
    check('orden_pago_detalles_monto_pos', sql`${t.monto_gs} > 0`),
  ],
);

export type PedidoCompra = typeof pedidosCompra.$inferSelect;
export type NuevoPedidoCompra = typeof pedidosCompra.$inferInsert;
export type PedidoCompraDetalle = typeof pedidoCompraDetalles.$inferSelect;
export type NuevoPedidoCompraDetalle = typeof pedidoCompraDetalles.$inferInsert;
export type OrdenCompra = typeof ordenesCompra.$inferSelect;
export type NuevaOrdenCompra = typeof ordenesCompra.$inferInsert;
export type OrdenCompraPedido = typeof ordenCompraPedidos.$inferSelect;
export type NuevaOrdenCompraPedido = typeof ordenCompraPedidos.$inferInsert;
export type OrdenCompraDetalle = typeof ordenCompraDetalles.$inferSelect;
export type NuevaOrdenCompraDetalle = typeof ordenCompraDetalles.$inferInsert;
export type FacturaCompra = typeof facturasCompra.$inferSelect;
export type NuevaFacturaCompra = typeof facturasCompra.$inferInsert;
export type FacturaCompraDetalle = typeof facturaCompraDetalles.$inferSelect;
export type NuevaFacturaCompraDetalle = typeof facturaCompraDetalles.$inferInsert;
export type Recepcion = typeof recepciones.$inferSelect;
export type NuevaRecepcion = typeof recepciones.$inferInsert;
export type RecepcionDetalle = typeof recepcionDetalles.$inferSelect;
export type NuevaRecepcionDetalle = typeof recepcionDetalles.$inferInsert;
export type HistoricoCosto = typeof historicoCostos.$inferSelect;
export type NuevoHistoricoCosto = typeof historicoCostos.$inferInsert;
export type CuentaPagar = typeof cuentasPagar.$inferSelect;
export type NuevaCuentaPagar = typeof cuentasPagar.$inferInsert;
export type OrdenPago = typeof ordenesPago.$inferSelect;
export type NuevaOrdenPago = typeof ordenesPago.$inferInsert;
export type OrdenPagoDetalle = typeof ordenPagoDetalles.$inferSelect;
export type NuevaOrdenPagoDetalle = typeof ordenPagoDetalles.$inferInsert;
