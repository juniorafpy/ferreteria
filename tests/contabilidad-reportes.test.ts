/**
 * Partida doble, anulaciones de ajustes/transferencias/asientos (revierten, no borran) y
 * reportes que cuadran con las transacciones (libros IVA, diario, mayor, sumas y saldos, kardex).
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { and, eq, gte, lte, ne, notInArray, sql } from 'drizzle-orm';
import { REPORTES as CATALOGO_UI } from '@/lib/ui/reportes';
import { asientoManualInput } from '@/server/validation/contabilidad';
import * as caja from '@/server/services/caja';
import * as compras from '@/server/services/compras';
import * as conta from '@/server/services/contabilidad';
import * as reportes from '@/server/services/reportes';
import * as stockSvc from '@/server/services/stock';
import * as ventas from '@/server/services/ventas';
import { crearEntorno, rechaza, s, type Entorno } from './helpers/db';

let E: Entorno;
before(async () => {
  E = await crearEntorno();
});
after(async () => E?.cerrar());

const cuentaPorCodigo = async (codigo: string) => (await E.db.select().from(s.planCuentas).where(eq(s.planCuentas.codigo, codigo)))[0];
const imputables = async () => E.db.select().from(s.planCuentas).where(eq(s.planCuentas.imputable, true));

describe('partida doble', () => {
  test('asiento manual descuadrado, con línea a ambos lados o en cuenta no imputable → rechazo', async () => {
    const [c1, c2] = await imputables();
    const madre = (await E.db.select().from(s.planCuentas).where(eq(s.planCuentas.imputable, false)))[0];
    const lineas = (d: number, h: number) => [
      { cuentaId: c1.id, debeGs: d, haberGs: 0 },
      { cuentaId: c2.id, debeGs: 0, haberGs: h },
    ];
    assert.equal(asientoManualInput.safeParse({ fecha: E.hoy, concepto: 'x', lineas: lineas(100, 90) }).success, false);
    await rechaza(() => E.tx((t) => conta.guardarAsientoManual(t, E.admin, { fecha: E.hoy, concepto: 'x', lineas: lineas(100, 90) })), /descuadrado/);
    await rechaza(
      () =>
        E.tx((t) =>
          conta.guardarAsientoManual(t, E.admin, {
            fecha: E.hoy,
            concepto: 'x',
            lineas: [
              { cuentaId: c1.id, debeGs: 100, haberGs: 100 },
              { cuentaId: c2.id, debeGs: 0, haberGs: 0 },
            ],
          }),
        ),
      /al menos dos líneas|Debe o al Haber/,
    );
    await rechaza(
      () =>
        E.tx((t) =>
          conta.guardarAsientoManual(t, E.admin, {
            fecha: E.hoy,
            concepto: 'x',
            lineas: [
              { cuentaId: madre.id, debeGs: 100, haberGs: 0 },
              { cuentaId: c2.id, debeGs: 0, haberGs: 100 },
            ],
          }),
        ),
      /no es imputable/,
    );
  });

  test('el trigger diferido de la BD rechaza un asiento confirmado descuadrado insertado por fuera del servicio', async () => {
    const [c1, c2] = await imputables();
    await rechaza(
      () =>
        E.tx(async (t) => {
          const [a] = await t
            .insert(s.asientosContables)
            .values({
              empresa_id: E.r.empresaId,
              sucursal_id: E.matriz,
              numero: 999_999,
              fecha: E.hoy,
              concepto: 'manipulado',
              origen_tipo: 'manual',
              total_debe_gs: 100,
              total_haber_gs: 100,
              estado: 'confirmado',
              creado_por: E.admin.usuarioId,
            })
            .returning();
          await t.insert(s.detallesAsientoContable).values([
            { empresa_id: E.r.empresaId, sucursal_id: E.matriz, asiento_id: a.id, linea: 1, cuenta_id: c1.id, debe_gs: 100, haber_gs: 0 },
            { empresa_id: E.r.empresaId, sucursal_id: E.matriz, asiento_id: a.id, linea: 2, cuenta_id: c2.id, debe_gs: 0, haber_gs: 90 },
          ]);
        }),
      /partida doble|check/i,
    );
  });

  test('anular asiento manual crea contra-asiento; no se anula un contra-asiento ni un automático; no se borra', async () => {
    const [c1, c2] = await imputables();
    const a = await E.tx((t) =>
      conta.guardarAsientoManual(t, E.admin, {
        fecha: E.hoy,
        concepto: 'Reclasificación',
        lineas: [
          { cuentaId: c1.id, debeGs: 5_000, haberGs: 0 },
          { cuentaId: c2.id, debeGs: 0, haberGs: 5_000 },
        ],
      }),
    );
    const rev = await E.tx((t) => conta.anularAsiento(t, E.admin, a.id, 'error'));
    const [orig] = await E.db.select().from(s.asientosContables).where(eq(s.asientosContables.id, a.id));
    const [contra] = await E.db.select().from(s.asientosContables).where(eq(s.asientosContables.id, rev.id));
    assert.equal(orig.estado, 'anulado');
    assert.equal(contra.asiento_revertido_id, a.id);
    const lc = await E.db.select().from(s.detallesAsientoContable).where(eq(s.detallesAsientoContable.asiento_id, rev.id));
    assert.deepEqual(
      lc.map((l) => [l.cuenta_id, l.debe_gs, l.haber_gs]).sort(),
      [
        [c1.id, 0, 5_000],
        [c2.id, 5_000, 0],
      ].sort(),
    );
    await rechaza(() => E.tx((t) => conta.anularAsiento(t, E.admin, rev.id, 'x')), /contra-asiento/);
    await rechaza(() => E.db.delete(s.asientosContables).where(eq(s.asientosContables.id, a.id)), /use anulación/);
    // Un asiento automático se revierte solo anulando su documento
    const cemento = await E.art('CO-0001');
    const f = await E.tx(async (t) => {
      const b = await ventas.guardarFacturaVenta(t, E.admin, { condicionOperacion: 'contado', detalles: [{ articuloId: cemento.id, cantidad: 1 }] });
      return ventas.confirmarFacturaVenta(t, E.admin, b.id);
    });
    const [auto] = await E.asientosDe('factura_venta', f.id);
    await rechaza(() => E.tx((t) => conta.anularAsiento(t, E.admin, auto.id, 'x')), /documento de origen/);
  });
});

describe('anulaciones de inventario (revierten, no borran)', () => {
  test('ajuste merma/sobrante: confirmar y anular restaura stock y revierte asiento; merma > stock bloqueada', async () => {
    const pintura = await E.art('PI-0001');
    const st0 = await E.stockDe(E.depMatriz.id, pintura.id);
    await rechaza(
      () =>
        E.tx(async (t) => {
          const a = await stockSvc.guardarAjusteStock(t, E.admin, { fecha: E.hoy, depositoId: E.depMatriz.id, tipoAjuste: 'merma', motivo: 'x', detalles: [{ articuloId: pintura.id, cantidad: st0.cantidad + 1 }] });
          return stockSvc.confirmarAjusteStock(t, E.admin, a.id);
        }),
      /Stock insuficiente/,
    );
    for (const tipo of ['merma', 'sobrante'] as const) {
      const a = await E.tx((t) =>
        stockSvc.guardarAjusteStock(t, E.admin, { fecha: E.hoy, depositoId: E.depMatriz.id, tipoAjuste: tipo, motivo: 'Conteo', detalles: [{ articuloId: pintura.id, cantidad: 3 }] }),
      );
      await E.tx((t) => stockSvc.confirmarAjusteStock(t, E.admin, a.id));
      assert.equal((await E.stockDe(E.depMatriz.id, pintura.id)).cantidad, st0.cantidad + (tipo === 'merma' ? -3 : 3));
      await rechaza(() => E.tx((t) => stockSvc.confirmarAjusteStock(t, E.admin, a.id)), /no está en borrador/);
      await E.tx((t) => stockSvc.anularAjusteStock(t, E.admin, a.id, 'conteo erróneo'));
      const st = await E.stockDe(E.depMatriz.id, pintura.id);
      assert.equal(st.cantidad, st0.cantidad);
      assert.equal(st.costoPromedio, st0.costoPromedio);
      assert.equal((await E.kardexDe('ajuste_stock', a.id)).length, 2);
      const as = await E.asientosDe('ajuste_stock', a.id);
      assert.equal(as.length, 2);
      assert.equal(as[0].estado, 'anulado');
      const [aj] = await E.db.select().from(s.ajustesStock).where(eq(s.ajustesStock.id, a.id));
      assert.equal(aj.estado, 'anulado');
      await rechaza(() => E.tx((t) => stockSvc.anularAjusteStock(t, E.admin, a.id, 'otra')), /ya está anulado/);
    }
  });

  test('transferencia enviada y recibida → anulación restaura ambos depósitos y revierte el asiento', async () => {
    const martillo = await E.art('HM-0001');
    const o0 = await E.stockDe(E.depMatriz.id, martillo.id);
    const d0 = await E.stockDe(E.depSL.id, martillo.id);
    const ctxSL = { ...E.admin, sucursalId: E.sanLorenzo };
    const t1 = await E.tx((t) => stockSvc.guardarTransferencia(t, E.admin, { fecha: E.hoy, depositoOrigenId: E.depMatriz.id, depositoDestinoId: E.depSL.id, detalles: [{ articuloId: martillo.id, cantidad: 4 }] }));
    await E.tx((t) => stockSvc.enviarTransferencia(t, E.admin, t1.id));
    assert.equal((await E.stockDe(E.depMatriz.id, martillo.id)).cantidad, o0.cantidad - 4);
    await rechaza(() => E.tx((t) => stockSvc.recibirTransferencia(t, E.admin, t1.id)), /sucursal destino/);
    await E.tx((t) => stockSvc.recibirTransferencia(t, ctxSL, t1.id));
    assert.equal((await E.stockDe(E.depSL.id, martillo.id)).cantidad, d0.cantidad + 4);
    await E.tx((t) => stockSvc.anularTransferencia(t, E.admin, t1.id, 'error'));
    assert.equal((await E.stockDe(E.depMatriz.id, martillo.id)).cantidad, o0.cantidad);
    assert.equal((await E.stockDe(E.depSL.id, martillo.id)).cantidad, d0.cantidad);
    const as = await E.asientosDe('transferencia_stock', t1.id);
    assert.equal(as.length, 2);
    assert.equal(as[1].asiento_revertido_id, as[0].id);
    // Enviada (no recibida) → reingresa al origen
    const t2 = await E.tx((t) => stockSvc.guardarTransferencia(t, E.admin, { fecha: E.hoy, depositoOrigenId: E.depMatriz.id, depositoDestinoId: E.depSL.id, detalles: [{ articuloId: martillo.id, cantidad: 2 }] }));
    await E.tx((t) => stockSvc.enviarTransferencia(t, E.admin, t2.id));
    await E.tx((t) => stockSvc.anularTransferencia(t, E.admin, t2.id, 'no viaja'));
    assert.equal((await E.stockDe(E.depMatriz.id, martillo.id)).cantidad, o0.cantidad);
    // Transferir más que el stock → bloqueado
    const t3 = await E.tx((t) =>
      stockSvc.guardarTransferencia(t, E.admin, { fecha: E.hoy, depositoOrigenId: E.depMatriz.id, depositoDestinoId: E.depSL.id, detalles: [{ articuloId: martillo.id, cantidad: o0.cantidad + 1 }] }),
    );
    await rechaza(() => E.tx((t) => stockSvc.enviarTransferencia(t, E.admin, t3.id)), /Stock insuficiente/);
  });
});

describe('reportes cuadran con las transacciones', () => {
  before(async () => {
    // Movimiento variado: compras, recepciones, ventas contado y crédito, cobro, caja con diferencia.
    const cemento = await E.art('CO-0001');
    const semilla = await E.art('JA-0001');
    const martillo = await E.art('HM-0001');
    const f = await E.tx((t) =>
      compras.guardarFacturaCompra(t, E.admin, {
        proveedorId: E.proveedor.id,
        timbrado: '12345678',
        numeroComprobante: '001-001-0004444',
        fechaEmision: E.hoy,
        condicionOperacion: 'credito',
        depositoId: E.depMatriz.id,
        detalles: [
          { articuloId: cemento.id, cantidad: 10, precioUnitarioGs: 52_800 },
          { articuloId: semilla.id, cantidad: 5, precioUnitarioGs: 37_800 },
        ],
      }),
    );
    await E.tx((t) => compras.confirmarFacturaCompra(t, E.admin, f.id));
    const rec = await E.tx((t) => compras.guardarRecepcion(t, E.admin, { fecha: E.hoy, facturaCompraId: f.id, depositoId: E.depMatriz.id }));
    await E.tx((t) => compras.confirmarRecepcion(t, E.admin, rec.id));
    const [cajaRow] = await E.db.select().from(s.cajas).where(eq(s.cajas.sucursal_id, E.matriz));
    const ses = await E.tx((t) => caja.abrirCaja(t, E.admin, { cajaId: cajaRow.id, montoAperturaGs: 100_000 }));
    for (const [cond, cant] of [
      ['contado', 2],
      ['credito', 3],
      ['contado', 1],
    ] as const) {
      const fv = await E.tx(async (t) => {
        const b = await ventas.guardarFacturaVenta(t, E.admin, {
          clienteId: cond === 'credito' ? E.cliente.id : null,
          condicionOperacion: cond,
          detalles: [
            { articuloId: cemento.id, cantidad: cant },
            { articuloId: martillo.id, cantidad: 1 },
            { articuloId: semilla.id, cantidad: 0.5 },
          ],
        });
        return ventas.confirmarFacturaVenta(t, E.admin, b.id);
      });
      if (cond === 'contado') {
        const [cxc] = await E.db.select().from(s.cuentasCobrar).where(eq(s.cuentasCobrar.factura_venta_id, fv.id));
        await E.tx((t) => caja.registrarCobro(t, E.admin, { cuentas: [{ cuentaCobrarId: cxc.id, montoGs: cxc.saldo_gs }], medios: [{ medioPago: 'efectivo', montoGs: cxc.saldo_gs }] }));
      }
    }
    // una venta anulada (no debe figurar en el libro)
    const anulada = await E.tx(async (t) => {
      const b = await ventas.guardarFacturaVenta(t, E.admin, { condicionOperacion: 'contado', detalles: [{ articuloId: cemento.id, cantidad: 1 }] });
      return ventas.confirmarFacturaVenta(t, E.admin, b.id);
    });
    await E.tx((t) => ventas.anularFacturaVenta(t, E.admin, anulada.id, 'prueba'));
    await E.tx((t) => caja.cerrarCaja(t, E.admin, { sesionCajaId: ses.id, arqueo: [{ medioPago: 'efectivo', montoDeclaradoGs: 1_000 }] }));
  });

  const F = () => ({ desde: E.hoy, hasta: E.hoy, sucursalId: 0 });

  test('libro de ventas = facturas de venta confirmadas (excluye anuladas)', async () => {
    const lv = await reportes.libroVentas(E.db, E.admin, F());
    const [db] = await E.db
      .select({
        n: sql<number>`count(*)`.mapWith(Number),
        total: sql<number>`coalesce(sum(${s.facturasVenta.total_gs}),0)`.mapWith(Number),
        iva10: sql<number>`coalesce(sum(${s.facturasVenta.iva_10_gs}),0)`.mapWith(Number),
        iva5: sql<number>`coalesce(sum(${s.facturasVenta.iva_5_gs}),0)`.mapWith(Number),
      })
      .from(s.facturasVenta)
      .where(eq(s.facturasVenta.estado, 'confirmado'));
    assert.equal(lv.filas.length, db.n);
    assert.equal(lv.totales.total_gs, db.total);
    assert.equal(lv.totales.iva_10_gs, db.iva10);
    assert.equal(lv.totales.iva_5_gs, db.iva5);
    assert.equal(lv.totales.base_10_gs + lv.totales.iva_10_gs + lv.totales.base_5_gs + lv.totales.iva_5_gs + lv.totales.exenta_gs, lv.totales.total_gs);
    // Ventas por artículo cuadra con el libro
    const vpa = await reportes.ventasPorArticulo(E.db, E.admin, F());
    assert.equal(vpa.totales.total_gs, lv.totales.total_gs);
  });

  test('libro de compras = facturas de compra confirmadas/recibidas', async () => {
    const lc = await reportes.libroCompras(E.db, E.admin, F());
    const [db] = await E.db
      .select({ total: sql<number>`coalesce(sum(${s.facturasCompra.total_gs}),0)`.mapWith(Number), iva: sql<number>`coalesce(sum(${s.facturasCompra.total_iva_gs}),0)`.mapWith(Number) })
      .from(s.facturasCompra)
      .where(notInArray(s.facturasCompra.estado, ['borrador', 'anulado']));
    assert.equal(lc.totales.total_gs, db.total);
    assert.equal(lc.totales.iva_10_gs + lc.totales.iva_5_gs, db.iva);
  });

  test('libro diario y balance de sumas y saldos: Debe total = Haber total = suma de líneas', async () => {
    const [db] = await E.db
      .select({
        d: sql<number>`coalesce(sum(${s.detallesAsientoContable.debe_gs}),0)`.mapWith(Number),
        h: sql<number>`coalesce(sum(${s.detallesAsientoContable.haber_gs}),0)`.mapWith(Number),
      })
      .from(s.detallesAsientoContable)
      .innerJoin(s.asientosContables, eq(s.asientosContables.id, s.detallesAsientoContable.asiento_id))
      .where(and(ne(s.asientosContables.estado, 'borrador'), gte(s.asientosContables.fecha, E.hoy), lte(s.asientosContables.fecha, E.hoy)));
    assert.ok(db.d > 0);
    const diario = await reportes.libroDiario(E.db, E.admin, F());
    assert.equal(diario.totales.debe_gs, db.d);
    assert.equal(diario.totales.haber_gs, db.h);
    const ss = await reportes.balanceSumasSaldos(E.db, E.admin, F());
    assert.equal(ss.totales.debe_gs, ss.totales.haber_gs);
    assert.equal(ss.totales.debe_gs, db.d);
    assert.equal(ss.totales.saldo_deudor_gs, ss.totales.saldo_acreedor_gs);
    await E.verificarPartidaDoble();
  });

  test('libro mayor: saldo final = saldo inicial + Σdebe − Σhaber = última fila, para cada cuenta con movimiento', async () => {
    const ss = await reportes.balanceSumasSaldos(E.db, E.admin, F());
    assert.ok(ss.filas.length >= 5);
    for (const fila of ss.filas as { cuenta_id: number; debe_gs: number; haber_gs: number }[]) {
      const m = await reportes.libroMayor(E.db, E.admin, { ...F(), cuentaId: fila.cuenta_id });
      const ini = Number(m.extra?.saldoInicialGs ?? 0);
      assert.equal(m.totales.debe_gs, fila.debe_gs, 'mayor vs sumas (debe)');
      assert.equal(m.totales.haber_gs, fila.haber_gs, 'mayor vs sumas (haber)');
      assert.equal(m.totales.saldo_final_gs, ini + m.totales.debe_gs - m.totales.haber_gs);
      const ultima = m.filas.at(-1) as { saldo_gs: number };
      assert.equal(ultima.saldo_gs, m.totales.saldo_final_gs);
      // saldo acumulado fila a fila
      let acc = ini;
      for (const x of m.filas as { debe_gs: number; haber_gs: number; saldo_gs: number }[]) {
        acc += x.debe_gs - x.haber_gs;
        assert.equal(x.saldo_gs, acc);
      }
    }
    // Saldo inicial: con un período posterior, todo el movimiento de hoy pasa a saldo inicial
    const merc = await cuentaPorCodigo('1.1.05');
    const manana = new Date(Date.parse(`${E.hoy}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    const hoyM = await reportes.libroMayor(E.db, E.admin, { ...F(), cuentaId: merc.id });
    const futM = await reportes.libroMayor(E.db, E.admin, { desde: manana, hasta: manana, sucursalId: 0, cuentaId: merc.id });
    assert.equal(futM.extra?.saldoInicialGs, hoyM.totales.saldo_final_gs);
  });

  test('kardex: saldo final = stock del depósito', async () => {
    const cemento = await E.art('CO-0001');
    const k = await reportes.kardex(E.db, E.admin, { desde: '1900-01-01', hasta: E.hoy, sucursalId: 0, articuloId: cemento.id, depositoId: E.depMatriz.id });
    const ultima = k.filas.at(-1) as Record<string, unknown>;
    const saldo = Number(ultima.saldo_cantidad ?? ultima.saldo ?? NaN);
    assert.equal(saldo, (await E.stockDe(E.depMatriz.id, cemento.id)).cantidad);
  });

  test('exportación CSV: todos los slugs del catálogo de la UI resuelven a un reporte', () => {
    for (const def of CATALOGO_UI) {
      assert.equal(reportes.resolverNombreReporte(def.slug), def.funcion, def.slug);
      assert.equal(reportes.resolverNombreReporte(def.funcion), def.funcion);
    }
    assert.equal(reportes.resolverNombreReporte('toString'), null);
    assert.equal(reportes.resolverNombreReporte('no-existe'), null);
  });
});
