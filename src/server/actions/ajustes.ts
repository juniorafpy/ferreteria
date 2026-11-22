'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { requirePermiso } from '../auth/permisos';
import { ctxDe } from '../auth/session';
import { accion, validar } from '../lib/accion';
import type { ActionResult } from '../lib/result';
import * as org from '../services/organizacion';
import * as stk from '../services/stock';
import {
  ajusteStockInput,
  configuracionSifenInput,
  empresaInput,
  parametrosInput,
  puntoExpedicionInput,
  rolInput,
  sucursalInput,
  timbradoInput,
  transferenciaInput,
  usuarioInput,
  type AjusteStockInput,
  type ConfiguracionSifenInput,
  type EmpresaInput,
  type ParametrosInput,
  type PuntoExpedicionInput,
  type RolInput,
  type SucursalInput,
  type TimbradoInput,
  type TransferenciaInput,
  type UsuarioInput,
} from '../validation/ajustes';
import { id as idSchema, motivo as motivoSchema } from '../validation/comunes';

type R = ActionResult<{ id: number }>;
const rv = () => revalidatePath('/ajustes', 'layout');
const rvStock = () => {
  rv();
  revalidatePath('/inventario', 'layout');
};

/* ---------------- Organización ---------------- */

export async function guardarEmpresa(input: EmpresaInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('organizacion.empresa.gestionar');
    const d = validar(empresaInput, input);
    const r = await db.transaction((tx) => org.guardarEmpresa(tx, ctxDe(s), d));
    revalidatePath('/', 'layout');
    return r;
  });
}

export async function guardarSucursal(input: SucursalInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('organizacion.sucursal.gestionar');
    const d = validar(sucursalInput, input);
    const r = await db.transaction((tx) => org.guardarSucursal(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function guardarTimbrado(input: TimbradoInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('organizacion.timbrado.gestionar');
    const d = validar(timbradoInput, input);
    const r = await db.transaction((tx) => org.guardarTimbrado(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function guardarPuntoExpedicion(input: PuntoExpedicionInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso(['organizacion.sucursal.gestionar', 'organizacion.timbrado.gestionar']);
    const d = validar(puntoExpedicionInput, input);
    const r = await db.transaction((tx) => org.guardarPuntoExpedicion(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

export async function guardarConfiguracionSifen(input: ConfiguracionSifenInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('organizacion.sifen.gestionar');
    const d = validar(configuracionSifenInput, input);
    const r = await db.transaction((tx) => org.guardarConfiguracionSifen(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

/* ---------------- Seguridad ---------------- */

export async function guardarUsuario(input: UsuarioInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('seguridad.usuario.gestionar');
    const d = validar(usuarioInput, input);
    const r = await db.transaction((tx) => org.guardarUsuario(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

/** Rol con `permisos` (códigos) y `descuentoManualMaxPct`. */
export async function guardarRol(input: RolInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('seguridad.rol.gestionar');
    const d = validar(rolInput, input);
    const r = await db.transaction((tx) => org.guardarRol(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

/* ---------------- Sistema ---------------- */

export async function guardarParametros(input: ParametrosInput): Promise<ActionResult<{ cantidad: number }>> {
  return accion(async () => {
    const s = await requirePermiso('organizacion.parametros.gestionar');
    const d = validar(parametrosInput, input);
    const r = await db.transaction((tx) => org.guardarParametros(tx, ctxDe(s), d));
    rv();
    return r;
  });
}

/* ---------------- Stock ---------------- */

export async function guardarAjusteStock(input: AjusteStockInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('ajustes.stock');
    const d = validar(ajusteStockInput, input);
    const r = await db.transaction((tx) => stk.guardarAjusteStock(tx, ctxDe(s), d));
    rvStock();
    return r;
  });
}

export async function confirmarAjusteStock(id: number): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('ajustes.stock');
    const r = await db.transaction((tx) => stk.confirmarAjusteStock(tx, ctxDe(s), validar(idSchema, id)));
    rvStock();
    return r;
  });
}

export async function anularAjusteStock(id: number, motivo: string): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('ajustes.stock.anular');
    const r = await db.transaction((tx) => stk.anularAjusteStock(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rvStock();
    return r;
  });
}

export async function guardarTransferencia(input: TransferenciaInput): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('inventario.transferencia.crear');
    const d = validar(transferenciaInput, input);
    const r = await db.transaction((tx) => stk.guardarTransferencia(tx, ctxDe(s), d));
    rvStock();
    return r;
  });
}

export async function enviarTransferencia(id: number): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('inventario.transferencia.enviar');
    const r = await db.transaction((tx) => stk.enviarTransferencia(tx, ctxDe(s), validar(idSchema, id)));
    rvStock();
    return r;
  });
}

/** Recepción total en la sucursal destino (la sesión debe estar en la sucursal destino). */
export async function recibirTransferencia(id: number): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('inventario.transferencia.recibir');
    const r = await db.transaction((tx) => stk.recibirTransferencia(tx, ctxDe(s), validar(idSchema, id)));
    rvStock();
    return r;
  });
}

export async function anularTransferencia(id: number, motivo: string): Promise<R> {
  return accion(async () => {
    const s = await requirePermiso('inventario.transferencia.anular');
    const r = await db.transaction((tx) => stk.anularTransferencia(tx, ctxDe(s), validar(idSchema, id), validar(motivoSchema, motivo)));
    rvStock();
    return r;
  });
}
