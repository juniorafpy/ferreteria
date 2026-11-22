/**
 * Ventas: presupuesto → factura (herencia, saldo pendiente, stock atómico), numeración, CDC,
 * anulación con cobros.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { validarCdc } from '@/server/fiscal/sifen';
import { calcularDvModulo11 } from '@/server/fiscal/ruc';
import * as caja from '@/server/services/caja';
import * as ventas from '@/server/services/ventas';
import { crearEntorno, rechaza, s, type Entorno } from './helpers/db';

let E: Entorno;
before(async () => {
  E = await crearEntorno();
});
after(async () => E?.cerrar());

async function presupuestoConfirmado(detalles: { articuloId: number; cantidad: number; descuentoGs?: number }[], condicion: 'contado' | 'credito' = 'credito') {
  const p = await E.tx((t) =>
    ventas.guardarPresupuesto(t, E.vendedor, { fecha: E.hoy, clienteId: E.cliente.id, condicionOperacion: condicion, detalles }),
  );
  await E.tx((t) => ventas.confirmarPresupuesto(t, E.vendedor, p.id));
  return p.id;
}
const detallesPres = (id: number) =>
  E.db.select().from(s.presupuestoDetalles).where(eq(s.presupuestoDetalles.presupuesto_id, id)).orderBy(asc(s.presupuestoDetalles.linea));
const estadoPres = async (id: number) => (await E.db.select().from(s.presupuestos).where(eq(s.presupuestos.id, id)))[0].estado;

describe('ventas', () => {
  test('presupuesto → factura: hereda cliente, precio y descuento; no se factura dos veces el saldo', async () => {
    const martillo = await E.art('HM-0001');
    const cemento = await E.art('CO-0001');
    const pid = await presupuestoConfirmado([
      { articuloId: martillo.id, cantidad: 2 },
      { articuloId: cemento.id, cantidad: 3, descuentoGs: 9_300 },
    ]);
    const pdet = await detallesPres(pid);
    // Dos borradores desde el mismo presupuesto
    const b1 = await E.tx((t) => ventas.crearFacturaDesdePresupuesto(t, E.admin, pid));
    const b2 = await E.tx((t) => ventas.crearFacturaDesdePresupuesto(t, E.admin, pid));
    const [fb1] = await E.db.select().from(s.facturasVenta).where(eq(s.facturasVenta.id, b1.id));
    assert.equal(fb1.cliente_id, E.cliente.id);
    assert.equal(fb1.condicion_operacion, 'credito');
    const fdet = await E.db.select().from(s.facturaVentaDetalles).where(eq(s.facturaVentaDetalles.factura_venta_id, b1.id)).orderBy(asc(s.facturaVentaDetalles.linea));
    assert.deepEqual(
      fdet.map((l) => [l.detalle_origen_id, l.precio_unitario_gs, l.descuento_gs, l.origen_descuento]),
      pdet.map((l) => [l.id, l.precio_unitario_gs, l.descuento_gs, l.origen_descuento]),
    );
    await E.tx((t) => ventas.confirmarFacturaVenta(t, E.admin, b1.id));
    assert.equal(await estadoPres(pid), 'facturado');
    await rechaza(() => E.tx((t) => ventas.confirmarFacturaVenta(t, E.admin, b2.id)), /no está pendiente de facturar|supera el saldo pendiente/);
    await rechaza(() => E.tx((t) => ventas.crearFacturaDesdePresupuesto(t, E.admin, pid)), /no está pendiente de facturar/);
    const [fb2] = await E.db.select().from(s.facturasVenta).where(eq(s.facturasVenta.id, b2.id));
    assert.equal(fb2.estado, 'borrador', 'el segundo borrador no se emitió');
  });

  test('facturación parcial + resto: saldo exacto y no se excede', async () => {
    const cinta = await E.art('HM-0003');
    const pid = await presupuestoConfirmado([{ articuloId: cinta.id, cantidad: 10 }]);
    const [pd] = await detallesPres(pid);
    // Parcial: 4 de 10
    const parcial = await E.tx((t) =>
      ventas.guardarFacturaVenta(t, E.admin, {
        presupuestoId: pid,
        condicionOperacion: 'credito',
        detalles: [{ detalleOrigenId: pd.id, articuloId: cinta.id, cantidad: 4 }],
      }),
    );
    // Intento de exceder con otra factura de 7 (4 + 7 > 10)
    const exceso = await E.tx((t) =>
      ventas.guardarFacturaVenta(t, E.admin, {
        presupuestoId: pid,
        condicionOperacion: 'credito',
        detalles: [{ detalleOrigenId: pd.id, articuloId: cinta.id, cantidad: 7 }],
      }),
    );
    await E.tx((t) => ventas.confirmarFacturaVenta(t, E.admin, parcial.id));
    assert.equal(await estadoPres(pid), 'facturado_parcial');
    await rechaza(() => E.tx((t) => ventas.confirmarFacturaVenta(t, E.admin, exceso.id)), /supera el saldo pendiente/);
    // Línea ajena al presupuesto
    const otro = await E.art('PI-0001');
    await rechaza(
      () =>
        E.tx((t) =>
          ventas.guardarFacturaVenta(t, E.admin, {
            presupuestoId: pid,
            condicionOperacion: 'credito',
            detalles: [{ detalleOrigenId: pd.id + 9999, articuloId: otro.id, cantidad: 1 }],
          }),
        ),
      /no pertenecen al presupuesto/,
    );
    // Resto
    const resto = await E.tx((t) => ventas.crearFacturaDesdePresupuesto(t, E.admin, pid));
    const [rl] = await E.db.select().from(s.facturaVentaDetalles).where(eq(s.facturaVentaDetalles.factura_venta_id, resto.id));
    assert.equal(rl.cantidad, 6);
    await E.tx((t) => ventas.confirmarFacturaVenta(t, E.admin, resto.id));
    assert.equal(await estadoPres(pid), 'facturado');
    const [pdTras] = await detallesPres(pid);
    assert.equal(pdTras.cantidad_facturada, 10);
    // Prorrateo del descuento automático: parcial + resto = descuento total del presupuesto
    const lineas = await E.db
      .select()
      .from(s.facturaVentaDetalles)
      .where(eq(s.facturaVentaDetalles.detalle_origen_id, pd.id));
    const facturas = await E.db.select().from(s.facturasVenta).where(eq(s.facturasVenta.presupuesto_id, pid));
    const emitidas = new Set(facturas.filter((f) => f.estado === 'confirmado').map((f) => f.id));
    const descFacturado = lineas.filter((l) => emitidas.has(l.factura_venta_id)).reduce((a, l) => a + l.descuento_gs, 0);
    assert.equal(descFacturado, pd.descuento_gs, 'descuento prorrateado = pactado');
  });

  test('stock negativo bloqueado: la transacción completa se revierte (sin numerar ni mover stock)', async () => {
    const taladro = await E.art('HE-0001');
    const st0 = await E.stockDe(E.depMatriz.id, taladro.id);
    const [num0] = await E.db
      .select()
      .from(s.numeracionesDocumento)
      .where(and(eq(s.numeracionesDocumento.sucursal_id, E.matriz), eq(s.numeracionesDocumento.tipo_documento, 'factura')));
    const borr = await E.tx((t) =>
      ventas.guardarFacturaVenta(t, E.admin, { condicionOperacion: 'contado', detalles: [{ articuloId: taladro.id, cantidad: st0.cantidad + 1 }] }),
    );
    await rechaza(() => E.tx((t) => ventas.confirmarFacturaVenta(t, E.admin, borr.id)), /Stock insuficiente/);
    assert.equal((await E.stockDe(E.depMatriz.id, taladro.id)).cantidad, st0.cantidad);
    assert.equal((await E.kardexDe('factura_venta', borr.id)).length, 0);
    const [num1] = await E.db.select().from(s.numeracionesDocumento).where(eq(s.numeracionesDocumento.id, num0.id));
    assert.equal(num1.numero_actual, num0.numero_actual, 'la numeración no avanza');
    // Vender exactamente el stock disponible sí se permite y deja 0
    const exacta = await E.tx(async (t) => {
      const f = await ventas.guardarFacturaVenta(t, E.admin, { condicionOperacion: 'contado', detalles: [{ articuloId: taladro.id, cantidad: st0.cantidad }] });
      return ventas.confirmarFacturaVenta(t, E.admin, f.id);
    });
    assert.ok(exacta.numero);
    assert.equal((await E.stockDe(E.depMatriz.id, taladro.id)).cantidad, 0);
    await rechaza(
      () =>
        E.tx(async (t) => {
          const f = await ventas.guardarFacturaVenta(t, E.admin, { condicionOperacion: 'contado', detalles: [{ articuloId: taladro.id, cantidad: 1 }] });
          return ventas.confirmarFacturaVenta(t, E.admin, f.id);
        }),
      /Stock insuficiente/,
    );
    // Dos líneas del mismo artículo que juntas superan el stock
    const cable = await E.art('EL-0001');
    const stc = await E.stockDe(E.depMatriz.id, cable.id);
    await rechaza(
      () =>
        E.tx(async (t) => {
          const f = await ventas.guardarFacturaVenta(t, E.admin, {
            condicionOperacion: 'contado',
            detalles: [
              { articuloId: cable.id, cantidad: stc.cantidad - 1 },
              { articuloId: cable.id, cantidad: 2 },
            ],
          });
          return ventas.confirmarFacturaVenta(t, E.admin, f.id);
        }),
      /Stock insuficiente/,
    );
    assert.equal((await E.stockDe(E.depMatriz.id, cable.id)).cantidad, stc.cantidad);
  });

  test('numeración correlativa sin huecos ni duplicados; CDC de 44 dígitos con DV válido y único', async () => {
    const tornillo = await E.art('FI-0001');
    for (let i = 0; i < 5; i++) {
      await E.tx(async (t) => {
        const f = await ventas.guardarFacturaVenta(t, E.admin, { condicionOperacion: 'contado', detalles: [{ articuloId: tornillo.id, cantidad: 1 + i }] });
        return ventas.confirmarFacturaVenta(t, E.admin, f.id);
      });
      // Intercalar un intento fallido que no debe consumir número
      await rechaza(
        () =>
          E.tx(async (t) => {
            const f = await ventas.guardarFacturaVenta(t, E.admin, { condicionOperacion: 'contado', detalles: [{ articuloId: tornillo.id, cantidad: 10_000_000 }] });
            return ventas.confirmarFacturaVenta(t, E.admin, f.id);
          }),
        /Stock insuficiente/,
      );
    }
    const emitidas = await E.db
      .select()
      .from(s.facturasVenta)
      .where(and(eq(s.facturasVenta.sucursal_id, E.matriz), isNotNull(s.facturasVenta.numero)))
      .orderBy(asc(s.facturasVenta.numero));
    const nums = emitidas.map((f) => f.numero!);
    assert.deepEqual(nums, Array.from({ length: nums.length }, (_, i) => i + 1), 'correlativo 1..N sin huecos');
    assert.equal(new Set(emitidas.map((f) => `${f.timbrado}|${f.establecimiento}|${f.punto_expedicion}|${f.numero}`)).size, emitidas.length);
    const [empresa] = await E.db.select().from(s.empresas).where(eq(s.empresas.id, E.r.empresaId));
    const cdcs = emitidas.map((f) => f.cdc!);
    assert.equal(new Set(cdcs).size, cdcs.length, 'CDC único');
    for (const f of emitidas) {
      const cdc = f.cdc!;
      assert.ok(validarCdc(cdc), `CDC válido ${cdc}`);
      assert.equal(cdc.length, 44);
      assert.equal(Number(cdc[43]), calcularDvModulo11(cdc.slice(0, 43)));
      assert.equal(cdc.slice(0, 2), '01', 'iTiDE factura');
      assert.equal(cdc.slice(2, 10), empresa.ruc.padStart(8, '0'));
      assert.equal(cdc.slice(10, 11), String(empresa.dv));
      assert.equal(cdc.slice(11, 14), f.establecimiento);
      assert.equal(cdc.slice(14, 17), f.punto_expedicion);
      assert.equal(Number(cdc.slice(17, 24)), f.numero);
      // CDC alterado en un dígito → DV inválido
      const alterado = cdc.slice(0, 30) + ((Number(cdc[30]) + 1) % 10) + cdc.slice(31);
      assert.equal(validarCdc(alterado), false);
    }
    // Restricción única en BD
    await assert.rejects(
      E.db.update(s.facturasVenta).set({ cdc: emitidas[0].cdc }).where(eq(s.facturasVenta.id, emitidas[1].id)),
    );
    await assert.rejects(
      E.db.update(s.facturasVenta).set({ numero: emitidas[0].numero }).where(eq(s.facturasVenta.id, emitidas[1].id)),
    );
  });

  test('anulación de venta con cobros: bloqueada; tras anular el cobro revierte stock, CxC, cliente y asientos', async () => {
    const pintura = await E.art('PI-0001');
    const st0 = await E.stockDe(E.depMatriz.id, pintura.id);
    const [cli0] = await E.db.select().from(s.clientes).where(eq(s.clientes.id, E.cliente.id));
    const f = await E.tx(async (t) => {
      const b = await ventas.guardarFacturaVenta(t, E.admin, { clienteId: E.cliente.id, condicionOperacion: 'credito', cantidadCuotas: 2, detalles: [{ articuloId: pintura.id, cantidad: 2 }] });
      return ventas.confirmarFacturaVenta(t, E.admin, b.id);
    });
    const cxc = await E.db.select().from(s.cuentasCobrar).where(eq(s.cuentasCobrar.factura_venta_id, f.id)).orderBy(asc(s.cuentasCobrar.id));
    assert.equal(cxc.length, 2);
    assert.equal(cxc.reduce((a, c) => a + c.monto_gs, 0), f.totalGs, 'cuotas suman el total');
    const [cajaRow] = await E.db.select().from(s.cajas).where(eq(s.cajas.sucursal_id, E.matriz));
    const ses = await E.tx((t) => caja.abrirCaja(t, E.admin, { cajaId: cajaRow.id, montoAperturaGs: 0 }));
    const cobro = await E.tx((t) =>
      caja.registrarCobro(t, E.admin, { cuentas: [{ cuentaCobrarId: cxc[0].id, montoGs: 1_000 }], medios: [{ medioPago: 'efectivo', montoGs: 1_000 }] }),
    );
    await rechaza(() => E.tx((t) => ventas.anularFacturaVenta(t, E.admin, f.id, 'desiste')), /cobros/);
    await E.tx((t) => caja.anularCobro(t, E.admin, cobro.id, 'error'));
    await E.tx((t) => ventas.anularFacturaVenta(t, E.admin, f.id, 'desiste'));
    await rechaza(() => E.tx((t) => ventas.anularFacturaVenta(t, E.admin, f.id, 'otra vez')), /ya está anulada/);

    const [fv] = await E.db.select().from(s.facturasVenta).where(eq(s.facturasVenta.id, f.id));
    assert.equal(fv.estado, 'anulado');
    assert.equal(fv.numero, Number(f.numero.slice(-7)), 'conserva su número (no hay borrado ni renumeración)');
    assert.equal((await E.stockDe(E.depMatriz.id, pintura.id)).cantidad, st0.cantidad);
    const [cli1] = await E.db.select().from(s.clientes).where(eq(s.clientes.id, E.cliente.id));
    assert.equal(cli1.saldo_gs, cli0.saldo_gs);
    const cxc1 = await E.db.select().from(s.cuentasCobrar).where(eq(s.cuentasCobrar.factura_venta_id, f.id));
    assert.ok(cxc1.every((c) => c.estado === 'anulado' && c.saldo_gs === 0));
    const [cb] = await E.db.select().from(s.cobros).where(eq(s.cobros.id, cobro.id));
    assert.equal(cb.estado, 'anulado');
    const asCobro = await E.asientosDe('cobro', cobro.id);
    assert.equal(asCobro.length, 2);
    const asFv = await E.asientosDe('factura_venta', f.id);
    assert.equal(asFv.length, 2);
    assert.ok(asFv[1].asiento_revertido_id === asFv[0].id && asFv[0].estado === 'anulado');
    const eventos = await E.db.select().from(s.sifenEventos).where(eq(s.sifenEventos.factura_venta_id, f.id));
    assert.ok(eventos.some((e) => e.tipo_evento === 'cancelacion'));
    await rechaza(() => E.db.delete(s.facturasVenta).where(eq(s.facturasVenta.id, f.id)), /use anulación/);
    await rechaza(() => E.db.delete(s.kardex).where(eq(s.kardex.origen_id, f.id)), /append-only/);
    // cierre de caja (sin diferencias)
    await E.tx((t) => caja.cerrarCaja(t, E.admin, { sesionCajaId: ses.id, arqueo: [{ medioPago: 'efectivo', montoDeclaradoGs: 0 }] }));
    await E.verificarPartidaDoble();
  });

  test('crédito: límite de crédito y cliente obligatorio', async () => {
    const martillo = await E.art('HM-0001');
    // CLI-0001 no tiene línea de crédito
    const [sinCredito] = await E.db.select().from(s.clientes).where(eq(s.clientes.codigo, 'CLI-0001'));
    await rechaza(
      () =>
        E.tx(async (t) => {
          const b = await ventas.guardarFacturaVenta(t, E.admin, { clienteId: sinCredito.id, condicionOperacion: 'credito', detalles: [{ articuloId: martillo.id, cantidad: 1 }] });
          return ventas.confirmarFacturaVenta(t, E.admin, b.id);
        }),
      /crédito/,
    );
    await rechaza(
      () => E.tx((t) => ventas.guardarFacturaVenta(t, E.admin, { condicionOperacion: 'credito', detalles: [{ articuloId: martillo.id, cantidad: 1 }] })),
      /requiere cliente/,
    );
  });
});
