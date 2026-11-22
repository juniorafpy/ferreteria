import { z } from 'zod';
import { validarRuc } from '../fiscal/ruc';
import { REGEX_NUMERO_FACTURA, validarCdc } from '../fiscal/sifen';

export const id = z.number().int().positive();
export const idOpt = id.nullish();
export const idNulo = id.nullish();

/** Monto en Gs: entero no negativo. */
export const montoGs = z.number().int('Debe ser un monto entero en Gs').nonnegative('No puede ser negativo');
export const montoPositivo = montoGs.positive('Debe ser mayor a cero');

export const cantidad = z.number().positive('La cantidad debe ser mayor a cero').max(99_999_999_999);
export const porcentaje = z.number().min(0).max(100);

export const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha con formato AAAA-MM-DD');
export const texto = (max: number) => z.string().trim().max(max);
export const textoOpt = (max: number) => z.string().trim().max(max).nullish();
export const requerido = (max: number) => z.string().trim().min(1, 'Requerido').max(max);

export const estadoRegistro = z.enum(['activo', 'inactivo']);
export const tipoIva = z.enum(['iva10', 'iva5', 'exenta']);
export const condicionOperacion = z.enum(['contado', 'credito']);
export const medioPago = z.enum(['efectivo', 'transferencia', 'tarjeta', 'qr']);

/** 001-001-0000001 */
export const numeroComprobante = z
  .string()
  .trim()
  .regex(REGEX_NUMERO_FACTURA, 'Formato 001-001-0000001')
  .refine((v) => Number(v.slice(-7)) >= 1, 'Número debe ser >= 1');

export const timbrado = z.string().regex(/^\d{8}$/, 'Timbrado de 8 dígitos');
export const cdc = z.string().refine(validarCdc, 'CDC inválido (44 dígitos con DV módulo 11)');

/** Objeto con ruc + dv validado con el algoritmo de la SET. */
export const rucConDv = z
  .object({ ruc: z.string().trim().regex(/^[0-9A-Za-z]{1,8}$/, 'RUC inválido'), dv: z.string().regex(/^[0-9]$/) })
  .refine((v) => validarRuc(v.ruc, v.dv), { message: 'Dígito verificador incorrecto', path: ['dv'] });

export const motivo = z.string().trim().min(3, 'Indique el motivo').max(255);

/** Filtros comunes para listados. */
export const filtroListado = z
  .object({
    q: z.string().trim().max(100).nullish(),
    desde: fecha.nullish(),
    hasta: fecha.nullish(),
    estado: z.string().max(30).nullish(),
    proveedorId: id.nullish(),
    clienteId: id.nullish(),
    limite: z.number().int().positive().max(1000).nullish(),
    pagina: z.number().int().positive().nullish(),
  })
  .nullish();
export type FiltroListado = z.infer<typeof filtroListado>;

/** Línea comercial genérica (presupuesto / factura de venta / OC / factura de compra). */
export const lineaComercial = z.object({
  /** Detalle origen (pedido/OC/presupuesto) cuando se importa. */
  detalleOrigenId: id.nullish(),
  articuloId: id,
  descripcion: texto(200).nullish(),
  unidadMedidaId: id.nullish(),
  factorConversion: z.number().positive().nullish(),
  cantidad,
  /** Si se omite se toma el precio de lista. */
  precioUnitarioGs: montoGs.nullish(),
  /** Si se omite se aplica el descuento automático vigente. */
  descuentoGs: montoGs.nullish(),
  tipoIva: tipoIva.nullish(),
});
export type LineaComercialInput = z.infer<typeof lineaComercial>;
