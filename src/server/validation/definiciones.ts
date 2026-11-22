import { z } from 'zod';
import { validarRuc } from '../fiscal/ruc';
import { estadoRegistro, fecha, id, idNulo, montoGs, porcentaje, requerido, textoOpt, tipoIva } from './comunes';

export const personaInput = z
  .object({
    id: id.nullish(),
    tipoPersonaId: id,
    tipoDocumentoId: id,
    numeroDocumento: requerido(20),
    /** Obligatorio si el tipo de documento es RUC (requiere_dv). Se valida módulo 11 en servidor. */
    dv: z.string().regex(/^[0-9]$/).nullish(),
    razonSocial: requerido(200),
    nombres: textoOpt(120),
    apellidos: textoOpt(120),
    nombreFantasia: textoOpt(200),
    esContribuyente: z.boolean().nullish(),
    actividadEconomicaId: idNulo,
    paisId: idNulo,
    ciudadId: idNulo,
    direccion: textoOpt(255),
    numeroCasa: textoOpt(10),
    telefono: textoOpt(30),
    celular: textoOpt(30),
    email: z.email('Email inválido').max(150).nullish().or(z.literal('')),
    observacion: textoOpt(2000),
  })
  .refine((p) => !p.dv || validarRuc(p.numeroDocumento, p.dv), {
    message: 'Dígito verificador del RUC incorrecto',
    path: ['dv'],
  });
export type PersonaInput = z.infer<typeof personaInput>;

/** Cliente: referencia una persona existente (personaId) o crea/actualiza una (persona). */
export const clienteInput = z
  .object({
    id: id.nullish(),
    personaId: id.nullish(),
    persona: personaInput.nullish(),
    codigo: textoOpt(20),
    condicionPagoId: idNulo,
    limiteCreditoGs: montoGs.nullish(),
    observacion: textoOpt(2000),
  })
  .refine((c) => c.personaId || c.persona, { message: 'Indique la persona', path: ['personaId'] });
export type ClienteInput = z.infer<typeof clienteInput>;

export const proveedorInput = z
  .object({
    id: id.nullish(),
    personaId: id.nullish(),
    persona: personaInput.nullish(),
    codigo: textoOpt(20),
    condicionPagoId: idNulo,
    contacto: textoOpt(150),
    observacion: textoOpt(2000),
  })
  .refine((c) => c.personaId || c.persona, { message: 'Indique la persona', path: ['personaId'] });
export type ProveedorInput = z.infer<typeof proveedorInput>;

export const articuloUnidadInput = z.object({
  id: id.nullish(),
  unidadMedidaId: id,
  factorConversion: z.number().positive(),
  codigoBarras: textoOpt(50),
  precioVentaGs: montoGs.nullish(),
  esPredeterminada: z.boolean().nullish(),
});

export const articuloInput = z.object({
  id: id.nullish(),
  codigo: requerido(30),
  codigoBarras: textoOpt(50),
  descripcion: requerido(200),
  descripcionLarga: textoOpt(4000),
  categoriaId: idNulo,
  marcaId: idNulo,
  modeloId: idNulo,
  unidadMedidaId: id,
  tipoIva,
  precioVentaGs: montoGs,
  costoReferenciaGs: montoGs.nullish(),
  controlaStock: z.boolean().nullish(),
  permiteDecimales: z.boolean().nullish(),
  stockMinimo: z.number().nonnegative().nullish(),
  unidades: z.array(articuloUnidadInput).nullish(),
});
export type ArticuloInput = z.infer<typeof articuloInput>;

export const descuentoArticuloInput = z
  .object({
    articuloId: id,
    porcentaje: porcentaje.positive().nullish(),
    montoGs: montoGs.positive().nullish(),
    cantidadMinima: z.number().positive().nullish(),
    topeGs: montoGs.positive().nullish(),
  })
  .refine((a) => (a.porcentaje != null) !== (a.montoGs != null), {
    message: 'Indique porcentaje o monto (uno solo)',
    path: ['porcentaje'],
  });

export const descuentoInput = z
  .object({
    id: id.nullish(),
    codigo: requerido(30),
    nombre: requerido(120),
    descripcion: textoOpt(2000),
    tipo: z.enum(['porcentaje', 'monto']),
    fechaDesde: fecha,
    fechaHasta: fecha,
    prioridad: z.number().int().min(1).max(32000).nullish(),
    acumulable: z.boolean().nullish(),
    todasSucursales: z.boolean().nullish(),
    sucursalIds: z.array(id),
    articulos: z.array(descuentoArticuloInput).min(1, 'Agregue al menos un artículo'),
  })
  .refine((d) => d.fechaHasta >= d.fechaDesde, { message: 'Vigencia inválida', path: ['fechaHasta'] })
  .refine((d) => d.todasSucursales || d.sucursalIds.length > 0, {
    message: 'Seleccione sucursales o marque todas',
    path: ['sucursalIds'],
  })
  .refine(
    (d) => d.articulos.every((a) => (d.tipo === 'porcentaje' ? a.porcentaje != null : a.montoGs != null)),
    { message: 'El valor de cada artículo debe coincidir con el tipo del descuento', path: ['articulos'] },
  );
export type DescuentoInput = z.infer<typeof descuentoInput>;

/** Tablas admitidas por guardarReferencial(tabla, datos). */
export const tablaReferencial = z.enum([
  'marcas',
  'modelos',
  'categorias',
  'unidadesMedida',
  'condicionesPago',
  'depositos',
  'tiposPersona',
  'tiposDocumento',
  'paises',
  'departamentos',
  'ciudades',
  'actividadesEconomicas',
]);
export type TablaReferencial = z.infer<typeof tablaReferencial>;

export const referencialSchemas = {
  marcas: z.object({ id: id.nullish(), nombre: requerido(100), estado: estadoRegistro.nullish() }),
  modelos: z.object({ id: id.nullish(), marcaId: id, nombre: requerido(100), estado: estadoRegistro.nullish() }),
  categorias: z.object({
    id: id.nullish(),
    codigo: requerido(20),
    nombre: requerido(120),
    padreId: idNulo,
    estado: estadoRegistro.nullish(),
  }),
  unidadesMedida: z.object({
    id: id.nullish(),
    codigo: requerido(10),
    nombre: requerido(60),
    codigoSifen: z.number().int().nullish(),
    permiteDecimales: z.boolean().nullish(),
  }),
  condicionesPago: z
    .object({
      id: id.nullish(),
      codigo: requerido(20),
      nombre: requerido(80),
      condicion: z.enum(['contado', 'credito']),
      diasPlazo: z.number().int().min(0).max(3650).nullish(),
      cantidadCuotas: z.number().int().min(1).max(120).nullish(),
      diasEntreCuotas: z.number().int().min(1).max(365).nullish(),
      estado: estadoRegistro.nullish(),
    })
    .refine((c) => c.condicion === 'credito' || ((c.cantidadCuotas ?? 1) === 1 && (c.diasPlazo ?? 0) === 0), {
      message: 'Contado: 1 cuota y 0 días',
      path: ['cantidadCuotas'],
    }),
  depositos: z.object({
    id: id.nullish(),
    sucursalId: id,
    codigo: requerido(20),
    nombre: requerido(120),
    esPrincipal: z.boolean().nullish(),
    permiteVenta: z.boolean().nullish(),
    estado: estadoRegistro.nullish(),
  }),
  tiposPersona: z.object({ id: id.nullish(), codigo: requerido(2), nombre: requerido(60) }),
  tiposDocumento: z.object({
    id: id.nullish(),
    codigo: requerido(10),
    nombre: requerido(80),
    codigoSifen: z.number().int().nullish(),
    requiereDv: z.boolean().nullish(),
  }),
  paises: z.object({
    id: id.nullish(),
    codigoIso: z.string().regex(/^[A-Z]{3}$/),
    nombre: requerido(80),
    nacionalidad: textoOpt(80),
  }),
  departamentos: z.object({ id: id.nullish(), paisId: id, codigo: z.number().int(), nombre: requerido(80) }),
  ciudades: z.object({
    id: id.nullish(),
    departamentoId: id,
    nombre: requerido(100),
    codigoSifen: z.number().int().nullish(),
  }),
  actividadesEconomicas: z.object({ id: id.nullish(), codigo: requerido(10), descripcion: requerido(255) }),
} satisfies Record<TablaReferencial, z.ZodType>;

export type ReferencialInput<T extends TablaReferencial> = z.infer<(typeof referencialSchemas)[T]>;

/** Entidades admitidas por cambiarEstado(entidad, id, estado). */
export const entidadEstado = z.enum([
  'personas',
  'clientes',
  'proveedores',
  'articulos',
  'descuentos',
  'marcas',
  'modelos',
  'categorias',
  'condicionesPago',
  'depositos',
  'usuarios',
  'roles',
  'sucursales',
  'cajas',
  'timbrados',
  'puntosExpedicion',
  'planCuentas',
]);
export type EntidadEstado = z.infer<typeof entidadEstado>;
