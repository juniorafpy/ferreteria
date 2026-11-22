import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  date,
  index,
  integer,
  pgTable,
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
  timestamps,
  totalesCabecera,
} from './_comunes';
import { articulos, depositos } from './articulos';
import { descuentos } from './descuentos';
import {
  condicionOperacionEnum,
  estadoCuentaEnum,
  estadoDocumentoEnum,
  estadoPresupuestoEnum,
  estadoRegistroEnum,
  estadoSesionCajaEnum,
  estadoSifenEnum,
  medioPagoEnum,
  modalidadFacturacionEnum,
  tipoDocumentoElectronicoEnum,
  tipoEmisionEnum,
  tipoEventoSifenEnum,
  tipoTarjetaEnum,
  tipoTransaccionEnum,
} from './enums';
import { empresas, puntosExpedicion, sucursales, timbrados } from './organizacion';
import { clientes } from './personas';
import { tiposDocumento, unidadesMedida } from './referenciales';
import { usuarios } from './seguridad';

const ambito = () => ({
  empresa_id: integer('empresa_id')
    .notNull()
    .references(() => empresas.id),
  sucursal_id: integer('sucursal_id')
    .notNull()
    .references(() => sucursales.id),
});
const auditoria = () => auditoriaDocumento(() => usuarios.id);
const linea = () =>
  camposLinea(
    () => articulos.id,
    () => unidadesMedida.id,
    () => descuentos.id,
  );

/* ------------------------------ Presupuestos ------------------------------ */

export const presupuestos = pgTable(
  'presupuestos',
  {
    id: pk(),
    ...ambito(),
    numero: integer('numero').notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    fecha_validez: date('fecha_validez', { mode: 'string' }),
    cliente_id: integer('cliente_id').references(() => clientes.id),
    vendedor_id: integer('vendedor_id').references(() => usuarios.id),
    condicion_operacion: condicionOperacionEnum('condicion_operacion').notNull().default('contado'),
    observacion: text('observacion'),
    ...totalesCabecera(),
    estado: estadoPresupuestoEnum('estado').notNull().default('borrador'),
    ...auditoria(),
  },
  (t) => [
    unique('presupuestos_numero_uq').on(t.empresa_id, t.sucursal_id, t.numero),
    index('presupuestos_cliente_idx').on(t.empresa_id, t.cliente_id, t.estado),
    ...checksTotales('presupuestos', t),
  ],
);

export const presupuestoDetalles = pgTable(
  'presupuesto_detalles',
  {
    id: pk(),
    ...ambito(),
    presupuesto_id: integer('presupuesto_id')
      .notNull()
      .references(() => presupuestos.id, { onDelete: 'cascade' }),
    ...linea(),
    /** Cantidad ya facturada (facturas de venta confirmadas). */
    cantidad_facturada: cantidad('cantidad_facturada'),
  },
  (t) => [
    unique('presupuesto_detalles_linea_uq').on(t.presupuesto_id, t.linea),
    ...checksLinea('presupuesto_detalles', t),
    check(
      'presupuesto_detalles_pend',
      sql`${t.cantidad_facturada} >= 0 AND ${t.cantidad_facturada} <= ${t.cantidad}`,
    ),
  ],
);

/* ------------------------------ Cajas ------------------------------ */

export const cajas = pgTable(
  'cajas',
  {
    id: pk(),
    ...ambito(),
    codigo: varchar('codigo', { length: 10 }).notNull(),
    nombre: varchar('nombre', { length: 80 }).notNull(),
    /** Punto de expedición que usa la caja para facturar. */
    punto_expedicion_id: integer('punto_expedicion_id').references(() => puntosExpedicion.id),
    deposito_id: integer('deposito_id').references(() => depositos.id),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [unique('cajas_codigo_uq').on(t.empresa_id, t.sucursal_id, t.codigo)],
);

export const sesionesCaja = pgTable(
  'sesiones_caja',
  {
    id: pk(),
    ...ambito(),
    caja_id: integer('caja_id')
      .notNull()
      .references(() => cajas.id),
    usuario_id: integer('usuario_id')
      .notNull()
      .references(() => usuarios.id),
    abierta_en: marcaTiempo('abierta_en').notNull().defaultNow(),
    monto_apertura_gs: montoGs('monto_apertura_gs'),
    // Totales del sistema al cierre (por medio de pago)
    total_efectivo_gs: montoGs('total_efectivo_gs'),
    total_transferencia_gs: montoGs('total_transferencia_gs'),
    total_tarjeta_gs: montoGs('total_tarjeta_gs'),
    total_qr_gs: montoGs('total_qr_gs'),
    /** Efectivo contado en el arqueo. */
    efectivo_declarado_gs: montoGs('efectivo_declarado_gs'),
    /** efectivo_declarado - (apertura + total_efectivo). Negativo = faltante. */
    diferencia_gs: montoGs('diferencia_gs'),
    cerrada_en: marcaTiempo('cerrada_en'),
    cerrada_por: integer('cerrada_por').references(() => usuarios.id),
    observacion_cierre: text('observacion_cierre'),
    estado: estadoSesionCajaEnum('estado').notNull().default('abierta'),
    ...timestamps(),
  },
  (t) => [
    // Una sola sesión abierta por caja
    uniqueIndex('sesiones_caja_abierta_uq')
      .on(t.caja_id)
      .where(sql`${t.estado} = 'abierta'`),
    index('sesiones_caja_usuario_idx').on(t.usuario_id, t.estado),
    check('sesiones_caja_apertura_no_neg', sql`${t.monto_apertura_gs} >= 0`),
    check(
      'sesiones_caja_cierre',
      sql`${t.estado} = 'abierta' OR (${t.cerrada_en} IS NOT NULL AND ${t.cerrada_por} IS NOT NULL)`,
    ),
  ],
);

/** Arqueo detallado por medio de pago al cerrar la sesión. */
export const arqueosCaja = pgTable(
  'arqueos_caja',
  {
    id: pk(),
    ...ambito(),
    sesion_caja_id: integer('sesion_caja_id')
      .notNull()
      .references(() => sesionesCaja.id, { onDelete: 'cascade' }),
    medio_pago: medioPagoEnum('medio_pago').notNull(),
    monto_sistema_gs: montoGs('monto_sistema_gs'),
    monto_declarado_gs: montoGs('monto_declarado_gs'),
    diferencia_gs: montoGs('diferencia_gs'),
    observacion: varchar('observacion', { length: 255 }),
  },
  (t) => [
    unique('arqueos_caja_uq').on(t.sesion_caja_id, t.medio_pago),
    check(
      'arqueos_caja_diferencia',
      sql`${t.diferencia_gs} = ${t.monto_declarado_gs} - ${t.monto_sistema_gs}`,
    ),
  ],
);

/* ------------------------------ Facturas de venta (SIFEN) ------------------------------ */

export const facturasVenta = pgTable(
  'facturas_venta',
  {
    id: pk(),
    ...ambito(),
    /** Presupuesto origen (opcional). */
    presupuesto_id: integer('presupuesto_id').references(() => presupuestos.id),
    cliente_id: integer('cliente_id').references(() => clientes.id),
    vendedor_id: integer('vendedor_id').references(() => usuarios.id),
    deposito_id: integer('deposito_id')
      .notNull()
      .references(() => depositos.id),
    sesion_caja_id: integer('sesion_caja_id').references(() => sesionesCaja.id),

    // --- Numeración / timbrado (se asigna al confirmar) ---
    modalidad: modalidadFacturacionEnum('modalidad').notNull().default('electronica'),
    tipo_documento: tipoDocumentoElectronicoEnum('tipo_documento').notNull().default('factura'),
    timbrado_id: integer('timbrado_id').references(() => timbrados.id),
    punto_expedicion_id: integer('punto_expedicion_id').references(() => puntosExpedicion.id),
    /** Snapshot del número de timbrado (8 dígitos). */
    timbrado: varchar('timbrado', { length: 8 }),
    establecimiento: char('establecimiento', { length: 3 }),
    punto_expedicion: char('punto_expedicion', { length: 3 }),
    /** Número de 1..9999999 (mostrar con padding de 7). Null en borrador. */
    numero: integer('numero'),
    fecha_emision: marcaTiempo('fecha_emision').notNull().defaultNow(),

    // --- SIFEN ---
    cdc: char('cdc', { length: 44 }),
    codigo_seguridad: char('codigo_seguridad', { length: 9 }),
    tipo_emision: tipoEmisionEnum('tipo_emision').notNull().default('normal'),
    tipo_transaccion: tipoTransaccionEnum('tipo_transaccion').notNull().default('venta_mercaderia'),
    condicion_operacion: condicionOperacionEnum('condicion_operacion').notNull().default('contado'),
    plazo_dias: smallint('plazo_dias'),
    cantidad_cuotas: smallint('cantidad_cuotas'),
    moneda: char('moneda', { length: 3 }).notNull().default('PYG'),
    estado_sifen: estadoSifenEnum('estado_sifen').notNull().default('pendiente'),
    sifen_codigo_respuesta: varchar('sifen_codigo_respuesta', { length: 10 }),
    sifen_mensaje: text('sifen_mensaje'),
    sifen_lote: varchar('sifen_lote', { length: 30 }),
    sifen_aprobado_en: marcaTiempo('sifen_aprobado_en'),
    xml_firmado: text('xml_firmado'),
    qr_url: text('qr_url'),

    // --- Receptor (snapshot al emitir) ---
    receptor_es_contribuyente: boolean('receptor_es_contribuyente').notNull().default(false),
    receptor_tipo_documento_id: integer('receptor_tipo_documento_id').references(() => tiposDocumento.id),
    receptor_numero_documento: varchar('receptor_numero_documento', { length: 20 }),
    receptor_dv: char('receptor_dv', { length: 1 }),
    receptor_razon_social: varchar('receptor_razon_social', { length: 200 }).notNull().default('SIN NOMBRE'),
    receptor_direccion: varchar('receptor_direccion', { length: 255 }),
    receptor_telefono: varchar('receptor_telefono', { length: 30 }),
    receptor_email: varchar('receptor_email', { length: 150 }),
    receptor_pais: char('receptor_pais', { length: 3 }).notNull().default('PRY'),

    observacion: text('observacion'),
    ...totalesCabecera(),
    /** Costo total (sin IVA) de la mercadería vendida, calculado al confirmar. */
    total_costo_gs: montoGs('total_costo_gs'),
    estado: estadoDocumentoEnum('estado').notNull().default('borrador'),
    ...auditoria(),
  },
  (t) => [
    uniqueIndex('facturas_venta_numero_uq')
      .on(t.empresa_id, t.timbrado, t.establecimiento, t.punto_expedicion, t.numero)
      .where(sql`${t.numero} IS NOT NULL`),
    uniqueIndex('facturas_venta_cdc_uq')
      .on(t.cdc)
      .where(sql`${t.cdc} IS NOT NULL`),
    index('facturas_venta_fecha_idx').on(t.empresa_id, t.sucursal_id, t.fecha_emision),
    index('facturas_venta_cliente_idx').on(t.empresa_id, t.cliente_id),
    index('facturas_venta_estado_sifen_idx').on(t.empresa_id, t.estado_sifen),
    check(
      'facturas_venta_numerada',
      sql`${t.estado} = 'borrador' OR (${t.numero} IS NOT NULL AND ${t.timbrado} IS NOT NULL AND ${t.establecimiento} IS NOT NULL AND ${t.punto_expedicion} IS NOT NULL)`,
    ),
    check('facturas_venta_numero_rango', sql`${t.numero} IS NULL OR ${t.numero} BETWEEN 1 AND 9999999`),
    check(
      'facturas_venta_credito',
      sql`${t.condicion_operacion} = 'contado' OR (${t.cantidad_cuotas} IS NOT NULL AND ${t.cantidad_cuotas} >= 1)`,
    ),
    check(
      'facturas_venta_cdc_electronica',
      sql`${t.modalidad} = 'electronica' OR ${t.cdc} IS NULL`,
    ),
    ...checksTotales('facturas_venta', t),
  ],
);

export const facturaVentaDetalles = pgTable(
  'factura_venta_detalles',
  {
    id: pk(),
    ...ambito(),
    factura_venta_id: integer('factura_venta_id')
      .notNull()
      .references(() => facturasVenta.id, { onDelete: 'cascade' }),
    /** Detalle de presupuesto origen (opcional). */
    detalle_origen_id: integer('detalle_origen_id').references(() => presupuestoDetalles.id),
    ...linea(),
    /** Costo promedio unitario (sin IVA, unidad base) al confirmar: base del CMV. */
    costo_unitario_gs: montoGs('costo_unitario_gs'),
  },
  (t) => [
    unique('factura_venta_detalles_linea_uq').on(t.factura_venta_id, t.linea),
    index('factura_venta_detalles_origen_idx').on(t.detalle_origen_id),
    index('factura_venta_detalles_articulo_idx').on(t.articulo_id),
    ...checksLinea('factura_venta_detalles', t),
  ],
);

/** Bitácora SIFEN desacoplada (append-only). */
export const sifenEventos = pgTable(
  'sifen_eventos',
  {
    id: pk(),
    ...ambito(),
    factura_venta_id: integer('factura_venta_id').references(() => facturasVenta.id),
    cdc: char('cdc', { length: 44 }),
    tipo_evento: tipoEventoSifenEnum('tipo_evento').notNull(),
    estado_sifen_resultante: estadoSifenEnum('estado_sifen_resultante'),
    codigo_respuesta: varchar('codigo_respuesta', { length: 10 }),
    mensaje: text('mensaje'),
    request_xml: text('request_xml'),
    response_xml: text('response_xml'),
    usuario_id: integer('usuario_id').references(() => usuarios.id),
    creado_en: marcaTiempo('creado_en').notNull().defaultNow(),
  },
  (t) => [
    index('sifen_eventos_factura_idx').on(t.factura_venta_id, t.creado_en),
    index('sifen_eventos_cdc_idx').on(t.cdc),
  ],
);

/** Cuotas declaradas en la factura a crédito (gCuotas SIFEN). */
export const cuotasVenta = pgTable(
  'cuotas_venta',
  {
    id: pk(),
    ...ambito(),
    factura_venta_id: integer('factura_venta_id')
      .notNull()
      .references(() => facturasVenta.id, { onDelete: 'cascade' }),
    numero_cuota: smallint('numero_cuota').notNull(),
    fecha_vencimiento: date('fecha_vencimiento', { mode: 'string' }).notNull(),
    monto_gs: montoGs('monto_gs'),
  },
  (t) => [
    unique('cuotas_venta_uq').on(t.factura_venta_id, t.numero_cuota),
    check('cuotas_venta_monto_pos', sql`${t.monto_gs} > 0 AND ${t.numero_cuota} >= 1`),
  ],
);

/** Saldo a cobrar por factura/cuota (contado = 1 cuota con vencimiento en la fecha de emisión). */
export const cuentasCobrar = pgTable(
  'cuentas_cobrar',
  {
    id: pk(),
    ...ambito(),
    cliente_id: integer('cliente_id').references(() => clientes.id),
    factura_venta_id: integer('factura_venta_id')
      .notNull()
      .references(() => facturasVenta.id),
    cuota_venta_id: integer('cuota_venta_id').references(() => cuotasVenta.id),
    numero_cuota: smallint('numero_cuota').notNull().default(1),
    fecha_vencimiento: date('fecha_vencimiento', { mode: 'string' }).notNull(),
    monto_gs: montoGs('monto_gs'),
    saldo_gs: montoGs('saldo_gs'),
    estado: estadoCuentaEnum('estado').notNull().default('pendiente'),
    ...timestamps(),
  },
  (t) => [
    unique('cuentas_cobrar_cuota_uq').on(t.factura_venta_id, t.numero_cuota),
    uniqueIndex('cuentas_cobrar_cuota_venta_uq')
      .on(t.cuota_venta_id)
      .where(sql`${t.cuota_venta_id} IS NOT NULL`),
    index('cuentas_cobrar_cliente_idx').on(t.empresa_id, t.cliente_id, t.estado),
    index('cuentas_cobrar_vencimiento_idx').on(t.empresa_id, t.fecha_vencimiento),
    check('cuentas_cobrar_saldo', sql`${t.monto_gs} > 0 AND ${t.saldo_gs} >= 0 AND ${t.saldo_gs} <= ${t.monto_gs}`),
  ],
);

/* ------------------------------ Cobros ------------------------------ */

export const cobros = pgTable(
  'cobros',
  {
    id: pk(),
    ...ambito(),
    numero: integer('numero').notNull(),
    fecha: marcaTiempo('fecha').notNull().defaultNow(),
    cliente_id: integer('cliente_id').references(() => clientes.id),
    sesion_caja_id: integer('sesion_caja_id')
      .notNull()
      .references(() => sesionesCaja.id),
    /** Total aplicado a cuentas (= suma cobro_detalles = suma cobro_medios - vuelto). */
    total_gs: montoGs('total_gs'),
    vuelto_gs: montoGs('vuelto_gs'),
    observacion: text('observacion'),
    estado: estadoDocumentoEnum('estado').notNull().default('borrador'),
    ...auditoria(),
  },
  (t) => [
    unique('cobros_numero_uq').on(t.empresa_id, t.sucursal_id, t.numero),
    index('cobros_sesion_idx').on(t.sesion_caja_id),
    index('cobros_cliente_idx').on(t.empresa_id, t.cliente_id),
    check('cobros_montos', sql`${t.total_gs} >= 0 AND ${t.vuelto_gs} >= 0`),
  ],
);

/** Aplicación del cobro a cuentas a cobrar. */
export const cobroDetalles = pgTable(
  'cobro_detalles',
  {
    id: pk(),
    ...ambito(),
    cobro_id: integer('cobro_id')
      .notNull()
      .references(() => cobros.id, { onDelete: 'cascade' }),
    cuenta_cobrar_id: integer('cuenta_cobrar_id')
      .notNull()
      .references(() => cuentasCobrar.id),
    monto_gs: montoGs('monto_gs'),
  },
  (t) => [
    unique('cobro_detalles_uq').on(t.cobro_id, t.cuenta_cobrar_id),
    check('cobro_detalles_monto_pos', sql`${t.monto_gs} > 0`),
  ],
);

/** Medios de pago del cobro. */
export const cobroMedios = pgTable(
  'cobro_medios',
  {
    id: pk(),
    ...ambito(),
    cobro_id: integer('cobro_id')
      .notNull()
      .references(() => cobros.id, { onDelete: 'cascade' }),
    medio_pago: medioPagoEnum('medio_pago').notNull(),
    monto_gs: montoGs('monto_gs'),
    /** Nro. de transferencia, autorización POS o id de transacción QR. */
    referencia: varchar('referencia', { length: 100 }),
    banco: varchar('banco', { length: 100 }),
    tipo_tarjeta: tipoTarjetaEnum('tipo_tarjeta'),
    marca_tarjeta: varchar('marca_tarjeta', { length: 40 }),
    ultimos_digitos: char('ultimos_digitos', { length: 4 }),
  },
  (t) => [
    index('cobro_medios_cobro_idx').on(t.cobro_id),
    check('cobro_medios_monto_pos', sql`${t.monto_gs} > 0`),
    check(
      'cobro_medios_tarjeta',
      sql`${t.medio_pago} <> 'tarjeta' OR ${t.tipo_tarjeta} IS NOT NULL`,
    ),
    check(
      'cobro_medios_referencia',
      sql`${t.medio_pago} = 'efectivo' OR ${t.referencia} IS NOT NULL`,
    ),
  ],
);

export type Presupuesto = typeof presupuestos.$inferSelect;
export type NuevoPresupuesto = typeof presupuestos.$inferInsert;
export type PresupuestoDetalle = typeof presupuestoDetalles.$inferSelect;
export type NuevoPresupuestoDetalle = typeof presupuestoDetalles.$inferInsert;
export type Caja = typeof cajas.$inferSelect;
export type NuevaCaja = typeof cajas.$inferInsert;
export type SesionCaja = typeof sesionesCaja.$inferSelect;
export type NuevaSesionCaja = typeof sesionesCaja.$inferInsert;
export type ArqueoCaja = typeof arqueosCaja.$inferSelect;
export type NuevoArqueoCaja = typeof arqueosCaja.$inferInsert;
export type FacturaVenta = typeof facturasVenta.$inferSelect;
export type NuevaFacturaVenta = typeof facturasVenta.$inferInsert;
export type FacturaVentaDetalle = typeof facturaVentaDetalles.$inferSelect;
export type NuevaFacturaVentaDetalle = typeof facturaVentaDetalles.$inferInsert;
export type SifenEvento = typeof sifenEventos.$inferSelect;
export type NuevoSifenEvento = typeof sifenEventos.$inferInsert;
export type CuotaVenta = typeof cuotasVenta.$inferSelect;
export type NuevaCuotaVenta = typeof cuotasVenta.$inferInsert;
export type CuentaCobrar = typeof cuentasCobrar.$inferSelect;
export type NuevaCuentaCobrar = typeof cuentasCobrar.$inferInsert;
export type Cobro = typeof cobros.$inferSelect;
export type NuevoCobro = typeof cobros.$inferInsert;
export type CobroDetalle = typeof cobroDetalles.$inferSelect;
export type NuevoCobroDetalle = typeof cobroDetalles.$inferInsert;
export type CobroMedio = typeof cobroMedios.$inferSelect;
export type NuevoCobroMedio = typeof cobroMedios.$inferInsert;
