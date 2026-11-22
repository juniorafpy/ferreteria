/**
 * Compras: Pedido → OC → Factura (CxP + histórico + asiento) → Recepción (stock).
 * Casos adversos: doble recepción, recepción > facturado, doble costo, factura duplicada, anulaciones.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { asc, eq } from 'drizzle-orm';
import * as compras from '@/server/services/compras';
import { crearEntorno, rechaza, s, type Entorno } from './helpers/db';

let E: Entorno;
before(async () => {
  E = await crearEntorno();
});
after(async () => E?.cerrar());

let nroComprobante = 500;
async function facturaConfirmada(lineas: { articuloId: number; cantidad: number; precioUnitarioGs: number }[]) {
  const f = await E.tx((t) =>
    compras.guardarFacturaCompra(t, E.admin, {
      proveedorId: E.proveedor.id,
      timbrado: '12345678',
      numeroComprobante: `001-001-${String(nroComprobante++).padStart(7, '0')}`,
      fechaEmision: E.hoy,
      condicionOperacion: 'credito',
      depositoId: E.depMatriz.id,
      detalles: lineas,
    }),
  );
  await E.tx((t) => compras.confirmarFacturaCompra(t, E.admin, f.id));
  return f.id;
}

describe('compras', () => {
  test('flujo pedido → OC → factura: OC no se factura dos veces y pedido no se ordena dos veces', async () => {
    const martillo = await E.art('HM-0001');
    const pedido = await E.tx((t) =>
      compras.guardarPedidoCompra(t, E.admin, { fecha: E.hoy, proveedorId: E.proveedor.id, detalles: [{ articuloId: martillo.id, cantidad: 10 }] }),
    );
    await E.tx((t) => compras.confirmarPedidoCompra(t, E.admin, pedido.id));
    // Dos OC borrador importando el mismo pedido completo: solo la primera puede confirmarse
    const oc1 = await E.tx((t) => compras.guardarOrdenCompra(t, E.admin, { fecha: E.hoy, proveedorId: E.proveedor.id, pedidoIds: [pedido.id] }));
    const oc2 = await E.tx((t) => compras.guardarOrdenCompra(t, E.admin, { fecha: E.hoy, proveedorId: E.proveedor.id, pedidoIds: [pedido.id] }));
    await E.tx((t) => compras.confirmarOrdenCompra(t, E.admin, oc1.id));
    await rechaza(() => E.tx((t) => compras.confirmarOrdenCompra(t, E.admin, oc2.id)), /supera el pendiente del pedido|no admite/);

    // Dos facturas borrador de la misma OC: solo la primera se confirma
    const base = { proveedorId: E.proveedor.id, ordenCompraId: oc1.id, timbrado: '12345678', fechaEmision: E.hoy, condicionOperacion: 'contado' as const };
    const f1 = await E.tx((t) => compras.guardarFacturaCompra(t, E.admin, { ...base, numeroComprobante: '001-001-0000901' }));
    const f2 = await E.tx((t) => compras.guardarFacturaCompra(t, E.admin, { ...base, numeroComprobante: '001-001-0000902' }));
    await E.tx((t) => compras.confirmarFacturaCompra(t, E.admin, f1.id));
    await rechaza(() => E.tx((t) => compras.confirmarFacturaCompra(t, E.admin, f2.id)), /supera el pendiente de la OC|no admite/);
    const [oc] = await E.db.select().from(s.ordenesCompra).where(eq(s.ordenesCompra.id, oc1.id));
    assert.equal(oc.estado, 'facturado');
  });

  test('factura duplicada del proveedor (mismo timbrado + número) es rechazada', async () => {
    const cemento = await E.art('CO-0001');
    const d = {
      proveedorId: E.proveedor.id,
      timbrado: '87654321',
      numeroComprobante: '002-001-0000077',
      fechaEmision: E.hoy,
      condicionOperacion: 'contado' as const,
      detalles: [{ articuloId: cemento.id, cantidad: 1, precioUnitarioGs: 55_000 }],
    };
    await E.tx((t) => compras.guardarFacturaCompra(t, E.admin, d));
    await rechaza(() => E.tx((t) => compras.guardarFacturaCompra(t, E.admin, d)), /facturas_compra_comprobante_uq|duplicate|unique/i);
  });

  test('confirmar dos veces no duplica CxP, histórico de costos ni asiento', async () => {
    const llave = await E.art('HM-0002');
    const fid = await facturaConfirmada([{ articuloId: llave.id, cantidad: 4, precioUnitarioGs: 82_500 }]);
    await rechaza(() => E.tx((t) => compras.confirmarFacturaCompra(t, E.admin, fid)), /no está en borrador/);
    const det = await E.db.select().from(s.facturaCompraDetalles).where(eq(s.facturaCompraDetalles.factura_compra_id, fid));
    const hist = await E.db.select().from(s.historicoCostos).where(eq(s.historicoCostos.detalle_factura_compra_id, det[0].id));
    assert.equal(hist.length, 1, 'una fila de histórico por detalle');
    assert.equal(hist[0].costo_unitario_gs, 75_000, 'costo neto sin IVA (82.500 / 1,1)');
    const cxp = await E.db.select().from(s.cuentasPagar).where(eq(s.cuentasPagar.factura_compra_id, fid));
    assert.equal(cxp.reduce((a, c) => a + c.monto_gs, 0), 4 * 82_500);
    assert.equal((await E.asientosDe('factura_compra', fid)).length, 1);
    // El histórico es append-only (trigger)
    await rechaza(() => E.db.update(s.historicoCostos).set({ costo_unitario_gs: 1 }).where(eq(s.historicoCostos.id, hist[0].id)), /append-only/);
  });

  test('recepción: no se recibe más de lo facturado ni dos veces la misma factura', async () => {
    const cinta = await E.art('HM-0003');
    const fid = await facturaConfirmada([{ articuloId: cinta.id, cantidad: 6, precioUnitarioGs: 22_000 }]);
    const [fd] = await E.db.select().from(s.facturaCompraDetalles).where(eq(s.facturaCompraDetalles.factura_compra_id, fid));
    const stock0 = await E.stockDe(E.depMatriz.id, cinta.id);

    // > facturado al guardar
    await rechaza(
      () => E.tx((t) => compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: fid, depositoId: E.depMatriz.id, detalles: [{ detalleOrigenId: fd.id, cantidad: 7 }] })),
      /supera lo pendiente/,
    );
    // detalle de otra factura
    await rechaza(
      () => E.tx((t) => compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: fid, depositoId: E.depMatriz.id, detalles: [{ detalleOrigenId: fd.id + 9999, cantidad: 1 }] })),
      /no pertenece a la factura/,
    );
    // Un arreglo vacío NO significa "recibir todo lo pendiente": se rechaza
    await rechaza(
      () => E.tx((t) => compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: fid, depositoId: E.depMatriz.id, detalles: [] })),
      /al menos una cantidad/,
    );

    // Dos borradores por el total: confirmar ambos = doble recepción → el segundo se rechaza en la confirmación
    const r1 = await E.tx((t) => compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: fid, depositoId: E.depMatriz.id }));
    const r2 = await E.tx((t) => compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: fid, depositoId: E.depMatriz.id }));
    await E.tx((t) => compras.confirmarRecepcion(t, E.admin, r1.id));
    await rechaza(() => E.tx((t) => compras.confirmarRecepcion(t, E.admin, r2.id)), /no admite recepciones|supera lo facturado/);
    await rechaza(() => E.tx((t) => compras.confirmarRecepcion(t, E.admin, r1.id)), /no está en borrador/);
    await rechaza(() => E.tx((t) => compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: fid, depositoId: E.depMatriz.id })), /no tiene pendientes/);

    const stock1 = await E.stockDe(E.depMatriz.id, cinta.id);
    assert.equal(stock1.cantidad, stock0.cantidad + 6, 'stock sumado una sola vez');
    assert.equal((await E.kardexDe('recepcion', r1.id)).length, 1);
    assert.equal((await E.kardexDe('recepcion', r2.id)).length, 0);
    const [fdTras] = await E.db.select().from(s.facturaCompraDetalles).where(eq(s.facturaCompraDetalles.id, fd.id));
    assert.equal(fdTras.cantidad_recibida, 6);
    // Histórico de costos: una sola fila aunque haya recepción (el costo se registra en la factura)
    assert.equal((await E.db.select().from(s.historicoCostos).where(eq(s.historicoCostos.detalle_factura_compra_id, fd.id))).length, 1);
  });

  test('recepción parcial + resto: cantidades íntegras', async () => {
    const pintura = await E.art('PI-0001');
    const fid = await facturaConfirmada([{ articuloId: pintura.id, cantidad: 10, precioUnitarioGs: 101_200 }]);
    const [fd] = await E.db.select().from(s.facturaCompraDetalles).where(eq(s.facturaCompraDetalles.factura_compra_id, fid));
    const stock0 = await E.stockDe(E.depMatriz.id, pintura.id);
    const r1 = await E.tx((t) =>
      compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: fid, depositoId: E.depMatriz.id, detalles: [{ detalleOrigenId: fd.id, cantidad: 4 }] }),
    );
    await E.tx((t) => compras.confirmarRecepcion(t, E.admin, r1.id));
    let [f] = await E.db.select().from(s.facturasCompra).where(eq(s.facturasCompra.id, fid));
    assert.equal(f.estado, 'recibido_parcial');
    const r2 = await E.tx((t) => compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: fid, depositoId: E.depMatriz.id }));
    const [r2d] = await E.db.select().from(s.recepcionDetalles).where(eq(s.recepcionDetalles.recepcion_id, r2.id));
    assert.equal(r2d.cantidad, 6, 'el resto pendiente');
    await E.tx((t) => compras.confirmarRecepcion(t, E.admin, r2.id));
    [f] = await E.db.select().from(s.facturasCompra).where(eq(s.facturasCompra.id, fid));
    assert.equal(f.estado, 'recibido');
    assert.equal((await E.stockDe(E.depMatriz.id, pintura.id)).cantidad, stock0.cantidad + 10);
    assert.equal(await E.verificarPartidaDoble() > 0, true);
  });

  test('anulación de compra con recepción: bloqueada; anular recepción revierte stock y asiento sin borrar', async () => {
    const taladro = await E.art('HE-0001');
    const fid = await facturaConfirmada([{ articuloId: taladro.id, cantidad: 2, precioUnitarioGs: 473_000 }]);
    const stock0 = await E.stockDe(E.depMatriz.id, taladro.id);
    const rec = await E.tx((t) => compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: fid, depositoId: E.depMatriz.id }));
    await E.tx((t) => compras.confirmarRecepcion(t, E.admin, rec.id));
    assert.equal((await E.stockDe(E.depMatriz.id, taladro.id)).cantidad, stock0.cantidad + 2);

    await rechaza(() => E.tx((t) => compras.anularFacturaCompra(t, E.admin, fid, 'prueba')), /recepciones|recibida/);

    await E.tx((t) => compras.anularRecepcion(t, E.admin, rec.id, 'devolución'));
    const st = await E.stockDe(E.depMatriz.id, taladro.id);
    assert.equal(st.cantidad, stock0.cantidad);
    assert.equal(st.costoPromedio, stock0.costoPromedio, 'costo promedio restaurado');
    const k = await E.kardexDe('recepcion', rec.id);
    assert.deepEqual(k.map((x) => x.tipo_movimiento), ['entrada_compra', 'anulacion_compra'], 'kardex conserva ambos movimientos');
    const asRec = await E.asientosDe('recepcion', rec.id);
    assert.equal(asRec.length, 2);
    assert.equal(asRec[0].estado, 'anulado');
    assert.equal(asRec[1].asiento_revertido_id, asRec[0].id);

    await E.tx((t) => compras.anularFacturaCompra(t, E.admin, fid, 'error de carga'));
    const [f] = await E.db.select().from(s.facturasCompra).where(eq(s.facturasCompra.id, fid));
    assert.equal(f.estado, 'anulado', 'la factura sigue existiendo (no hay borrado físico)');
    const cxp = await E.db.select().from(s.cuentasPagar).where(eq(s.cuentasPagar.factura_compra_id, fid));
    assert.ok(cxp.length > 0 && cxp.every((c) => c.estado === 'anulado' && c.saldo_gs === 0));
    const asF = await E.asientosDe('factura_compra', fid);
    assert.equal(asF.length, 2);
    // Documento confirmado/anulado no se puede borrar físicamente
    await rechaza(() => E.db.delete(s.recepciones).where(eq(s.recepciones.id, rec.id)), /use anulación/);
    await rechaza(() => E.db.delete(s.facturasCompra).where(eq(s.facturasCompra.id, fid)), /use anulación/);
    await E.verificarPartidaDoble();
  });

  test('orden de pago: no supera el saldo, anulación restaura CxP y saldo del proveedor', async () => {
    const martillo = await E.art('HM-0001');
    const fid = await facturaConfirmada([{ articuloId: martillo.id, cantidad: 1, precioUnitarioGs: 66_000 }]);
    const [cxp] = await E.db.select().from(s.cuentasPagar).where(eq(s.cuentasPagar.factura_compra_id, fid)).orderBy(asc(s.cuentasPagar.id));
    const [prov0] = await E.db.select().from(s.proveedores).where(eq(s.proveedores.id, E.proveedor.id));
    await rechaza(
      () =>
        E.tx((t) =>
          compras.registrarOrdenPago(t, E.admin, { fecha: E.hoy, proveedorId: E.proveedor.id, medioPago: 'efectivo', cuentas: [{ cuentaPagarId: cxp.id, montoGs: cxp.saldo_gs + 1 }] }),
        ),
      /supera el saldo/,
    );
    const op = await E.tx((t) =>
      compras.registrarOrdenPago(t, E.admin, { fecha: E.hoy, proveedorId: E.proveedor.id, medioPago: 'efectivo', cuentas: [{ cuentaPagarId: cxp.id, montoGs: cxp.saldo_gs }] }),
    );
    let [c] = await E.db.select().from(s.cuentasPagar).where(eq(s.cuentasPagar.id, cxp.id));
    assert.equal(c.estado, 'pagado');
    await rechaza(() => E.tx((t) => compras.anularFacturaCompra(t, E.admin, fid, 'x')), /pagos registrados/);
    await E.tx((t) => compras.anularOrdenPago(t, E.admin, op.id, 'prueba anulación'));
    [c] = await E.db.select().from(s.cuentasPagar).where(eq(s.cuentasPagar.id, cxp.id));
    assert.equal(c.saldo_gs, c.monto_gs);
    const [prov1] = await E.db.select().from(s.proveedores).where(eq(s.proveedores.id, E.proveedor.id));
    assert.equal(prov1.saldo_gs, prov0.saldo_gs);
    await rechaza(() => E.tx((t) => compras.anularOrdenPago(t, E.admin, op.id, 'otra vez')), /no está confirmada/);
    await E.verificarPartidaDoble();
  });

  test('aislamiento multiempresa: otra empresa no ve ni confirma documentos ajenos', async () => {
    const martillo = await E.art('HM-0001');
    const f = await E.tx((t) =>
      compras.guardarFacturaCompra(t, E.admin, {
        proveedorId: E.proveedor.id,
        timbrado: '12345678',
        numeroComprobante: '009-009-0000001',
        fechaEmision: E.hoy,
        condicionOperacion: 'contado',
        detalles: [{ articuloId: martillo.id, cantidad: 1, precioUnitarioGs: 1_000 }],
      }),
    );
    const ajeno = { ...E.admin, empresaId: E.r.empresaId + 1000 };
    await rechaza(() => E.tx((t) => compras.confirmarFacturaCompra(t, ajeno, f.id)), /inexistente/);
    await rechaza(() => E.tx((t) => compras.guardarRecepcion(t, ajeno, { fecha: E.hoy, facturaCompraId: f.id, depositoId: E.depMatriz.id })), /inexistente/);
  });
});
