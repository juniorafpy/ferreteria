/**
 * Verificación end-to-end de los SERVICIOS de dominio sobre PGlite (sin Next ni PostgreSQL).
 * Aplica ./drizzle, corre el seed y ejecuta:
 *   pedido → OC → factura compra → recepción → presupuesto → factura venta (crédito) → SIFEN →
 *   cobro → (anulación rechazada) → anulación de cobro → anulación de la factura de venta
 * más ajuste de stock, transferencia, orden de pago, cierre de caja y reportes.
 * Uso: npx tsx src/server/__verificacion__/flujo-pglite.ts
 */
import { PGlite } from '@electric-sql/pglite';
import { and, asc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import assert from 'node:assert/strict';
import type { DbLike } from '@/db';
import * as s from '@/db/schema';
import { seed } from '@/db/seed/seed';
import { validarCdc } from '../fiscal/sifen';
import type { Ctx } from '../lib/contexto';
import { hoyPy } from '../lib/fechas';
import { ErrorNegocio } from '../lib/result';
import * as caja from '../services/caja';
import * as compras from '../services/compras';
import * as conta from '../services/contabilidad';
import { resolverDescuento } from '../services/descuentos';
import * as reportes from '../services/reportes';
import { cargarSesion, autenticar } from '../services/seguridad';
import { enviarFacturaSifen, obtenerKude } from '../services/sifen';
import * as stockSvc from '../services/stock';
import * as ventas from '../services/ventas';

let pasos = 0;
const ok = (m: string) => {
  pasos++;
  console.log(`  ok  ${m}`);
};

async function esperarError(nombre: string, fn: () => Promise<unknown>, patron?: RegExp) {
  try {
    await fn();
  } catch (e) {
    const causa = (e as { cause?: { message?: string } }).cause?.message;
    const msg = causa ? `${causa}` : e instanceof Error ? e.message : String(e);
    if (patron) assert.match(msg, patron, `${nombre}: mensaje inesperado "${msg}"`);
    assert.ok(e instanceof ErrorNegocio || patron, `${nombre}: se esperaba ErrorNegocio, llegó ${msg}`);
    ok(`rechazado: ${nombre} → ${msg.slice(0, 100)}`);
    return;
  }
  throw new Error(`Se esperaba error: ${nombre}`);
}

async function main() {
  const client = new PGlite();
  const pg = drizzle({ client, schema: s });
  const db = pg as unknown as DbLike;
  const tx = <T>(fn: (t: DbLike) => Promise<T>) => db.transaction((t) => fn(t as unknown as DbLike));

  console.log('Migraciones + seed...');
  await migrate(pg, { migrationsFolder: './drizzle' });
  const r = await seed(db);
  const [matriz, sanLorenzo] = r.sucursalIds;

  const sesion = await autenticar(db, 'admin', 'Admin.Ferre2026');
  assert.equal(sesion.sucursalId, matriz);
  const ctx: Ctx = sesion;
  ok(`login admin (${sesion.permisos.length} permisos, desc. máx ${sesion.descuentoManualMaxPct}%)`);
  await esperarError('login con contraseña incorrecta', () => autenticar(db, 'admin', 'x'));

  const vend = await autenticar(db, 'vendedor', 'Demo.Ferre2026');
  const ctxVend: Ctx = vend;
  assert.equal(vend.descuentoManualMaxPct, 10);
  const cajero = (await cargarSesion(db, (await autenticar(db, 'cajero', 'Demo.Ferre2026')).usuarioId, r.empresaId, matriz))!;
  assert.ok(!cajero.permisos.includes('ventas.descuento_manual'));

  const art = async (codigo: string) => {
    const [a] = await db.select().from(s.articulos).where(eq(s.articulos.codigo, codigo));
    return a;
  };
  const martillo = await art('HM-0001');
  const cemento = await art('CO-0001');
  const semilla = await art('JA-0001');
  const [proveedor] = await db.select().from(s.proveedores).where(eq(s.proveedores.codigo, 'PRO-0001'));
  const [cliente] = await db.select().from(s.clientes).where(eq(s.clientes.codigo, 'CLI-0002'));
  const [depMatriz] = await db
    .select()
    .from(s.depositos)
    .where(and(eq(s.depositos.sucursal_id, matriz), eq(s.depositos.es_principal, true)));
  const [depSL] = await db
    .select()
    .from(s.depositos)
    .where(and(eq(s.depositos.sucursal_id, sanLorenzo), eq(s.depositos.es_principal, true)));
  const stockDe = async (depositoId: number, articuloId: number) => {
    const [x] = await db
      .select()
      .from(s.stock)
      .where(and(eq(s.stock.deposito_id, depositoId), eq(s.stock.articulo_id, articuloId)));
    return x;
  };
  const kardexDe = (origen: (typeof s.kardex.$inferSelect)['origen_tipo'], id: number) =>
    db
      .select()
      .from(s.kardex)
      .where(and(eq(s.kardex.origen_tipo, origen), eq(s.kardex.origen_id, id)))
      .orderBy(asc(s.kardex.id));
  const hoy = hoyPy();

  const stockMartillo0 = await stockDe(depMatriz.id, martillo.id);
  const stockCemento0 = await stockDe(depMatriz.id, cemento.id);

  /* ---------------- Compras ---------------- */
  console.log('Compras...');
  const pedido = await tx((t) =>
    compras.guardarPedidoCompra(t, ctx, {
      fecha: hoy,
      proveedorId: proveedor.id,
      depositoId: depMatriz.id,
      detalles: [
        { articuloId: martillo.id, cantidad: 10 },
        { articuloId: cemento.id, cantidad: 20 },
      ],
    }),
  );
  await tx((t) => compras.confirmarPedidoCompra(t, ctx, pedido.id));
  ok(`pedido ${pedido.id} confirmado`);

  const oc = await tx((t) =>
    compras.guardarOrdenCompra(t, ctx, { fecha: hoy, proveedorId: proveedor.id, depositoId: depMatriz.id, pedidoIds: [pedido.id] }),
  );
  // Ajustar precios de la OC (IVA incluido) re-guardando con detalles explícitos
  const ocDet = await db.select().from(s.ordenCompraDetalles).where(eq(s.ordenCompraDetalles.orden_compra_id, oc.id)).orderBy(asc(s.ordenCompraDetalles.linea));
  assert.equal(ocDet.length, 2);
  await tx((t) =>
    compras.guardarOrdenCompra(t, ctx, {
      id: oc.id,
      fecha: hoy,
      proveedorId: proveedor.id,
      depositoId: depMatriz.id,
      pedidoIds: [pedido.id],
      detalles: ocDet.map((l) => ({
        detalleOrigenId: l.detalle_origen_id,
        articuloId: l.articulo_id,
        cantidad: l.cantidad,
        precioUnitarioGs: l.articulo_id === martillo.id ? 66_000 : 55_000,
      })),
    }),
  );
  await tx((t) => compras.confirmarOrdenCompra(t, ctx, oc.id));
  const [pedidoTras] = await db.select().from(s.pedidosCompra).where(eq(s.pedidosCompra.id, pedido.id));
  assert.equal(pedidoTras.estado, 'ordenado');
  ok(`OC ${oc.id} confirmada; pedido → ordenado`);

  const fc = await tx((t) =>
    compras.guardarFacturaCompra(t, ctx, {
      proveedorId: proveedor.id,
      ordenCompraId: oc.id,
      timbrado: '12345678',
      numeroComprobante: '001-001-0000123',
      fechaEmision: hoy,
      condicionOperacion: 'credito',
      depositoId: depMatriz.id,
    }),
  );
  const totalFc = 10 * 66_000 + 20 * 55_000;
  const fcConf = await tx((t) => compras.confirmarFacturaCompra(t, ctx, fc.id));
  const [fcRow] = await db.select().from(s.facturasCompra).where(eq(s.facturasCompra.id, fc.id));
  assert.equal(fcRow.total_gs, totalFc);
  assert.equal(fcRow.estado, 'confirmado');
  assert.equal(fcRow.iva_10_gs, Math.round((10 * 66_000) / 11) + Math.round((20 * 55_000) / 11));
  const cxp = await db.select().from(s.cuentasPagar).where(eq(s.cuentasPagar.factura_compra_id, fc.id));
  assert.equal(cxp.reduce((a, c) => a + c.saldo_gs, 0), totalFc);
  const hist = await db.select().from(s.historicoCostos);
  assert.equal(hist.length, 2);
  assert.equal(hist.find((h) => h.articulo_id === martillo.id)!.costo_unitario_gs, 60_000);
  assert.equal((await stockDe(depMatriz.id, martillo.id)).cantidad, stockMartillo0.cantidad, 'la factura no suma stock');
  const [ocTras] = await db.select().from(s.ordenesCompra).where(eq(s.ordenesCompra.id, oc.id));
  assert.equal(ocTras.estado, 'facturado');
  assert.ok(fcConf.asientoId);
  ok(`factura compra ${fc.id}: CxP ${totalFc}, histórico 2 filas, stock sin cambios, OC → facturado`);
  await esperarError('confirmar dos veces la factura de compra', () => tx((t) => compras.confirmarFacturaCompra(t, ctx, fc.id)));
  await esperarError('factura duplicada del proveedor', () =>
    tx(async (t) => {
      const f2 = await compras.guardarFacturaCompra(t, ctx, {
        proveedorId: proveedor.id,
        timbrado: '12345678',
        numeroComprobante: '001-001-0000123',
        fechaEmision: hoy,
        condicionOperacion: 'contado',
        detalles: [{ articuloId: martillo.id, cantidad: 1, precioUnitarioGs: 1000 }],
      });
      return f2;
    }),
    /Ya existe|duplicate|unique|facturas_compra_comprobante_uq/i,
  );

  const rec = await tx((t) => compras.guardarRecepcion(t, ctx, { fecha: hoy, facturaCompraId: fc.id, depositoId: depMatriz.id }));
  await tx((t) => compras.confirmarRecepcion(t, ctx, rec.id));
  const sm1 = await stockDe(depMatriz.id, martillo.id);
  assert.equal(sm1.cantidad, stockMartillo0.cantidad + 10);
  const promEsperado = Math.round((stockMartillo0.cantidad * stockMartillo0.costo_promedio_gs + 10 * 60_000) / (stockMartillo0.cantidad + 10));
  assert.equal(sm1.costo_promedio_gs, promEsperado);
  assert.equal(sm1.ultimo_costo_gs, 60_000);
  assert.equal(hist.find((h) => h.articulo_id === martillo.id)!.costo_promedio_nuevo_gs, promEsperado);
  const kRec = await kardexDe('recepcion', rec.id);
  assert.equal(kRec.length, 2);
  assert.equal(kRec[0].tipo_movimiento, 'entrada_compra');
  const [fcTras] = await db.select().from(s.facturasCompra).where(eq(s.facturasCompra.id, fc.id));
  assert.equal(fcTras.estado, 'recibido');
  ok(`recepción ${rec.id}: stock martillo ${stockMartillo0.cantidad}→${sm1.cantidad}, promedio ${stockMartillo0.costo_promedio_gs}→${sm1.costo_promedio_gs}, kardex 2`);
  await esperarError('recibir más de lo facturado', () =>
    tx((t) => compras.guardarRecepcion(t, ctx, { fecha: hoy, facturaCompraId: fc.id, depositoId: depMatriz.id })),
  );

  const op = await tx((t) =>
    compras.registrarOrdenPago(t, ctx, {
      fecha: hoy,
      proveedorId: proveedor.id,
      medioPago: 'transferencia',
      referencia: 'TRF-1',
      cuentas: [{ cuentaPagarId: cxp[0].id, montoGs: 500_000 }],
    }),
  );
  const [cxpTras] = await db.select().from(s.cuentasPagar).where(eq(s.cuentasPagar.id, cxp[0].id));
  assert.equal(cxpTras.saldo_gs, totalFc - 500_000);
  assert.equal(cxpTras.estado, 'parcial');
  await esperarError('anular factura de compra con mercadería recibida', () =>
    tx((t) => compras.anularFacturaCompra(t, ctx, fc.id, 'prueba')),
  );
  await tx((t) => compras.anularOrdenPago(t, ctx, op.id, 'prueba de anulación'));
  const [cxpTras2] = await db.select().from(s.cuentasPagar).where(eq(s.cuentasPagar.id, cxp[0].id));
  assert.equal(cxpTras2.saldo_gs, totalFc);
  ok('orden de pago registrada y anulada (CxP restaurada)');

  /* ---------------- Ventas ---------------- */
  console.log('Ventas...');
  const auto = await resolverDescuento(db, { empresaId: r.empresaId, sucursalId: matriz, articuloId: martillo.id, cantidad: 3, fecha: hoy });
  assert.ok(auto && auto.descuentoGs === Math.round(3 * 85_000 * 0.1));
  ok(`descuento automático resuelto: ${auto.codigo} ${auto.descuentoGs} Gs`);

  await esperarError(
    'descuento manual que supera el tope del rol (vendedor 10%)',
    () =>
      tx((t) =>
        ventas.guardarPresupuesto(t, ctxVend, {
          fecha: hoy,
          clienteId: cliente.id,
          condicionOperacion: 'credito',
          detalles: [{ articuloId: cemento.id, cantidad: 5, descuentoGs: 50_000 }],
        }),
      ),
    /supera el máximo/,
  );
  await esperarError(
    'descuento manual sin permiso (cajero)',
    () =>
      tx((t) =>
        ventas.guardarPresupuesto(t, cajero, {
          fecha: hoy,
          condicionOperacion: 'contado',
          detalles: [{ articuloId: cemento.id, cantidad: 1, descuentoGs: 1000 }],
        }),
      ),
    /ventas\.descuento_manual/,
  );

  const pres = await tx((t) =>
    ventas.guardarPresupuesto(t, ctxVend, {
      fecha: hoy,
      clienteId: cliente.id,
      condicionOperacion: 'credito',
      detalles: [
        { articuloId: martillo.id, cantidad: 3 },
        { articuloId: cemento.id, cantidad: 5, descuentoGs: 15_500 }, // 5% manual
        { articuloId: semilla.id, cantidad: 2 },
      ],
    }),
  );
  await tx((t) => ventas.confirmarPresupuesto(t, ctxVend, pres.id));
  const presDet = await db.select().from(s.presupuestoDetalles).where(eq(s.presupuestoDetalles.presupuesto_id, pres.id)).orderBy(asc(s.presupuestoDetalles.linea));
  assert.equal(presDet[0].origen_descuento, 'automatico');
  assert.equal(presDet[0].descuento_gs, 25_500);
  assert.equal(presDet[1].origen_descuento, 'manual');
  assert.equal(presDet[2].origen_descuento, 'ninguno');
  assert.equal(presDet[2].iva_gs, Math.round(110_000 / 21));
  ok(`presupuesto ${pres.id} confirmado (auto/manual/ninguno, IVA 5% por línea)`);

  const fvBorr = await tx((t) => ventas.crearFacturaDesdePresupuesto(t, ctx, pres.id));
  const fvConf = await tx((t) => ventas.confirmarFacturaVenta(t, ctx, fvBorr.id));
  const [fv] = await db.select().from(s.facturasVenta).where(eq(s.facturasVenta.id, fvBorr.id));
  assert.equal(fv.estado, 'confirmado');
  assert.equal(fvConf.numero, '001-001-0000001');
  assert.ok(fv.cdc && validarCdc(fv.cdc), 'CDC válido de 44 dígitos');
  assert.ok(fv.qr_url?.includes(`Id=${fv.cdc}`) && fv.qr_url.includes('cHashQR='));
  assert.equal(fv.estado_sifen, 'pendiente');
  assert.equal(fv.total_gs, pres.totalGs);
  const totalVenta = fv.total_gs;
  const smVenta = await stockDe(depMatriz.id, martillo.id);
  assert.equal(smVenta.cantidad, sm1.cantidad - 3);
  const kVenta = await kardexDe('factura_venta', fv.id);
  assert.equal(kVenta.length, 3);
  assert.ok(fv.total_costo_gs > 0);
  const cxc = await db.select().from(s.cuentasCobrar).where(eq(s.cuentasCobrar.factura_venta_id, fv.id));
  assert.equal(cxc.reduce((a, c) => a + c.monto_gs, 0), totalVenta);
  const cuotas = await db.select().from(s.cuotasVenta).where(eq(s.cuotasVenta.factura_venta_id, fv.id));
  assert.equal(cuotas.length, cxc.length);
  const [presTras] = await db.select().from(s.presupuestos).where(eq(s.presupuestos.id, pres.id));
  assert.equal(presTras.estado, 'facturado');
  const [cliTras] = await db.select().from(s.clientes).where(eq(s.clientes.id, cliente.id));
  assert.equal(cliTras.saldo_gs, totalVenta);
  const evGen = await db.select().from(s.sifenEventos).where(eq(s.sifenEventos.factura_venta_id, fv.id));
  assert.equal(evGen[0]?.tipo_evento, 'generacion');
  ok(`factura venta ${fvConf.numero} CDC ${fv.cdc} total ${totalVenta}, CMV ${fv.total_costo_gs}, CxC ${cxc.length} cuota(s), presupuesto → facturado`);
  await esperarError('facturar más que el saldo pendiente del presupuesto', () => tx((t) => ventas.crearFacturaDesdePresupuesto(t, ctx, pres.id)));
  await esperarError('vender sin stock', () =>
    tx(async (t) => {
      const f = await ventas.guardarFacturaVenta(t, ctx, {
        condicionOperacion: 'contado',
        detalles: [{ articuloId: martillo.id, cantidad: 100_000 }],
      });
      return ventas.confirmarFacturaVenta(t, ctx, f.id);
    }),
    /Stock insuficiente/,
  );
  // la numeración no avanzó por la transacción revertida
  const [num] = await db
    .select()
    .from(s.numeracionesDocumento)
    .where(and(eq(s.numeracionesDocumento.sucursal_id, matriz), eq(s.numeracionesDocumento.tipo_documento, 'factura')));
  assert.equal(num.numero_actual, 1);

  const env = await tx((t) => enviarFacturaSifen(t, ctx, fv.id));
  assert.equal(env.estadoSifen, 'aprobado');
  const kude = await obtenerKude(db, ctx, fv.id);
  assert.ok(kude && kude.eventos.length >= 3 && kude.items.length === 3);
  ok('SIFEN stub: aprobado; KuDE con eventos generacion/envio/respuesta');

  /* ---------------- Caja ---------------- */
  console.log('Caja...');
  const [cajaRow] = await db.select().from(s.cajas).where(eq(s.cajas.sucursal_id, matriz));
  const ses = await tx((t) => caja.abrirCaja(t, ctx, { cajaId: cajaRow.id, montoAperturaGs: 500_000 }));
  await esperarError('abrir dos veces', () => tx((t) => caja.abrirCaja(t, ctx, { cajaId: cajaRow.id, montoAperturaGs: 0 })));
  const cobro = await tx((t) =>
    caja.registrarCobro(t, ctx, {
      clienteId: cliente.id,
      cuentas: [{ cuentaCobrarId: cxc[0].id, montoGs: 100_000 }],
      medios: [
        { medioPago: 'efectivo', montoGs: 60_000 },
        { medioPago: 'transferencia', montoGs: 50_000, referencia: 'TRF-99' },
      ],
    }),
  );
  assert.equal(cobro.vueltoGs, 10_000);
  const [cxcTras] = await db.select().from(s.cuentasCobrar).where(eq(s.cuentasCobrar.id, cxc[0].id));
  assert.equal(cxcTras.estado, 'parcial');
  assert.equal(cxcTras.saldo_gs, cxc[0].monto_gs - 100_000);
  ok(`cobro ${cobro.numero}: 100.000 (efectivo 60.000 + transf. 50.000, vuelto 10.000)`);

  await esperarError('anular factura con cobros', () => tx((t) => ventas.anularFacturaVenta(t, ctx, fv.id, 'cliente desistió')), /cobros/);
  await tx((t) => caja.anularCobro(t, ctx, cobro.id, 'error de carga'));
  const [cxcTras2] = await db.select().from(s.cuentasCobrar).where(eq(s.cuentasCobrar.id, cxc[0].id));
  assert.equal(cxcTras2.saldo_gs, cxc[0].monto_gs);
  ok('cobro anulado (CxC restaurada, contra-asiento)');

  /* ---------------- Anulación de la factura de venta ---------------- */
  console.log('Anulación de factura de venta...');
  const anul = await tx((t) => ventas.anularFacturaVenta(t, ctx, fv.id, 'cliente desistió'));
  assert.equal(anul.estadoSifen, 'cancelado');
  const [fvAnul] = await db.select().from(s.facturasVenta).where(eq(s.facturasVenta.id, fv.id));
  assert.equal(fvAnul.estado, 'anulado');
  const smAnul = await stockDe(depMatriz.id, martillo.id);
  assert.equal(smAnul.cantidad, sm1.cantidad);
  assert.equal(smAnul.costo_promedio_gs, sm1.costo_promedio_gs);
  const scAnul = await stockDe(depMatriz.id, cemento.id);
  assert.equal(scAnul.cantidad, stockCemento0.cantidad + 20);
  const kAnul = (await kardexDe('factura_venta', fv.id)).filter((k) => k.tipo_movimiento === 'anulacion_venta');
  assert.equal(kAnul.length, 3);
  const cxcAnul = await db.select().from(s.cuentasCobrar).where(eq(s.cuentasCobrar.factura_venta_id, fv.id));
  assert.ok(cxcAnul.every((c) => c.estado === 'anulado' && c.saldo_gs === 0));
  const [presAnul] = await db.select().from(s.presupuestos).where(eq(s.presupuestos.id, pres.id));
  assert.equal(presAnul.estado, 'confirmado');
  const [cliAnul] = await db.select().from(s.clientes).where(eq(s.clientes.id, cliente.id));
  assert.equal(cliAnul.saldo_gs, 0);
  const asFv = await db
    .select()
    .from(s.asientosContables)
    .where(and(eq(s.asientosContables.origen_tipo, 'factura_venta'), eq(s.asientosContables.origen_id, fv.id)));
  assert.equal(asFv.length, 2);
  assert.ok(asFv.some((a) => a.estado === 'anulado') && asFv.some((a) => a.asiento_revertido_id !== null));
  ok('factura anulada: stock y promedio restaurados, kardex inverso, CxC anulada, presupuesto → confirmado, contra-asiento, SIFEN cancelado');

  /* ---------------- Contado + cierre de caja ---------------- */
  const fContado = await tx(async (t) => {
    const f = await ventas.guardarFacturaVenta(t, ctx, { condicionOperacion: 'contado', detalles: [{ articuloId: cemento.id, cantidad: 2 }] });
    return ventas.confirmarFacturaVenta(t, ctx, f.id);
  });
  assert.equal(fContado.numero, '001-001-0000002');
  const [cxcContado] = await db.select().from(s.cuentasCobrar).where(eq(s.cuentasCobrar.factura_venta_id, fContado.id));
  await tx((t) =>
    caja.registrarCobro(t, ctx, {
      cuentas: [{ cuentaCobrarId: cxcContado.id, montoGs: cxcContado.saldo_gs }],
      medios: [{ medioPago: 'efectivo', montoGs: 200_000 }],
    }),
  );
  const cierre = await tx((t) =>
    caja.cerrarCaja(t, ctx, {
      sesionCajaId: ses.id,
      arqueo: [{ medioPago: 'efectivo', montoDeclaradoGs: 500_000 + cxcContado.saldo_gs - 1_000 }],
    }),
  );
  assert.equal(cierre.diferenciaEfectivoGs, -1_000);
  ok(`venta contado ${fContado.numero} cobrada; cierre de caja con faltante 1.000 (asiento diferencia_caja)`);

  /* ---------------- Ajuste y transferencia ---------------- */
  const aj = await tx((t) =>
    stockSvc.guardarAjusteStock(t, ctx, {
      fecha: hoy,
      depositoId: depMatriz.id,
      tipoAjuste: 'merma',
      motivo: 'Rotura',
      detalles: [{ articuloId: cemento.id, cantidad: 1 }],
    }),
  );
  await tx((t) => stockSvc.confirmarAjusteStock(t, ctx, aj.id));
  await tx((t) => stockSvc.anularAjusteStock(t, ctx, aj.id, 'conteo erróneo'));
  const tr = await tx((t) =>
    stockSvc.guardarTransferencia(t, ctx, {
      fecha: hoy,
      depositoOrigenId: depMatriz.id,
      depositoDestinoId: depSL.id,
      detalles: [{ articuloId: martillo.id, cantidad: 2 }],
    }),
  );
  await tx((t) => stockSvc.enviarTransferencia(t, ctx, tr.id));
  const ctxSL: Ctx = { ...ctx, sucursalId: sanLorenzo };
  const slAntes = await stockDe(depSL.id, martillo.id);
  await tx((t) => stockSvc.recibirTransferencia(t, ctxSL, tr.id));
  const slDespues = await stockDe(depSL.id, martillo.id);
  assert.equal(slDespues.cantidad, slAntes.cantidad + 2);
  ok('ajuste merma confirmado/anulado; transferencia Matriz → San Lorenzo enviada y recibida');

  /* ---------------- Asientos ---------------- */
  console.log('Contabilidad...');
  const sumas = await db
    .select({
      id: s.asientosContables.id,
      cab_d: s.asientosContables.total_debe_gs,
      cab_h: s.asientosContables.total_haber_gs,
      d: sql<number>`sum(${s.detallesAsientoContable.debe_gs})`.mapWith(Number),
      h: sql<number>`sum(${s.detallesAsientoContable.haber_gs})`.mapWith(Number),
      n: sql<number>`count(*)`.mapWith(Number),
    })
    .from(s.asientosContables)
    .innerJoin(s.detallesAsientoContable, eq(s.detallesAsientoContable.asiento_id, s.asientosContables.id))
    .groupBy(s.asientosContables.id);
  assert.ok(sumas.length >= 10);
  for (const a of sumas) {
    assert.equal(a.d, a.h, `asiento ${a.id} descuadrado`);
    assert.equal(a.d, a.cab_d);
    assert.equal(a.h, a.cab_h);
    assert.ok(a.n >= 2);
  }
  ok(`${sumas.length} asientos: todos cuadran (Debe = Haber = cabecera)`);
  await esperarError('asiento manual descuadrado', () =>
    tx(async (t) => {
      const cuentas = await t.select().from(s.planCuentas).where(eq(s.planCuentas.imputable, true)).limit(2);
      return conta.guardarAsientoManual(t, ctx, {
        fecha: hoy,
        concepto: 'x',
        lineas: [
          { cuentaId: cuentas[0].id, debeGs: 100, haberGs: 0 },
          { cuentaId: cuentas[1].id, debeGs: 0, haberGs: 90 },
        ],
      });
    }),
    /descuadrado/,
  );

  /* ---------------- Reportes ---------------- */
  console.log('Reportes...');
  const f = { desde: hoy, hasta: hoy, sucursalId: 0 };
  const lv = await reportes.libroVentas(db, ctx, f);
  assert.equal(lv.filas.length, 1, 'libro de ventas excluye anuladas');
  const lc = await reportes.libroCompras(db, ctx, f);
  assert.equal(lc.totales.total_gs, totalFc);
  const k = await reportes.kardex(db, ctx, { ...f, articuloId: martillo.id, depositoId: depMatriz.id });
  assert.ok(k.filas.length >= 4);
  const ss = await reportes.balanceSumasSaldos(db, ctx, f);
  assert.equal(ss.totales.debe_gs, ss.totales.haber_gs);
  assert.equal(ss.totales.saldo_deudor_gs, ss.totales.saldo_acreedor_gs);
  const [cuentaMerc] = await db.select().from(s.planCuentas).where(eq(s.planCuentas.codigo, '1.1.05'));
  const mayor = await reportes.libroMayor(db, ctx, { ...f, cuentaId: cuentaMerc.id });
  const ultimo = mayor.filas.at(-1) as { saldo_gs: number } | undefined;
  assert.ok(ultimo);
  assert.equal(ultimo.saldo_gs, Number(mayor.extra?.saldoInicialGs ?? 0) + mayor.totales.debe_gs - mayor.totales.haber_gs);
  const diario = await reportes.libroDiario(db, ctx, f);
  assert.equal(diario.totales.debe_gs, diario.totales.haber_gs);
  const hc = await reportes.historicoCostos(db, ctx, { ...f, articuloId: martillo.id });
  assert.equal(hc.filas.length, 1);
  for (const nombre of Object.keys(reportes.REPORTES) as (keyof typeof reportes.REPORTES)[]) {
    const rep = await reportes.REPORTES[nombre](db, ctx, { ...f, cuentaId: cuentaMerc.id, articuloId: martillo.id });
    assert.ok(Array.isArray(rep.filas) && rep.columnas.length > 0, nombre);
  }
  ok(`reportes OK (${Object.keys(reportes.REPORTES).length}); libro mayor 1.1.05 saldo final ${ultimo.saldo_gs}`);

  await client.close();
  console.log(`\nFLUJO PGlite OK (${pasos} verificaciones)`);
}

main().catch((err) => {
  console.error('\nFALLÓ:', err);
  process.exit(1);
});
