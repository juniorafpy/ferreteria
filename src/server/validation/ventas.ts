import { z } from 'zod';
import { cantidad, condicionOperacion, fecha, id, idNulo, lineaComercial, textoOpt } from './comunes';

export const presupuestoInput = z.object({
  id: id.nullish(),
  fecha,
  fechaValidez: fecha.nullish(),
  clienteId: idNulo,
  vendedorId: idNulo,
  condicionOperacion,
  observacion: textoOpt(2000),
  detalles: z.array(lineaComercial).min(1, 'Agregue al menos un artículo'),
});
export type PresupuestoInput = z.infer<typeof presupuestoInput>;

export const facturaVentaInput = z
  .object({
    id: id.nullish(),
    presupuestoId: idNulo,
    clienteId: idNulo,
    vendedorId: idNulo,
    /** Por defecto: depósito de la caja abierta o principal de la sucursal. */
    depositoId: idNulo,
    condicionOperacion,
    /** Crédito: condición de pago (define cuotas/plazo) o cuotas explícitas. */
    condicionPagoId: idNulo,
    cantidadCuotas: z.number().int().min(1).max(120).nullish(),
    plazoDias: z.number().int().min(0).max(3650).nullish(),
    observacion: textoOpt(2000),
    /** `detalleOrigenId` = presupuesto_detalles.id cuando proviene de un presupuesto. */
    detalles: z.array(lineaComercial).min(1, 'Agregue al menos un artículo'),
  })
  .refine((f) => f.condicionOperacion === 'contado' || !!f.clienteId, {
    message: 'La venta a crédito requiere cliente',
    path: ['clienteId'],
  });
export type FacturaVentaInput = z.infer<typeof facturaVentaInput>;

export const resolverDescuentoInput = z.object({
  articuloId: id,
  cantidad,
  fecha,
  sucursalId: id.nullish(),
  /** Precio unitario de la línea (por defecto precio de lista del artículo). */
  precioUnitarioGs: z.number().int().nonnegative().nullish(),
});
export type ResolverDescuentoInput = z.infer<typeof resolverDescuentoInput>;

export const filtroDocumentosVenta = z
  .object({
    desde: fecha.nullish(),
    hasta: fecha.nullish(),
    clienteId: id.nullish(),
    estado: z.string().max(30).nullish(),
    estadoSifen: z.string().max(30).nullish(),
    q: z.string().max(100).nullish(),
    limite: z.number().int().positive().max(1000).nullish(),
  })
  .nullish();
export type FiltroDocumentosVenta = z.infer<typeof filtroDocumentosVenta>;
