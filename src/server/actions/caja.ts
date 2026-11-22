'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { requirePermiso } from '../auth/permisos';
import { ctxDe } from '../auth/session';
import { accion, validar } from '../lib/accion';
import type { ActionResult } from '../lib/result';
import * as svc from '../services/caja';
import {
  abrirCajaInput,
  cerrarCajaInput,
  cobroInput,
  type AbrirCajaInput,
  type CerrarCajaInput,
  type CobroInput,
} from '../validation/caja';
import { id as idSchema, motivo as motivoSchema } from '../validation/comunes';

const rv = () => {
  revalidatePath('/caja', 'layout');
  revalidatePath('/ventas', 'layout');
};

export async function abrirCaja(input: AbrirCajaInput): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('caja.sesion.abrir');
    const d = validar(abrirCajaInput, input);
    const r = await db.transaction((tx) => svc.abrirCaja(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

/** Cierra la sesión con arqueo por medio de pago. */
export async function cerrarCaja(
  input: CerrarCajaInput,
): Promise<ActionResult<{ id: number; sistema: Record<'efectivo' | 'transferencia' | 'tarjeta' | 'qr', number>; diferenciaEfectivoGs: number }>> {
  return accion(async () => {
    const s = await requirePermiso('caja.sesion.cerrar');
    const d = validar(cerrarCajaInput, input);
    const r = await db.transaction((tx) => svc.cerrarCaja(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

/** Cobro multi-medio aplicado a cuentas a cobrar (requiere caja abierta del usuario). */
export async function registrarCobro(
  input: CobroInput,
): Promise<ActionResult<{ id: number; numero: number; totalGs: number; vueltoGs: number }>> {
  return accion(async () => {
    const s = await requirePermiso('caja.cobro.crear');
    const d = validar(cobroInput, input);
    const r = await db.transaction((tx) => svc.registrarCobro(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function anularCobro(id: number, motivo: string): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('caja.cobro.anular');
    const r = await db.transaction((tx) => svc.anularCobro(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rv();
    return r;
  });
}
