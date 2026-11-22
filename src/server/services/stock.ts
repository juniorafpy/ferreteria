import { and, asc, eq, inArray } from 'drizzle-orm';
import type { DbLike } from '@/db';
import { ajustesStock, ajusteStockDetalles, articulos, transferenciasStock, transferenciaStockDetalles } from '@/db/schema';
import type { Ctx } from '../lib/contexto';
import { siguienteNumero } from '../lib/numeracion';
import { asegurar } from '../lib/result';
import type { AjusteStockInput, TransferenciaInput } from '../validation/ajustes';
import { generarAsiento, revertirAsientosDeOrigen } from './contabilidad';
import { bloquearStock, obtenerDeposito, registrarEntrada, registrarSalida, stockActual } from './inventario';

const ahora = () => new Date();

async function articulosConStock(tx: DbLike, ctx: Ctx, ids: number[]) {
  const filas = await tx
    .select()
    .from(articulos)
    .where(and(eq(articulos.empresa_id, ctx.empresaId), inArray(articulos.id, [...new Set(ids)])));
  asegurar(filas.length === new Set(ids).size, 'Artículo inexistente');
  for (const a of filas) asegurar(a.controla_stock, `El artículo ${a.codigo} no controla stock`);
  return new Map(filas.map((a) => [a.id, a]));
}

/* =============================== Ajustes de stock =============================== */

export async function guardarAjusteStock(tx: DbLike, ctx: Ctx, d: AjusteStockInput) {
  const dep = await obtenerDeposito(tx, ctx, d.depositoId);
  asegurar(dep.sucursal_id === ctx.sucursalId, 'El depósito debe pertenecer a la sucursal actual');
  const arts = await articulosConStock(tx, ctx, d.detalles.map((x) => x.articuloId));
  const lineas = [];
  for (const [i, l] of d.detalles.entries()) {
    const a = arts.get(l.articuloId)!;
    if (!a.permite_decimales) asegurar(Number.isInteger(l.cantidad), `${a.codigo} no admite decimales`);
    const s = await stockActual(tx, d.depositoId, l.articuloId);
    const costo = s && s.costo_promedio_gs > 0 ? s.costo_promedio_gs : a.costo_referencia_gs;
    lineas.push({
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      linea: i + 1,
      articulo_id: l.articuloId,
      cantidad: l.cantidad,
      cantidad_sistema: s ? Number(s.cantidad) : 0,
      costo_unitario_gs: costo,
      total_costo_gs: Math.round(l.cantidad * costo),
      observacion: l.observacion ?? null,
    });
  }
  const cabecera = {
    fecha: d.fecha,
    deposito_id: d.depositoId,
    tipo_ajuste: d.tipoAjuste,
    motivo: d.motivo,
    observacion: d.observacion ?? null,
    total_costo_gs: lineas.reduce((a, l) => a + l.total_costo_gs, 0),
  };
  let id: number;
  if (d.id) {
    const [a] = await tx
      .select()
      .from(ajustesStock)
      .where(and(eq(ajustesStock.id, d.id), eq(ajustesStock.empresa_id, ctx.empresaId)))
      .for('update');
    asegurar(a, 'Ajuste inexistente');
    asegurar(a.estado === 'borrador', 'Solo se editan ajustes en borrador');
    await tx.update(ajustesStock).set(cabecera).where(eq(ajustesStock.id, a.id));
    await tx.delete(ajusteStockDetalles).where(eq(ajusteStockDetalles.ajuste_stock_id, a.id));
    id = a.id;
  } else {
    const numero = await siguienteNumero(tx, 'ajustes_stock', ajustesStock, ctx.empresaId, ctx.sucursalId);
    const [a] = await tx
      .insert(ajustesStock)
      .values({ ...cabecera, empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, numero, creado_por: ctx.usuarioId })
      .returning({ id: ajustesStock.id });
    id = a.id;
  }
  await tx.insert(ajusteStockDetalles).values(lineas.map((l) => ({ ...l, ajuste_stock_id: id })));
  return { id };
}

async function bloquearAjuste(tx: DbLike, ctx: Ctx, id: number) {
  const [a] = await tx
    .select()
    .from(ajustesStock)
    .where(and(eq(ajustesStock.id, id), eq(ajustesStock.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(a, 'Ajuste inexistente');
  return a;
}

/** Merma: salida a costo promedio. Sobrante: entrada a costo promedio (o costo de referencia). Asiento. */
export async function confirmarAjusteStock(tx: DbLike, ctx: Ctx, id: number) {
  const a = await bloquearAjuste(tx, ctx, id);
  asegurar(a.estado === 'borrador', 'El ajuste no está en borrador');
  const det = await tx.select().from(ajusteStockDetalles).where(eq(ajusteStockDetalles.ajuste_stock_id, id)).orderBy(asc(ajusteStockDetalles.linea));
  asegurar(det.length > 0, 'El ajuste no tiene líneas');
  await bloquearStock(tx, ctx, det.map((l) => ({ depositoId: a.deposito_id, articuloId: l.articulo_id })));
  let total = 0;
  for (const l of det) {
    const s = await stockActual(tx, a.deposito_id, l.articulo_id);
    const mov =
      a.tipo_ajuste === 'merma'
        ? await registrarSalida(tx, ctx, {
            depositoId: a.deposito_id,
            articuloId: l.articulo_id,
            cantidad: l.cantidad,
            tipoMovimiento: 'ajuste_salida',
            origenTipo: 'ajuste_stock',
            origenId: a.id,
            origenDetalleId: l.id,
          })
        : await registrarEntrada(tx, ctx, {
            depositoId: a.deposito_id,
            articuloId: l.articulo_id,
            cantidad: l.cantidad,
            costoUnitarioGs: s && s.costo_promedio_gs > 0 ? s.costo_promedio_gs : l.costo_unitario_gs,
            tipoMovimiento: 'ajuste_entrada',
            origenTipo: 'ajuste_stock',
            origenId: a.id,
            origenDetalleId: l.id,
          });
    const totalLinea = Math.round(l.cantidad * mov.costoUnitarioGs);
    total += totalLinea;
    await tx
      .update(ajusteStockDetalles)
      .set({ costo_unitario_gs: mov.costoUnitarioGs, total_costo_gs: totalLinea, cantidad_sistema: s ? Number(s.cantidad) : 0 })
      .where(eq(ajusteStockDetalles.id, l.id));
  }
  await generarAsiento(tx, ctx, {
    fecha: a.fecha,
    concepto: `Ajuste de stock N° ${a.numero} (${a.tipo_ajuste}): ${a.motivo}`,
    origenTipo: 'ajuste_stock',
    origenId: a.id,
    sucursalId: a.sucursal_id,
    partidas:
      a.tipo_ajuste === 'merma'
        ? [
            { operacion: 'ajuste_merma', concepto: 'mermas', montoGs: total },
            { operacion: 'ajuste_merma', concepto: 'mercaderias', montoGs: total },
          ]
        : [
            { operacion: 'ajuste_sobrante', concepto: 'mercaderias', montoGs: total },
            { operacion: 'ajuste_sobrante', concepto: 'sobrantes', montoGs: total },
          ],
  });
  await tx
    .update(ajustesStock)
    .set({ estado: 'confirmado', total_costo_gs: total, confirmado_por: ctx.usuarioId, confirmado_en: ahora() })
    .where(eq(ajustesStock.id, id));
  return { id };
}

export async function anularAjusteStock(tx: DbLike, ctx: Ctx, id: number, motivo: string) {
  const a = await bloquearAjuste(tx, ctx, id);
  if (a.estado === 'confirmado') {
    const det = await tx.select().from(ajusteStockDetalles).where(eq(ajusteStockDetalles.ajuste_stock_id, id));
    await bloquearStock(tx, ctx, det.map((l) => ({ depositoId: a.deposito_id, articuloId: l.articulo_id })));
    for (const l of det) {
      const mov = {
        depositoId: a.deposito_id,
        articuloId: l.articulo_id,
        cantidad: l.cantidad,
        tipoMovimiento: 'anulacion_ajuste' as const,
        origenTipo: 'ajuste_stock' as const,
        origenId: a.id,
        origenDetalleId: l.id,
      };
      if (a.tipo_ajuste === 'merma') await registrarEntrada(tx, ctx, { ...mov, costoUnitarioGs: l.costo_unitario_gs });
      else await registrarSalida(tx, ctx, { ...mov, costoUnitarioGs: l.costo_unitario_gs, descripcion: 'anulación de sobrante' });
    }
    await revertirAsientosDeOrigen(tx, ctx, 'ajuste_stock', id, motivo);
  } else {
    asegurar(a.estado === 'borrador', 'El ajuste ya está anulado');
  }
  await tx
    .update(ajustesStock)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
    .where(eq(ajustesStock.id, id));
  return { id };
}

/* =============================== Transferencias =============================== */

export async function guardarTransferencia(tx: DbLike, ctx: Ctx, d: TransferenciaInput) {
  const origen = await obtenerDeposito(tx, ctx, d.depositoOrigenId);
  const destino = await obtenerDeposito(tx, ctx, d.depositoDestinoId);
  asegurar(origen.sucursal_id === ctx.sucursalId, 'El depósito origen debe pertenecer a la sucursal actual');
  const arts = await articulosConStock(tx, ctx, d.detalles.map((x) => x.articuloId));
  for (const l of d.detalles) {
    const a = arts.get(l.articuloId)!;
    if (!a.permite_decimales) asegurar(Number.isInteger(l.cantidad), `${a.codigo} no admite decimales`);
  }
  const cabecera = {
    sucursal_destino_id: destino.sucursal_id,
    deposito_origen_id: origen.id,
    deposito_destino_id: destino.id,
    fecha: d.fecha,
    observacion: d.observacion ?? null,
  };
  let id: number;
  if (d.id) {
    const [t] = await tx
      .select()
      .from(transferenciasStock)
      .where(and(eq(transferenciasStock.id, d.id), eq(transferenciasStock.empresa_id, ctx.empresaId)))
      .for('update');
    asegurar(t, 'Transferencia inexistente');
    asegurar(t.estado === 'borrador', 'Solo se editan transferencias en borrador');
    await tx.update(transferenciasStock).set(cabecera).where(eq(transferenciasStock.id, t.id));
    await tx.delete(transferenciaStockDetalles).where(eq(transferenciaStockDetalles.transferencia_stock_id, t.id));
    id = t.id;
  } else {
    const numero = await siguienteNumero(tx, 'transferencias_stock', transferenciasStock, ctx.empresaId, ctx.sucursalId);
    const [t] = await tx
      .insert(transferenciasStock)
      .values({ ...cabecera, empresa_id: ctx.empresaId, sucursal_id: ctx.sucursalId, numero, creado_por: ctx.usuarioId })
      .returning({ id: transferenciasStock.id });
    id = t.id;
  }
  await tx.insert(transferenciaStockDetalles).values(
    d.detalles.map((l, i) => ({
      empresa_id: ctx.empresaId,
      sucursal_id: ctx.sucursalId,
      transferencia_stock_id: id,
      linea: i + 1,
      articulo_id: l.articuloId,
      cantidad: l.cantidad,
    })),
  );
  return { id };
}

async function bloquearTransferencia(tx: DbLike, ctx: Ctx, id: number) {
  const [t] = await tx
    .select()
    .from(transferenciasStock)
    .where(and(eq(transferenciasStock.id, id), eq(transferenciasStock.empresa_id, ctx.empresaId)))
    .for('update');
  asegurar(t, 'Transferencia inexistente');
  return t;
}

/** Envía: salida del depósito origen a costo promedio (el costo viaja con la transferencia). */
export async function enviarTransferencia(tx: DbLike, ctx: Ctx, id: number) {
  const t = await bloquearTransferencia(tx, ctx, id);
  asegurar(t.estado === 'borrador', 'La transferencia no está en borrador');
  asegurar(t.sucursal_id === ctx.sucursalId, 'Solo la sucursal origen puede enviar');
  const det = await tx
    .select()
    .from(transferenciaStockDetalles)
    .where(eq(transferenciaStockDetalles.transferencia_stock_id, id))
    .orderBy(asc(transferenciaStockDetalles.linea));
  await bloquearStock(tx, ctx, det.map((l) => ({ depositoId: t.deposito_origen_id, articuloId: l.articulo_id })));
  let total = 0;
  for (const l of det) {
    const mov = await registrarSalida(tx, ctx, {
      depositoId: t.deposito_origen_id,
      articuloId: l.articulo_id,
      cantidad: l.cantidad,
      tipoMovimiento: 'transferencia_salida',
      origenTipo: 'transferencia_stock',
      origenId: t.id,
      origenDetalleId: l.id,
    });
    total += Math.round(l.cantidad * mov.costoUnitarioGs);
    await tx.update(transferenciaStockDetalles).set({ costo_unitario_gs: mov.costoUnitarioGs }).where(eq(transferenciaStockDetalles.id, l.id));
  }
  await tx
    .update(transferenciasStock)
    .set({ estado: 'enviado', total_costo_gs: total, enviado_por: ctx.usuarioId, enviado_en: ahora(), confirmado_por: ctx.usuarioId, confirmado_en: ahora() })
    .where(eq(transferenciasStock.id, id));
  return { id };
}

/** Recibe (total): entrada en destino al costo de envío; asiento mercaderías destino/origen por sucursal. */
export async function recibirTransferencia(tx: DbLike, ctx: Ctx, id: number) {
  const t = await bloquearTransferencia(tx, ctx, id);
  asegurar(t.estado === 'enviado', 'La transferencia no está enviada');
  asegurar(t.sucursal_destino_id === ctx.sucursalId, 'Solo la sucursal destino puede recibir');
  const det = await tx.select().from(transferenciaStockDetalles).where(eq(transferenciaStockDetalles.transferencia_stock_id, id));
  await bloquearStock(tx, ctx, det.map((l) => ({ depositoId: t.deposito_destino_id, articuloId: l.articulo_id })));
  for (const l of det) {
    await registrarEntrada(tx, ctx, {
      depositoId: t.deposito_destino_id,
      articuloId: l.articulo_id,
      cantidad: l.cantidad,
      costoUnitarioGs: l.costo_unitario_gs,
      tipoMovimiento: 'transferencia_entrada',
      origenTipo: 'transferencia_stock',
      origenId: t.id,
      origenDetalleId: l.id,
    });
    await tx.update(transferenciaStockDetalles).set({ cantidad_recibida: l.cantidad }).where(eq(transferenciaStockDetalles.id, l.id));
  }
  await generarAsiento(tx, ctx, {
    fecha: t.fecha,
    concepto: `Transferencia de stock N° ${t.numero}`,
    origenTipo: 'transferencia_stock',
    origenId: t.id,
    sucursalId: t.sucursal_id,
    partidas: [
      { operacion: 'transferencia', concepto: 'mercaderias_destino', montoGs: t.total_costo_gs, sucursalId: t.sucursal_destino_id },
      { operacion: 'transferencia', concepto: 'mercaderias_origen', montoGs: t.total_costo_gs, sucursalId: t.sucursal_id },
    ],
  });
  await tx
    .update(transferenciasStock)
    .set({ estado: 'recibido', recibido_por: ctx.usuarioId, recibido_en: ahora() })
    .where(eq(transferenciasStock.id, id));
  return { id };
}

/** Anula: borrador → anulado; enviado → reingresa al origen; recibido → retira del destino y reingresa al origen. */
export async function anularTransferencia(tx: DbLike, ctx: Ctx, id: number, motivo: string) {
  const t = await bloquearTransferencia(tx, ctx, id);
  asegurar(t.estado !== 'anulado', 'La transferencia ya está anulada');
  if (t.estado !== 'borrador') {
    const det = await tx.select().from(transferenciaStockDetalles).where(eq(transferenciaStockDetalles.transferencia_stock_id, id));
    const pares = det.map((l) => ({ depositoId: t.deposito_origen_id, articuloId: l.articulo_id }));
    if (t.estado === 'recibido') pares.push(...det.map((l) => ({ depositoId: t.deposito_destino_id, articuloId: l.articulo_id })));
    await bloquearStock(tx, ctx, pares);
    for (const l of det) {
      const base = {
        articuloId: l.articulo_id,
        cantidad: l.cantidad,
        tipoMovimiento: 'anulacion_transferencia' as const,
        origenTipo: 'transferencia_stock' as const,
        origenId: t.id,
        origenDetalleId: l.id,
      };
      if (t.estado === 'recibido') {
        await registrarSalida(tx, ctx, { ...base, depositoId: t.deposito_destino_id, costoUnitarioGs: l.costo_unitario_gs, descripcion: 'anulación de transferencia' });
      }
      await registrarEntrada(tx, ctx, { ...base, depositoId: t.deposito_origen_id, costoUnitarioGs: l.costo_unitario_gs });
    }
    if (t.estado === 'recibido') await revertirAsientosDeOrigen(tx, ctx, 'transferencia_stock', id, motivo);
  }
  await tx
    .update(transferenciasStock)
    .set({ estado: 'anulado', anulado_por: ctx.usuarioId, anulado_en: ahora(), motivo_anulacion: motivo })
    .where(eq(transferenciasStock.id, id));
  return { id };
}
