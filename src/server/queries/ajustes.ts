/** Consultas de Ajustes: organización, seguridad, parámetros y stock (Server Components). */
import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  ajustesStock,
  articulos,
  configuracionSifen,
  depositos,
  empresas,
  establecimientos,
  parametrosGenerales,
  permisos,
  stock,
  sucursales,
  timbrados,
  transferenciasStock,
  unidadesMedida,
} from '@/db/schema';
import { requireSesion } from '../auth/session';
import { requirePermiso } from '../auth/permisos';
import { sucursalesHabilitadas } from '../services/seguridad';
import { filtroStock, type FiltroStock } from '../validation/ajustes';
import { filtroListado, type FiltroListado } from '../validation/comunes';

/* ---------------- Organización ---------------- */

export async function listarEmpresas() {
  const s = await requireSesion();
  return db.select().from(empresas).where(eq(empresas.id, s.empresaId));
}

export async function listarSucursales() {
  const s = await requireSesion();
  const filas = await db
    .select({ sucursal: sucursales, establecimiento: establecimientos })
    .from(sucursales)
    .leftJoin(establecimientos, eq(establecimientos.sucursal_id, sucursales.id))
    .where(eq(sucursales.empresa_id, s.empresaId))
    .orderBy(asc(sucursales.codigo));
  return filas.map((f) => ({ ...f.sucursal, establecimiento: f.establecimiento }));
}

/** Sucursales donde el usuario de la sesión tiene roles (para cambiarContexto). */
export async function listarMisSucursales() {
  const s = await requireSesion();
  return sucursalesHabilitadas(db, s.usuarioId, s.empresaId);
}

export async function listarTimbrados() {
  const s = await requireSesion();
  return db.select().from(timbrados).where(eq(timbrados.empresa_id, s.empresaId)).orderBy(desc(timbrados.fecha_inicio_vigencia));
}

export async function listarPuntosExpedicion() {
  const s = await requireSesion();
  const puntos = await db.query.puntosExpedicion.findMany({
    where: (t, { eq: e }) => e(t.empresa_id, s.empresaId),
    with: { sucursal: { columns: { id: true, codigo: true, nombre: true } }, establecimiento: true, numeraciones: { with: { timbrado: true } } },
    orderBy: (t, { asc: a }) => [a(t.sucursal_id), a(t.codigo)],
  });
  return puntos;
}

export async function obtenerConfiguracionSifen() {
  const s = await requireSesion();
  return db
    .select()
    .from(configuracionSifen)
    .where(eq(configuracionSifen.empresa_id, s.empresaId))
    .orderBy(asc(configuracionSifen.id));
}

/* ---------------- Seguridad ---------------- */

export async function listarUsuarios() {
  const s = await requirePermiso('seguridad.usuario.gestionar');
  const lista = await db.query.usuarios.findMany({
    where: (t, { eq: e }) => e(t.empresa_id, s.empresaId),
    columns: { password_hash: false },
    with: { sucursalPredeterminada: { columns: { id: true, nombre: true } }, roles: { with: { rol: { columns: { id: true, codigo: true, nombre: true } }, sucursal: { columns: { id: true, nombre: true } } } } },
    orderBy: (t, { asc: a }) => [a(t.usuario)],
  });
  return lista;
}

export async function listarRoles() {
  const s = await requireSesion();
  const lista = await db.query.roles.findMany({
    where: (t, { eq: e }) => e(t.empresa_id, s.empresaId),
    with: { permisos: { with: { permiso: true } } },
    orderBy: (t, { asc: a }) => [a(t.codigo)],
  });
  return lista.map((r) => ({
    ...r,
    descuentoManualMaxPct: r.descuento_manual_max_pct,
    permisos: r.permisos.map((p) => p.permiso.codigo).sort(),
  }));
}

export async function listarPermisos() {
  await requireSesion();
  return db.select().from(permisos).orderBy(asc(permisos.modulo), asc(permisos.codigo));
}

/* ---------------- Sistema ---------------- */

/** Parámetros de la empresa (globales) y de la sucursal de la sesión. Incluye `valores` clave→valor efectivo. */
export async function obtenerParametros() {
  const s = await requireSesion();
  const filas = await db
    .select()
    .from(parametrosGenerales)
    .where(
      and(
        eq(parametrosGenerales.empresa_id, s.empresaId),
        or(isNull(parametrosGenerales.sucursal_id), eq(parametrosGenerales.sucursal_id, s.sucursalId)),
      ),
    )
    .orderBy(asc(parametrosGenerales.clave));
  const valores: Record<string, string> = {};
  for (const f of filas.filter((x) => x.sucursal_id === null)) valores[f.clave] = f.valor;
  for (const f of filas.filter((x) => x.sucursal_id !== null)) valores[f.clave] = f.valor;
  return { filas, valores };
}

export async function listarAjustesStock(f?: FiltroListado) {
  const s = await requireSesion();
  const x = filtroListado.parse(f) ?? {};
  return db
    .select({
      id: ajustesStock.id,
      numero: ajustesStock.numero,
      fecha: ajustesStock.fecha,
      deposito_id: ajustesStock.deposito_id,
      deposito: depositos.nombre,
      tipo_ajuste: ajustesStock.tipo_ajuste,
      motivo: ajustesStock.motivo,
      total_costo_gs: ajustesStock.total_costo_gs,
      estado: ajustesStock.estado,
    })
    .from(ajustesStock)
    .innerJoin(depositos, eq(depositos.id, ajustesStock.deposito_id))
    .where(
      and(
        eq(ajustesStock.empresa_id, s.empresaId),
        eq(ajustesStock.sucursal_id, s.sucursalId),
        x.desde ? sql`${ajustesStock.fecha} >= ${x.desde}` : undefined,
        x.hasta ? sql`${ajustesStock.fecha} <= ${x.hasta}` : undefined,
        x.estado ? sql`${ajustesStock.estado}::text = ${x.estado}` : undefined,
      ),
    )
    .orderBy(desc(ajustesStock.fecha), desc(ajustesStock.numero))
    .limit(x.limite ?? 200);
}

export async function obtenerAjusteStock(id: number) {
  const s = await requireSesion();
  return (
    (await db.query.ajustesStock.findFirst({
      where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
      with: { deposito: true, detalles: { orderBy: (d, { asc: a }) => [a(d.linea)], with: { articulo: { columns: { codigo: true, descripcion: true } } } } },
    })) ?? null
  );
}

/** Transferencias donde la sucursal de la sesión es origen o destino. */
export async function listarTransferencias(f?: FiltroListado) {
  const s = await requireSesion();
  const x = filtroListado.parse(f) ?? {};
  return db
    .select({
      id: transferenciasStock.id,
      numero: transferenciasStock.numero,
      fecha: transferenciasStock.fecha,
      sucursal_id: transferenciasStock.sucursal_id,
      sucursal_destino_id: transferenciasStock.sucursal_destino_id,
      deposito_origen_id: transferenciasStock.deposito_origen_id,
      deposito_destino_id: transferenciasStock.deposito_destino_id,
      total_costo_gs: transferenciasStock.total_costo_gs,
      estado: transferenciasStock.estado,
      es_entrante: sql<boolean>`${transferenciasStock.sucursal_destino_id} = ${s.sucursalId}`,
    })
    .from(transferenciasStock)
    .where(
      and(
        eq(transferenciasStock.empresa_id, s.empresaId),
        or(eq(transferenciasStock.sucursal_id, s.sucursalId), eq(transferenciasStock.sucursal_destino_id, s.sucursalId)),
        x.estado ? sql`${transferenciasStock.estado}::text = ${x.estado}` : undefined,
        x.desde ? sql`${transferenciasStock.fecha} >= ${x.desde}` : undefined,
        x.hasta ? sql`${transferenciasStock.fecha} <= ${x.hasta}` : undefined,
      ),
    )
    .orderBy(desc(transferenciasStock.fecha), desc(transferenciasStock.id))
    .limit(x.limite ?? 200);
}

export async function obtenerTransferencia(id: number) {
  const s = await requireSesion();
  return (
    (await db.query.transferenciasStock.findFirst({
      where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
      with: {
        sucursalOrigen: { columns: { id: true, nombre: true } },
        sucursalDestino: { columns: { id: true, nombre: true } },
        depositoOrigen: true,
        depositoDestino: true,
        detalles: { orderBy: (d, { asc: a }) => [a(d.linea)], with: { articulo: { columns: { codigo: true, descripcion: true } } } },
      },
    })) ?? null
  );
}

/** Existencias por depósito (sucursal de la sesión por defecto; sucursalId 0 = todas). */
export async function consultarStock(f?: FiltroStock) {
  const s = await requireSesion();
  const x = filtroStock.parse(f) ?? {};
  const p = x.q ? `%${x.q}%` : null;
  const sucursalId = x.sucursalId === undefined || x.sucursalId === null ? s.sucursalId : x.sucursalId;
  return db
    .select({
      id: stock.id,
      articulo_id: articulos.id,
      codigo: articulos.codigo,
      descripcion: articulos.descripcion,
      unidad: unidadesMedida.codigo,
      deposito_id: depositos.id,
      deposito: depositos.nombre,
      sucursal_id: stock.sucursal_id,
      cantidad: stock.cantidad,
      cantidad_reservada: stock.cantidad_reservada,
      stock_minimo: articulos.stock_minimo,
      bajo_minimo: sql<boolean>`${stock.cantidad} < ${articulos.stock_minimo}`,
      costo_promedio_gs: stock.costo_promedio_gs,
      ultimo_costo_gs: stock.ultimo_costo_gs,
      valorizado_gs: sql<number>`round(${stock.cantidad} * ${stock.costo_promedio_gs})`.mapWith(Number),
      precio_venta_gs: articulos.precio_venta_gs,
    })
    .from(stock)
    .innerJoin(articulos, eq(articulos.id, stock.articulo_id))
    .innerJoin(unidadesMedida, eq(unidadesMedida.id, articulos.unidad_medida_id))
    .innerJoin(depositos, eq(depositos.id, stock.deposito_id))
    .where(
      and(
        eq(stock.empresa_id, s.empresaId),
        sucursalId ? eq(stock.sucursal_id, sucursalId) : undefined,
        x.depositoId ? eq(stock.deposito_id, x.depositoId) : undefined,
        p ? or(ilike(articulos.codigo, p), ilike(articulos.descripcion, p)) : undefined,
        x.soloBajoMinimo ? sql`${stock.cantidad} < ${articulos.stock_minimo}` : undefined,
      ),
    )
    .orderBy(asc(articulos.codigo), asc(depositos.codigo))
    .limit(x.limite ?? 1000);
}

