import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_comunes';
import {
  ambienteSifenEnum,
  estadoRegistroEnum,
  modalidadFacturacionEnum,
  tipoDocumentoElectronicoEnum,
} from './enums';
import { actividadesEconomicas, ciudades } from './referenciales';

export const empresas = pgTable(
  'empresas',
  {
    id: pk(),
    ruc: varchar('ruc', { length: 20 }).notNull(),
    dv: char('dv', { length: 1 }).notNull(),
    razon_social: varchar('razon_social', { length: 200 }).notNull(),
    nombre_fantasia: varchar('nombre_fantasia', { length: 200 }),
    direccion: varchar('direccion', { length: 255 }),
    numero_casa: varchar('numero_casa', { length: 10 }),
    ciudad_id: integer('ciudad_id').references(() => ciudades.id),
    telefono: varchar('telefono', { length: 30 }),
    email: varchar('email', { length: 150 }),
    actividad_economica_id: integer('actividad_economica_id').references(() => actividadesEconomicas.id),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [unique('empresas_ruc_uq').on(t.ruc)],
);

export const sucursales = pgTable(
  'sucursales',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    codigo: varchar('codigo', { length: 10 }).notNull(),
    nombre: varchar('nombre', { length: 120 }).notNull(),
    direccion: varchar('direccion', { length: 255 }),
    ciudad_id: integer('ciudad_id').references(() => ciudades.id),
    telefono: varchar('telefono', { length: 30 }),
    email: varchar('email', { length: 150 }),
    es_casa_matriz: boolean('es_casa_matriz').notNull().default(false),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('sucursales_empresa_codigo_uq').on(t.empresa_id, t.codigo),
    // id + empresa para FKs compuestas futuras / consistencia
    unique('sucursales_id_empresa_uq').on(t.id, t.empresa_id),
  ],
);

/** Establecimiento SIFEN (código de 3 dígitos, ej. "001"), uno por sucursal. */
export const establecimientos = pgTable(
  'establecimientos',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    sucursal_id: integer('sucursal_id')
      .notNull()
      .references(() => sucursales.id),
    codigo: char('codigo', { length: 3 }).notNull(),
    denominacion: varchar('denominacion', { length: 120 }).notNull(),
    direccion: varchar('direccion', { length: 255 }),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('establecimientos_empresa_codigo_uq').on(t.empresa_id, t.codigo),
    check('establecimientos_codigo_fmt', sql`${t.codigo} ~ '^[0-9]{3}$'`),
  ],
);

export const puntosExpedicion = pgTable(
  'puntos_expedicion',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    sucursal_id: integer('sucursal_id')
      .notNull()
      .references(() => sucursales.id),
    establecimiento_id: integer('establecimiento_id')
      .notNull()
      .references(() => establecimientos.id),
    codigo: char('codigo', { length: 3 }).notNull(),
    descripcion: varchar('descripcion', { length: 120 }),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('puntos_expedicion_estab_codigo_uq').on(t.establecimiento_id, t.codigo),
    check('puntos_expedicion_codigo_fmt', sql`${t.codigo} ~ '^[0-9]{3}$'`),
  ],
);

export const timbrados = pgTable(
  'timbrados',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    numero: varchar('numero', { length: 8 }).notNull(),
    modalidad: modalidadFacturacionEnum('modalidad').notNull().default('electronica'),
    fecha_inicio_vigencia: date('fecha_inicio_vigencia', { mode: 'string' }).notNull(),
    /** Null en timbrados electrónicos sin vencimiento. */
    fecha_fin_vigencia: date('fecha_fin_vigencia', { mode: 'string' }),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('timbrados_empresa_numero_uq').on(t.empresa_id, t.numero),
    check('timbrados_numero_fmt', sql`${t.numero} ~ '^[0-9]{8}$'`),
    check(
      'timbrados_vigencia',
      sql`${t.fecha_fin_vigencia} IS NULL OR ${t.fecha_fin_vigencia} >= ${t.fecha_inicio_vigencia}`,
    ),
  ],
);

/**
 * Correlativo por timbrado + punto de expedición + tipo de documento.
 * El backend debe bloquear la fila (SELECT ... FOR UPDATE) e incrementar numero_actual
 * dentro de la misma transacción que confirma el documento.
 */
export const numeracionesDocumento = pgTable(
  'numeraciones_documento',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    sucursal_id: integer('sucursal_id')
      .notNull()
      .references(() => sucursales.id),
    timbrado_id: integer('timbrado_id')
      .notNull()
      .references(() => timbrados.id),
    punto_expedicion_id: integer('punto_expedicion_id')
      .notNull()
      .references(() => puntosExpedicion.id),
    tipo_documento: tipoDocumentoElectronicoEnum('tipo_documento').notNull().default('factura'),
    numero_desde: integer('numero_desde').notNull().default(1),
    numero_hasta: integer('numero_hasta').notNull().default(9999999),
    /** Último número utilizado (0 = ninguno). */
    numero_actual: integer('numero_actual').notNull().default(0),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('numeraciones_doc_uq').on(t.timbrado_id, t.punto_expedicion_id, t.tipo_documento),
    check(
      'numeraciones_doc_rango',
      sql`${t.numero_desde} >= 1 AND ${t.numero_hasta} <= 9999999 AND ${t.numero_desde} <= ${t.numero_hasta} AND ${t.numero_actual} >= 0 AND ${t.numero_actual} <= ${t.numero_hasta}`,
    ),
  ],
);

/**
 * Configuración SIFEN por empresa (sucursal_id NULL = valor por defecto) o por sucursal.
 * Los secretos (CSC, contraseña del certificado) NO se guardan en claro: se guarda
 * una referencia (nombre de variable de entorno / secret manager).
 */
export const configuracionSifen = pgTable(
  'configuracion_sifen',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    sucursal_id: integer('sucursal_id').references(() => sucursales.id),
    ambiente: ambienteSifenEnum('ambiente').notNull().default('test'),
    id_csc: varchar('id_csc', { length: 10 }),
    csc_ref: varchar('csc_ref', { length: 120 }),
    certificado_ruta: varchar('certificado_ruta', { length: 255 }),
    certificado_password_ref: varchar('certificado_password_ref', { length: 120 }),
    url_ws_recepcion: varchar('url_ws_recepcion', { length: 255 }),
    url_ws_consulta: varchar('url_ws_consulta', { length: 255 }),
    url_qr_base: varchar('url_qr_base', { length: 255 }),
    envio_por_lote: boolean('envio_por_lote').notNull().default(false),
    activo: boolean('activo').notNull().default(true),
    ...timestamps(),
  },
  (t) => [unique('configuracion_sifen_uq').on(t.empresa_id, t.sucursal_id).nullsNotDistinct()],
);

/** Parámetros clave/valor por empresa (sucursal_id NULL = global de la empresa). */
export const parametrosGenerales = pgTable(
  'parametros_generales',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    sucursal_id: integer('sucursal_id').references(() => sucursales.id),
    clave: varchar('clave', { length: 80 }).notNull(),
    valor: text('valor').notNull(),
    descripcion: varchar('descripcion', { length: 255 }),
    ...timestamps(),
  },
  (t) => [
    unique('parametros_generales_uq').on(t.empresa_id, t.sucursal_id, t.clave).nullsNotDistinct(),
    index('parametros_generales_clave_idx').on(t.clave),
  ],
);

export type Empresa = typeof empresas.$inferSelect;
export type NuevaEmpresa = typeof empresas.$inferInsert;
export type Sucursal = typeof sucursales.$inferSelect;
export type NuevaSucursal = typeof sucursales.$inferInsert;
export type Establecimiento = typeof establecimientos.$inferSelect;
export type NuevoEstablecimiento = typeof establecimientos.$inferInsert;
export type PuntoExpedicion = typeof puntosExpedicion.$inferSelect;
export type NuevoPuntoExpedicion = typeof puntosExpedicion.$inferInsert;
export type Timbrado = typeof timbrados.$inferSelect;
export type NuevoTimbrado = typeof timbrados.$inferInsert;
export type NumeracionDocumento = typeof numeracionesDocumento.$inferSelect;
export type NuevaNumeracionDocumento = typeof numeracionesDocumento.$inferInsert;
export type ConfiguracionSifen = typeof configuracionSifen.$inferSelect;
export type NuevaConfiguracionSifen = typeof configuracionSifen.$inferInsert;
export type ParametroGeneral = typeof parametrosGenerales.$inferSelect;
export type NuevoParametroGeneral = typeof parametrosGenerales.$inferInsert;
