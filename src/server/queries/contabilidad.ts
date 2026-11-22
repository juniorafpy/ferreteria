/** Consultas de Contabilidad (Server Components). */
import { and, asc, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { asientosContables, configuracionContable, planCuentas } from '@/db/schema';
import { requireSesion } from '../auth/session';
import { filtroAsientos, type FiltroAsientos } from '../validation/contabilidad';

export async function listarPlanCuentas() {
  const s = await requireSesion();
  return db.select().from(planCuentas).where(eq(planCuentas.empresa_id, s.empresaId)).orderBy(asc(planCuentas.codigo));
}

export async function listarConfiguracionContable() {
  const s = await requireSesion();
  return db
    .select({
      id: configuracionContable.id,
      operacion: configuracionContable.operacion,
      concepto: configuracionContable.concepto,
      lado: configuracionContable.lado,
      cuenta_id: configuracionContable.cuenta_id,
      cuenta_codigo: planCuentas.codigo,
      cuenta: planCuentas.nombre,
      descripcion: configuracionContable.descripcion,
    })
    .from(configuracionContable)
    .innerJoin(planCuentas, eq(planCuentas.id, configuracionContable.cuenta_id))
    .where(eq(configuracionContable.empresa_id, s.empresaId))
    .orderBy(asc(configuracionContable.operacion), asc(configuracionContable.lado), asc(configuracionContable.concepto));
}

export async function listarAsientos(f?: FiltroAsientos) {
  const s = await requireSesion();
  const x = filtroAsientos.parse(f) ?? {};
  return db
    .select({
      id: asientosContables.id,
      numero: asientosContables.numero,
      fecha: asientosContables.fecha,
      concepto: asientosContables.concepto,
      origen_tipo: asientosContables.origen_tipo,
      origen_id: asientosContables.origen_id,
      asiento_revertido_id: asientosContables.asiento_revertido_id,
      total_debe_gs: asientosContables.total_debe_gs,
      total_haber_gs: asientosContables.total_haber_gs,
      estado: asientosContables.estado,
      sucursal_id: asientosContables.sucursal_id,
    })
    .from(asientosContables)
    .where(
      and(
        eq(asientosContables.empresa_id, s.empresaId),
        x.desde ? gte(asientosContables.fecha, x.desde) : undefined,
        x.hasta ? lte(asientosContables.fecha, x.hasta) : undefined,
        x.origenTipo ? sql`${asientosContables.origen_tipo}::text = ${x.origenTipo}` : undefined,
        x.estado ? sql`${asientosContables.estado}::text = ${x.estado}` : undefined,
        x.q ? ilike(asientosContables.concepto, `%${x.q}%`) : undefined,
      ),
    )
    .orderBy(desc(asientosContables.fecha), desc(asientosContables.numero))
    .limit(x.limite ?? 300);
}

export async function obtenerAsiento(id: number) {
  const s = await requireSesion();
  const a = await db.query.asientosContables.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: {
      creadoPor: { columns: { id: true, nombre: true } },
      asientoRevertido: { columns: { id: true, numero: true } },
      detalles: { orderBy: (d, { asc: o }) => [o(d.linea)], with: { cuenta: { columns: { codigo: true, nombre: true } } } },
    },
  });
  if (!a) return null;
  const [reversion] = await db
    .select({ id: asientosContables.id, numero: asientosContables.numero })
    .from(asientosContables)
    .where(eq(asientosContables.asiento_revertido_id, a.id));
  return {
    ...a,
    reversion: reversion ?? null,
    detalles: a.detalles.map((d) => ({ ...d, cuenta_codigo: d.cuenta.codigo, cuenta_nombre: d.cuenta.nombre })),
  };
}
