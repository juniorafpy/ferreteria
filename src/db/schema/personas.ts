import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { montoGs, pk, timestamps } from './_comunes';
import { condicionOperacionEnum, estadoRegistroEnum } from './enums';
import { empresas } from './organizacion';
import {
  actividadesEconomicas,
  ciudades,
  paises,
  tiposDocumento,
  tiposPersona,
} from './referenciales';

/** Ficha maestra única de persona física o jurídica. */
export const personas = pgTable(
  'personas',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    tipo_persona_id: integer('tipo_persona_id')
      .notNull()
      .references(() => tiposPersona.id),
    tipo_documento_id: integer('tipo_documento_id')
      .notNull()
      .references(() => tiposDocumento.id),
    numero_documento: varchar('numero_documento', { length: 20 }).notNull(),
    /** Dígito verificador (solo RUC). */
    dv: char('dv', { length: 1 }),
    /** Nombre completo o razón social (lo que va a la factura). */
    razon_social: varchar('razon_social', { length: 200 }).notNull(),
    nombres: varchar('nombres', { length: 120 }),
    apellidos: varchar('apellidos', { length: 120 }),
    nombre_fantasia: varchar('nombre_fantasia', { length: 200 }),
    es_contribuyente: boolean('es_contribuyente').notNull().default(false),
    actividad_economica_id: integer('actividad_economica_id').references(() => actividadesEconomicas.id),
    pais_id: integer('pais_id').references(() => paises.id),
    ciudad_id: integer('ciudad_id').references(() => ciudades.id),
    direccion: varchar('direccion', { length: 255 }),
    numero_casa: varchar('numero_casa', { length: 10 }),
    telefono: varchar('telefono', { length: 30 }),
    celular: varchar('celular', { length: 30 }),
    email: varchar('email', { length: 150 }),
    observacion: text('observacion'),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('personas_empresa_documento_uq').on(t.empresa_id, t.tipo_documento_id, t.numero_documento),
    index('personas_razon_social_idx').on(t.empresa_id, t.razon_social),
  ],
);

export const condicionesPago = pgTable(
  'condiciones_pago',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    codigo: varchar('codigo', { length: 20 }).notNull(),
    nombre: varchar('nombre', { length: 80 }).notNull(),
    condicion: condicionOperacionEnum('condicion').notNull(),
    /** Días hasta la primera cuota. */
    dias_plazo: smallint('dias_plazo').notNull().default(0),
    cantidad_cuotas: smallint('cantidad_cuotas').notNull().default(1),
    dias_entre_cuotas: smallint('dias_entre_cuotas').notNull().default(30),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('condiciones_pago_empresa_codigo_uq').on(t.empresa_id, t.codigo),
    check(
      'condiciones_pago_coherente',
      sql`${t.cantidad_cuotas} >= 1 AND ${t.dias_plazo} >= 0 AND (${t.condicion} = 'credito' OR (${t.cantidad_cuotas} = 1 AND ${t.dias_plazo} = 0))`,
    ),
  ],
);

export const clientes = pgTable(
  'clientes',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    persona_id: integer('persona_id')
      .notNull()
      .references(() => personas.id),
    codigo: varchar('codigo', { length: 20 }),
    condicion_pago_id: integer('condicion_pago_id').references(() => condicionesPago.id),
    limite_credito_gs: montoGs('limite_credito_gs'),
    /** Saldo deudor cacheado (fuente de verdad: cuentas_cobrar). */
    saldo_gs: montoGs('saldo_gs'),
    observacion: text('observacion'),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [
    unique('clientes_empresa_persona_uq').on(t.empresa_id, t.persona_id),
    check('clientes_limite_no_neg', sql`${t.limite_credito_gs} >= 0`),
  ],
);

export const proveedores = pgTable(
  'proveedores',
  {
    id: pk(),
    empresa_id: integer('empresa_id')
      .notNull()
      .references(() => empresas.id),
    persona_id: integer('persona_id')
      .notNull()
      .references(() => personas.id),
    codigo: varchar('codigo', { length: 20 }),
    condicion_pago_id: integer('condicion_pago_id').references(() => condicionesPago.id),
    contacto: varchar('contacto', { length: 150 }),
    saldo_gs: montoGs('saldo_gs'),
    observacion: text('observacion'),
    estado: estadoRegistroEnum('estado').notNull().default('activo'),
    ...timestamps(),
  },
  (t) => [unique('proveedores_empresa_persona_uq').on(t.empresa_id, t.persona_id)],
);

export type Persona = typeof personas.$inferSelect;
export type NuevaPersona = typeof personas.$inferInsert;
export type CondicionPago = typeof condicionesPago.$inferSelect;
export type NuevaCondicionPago = typeof condicionesPago.$inferInsert;
export type Cliente = typeof clientes.$inferSelect;
export type NuevoCliente = typeof clientes.$inferInsert;
export type Proveedor = typeof proveedores.$inferSelect;
export type NuevoProveedor = typeof proveedores.$inferInsert;
