import { and, eq, inArray } from 'drizzle-orm';
import type { DbLike } from '@/db';
import { asientosContables, configuracionContable, detallesAsientoContable, planCuentas } from '@/db/schema';
import type { Ctx } from '../lib/contexto';
import { hoyPy } from '../lib/fechas';
import { siguienteNumero } from '../lib/numeracion';
import { asegurar, ErrorNegocio } from '../lib/result';

type OrigenTipo = (typeof asientosContables.$inferInsert)['origen_tipo'];
type Operacion = (typeof configuracionContable.$inferSelect)['operacion'];
type Lado = 'debe' | 'haber';

export type LineaAsiento = {
  cuentaId: number;
  debeGs: number;
  haberGs: number;
  glosa?: string | null;
  /** Sucursal de la línea (por defecto la del asiento). Útil en transferencias. */
  sucursalId?: number;
};

export type DatosAsiento = {
  fecha?: string;
  concepto: string;
  origenTipo: NonNullable<OrigenTipo>;
  origenId?: number | null;
  asientoRevertidoId?: number | null;
  sucursalId?: number;
  lineas: LineaAsiento[];
  estado?: 'borrador' | 'confirmado';
};

/**
 * Inserta un asiento (cabecera + líneas). Valida: >= 2 líneas, cuentas imputables y activas
 * de la empresa, cada línea solo al Debe o al Haber, y Debe === Haber.
 */
export async function crearAsiento(tx: DbLike, ctx: Ctx, d: DatosAsiento): Promise<{ id: number; numero: number }> {
  const lineas = d.lineas.filter((l) => l.debeGs !== 0 || l.haberGs !== 0);
  asegurar(lineas.length >= 2, 'El asiento requiere al menos dos líneas');
  for (const l of lineas) {
    asegurar(Number.isInteger(l.debeGs) && Number.isInteger(l.haberGs), 'Montos del asiento deben ser enteros');
    asegurar(l.debeGs >= 0 && l.haberGs >= 0, 'Montos del asiento no pueden ser negativos');
    asegurar((l.debeGs > 0) !== (l.haberGs > 0), 'Cada línea del asiento va al Debe o al Haber');
  }
  const totalDebe = lineas.reduce((a, l) => a + l.debeGs, 0);
  const totalHaber = lineas.reduce((a, l) => a + l.haberGs, 0);
  if (totalDebe !== totalHaber) {
    throw new ErrorNegocio(`Asiento descuadrado: Debe ${totalDebe} ≠ Haber ${totalHaber}`);
  }
  const ids = [...new Set(lineas.map((l) => l.cuentaId))];
  const cuentas = await tx
    .select({ id: planCuentas.id, imputable: planCuentas.imputable, estado: planCuentas.estado, codigo: planCuentas.codigo })
    .from(planCuentas)
    .where(and(eq(planCuentas.empresa_id, ctx.empresaId), inArray(planCuentas.id, ids)));
  asegurar(cuentas.length === ids.length, 'Cuenta contable inexistente en la empresa');
  for (const c of cuentas) {
    asegurar(c.imputable, `La cuenta ${c.codigo} no es imputable`);
    asegurar(c.estado === 'activo', `La cuenta ${c.codigo} está inactiva`);
  }

  const sucursalId = d.sucursalId ?? ctx.sucursalId;
  const numero = await siguienteNumero(tx, 'asientos_contables', asientosContables, ctx.empresaId, null);
  const estado = d.estado ?? 'confirmado';
  const ahora = new Date();
  const [asiento] = await tx
    .insert(asientosContables)
    .values({
      empresa_id: ctx.empresaId,
      sucursal_id: sucursalId,
      numero,
      fecha: d.fecha ?? hoyPy(),
      concepto: d.concepto.slice(0, 255),
      origen_tipo: d.origenTipo,
      origen_id: d.origenId ?? null,
      asiento_revertido_id: d.asientoRevertidoId ?? null,
      total_debe_gs: totalDebe,
      total_haber_gs: totalHaber,
      estado,
      creado_por: ctx.usuarioId,
      confirmado_por: estado === 'confirmado' ? ctx.usuarioId : null,
      confirmado_en: estado === 'confirmado' ? ahora : null,
    })
    .returning({ id: asientosContables.id, numero: asientosContables.numero });
  await tx.insert(detallesAsientoContable).values(
    lineas.map((l, i) => ({
      empresa_id: ctx.empresaId,
      sucursal_id: l.sucursalId ?? sucursalId,
      asiento_id: asiento.id,
      linea: i + 1,
      cuenta_id: l.cuentaId,
      debe_gs: l.debeGs,
      haber_gs: l.haberGs,
      glosa: l.glosa?.slice(0, 255) ?? null,
    })),
  );
  return asiento;
}

export type Partida = {
  operacion: Operacion;
  concepto: string;
  montoGs: number;
  /** Fuerza el lado (p. ej. diferencia_caja: efectivo según signo). */
  lado?: Lado;
  sucursalId?: number;
};

/**
 * Asiento automático a partir de configuracion_contable. Cada partida (operación, concepto, monto)
 * se resuelve a su cuenta y lado configurados; montos 0 se omiten; líneas con misma cuenta+lado+sucursal
 * se agrupan. Rechaza si falta configuración o si Debe ≠ Haber. Devuelve null si no hay montos.
 */
export async function generarAsiento(
  tx: DbLike,
  ctx: Ctx,
  d: Omit<DatosAsiento, 'lineas'> & { partidas: Partida[] },
): Promise<{ id: number; numero: number } | null> {
  const partidas = d.partidas.filter((p) => p.montoGs !== 0);
  if (partidas.length === 0) return null;
  for (const p of partidas) {
    asegurar(p.montoGs > 0 && Number.isInteger(p.montoGs), `Monto inválido en ${p.operacion}.${p.concepto}`);
  }
  const operaciones = [...new Set(partidas.map((p) => p.operacion))];
  const config = await tx
    .select()
    .from(configuracionContable)
    .where(and(eq(configuracionContable.empresa_id, ctx.empresaId), inArray(configuracionContable.operacion, operaciones)));
  const porClave = new Map(config.map((c) => [`${c.operacion}.${c.concepto}`, c]));

  const agrupadas = new Map<string, LineaAsiento>();
  for (const p of partidas) {
    const c = porClave.get(`${p.operacion}.${p.concepto}`);
    if (!c) throw new ErrorNegocio(`Falta configuración contable para ${p.operacion}.${p.concepto}`);
    const lado = p.lado ?? c.lado;
    const suc = p.sucursalId ?? d.sucursalId ?? ctx.sucursalId;
    const k = `${c.cuenta_id}|${lado}|${suc}`;
    const l = agrupadas.get(k) ?? { cuentaId: c.cuenta_id, debeGs: 0, haberGs: 0, glosa: c.descripcion, sucursalId: suc };
    if (lado === 'debe') l.debeGs += p.montoGs;
    else l.haberGs += p.montoGs;
    agrupadas.set(k, l);
  }
  return crearAsiento(tx, ctx, { ...d, lineas: [...agrupadas.values()] });
}

/** Contra-asiento: invierte Debe/Haber del original, que pasa a `anulado`. */
export async function contraasiento(tx: DbLike, ctx: Ctx, asientoId: number, motivo: string) {
  const [original] = await tx
    .select()
    .from(asientosContables)
    .where(and(eq(asientosContables.id, asientoId), eq(asientosContables.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(original, 'Asiento inexistente');
  asegurar(original.estado === 'confirmado', `El asiento ${original.numero} no está confirmado`);
  const lineas = await tx
    .select()
    .from(detallesAsientoContable)
    .where(eq(detallesAsientoContable.asiento_id, asientoId))
    .orderBy(detallesAsientoContable.linea);
  const nuevo = await crearAsiento(tx, ctx, {
    fecha: hoyPy(),
    concepto: `Reversión asiento N° ${original.numero}: ${motivo}`,
    origenTipo: original.origen_tipo,
    origenId: original.origen_id,
    asientoRevertidoId: original.id,
    sucursalId: original.sucursal_id,
    lineas: lineas.map((l) => ({
      cuentaId: l.cuenta_id,
      debeGs: l.haber_gs,
      haberGs: l.debe_gs,
      glosa: l.glosa,
      sucursalId: l.sucursal_id,
    })),
  });
  await tx
    .update(asientosContables)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: new Date(), motivo_anulacion: motivo })
    .where(eq(asientosContables.id, asientoId));
  return nuevo;
}

/** Revierte todos los asientos confirmados (no reversiones) de un documento origen. */
export async function revertirAsientosDeOrigen(
  tx: DbLike,
  ctx: Ctx,
  origenTipo: NonNullable<OrigenTipo>,
  origenId: number,
  motivo: string,
) {
  const asientos = await tx
    .select({ id: asientosContables.id, revertido: asientosContables.asiento_revertido_id })
    .from(asientosContables)
    .where(
      and(
        eq(asientosContables.empresa_id, ctx.empresaId),
        eq(asientosContables.origen_tipo, origenTipo),
        eq(asientosContables.origen_id, origenId),
        eq(asientosContables.estado, 'confirmado'),
      ),
    );
  const out = [];
  for (const a of asientos.filter((x) => x.revertido === null)) out.push(await contraasiento(tx, ctx, a.id, motivo));
  return out;
}

/* ---------------- Asientos manuales / plan de cuentas ---------------- */

export async function guardarAsientoManual(
  tx: DbLike,
  ctx: Ctx,
  d: { id?: number; fecha: string; concepto: string; confirmar?: boolean; lineas: LineaAsiento[] },
) {
  if (d.id) {
    const [a] = await tx
      .select()
      .from(asientosContables)
      .where(and(eq(asientosContables.id, d.id), eq(asientosContables.empresa_id, ctx.empresaId)))
      .for('update');
    asegurar(a, 'Asiento inexistente');
    asegurar(a.estado === 'borrador' && a.origen_tipo === 'manual', 'Solo se editan asientos manuales en borrador');
    await tx.delete(detallesAsientoContable).where(eq(detallesAsientoContable.asiento_id, a.id));
    await tx.delete(asientosContables).where(eq(asientosContables.id, a.id));
  }
  return crearAsiento(tx, ctx, {
    fecha: d.fecha,
    concepto: d.concepto,
    origenTipo: 'manual',
    lineas: d.lineas,
    estado: d.confirmar === false ? 'borrador' : 'confirmado',
  });
}

export async function anularAsiento(tx: DbLike, ctx: Ctx, asientoId: number, motivo: string) {
  const [a] = await tx
    .select()
    .from(asientosContables)
    .where(and(eq(asientosContables.id, asientoId), eq(asientosContables.empresa_id, ctx.empresaId)));
  asegurar(a, 'Asiento inexistente');
  if (a.estado === 'borrador') {
    await tx
      .update(asientosContables)
      .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: new Date(), motivo_anulacion: motivo })
      .where(eq(asientosContables.id, a.id));
    return { id: a.id };
  }
  asegurar(a.origen_tipo === 'manual', 'Los asientos automáticos se revierten anulando el documento de origen');
  asegurar(a.asiento_revertido_id === null, 'No se puede anular un contra-asiento');
  return contraasiento(tx, ctx, a.id, motivo);
}

export async function guardarCuenta(
  tx: DbLike,
  ctx: Ctx,
  d: { id?: number; codigo: string; nombre: string; padreId?: number | null; tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'costo' | 'gasto'; imputable: boolean; estado?: 'activo' | 'inactivo' },
) {
  let nivel = 1;
  if (d.padreId) {
    const [p] = await tx
      .select()
      .from(planCuentas)
      .where(and(eq(planCuentas.id, d.padreId), eq(planCuentas.empresa_id, ctx.empresaId)));
    asegurar(p, 'Cuenta padre inexistente');
    asegurar(!p.imputable, 'La cuenta padre no puede ser imputable');
    asegurar(d.codigo.startsWith(`${p.codigo}.`), `El código debe comenzar con ${p.codigo}.`);
    nivel = p.nivel + 1;
  }
  const valores = {
    empresa_id: ctx.empresaId,
    codigo: d.codigo,
    nombre: d.nombre,
    padre_id: d.padreId ?? null,
    nivel,
    tipo: d.tipo,
    imputable: d.imputable,
    estado: d.estado ?? 'activo',
  };
  if (d.id) {
    if (!d.imputable) {
      const [mov] = await tx
        .select({ id: detallesAsientoContable.id })
        .from(detallesAsientoContable)
        .where(eq(detallesAsientoContable.cuenta_id, d.id))
        .limit(1);
      asegurar(!mov, 'La cuenta tiene movimientos: no puede dejar de ser imputable');
    }
    const r = await tx
      .update(planCuentas)
      .set(valores)
      .where(and(eq(planCuentas.id, d.id), eq(planCuentas.empresa_id, ctx.empresaId)))
      .returning({ id: planCuentas.id });
    asegurar(r.length, 'Cuenta inexistente');
    return r[0];
  }
  const [r] = await tx.insert(planCuentas).values(valores).returning({ id: planCuentas.id });
  return r;
}

export async function guardarConfiguracionContable(
  tx: DbLike,
  ctx: Ctx,
  d: { id?: number; operacion: Operacion; concepto: string; lado: Lado; cuentaId: number; descripcion?: string | null },
) {
  const [c] = await tx
    .select()
    .from(planCuentas)
    .where(and(eq(planCuentas.id, d.cuentaId), eq(planCuentas.empresa_id, ctx.empresaId)));
  asegurar(c && c.imputable, 'La cuenta debe ser imputable');
  const valores = {
    empresa_id: ctx.empresaId,
    operacion: d.operacion,
    concepto: d.concepto,
    lado: d.lado,
    cuenta_id: d.cuentaId,
    descripcion: d.descripcion ?? null,
  };
  const [r] = await tx
    .insert(configuracionContable)
    .values(valores)
    .onConflictDoUpdate({
      target: [configuracionContable.empresa_id, configuracionContable.operacion, configuracionContable.concepto],
      set: { lado: valores.lado, cuenta_id: valores.cuenta_id, descripcion: valores.descripcion },
    })
    .returning({ id: configuracionContable.id });
  return r;
}
