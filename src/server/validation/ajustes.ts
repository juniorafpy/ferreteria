import { z } from 'zod';
import { cantidad, estadoRegistro, fecha, id, idNulo, porcentaje, requerido, rucConDv, textoOpt, timbrado } from './comunes';

/* ---------- Organización ---------- */

export const empresaInput = z.object({
  id: id.nullish(),
  ruc: rucConDv,
  razonSocial: requerido(200),
  nombreFantasia: textoOpt(200),
  direccion: textoOpt(255),
  numeroCasa: textoOpt(10),
  ciudadId: idNulo,
  telefono: textoOpt(30),
  email: textoOpt(150),
  actividadEconomicaId: idNulo,
  estado: estadoRegistro.nullish(),
});
export type EmpresaInput = z.infer<typeof empresaInput>;

export const sucursalInput = z.object({
  id: id.nullish(),
  codigo: requerido(10),
  nombre: requerido(120),
  direccion: textoOpt(255),
  ciudadId: idNulo,
  telefono: textoOpt(30),
  email: textoOpt(150),
  esCasaMatriz: z.boolean().nullish(),
  estado: estadoRegistro.nullish(),
  /** Establecimiento SIFEN de la sucursal (3 dígitos). */
  establecimiento: z
    .object({ codigo: z.string().regex(/^\d{3}$/), denominacion: requerido(120), direccion: textoOpt(255) })
    .nullish(),
});
export type SucursalInput = z.infer<typeof sucursalInput>;

export const timbradoInput = z
  .object({
    id: id.nullish(),
    numero: timbrado,
    modalidad: z.enum(['electronica', 'autoimpresor', 'preimpreso']),
    fechaInicioVigencia: fecha,
    fechaFinVigencia: fecha.nullish(),
    estado: estadoRegistro.nullish(),
  })
  .refine((t) => !t.fechaFinVigencia || t.fechaFinVigencia >= t.fechaInicioVigencia, {
    message: 'Vigencia inválida',
    path: ['fechaFinVigencia'],
  });
export type TimbradoInput = z.infer<typeof timbradoInput>;

export const puntoExpedicionInput = z.object({
  id: id.nullish(),
  sucursalId: id,
  establecimientoId: id,
  codigo: z.string().regex(/^\d{3}$/, '3 dígitos'),
  descripcion: textoOpt(120),
  estado: estadoRegistro.nullish(),
  /** Numeraciones (timbrado + tipo de documento) a crear/actualizar para el punto. */
  numeraciones: z
    .array(
      z.object({
        timbradoId: id,
        tipoDocumento: z.enum(['factura', 'autofactura', 'nota_credito', 'nota_debito', 'nota_remision']),
        numeroDesde: z.number().int().min(1).max(9_999_999).nullish(),
        numeroHasta: z.number().int().min(1).max(9_999_999).nullish(),
      }),
    )
    .nullish(),
});
export type PuntoExpedicionInput = z.infer<typeof puntoExpedicionInput>;

export const configuracionSifenInput = z.object({
  id: id.nullish(),
  sucursalId: idNulo,
  ambiente: z.enum(['test', 'produccion']),
  idCsc: textoOpt(10),
  /** Nombre de la variable de entorno que contiene el CSC (no el secreto en sí). */
  cscRef: textoOpt(120),
  certificadoRuta: textoOpt(255),
  certificadoPasswordRef: textoOpt(120),
  urlWsRecepcion: textoOpt(255),
  urlWsConsulta: textoOpt(255),
  urlQrBase: textoOpt(255),
  envioPorLote: z.boolean().nullish(),
  activo: z.boolean().nullish(),
});
export type ConfiguracionSifenInput = z.infer<typeof configuracionSifenInput>;

/* ---------- Seguridad ---------- */

export const usuarioInput = z.object({
  id: id.nullish(),
  usuario: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,60}$/, 'Usuario en minúsculas (3-60)'),
  nombre: requerido(150),
  email: textoOpt(150),
  /** Obligatoria al crear; si se omite al editar no cambia. */
  password: z.string().min(8, 'Mínimo 8 caracteres').max(200).nullish(),
  sucursalPredeterminadaId: idNulo,
  estado: estadoRegistro.nullish(),
  /** sucursalId null = el rol aplica en todas las sucursales. */
  roles: z.array(z.object({ rolId: id, sucursalId: idNulo })).nullish(),
});
export type UsuarioInput = z.infer<typeof usuarioInput>;

export const rolInput = z.object({
  id: id.nullish(),
  codigo: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,30}$/),
  nombre: requerido(80),
  descripcion: textoOpt(255),
  descuentoManualMaxPct: porcentaje,
  estado: estadoRegistro.nullish(),
  /** Códigos de permiso. */
  permisos: z.array(z.string().max(80)),
});
export type RolInput = z.infer<typeof rolInput>;

/* ---------- Sistema ---------- */

export const parametrosInput = z.object({
  /** null = parámetro global de la empresa. */
  sucursalId: idNulo,
  valores: z.array(z.object({ clave: requerido(80), valor: z.string().max(4000), descripcion: textoOpt(255) })),
});
export type ParametrosInput = z.infer<typeof parametrosInput>;

export const ajusteStockInput = z.object({
  id: id.nullish(),
  fecha,
  depositoId: id,
  tipoAjuste: z.enum(['merma', 'sobrante']),
  motivo: requerido(255),
  observacion: textoOpt(2000),
  detalles: z
    .array(z.object({ articuloId: id, cantidad, observacion: textoOpt(255) }))
    .min(1, 'Agregue al menos un artículo'),
});
export type AjusteStockInput = z.infer<typeof ajusteStockInput>;

export const transferenciaInput = z
  .object({
    id: id.nullish(),
    fecha,
    depositoOrigenId: id,
    depositoDestinoId: id,
    observacion: textoOpt(2000),
    detalles: z.array(z.object({ articuloId: id, cantidad })).min(1, 'Agregue al menos un artículo'),
  })
  .refine((t) => t.depositoOrigenId !== t.depositoDestinoId, {
    message: 'Origen y destino deben ser distintos',
    path: ['depositoDestinoId'],
  });
export type TransferenciaInput = z.infer<typeof transferenciaInput>;

export const filtroStock = z
  .object({
    q: z.string().max(100).nullish(),
    depositoId: id.nullish(),
    sucursalId: id.nullish(),
    soloBajoMinimo: z.boolean().nullish(),
    limite: z.number().int().positive().max(5000).nullish(),
  })
  .nullish();
export type FiltroStock = z.infer<typeof filtroStock>;
