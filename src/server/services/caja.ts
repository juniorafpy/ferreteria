import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { DbLike } from '@/db';
import { arqueosCaja, cajas, clientes, cobroDetalles, cobroMedios, cobros, cuentasCobrar, sesionesCaja } from '@/db/schema';
import type { Ctx } from '../lib/contexto';
import { estadoCuenta } from '../lib/cuotas';
import { hoyPy } from '../lib/fechas';
import { siguienteNumero } from '../lib/numeracion';
import { asegurar, ErrorNegocio } from '../lib/result';
import type { AbrirCajaInput, CerrarCajaInput, CobroInput } from '../validation/caja';
import { generarAsiento, revertirAsientosDeOrigen } from './contabilidad';
import { sesionAbiertaDe } from './ventas';

const MEDIOS = ['efectivo', 'transferencia', 'tarjeta', 'qr'] as const;
type Medio = (typeof MEDIOS)[number];

export async function abrirCaja(tx: DbLike, ctx: Ctx, d: AbrirCajaInput) {
  const [c] = await tx
    .select()
    .from(cajas)
    .where(and(eq(cajas.id, d.cajaId), eq(cajas.empresa_id, ctx.empresaId)));
  asegurar(c, 'Caja inexistente');
  asegurar(c.sucursal_id === ctx.sucursalId, 'La caja pertenece a otra sucursal');
  asegurar(c.estado === 'activo', 'La caja está inactiva');
  const propia = await sesionAbiertaDe(tx, ctx);
  asegurar(!propia, `Ya tiene abierta la caja ${propia?.caja.nombre}`);
  const [ocupada] = await tx
    .select({ id: sesionesCaja.id })
    .from(sesionesCaja)
    .where(and(eq(sesionesCaja.caja_id, c.id), eq(sesionesCaja.estado, 'abierta')))
    .for('update');
  asegurar(!ocupada, 'La caja ya tiene una sesión abierta');
  const [s] = await tx
    .insert(sesionesCaja)
    .values({
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      caja_id: c.id,
      usuario_id: ctx.usuarioId,
      monto_apertura_gs: d.montoAperturaGs,
    })
    .returning({ id: sesionesCaja.id });
  return { id: s.id };
}

/** Totales del sistema por medio de pago (cobros confirmados; efectivo neto de vuelto). */
export async function totalesSesion(tx: DbLike, sesionId: number): Promise<Record<Medio, number>> {
  const filas = await tx
    .select({ medio: cobroMedios.medio_pago, total: sql<number>`coalesce(sum(${cobroMedios.monto_gs}), 0)`.mapWith(Number) })
    .from(cobroMedios)
    .innerJoin(cobros, eq(cobros.id, cobroMedios.cobro_id))
    .where(and(eq(cobros.sesion_caja_id, sesionId), eq(cobros.estado, 'confirmado')))
    .groupBy(cobroMedios.medio_pago);
  const [v] = await tx
    .select({ vuelto: sql<number>`coalesce(sum(${cobros.vuelto_gs}), 0)`.mapWith(Number) })
    .from(cobros)
    .where(and(eq(cobros.sesion_caja_id, sesionId), eq(cobros.estado, 'confirmado')));
  const out: Record<Medio, number> = { efectivo: 0, transferencia: 0, tarjeta: 0, qr: 0 };
  for (const f of filas) out[f.medio] = f.total;
  out.efectivo -= v?.vuelto ?? 0;
  return out;
}

/** Cierra la sesión con arqueo por medio. Diferencia de efectivo → asiento diferencia_caja. */
export async function cerrarCaja(tx: DbLike, ctx: Ctx, d: CerrarCajaInput) {
  const [s] = await tx
    .select()
    .from(sesionesCaja)
    .where(and(eq(sesionesCaja.id, d.sesionCajaId), eq(sesionesCaja.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(s, 'Sesión de caja inexistente');
  asegurar(s.estado === 'abierta', 'La sesión ya está cerrada');
  asegurar(s.usuario_id === ctx.usuarioId || ctx.permisos.includes('caja.sesion.cerrar'), 'La sesión pertenece a otro usuario');
  const sistema = await totalesSesion(tx, s.id);
  const declarado = new Map(d.arqueo.map((a) => [a.medioPago, a]));
  const filas = MEDIOS.map((m) => {
    const montoSistema = m === 'efectivo' ? s.monto_apertura_gs + sistema.efectivo : sistema[m];
    const montoDeclarado = declarado.get(m)?.montoDeclaradoGs ?? 0;
    return {
      empresa_id: s.empresa_id,
      sucursal_id: s.sucursal_id,
      sesion_caja_id: s.id,
      medio_pago: m,
      monto_sistema_gs: montoSistema,
      monto_declarado_gs: montoDeclarado,
      diferencia_gs: montoDeclarado - montoSistema,
      observacion: declarado.get(m)?.observacion ?? null,
    };
  });
  await tx.insert(arqueosCaja).values(filas);
  const efectivo = filas.find((f) => f.medio_pago === 'efectivo')!;
  const dif = efectivo.diferencia_gs;
  await tx
    .update(sesionesCaja)
    .set({
      total_efectivo_gs: sistema.efectivo,
      total_transferencia_gs: sistema.transferencia,
      total_tarjeta_gs: sistema.tarjeta,
      total_qr_gs: sistema.qr,
      efectivo_declarado_gs: efectivo.monto_declarado_gs,
      diferencia_gs: dif,
      cerrada_en: new Date(),
      cerrada_por: ctx.usuarioId,
      observacion_cierre: d.observacion ?? null,
      estado: 'cerrada',
    })
    .where(eq(sesionesCaja.id, s.id));
  if (dif !== 0) {
    const monto = Math.abs(dif);
    await generarAsiento(tx, ctx, {
      fecha: hoyPy(),
      concepto: `${dif < 0 ? 'Faltante' : 'Sobrante'} de caja, sesión N° ${s.id}`,
      origenTipo: 'sesion_caja',
      origenId: s.id,
      sucursalId: s.sucursal_id,
      partidas:
        dif < 0
          ? [
              { operacion: 'diferencia_caja', concepto: 'faltante', montoGs: monto },
              { operacion: 'diferencia_caja', concepto: 'efectivo', montoGs: monto, lado: 'haber' },
            ]
          : [
              { operacion: 'diferencia_caja', concepto: 'efectivo', montoGs: monto, lado: 'debe' },
              { operacion: 'diferencia_caja', concepto: 'sobrante', montoGs: monto },
            ],
    });
  }
  return { id: s.id, sistema, diferenciaEfectivoGs: dif };
}

/** Cobro multi-medio aplicado a una o más cuentas a cobrar (requiere caja abierta). */
export async function registrarCobro(tx: DbLike, ctx: Ctx, d: CobroInput) {
  const sesion = await sesionAbiertaDe(tx, ctx);
  asegurar(sesion, 'Debe abrir una caja para registrar cobros');
  const ids = d.cuentas.map((c) => c.cuentaCobrarId);
  asegurar(new Set(ids).size === ids.length, 'Cuenta repetida');
  const cuentas = await tx
    .select()
    .from(cuentasCobrar)
    .where(and(eq(cuentasCobrar.empresa_id, ctx.empresaId), inArray(cuentasCobrar.id, ids)))
    .orderBy(asc(cuentasCobrar.id))
    .for('update');
  asegurar(cuentas.length === ids.length, 'Cuenta a cobrar inexistente');
  const clientesSet = new Set(cuentas.map((c) => c.cliente_id ?? 0));
  asegurar(clientesSet.size === 1, 'Las cuentas deben ser de un mismo cliente');
  const clienteId = cuentas[0].cliente_id;
  if (d.clienteId) asegurar(clienteId === d.clienteId, 'Las cuentas no pertenecen al cliente');
  const porId = new Map(cuentas.map((c) => [c.id, c]));
  for (const x of d.cuentas) {
    const c = porId.get(x.cuentaCobrarId)!;
    asegurar(c.estado === 'pendiente' || c.estado === 'parcial', `La cuota ${c.numero_cuota} no tiene saldo`);
    if (x.montoGs > c.saldo_gs) throw new ErrorNegocio(`El cobro (${x.montoGs}) supera el saldo de la cuota (${c.saldo_gs})`);
  }
  const total = d.cuentas.reduce((a, x) => a + x.montoGs, 0);
  const totalMedios = d.medios.reduce((a, m) => a + m.montoGs, 0);
  asegurar(totalMedios >= total, 'Los medios de pago no cubren el total');
  const vuelto = totalMedios - total;
  const efectivo = d.medios.filter((m) => m.medioPago === 'efectivo').reduce((a, m) => a + m.montoGs, 0);
  asegurar(vuelto <= efectivo, 'Solo puede haber vuelto sobre pagos en efectivo');

  const numero = await siguienteNumero(tx, 'cobros', cobros, ctx.empresaId, ctx.sucursalId);
  const [cobro] = await tx
    .insert(cobros)
    .values({
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      numero,
      cliente_id: clienteId,
      sesion_caja_id: sesion.sesion.id,
      total_gs: total,
      vuelto_gs: vuelto,
      observacion: d.observacion ?? null,
      estado: 'confirmado',
      creado_por: ctx.usuarioId,
      confirmado_por: ctx.usuarioId,
      confirmado_en: new Date(),
    })
    .returning({ id: cobros.id, numero: cobros.numero });
  await tx.insert(cobroDetalles).values(
    d.cuentas.map((x) => ({
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      cobro_id: cobro.id,
      cuenta_cobrar_id: x.cuentaCobrarId,
      monto_gs: x.montoGs,
    })),
  );
  await tx.insert(cobroMedios).values(
    d.medios.map((m) => ({
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      cobro_id: cobro.id,
      medio_pago: m.medioPago,
      monto_gs: m.montoGs,
      referencia: m.referencia ?? null,
      banco: m.banco ?? null,
      tipo_tarjeta: m.tipoTarjeta ?? null,
      marca_tarjeta: m.marcaTarjeta ?? null,
      ultimos_digitos: m.ultimosDigitos ?? null,
    })),
  );
  for (const x of d.cuentas) {
    const c = porId.get(x.cuentaCobrarId)!;
    const saldo = c.saldo_gs - x.montoGs;
    await tx.update(cuentasCobrar).set({ saldo_gs: saldo, estado: estadoCuenta(c.monto_gs, saldo) }).where(eq(cuentasCobrar.id, c.id));
  }
  if (clienteId) {
    await tx.update(clientes).set({ saldo_gs: sql`${clientes.saldo_gs} - ${total}` }).where(eq(clientes.id, clienteId));
  }
  const porMedio = new Map<Medio, number>();
  for (const m of d.medios) porMedio.set(m.medioPago, (porMedio.get(m.medioPago) ?? 0) + m.montoGs);
  porMedio.set('efectivo', (porMedio.get('efectivo') ?? 0) - vuelto);
  await generarAsiento(tx, ctx, {
    fecha: hoyPy(),
    concepto: `Cobro N° ${cobro.numero}`,
    origenTipo: 'cobro',
    origenId: cobro.id,
    partidas: [
      ...[...porMedio.entries()].map(([medio, monto]) => ({ operacion: 'cobro' as const, concepto: medio, montoGs: monto })),
      { operacion: 'cobro', concepto: 'deudores', montoGs: total },
    ],
  });
  return { id: cobro.id, numero: cobro.numero, totalGs: total, vueltoGs: vuelto };
}

export async function anularCobro(tx: DbLike, ctx: Ctx, id: number, motivo: string) {
  const [c] = await tx
    .select()
    .from(cobros)
    .where(and(eq(cobros.id, id), eq(cobros.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(c, 'Cobro inexistente');
  asegurar(c.estado === 'confirmado', 'El cobro no está confirmado');
  const [s] = await tx.select().from(sesionesCaja).where(eq(sesionesCaja.id, c.sesion_caja_id));
  asegurar(s?.estado === 'abierta', 'La sesión de caja del cobro ya fue cerrada');
  const det = await tx.select().from(cobroDetalles).where(eq(cobroDetalles.cobro_id, id));
  const cuentas = await tx
    .select()
    .from(cuentasCobrar)
    .where(inArray(cuentasCobrar.id, det.map((x) => x.cuenta_cobrar_id)))
    .orderBy(asc(cuentasCobrar.id))
    .for('update');
  const porId = new Map(cuentas.map((x) => [x.id, x]));
  for (const x of det) {
    const cc = porId.get(x.cuenta_cobrar_id)!;
    asegurar(cc.estado !== 'anulado', 'Una cuenta del cobro está anulada');
    const saldo = cc.saldo_gs + x.monto_gs;
    await tx.update(cuentasCobrar).set({ saldo_gs: saldo, estado: estadoCuenta(cc.monto_gs, saldo) }).where(eq(cuentasCobrar.id, cc.id));
  }
  if (c.cliente_id) {
    await tx.update(clientes).set({ saldo_gs: sql`${clientes.saldo_gs} + ${c.total_gs}` }).where(eq(clientes.id, c.cliente_id));
  }
  await revertirAsientosDeOrigen(tx, ctx, 'cobro', id, motivo);
  await tx
    .update(cobros)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: new Date(), motivo_anulacion: motivo })
    .where(eq(cobros.id, id));
  return { id };
}
