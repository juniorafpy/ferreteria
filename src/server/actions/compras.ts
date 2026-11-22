'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { requirePermiso } from '../auth/permisos';
import { ctxDe } from '../auth/session';
import { accion, validar } from '../lib/accion';
import type { ActionResult } from '../lib/result';
import * as svc from '../services/compras';
import { id as idSchema, motivo as motivoSchema } from '../validation/comunes';
import {
  facturaCompraInput,
  ordenCompraInput,
  ordenPagoInput,
  pedidoCompraInput,
  recepcionInput,
  type FacturaCompraInput,
  type OrdenCompraInput,
  type OrdenPagoInput,
  type PedidoCompraInput,
  type RecepcionInput,
} from '../validation/compras';

type R = ActionResult<{ id: number }>;
const rv = () => revalidatePath('/compras', 'layout');

export async function guardarPedidoCompra(input: PedidoCompraInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.pedido.crear');
    const d = validar(pedidoCompraInput, input);
    const r = await db.transaction((tx) => svc.guardarPedidoCompra(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function confirmarPedidoCompra(id: number): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.pedido.confirmar');
    const r = await db.transaction((tx) => svc.confirmarPedidoCompra(tx, ctxDe(s), validar(idSchema, id)));
    rv();
    return r;
  });
}

/** Extra (no en el contrato): anula un pedido sin órdenes. */
export async function anularPedidoCompra(id: number, motivo: string): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.pedido.anular');
    const r = await db.transaction((tx) => svc.anularPedidoCompra(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rv();
    return r;
  });
}

/** Admite `pedidoIds[]`: si `detalles` viene vacío importa los pendientes de esos pedidos. */
export async function guardarOrdenCompra(input: OrdenCompraInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.orden.crear');
    const d = validar(ordenCompraInput, input);
    const r = await db.transaction((tx) => svc.guardarOrdenCompra(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function confirmarOrdenCompra(id: number): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.orden.confirmar');
    const r = await db.transaction((tx) => svc.confirmarOrdenCompra(tx, ctxDe(s), validar(idSchema, id)));
    rv();
    return r;
  });
}

/** Extra (no en el contrato): anula una OC sin facturas (devuelve pendientes al pedido). */
export async function anularOrdenCompra(id: number, motivo: string): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.orden.anular');
    const r = await db.transaction((tx) => svc.anularOrdenCompra(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rv();
    return r;
  });
}

/** Admite `ordenCompraId`: si `detalles` viene vacío importa los pendientes de facturar. */
export async function guardarFacturaCompra(input: FacturaCompraInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.factura.crear');
    const d = validar(facturaCompraInput, input);
    const r = await db.transaction((tx) => svc.guardarFacturaCompra(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function confirmarFacturaCompra(id: number): Promise<ActionResult<{ id: number; asientoId: number | null }>> {
  return accion(async () => {
    const s = await requirePermiso('compras.factura.confirmar');
    const r = await db.transaction((tx) => svc.confirmarFacturaCompra(tx, ctxDe(s), validar(idSchema, id)));
    rv();
    return r;
  });
}

export async function anularFacturaCompra(id: number, motivo: string): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.factura.anular');
    const r = await db.transaction((tx) => svc.anularFacturaCompra(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rv();
    return r;
  });
}

export async function guardarRecepcion(input: RecepcionInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.recepcion.crear');
    const d = validar(recepcionInput, input);
    const r = await db.transaction((tx) => svc.guardarRecepcion(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function confirmarRecepcion(id: number): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.recepcion.confirmar');
    const r = await db.transaction((tx) => svc.confirmarRecepcion(tx, ctxDe(s), validar(idSchema, id)));
    rv();
    revalidatePath('/inventario', 'layout');
    return r;
  });
}

export async function anularRecepcion(id: number, motivo: string): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.recepcion.anular');
    const r = await db.transaction((tx) => svc.anularRecepcion(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rv();
    return r;
  });
}

/** Registra y confirma una orden de pago (cuentas + monto por cuota). */
export async function registrarOrdenPago(input: OrdenPagoInput): Promise<ActionResult<{ id: number; numero: number }>> {
  return accion(async () => {
    const s = await requirePermiso(['compras.pago.confirmar', 'compras.pago.crear']);
    const d = validar(ordenPagoInput, input);
    const r = await db.transaction((tx) => svc.registrarOrdenPago(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function anularOrdenPago(id: number, motivo: string): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('compras.pago.anular');
    const r = await db.transaction((tx) => svc.anularOrdenPago(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rv();
    return r;
  });
}
