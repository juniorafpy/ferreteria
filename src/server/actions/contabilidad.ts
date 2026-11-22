'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { requirePermiso } from '../auth/permisos';
import { ctxDe } from '../auth/session';
import { accion, validar } from '../lib/accion';
import type { ActionResult } from '../lib/result';
import * as svc from '../services/contabilidad';
import { id as idSchema, motivo as motivoSchema } from '../validation/comunes';
import {
  asientoManualInput,
  configuracionContableInput,
  cuentaInput,
  type AsientoManualInput,
  type ConfiguracionContableInput,
  type CuentaInput,
} from '../validation/contabilidad';

const rv = () => revalidatePath('/contabilidad', 'layout');

export async function guardarCuenta(input: CuentaInput): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('contabilidad.plan_cuentas.gestionar');
    const d = validar(cuentaInput, input);
    const r = await db.transaction((tx) =>
      svc.guardarCuenta(tx, ctxDe(s), { ...d, id: d.id ?? undefined, estado: d.estado ?? undefined }),
    );
    rv();
    return r;
  });
}

export async function guardarConfiguracionContable(input: ConfiguracionContableInput): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('contabilidad.configuracion.gestionar');
    const d = validar(configuracionContableInput, input);
    const r = await db.transaction((tx) => svc.guardarConfiguracionContable(tx, ctxDe(s), { ...d, id: d.id ?? undefined }));
    rv();
    return r;
  });
}

/** Asiento manual: valida Debe = Haber (Zod y servicio). `confirmar: false` lo deja en borrador. */
export async function guardarAsientoManual(input: AsientoManualInput): Promise<ActionResult<{ id: number; numero: number }>> {
  return accion(async () => {
    const s = await requirePermiso('contabilidad.asiento.crear');
    const d = validar(asientoManualInput, input);
    const r = await db.transaction((tx) =>
      svc.guardarAsientoManual(tx, ctxDe(s), {
        id: d.id ?? undefined,
        fecha: d.fecha,
        concepto: d.concepto,
        confirmar: d.confirmar ?? true,
        lineas: d.lineas.map((l) => ({ cuentaId: l.cuentaId, debeGs: l.debeGs, haberGs: l.haberGs, glosa: l.glosa })),
      }),
    );
    rv();
    return r;
  });
}

/** Anula un asiento manual (contra-asiento si está confirmado). */
export async function anularAsiento(id: number, motivo: string): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('contabilidad.asiento.anular');
    const r = await db.transaction((tx) => svc.anularAsiento(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rv();
    return { id: r.id };
  });
}
