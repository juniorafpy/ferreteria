import { z } from 'zod';
import {
  cantidad,
  cdc,
  condicionOperacion,
  fecha,
  id,
  idNulo,
  lineaComercial,
  montoPositivo,
  numeroComprobante,
  textoOpt,
  timbrado,
} from './comunes';

export const pedidoCompraInput = z.object({
  id: id.nullish(),
  fecha,
  proveedorId: idNulo,
  depositoId: idNulo,
  observacion: textoOpt(2000),
  detalles: z
    .array(
      z.object({
        articuloId: id,
        unidadMedidaId: idNulo,
        cantidad,
        observacion: textoOpt(255),
      }),
    )
    .min(1, 'Agregue al menos un artículo'),
});
export type PedidoCompraInput = z.infer<typeof pedidoCompraInput>;

/** Línea de compra: precio unitario CON IVA (como figura en el comprobante del proveedor). */
export const lineaCompra = lineaComercial.extend({
  precioUnitarioGs: z.number().int().nonnegative(),
});

export const ordenCompraInput = z
  .object({
    id: id.nullish(),
    fecha,
    proveedorId: id,
    condicionPagoId: idNulo,
    depositoId: idNulo,
    fechaEntregaEstimada: fecha.nullish(),
    observacion: textoOpt(2000),
    /** Pedidos aprobados a consolidar. Si `detalles` viene vacío se importan sus pendientes. */
    pedidoIds: z.array(id).nullish(),
    /** En líneas importadas, `detalleOrigenId` = pedido_compra_detalles.id. */
    detalles: z.array(lineaCompra).nullish(),
  })
  .refine((o) => (o.detalles?.length ?? 0) > 0 || (o.pedidoIds?.length ?? 0) > 0, {
    message: 'Agregue artículos o importe pedidos',
    path: ['detalles'],
  });
export type OrdenCompraInput = z.infer<typeof ordenCompraInput>;

export const facturaCompraInput = z
  .object({
    id: id.nullish(),
    proveedorId: id,
    /** OC origen. Si `detalles` viene vacío se importan los pendientes de facturar. */
    ordenCompraId: idNulo,
    timbrado,
    timbradoVencimiento: fecha.nullish(),
    /** 001-001-0000001 */
    numeroComprobante,
    cdc: cdc.nullish(),
    fechaEmision: fecha,
    condicionOperacion,
    condicionPagoId: idNulo,
    fechaVencimiento: fecha.nullish(),
    depositoId: idNulo,
    observacion: textoOpt(2000),
    /** En líneas importadas, `detalleOrigenId` = orden_compra_detalles.id. */
    detalles: z.array(lineaCompra).nullish(),
  })
  .refine((f) => (f.detalles?.length ?? 0) > 0 || !!f.ordenCompraId, {
    message: 'Agregue artículos o seleccione una orden de compra',
    path: ['detalles'],
  });
export type FacturaCompraInput = z.infer<typeof facturaCompraInput>;

export const recepcionInput = z.object({
  id: id.nullish(),
  fecha,
  facturaCompraId: id,
  depositoId: id,
  observacion: textoOpt(2000),
  /** Vacío = recibir todo lo pendiente. `detalleOrigenId` = factura_compra_detalles.id; cantidad en unidad del documento. */
  detalles: z.array(z.object({ detalleOrigenId: id, cantidad })).nullish(),
});
export type RecepcionInput = z.infer<typeof recepcionInput>;

export const ordenPagoInput = z.object({
  fecha,
  proveedorId: id,
  medioPago: z.enum(['efectivo', 'transferencia']),
  referencia: textoOpt(100),
  banco: textoOpt(100),
  observacion: textoOpt(2000),
  cuentas: z.array(z.object({ cuentaPagarId: id, montoGs: montoPositivo })).min(1, 'Seleccione cuentas a pagar'),
});
export type OrdenPagoInput = z.infer<typeof ordenPagoInput>;

export const filtroCompras = z
  .object({
    q: z.string().trim().max(100).nullish(),
    desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
    hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
    estado: z.string().max(30).nullish(),
    proveedorId: id.nullish(),
    /** CxP: solo cuotas con saldo. */
    soloPendientes: z.boolean().nullish(),
    limite: z.number().int().positive().max(1000).nullish(),
  })
  .nullish();
export type FiltroCompras = z.infer<typeof filtroCompras>;
