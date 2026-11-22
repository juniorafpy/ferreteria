'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { requirePermiso } from '../auth/permisos';
import { ctxDe, type Sesion } from '../auth/session';
import { accion, validar } from '../lib/accion';
import type { ActionResult } from '../lib/result';
import { enviarFacturaSifen } from '../services/sifen';
import * as svc from '../services/ventas';
import { id as idSchema, motivo as motivoSchema } from '../validation/comunes';
import { facturaVentaInput, presupuestoInput, type FacturaVentaInput, type PresupuestoInput } from '../validation/ventas';

const rv = () => revalidatePath('/ventas', 'layout');

export async function guardarPresupuesto(input: PresupuestoInput): Promise<ActionResult<{ id: number; totalGs: number }>> {
  return accion(async () => {
    const s = await requirePermiso('ventas.presupuesto.crear');
    const d = validar(presupuestoInput, input);
    const r = await db.transaction((tx) => svc.guardarPresupuesto(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function confirmarPresupuesto(id: number): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('ventas.presupuesto.confirmar');
    const r = await db.transaction((tx) => svc.confirmarPresupuesto(tx, ctxDe(s), validar(idSchema, id)));
    rv();
    return r;
  });
}

export async function anularPresupuesto(id: number, motivo: string): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('ventas.presupuesto.anular');
    const r = await db.transaction((tx) => svc.anularPresupuesto(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rv();
    return r;
  });
}

/** Crea una factura BORRADOR con los pendientes del presupuesto. */
export async function crearFacturaDesdePresupuesto(presupuestoId: number): Promise<ActionResult<{ id: number; totalGs: number }>> {
  return accion(async () => {
    const s = await requirePermiso('ventas.factura.crear');
    const r = await db.transaction((tx) => svc.crearFacturaDesdePresupuesto(tx, ctxDe(s), validar(idSchema, presupuestoId)));
    rv();
    return r;
  });
}

export async function guardarFacturaVenta(input: FacturaVentaInput): Promise<ActionResult<{ id: number; totalGs: number }>> {
  return accion(async () => {
    const s = await requirePermiso('ventas.factura.crear');
    const d = validar(facturaVentaInput, input);
    const r = await db.transaction((tx) => svc.guardarFacturaVenta(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

/** Envío a SIFEN posterior al commit (no revierte la venta si falla; queda `pendiente`). */
async function intentarEnvioSifen(s: Sesion, facturaId: number) {
  try {
    return await db.transaction((tx) => enviarFacturaSifen(tx, ctxDe(s), facturaId));
  } catch (e) {
    console.error('[sifen] envío diferido falló', e);
    return null;
  }
}

export type ResultadoConfirmacionVenta = {
  id: number;
  numero: string;
  cdc: string | null;
  totalGs: number;
  estadoSifen: string;
  mensajeSifen?: string | null;
};

export async function confirmarFacturaVenta(id: number): Promise<ActionResult<ResultadoConfirmacionVenta>> {
  return accion(async () => {
    const s = await requirePermiso('ventas.factura.confirmar');
    const fid = validar(idSchema, id);
    const r = await db.transaction((tx) => svc.confirmarFacturaVenta(tx, ctxDe(s), fid));
    let estadoSifen: string = r.estadoSifen;
    let mensajeSifen: string | null = null;
    if (r.cdc) {
      const env = await intentarEnvioSifen(s, fid);
      if (env) {
        estadoSifen = env.estadoSifen;
        mensajeSifen = env.mensaje;
      }
    }
    rv();
    revalidatePath('/caja', 'layout');
    return { ...r, estadoSifen, mensajeSifen };
  });
}

export async function anularFacturaVenta(id: number, motivo: string): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('ventas.factura.anular');
    const r = await db.transaction((tx) => svc.anularFacturaVenta(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rv();
    revalidatePath('/caja', 'layout');
    return r;
  });
}

/** Reenvía (o envía) a SIFEN una factura pendiente/rechazada. */
export async function reenviarSifen(id: number): Promise<ActionResult<{ id: number; estadoSifen: string; mensaje: string }>> {
  return accion(async () => {
    const s = await requirePermiso(['ventas.sifen.gestionar', 'ventas.factura.confirmar']);
    const r = await db.transaction((tx) => enviarFacturaSifen(tx, ctxDe(s), validar(idSchema, id)));
    rv();
    return r;
  });
}
