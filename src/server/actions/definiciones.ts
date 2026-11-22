'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db';
import { requirePermiso, tienePermiso } from '../auth/permisos';
import { ctxDe, requireSesion } from '../auth/session';
import { accion, validar } from '../lib/accion';
import { ErrorNegocio, type ActionResult } from '../lib/result';
import * as svc from '../services/definiciones';
import {
  articuloInput,
  clienteInput,
  descuentoInput,
  personaInput,
  proveedorInput,
  referencialSchemas,
  tablaReferencial,
  type ArticuloInput,
  type ClienteInput,
  type DescuentoInput,
  type PersonaInput,
  type ProveedorInput,
  type TablaReferencial,
} from '../validation/definiciones';
import { estadoRegistro, id as idSchema } from '../validation/comunes';

const rv = (ruta: string) => revalidatePath(`/definiciones/${ruta}`, 'layout');

export async function guardarPersona(input: PersonaInput): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso(['personas.cliente.gestionar', 'personas.proveedor.gestionar']);
    const d = validar(personaInput, input);
    const r = await db.transaction((tx) => svc.guardarPersona(tx, ctxDe(s), d));
    rv('personas');
    return r;
  });
}

export async function guardarCliente(input: ClienteInput): Promise<ActionResult<{ id: number; personaId: number }>> {
  return accion(async () => {
    const s = await requirePermiso('personas.cliente.gestionar');
    const d = validar(clienteInput, input);
    const r = await db.transaction((tx) => svc.guardarCliente(tx, ctxDe(s), d));
    rv('clientes');
    return r;
  });
}

export async function guardarProveedor(input: ProveedorInput): Promise<ActionResult<{ id: number; personaId: number }>> {
  return accion(async () => {
    const s = await requirePermiso('personas.proveedor.gestionar');
    const d = validar(proveedorInput, input);
    const r = await db.transaction((tx) => svc.guardarProveedor(tx, ctxDe(s), d));
    rv('proveedores');
    return r;
  });
}

export async function guardarArticulo(input: ArticuloInput): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('articulos.gestionar');
    const d = validar(articuloInput, input);
    const r = await db.transaction((tx) =>
      svc.guardarArticulo(tx, ctxDe(s), d, { puedeModificarPrecio: tienePermiso(s, 'articulos.precio.modificar') }),
    );
    rv('articulos');
    return r;
  });
}

/** Cabecera + `sucursalIds[]` + `articulos[]`. */
export async function guardarDescuento(input: DescuentoInput): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('descuentos.gestionar');
    const d = validar(descuentoInput, input);
    const r = await db.transaction((tx) => svc.guardarDescuento(tx, ctxDe(s), d));
    rv('descuentos');
    return r;
  });
}

/** Alta/edición de catálogos referenciales. `tabla` ∈ tablaReferencial. */
export async function guardarReferencial(tabla: TablaReferencial, datos: unknown): Promise<ActionResult<{ id: number }>> {
  return accion(async () => {
    const s = await requirePermiso('referenciales.gestionar');
    const t = validar(tablaReferencial, tabla);
    const d = validar(referencialSchemas[t] as z.ZodType, datos);
    const r = await db.transaction((tx) => svc.guardarReferencial(tx, ctxDe(s), t, d as never));
    rv('referenciales');
    return r;
  });
}

/**
 * Activa/inactiva un registro maestro. `entidad` admite plural o singular / snake_case
 * ("articulos" | "articulo", "puntos_expedicion"...).
 */
export async function cambiarEstado(
  entidad: string,
  id: number,
  estado: 'activo' | 'inactivo',
): Promise<ActionResult<{ id: number; estado: 'activo' | 'inactivo' }>> {
  return accion(async () => {
    const e = svc.normalizarEntidad(String(entidad));
    if (!e) throw new ErrorNegocio(`Entidad no soportada: ${entidad}`);
    const s = await requireSesion();
    const permiso = svc.PERMISO_ESTADO[e];
    if (!tienePermiso(s, permiso) && !(e === 'personas' && tienePermiso(s, 'personas.proveedor.gestionar'))) {
      throw new ErrorNegocio(`No tiene permiso para esta operación (${permiso})`);
    }
    const r = await db.transaction((tx) => svc.cambiarEstado(tx, ctxDe(s), e, validar(idSchema, id), validar(estadoRegistro, estado)));
    revalidatePath('/', 'layout');
    return r;
  });
}
