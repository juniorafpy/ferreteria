/**
 * IVA incluido en Guaraníes enteros: el desglose (base + IVA por tasa + exenta) suma EXACTAMENTE el
 * total, línea por línea y en cabecera, con montos que fuerzan redondeo.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { calcularLinea, calcularTotales, ivaIncluido, type TipoIva } from '@/server/fiscal/iva';
import * as compras from '@/server/services/compras';
import * as reportes from '@/server/services/reportes';
import * as ventas from '@/server/services/ventas';
import { crearEntorno, s, type Entorno } from './helpers/db';

const MONTOS = [1, 7, 11, 21, 33, 34, 55, 99, 101, 1_001, 33_333, 999_999];

describe('IVA (funciones puras)', () => {
  test('IVA contenido por línea: /11 y /21 redondeado, base + IVA = total', () => {
    for (const m of MONTOS) {
      for (const t of ['iva10', 'iva5', 'exenta'] as TipoIva[]) {
        const iva = ivaIncluido(m, t);
        assert.ok(Number.isInteger(iva));
        assert.equal(iva, t === 'iva10' ? Math.round(m / 11) : t === 'iva5' ? Math.round(m / 21) : 0);
        assert.equal(m - iva + iva, m);
        assert.ok(iva <= m);
      }
    }
  });

  test('cantidades decimales (33,333) y descuentos: total entero y desglose exacto', () => {
    const lineas = [
      calcularLinea({ cantidad: 33.333, precioUnitarioGs: 1, tipoIva: 'iva10' }),
      calcularLinea({ cantidad: 3, precioUnitarioGs: 7, descuentoGs: 1, tipoIva: 'iva10' }),
      calcularLinea({ cantidad: 1, precioUnitarioGs: 11, tipoIva: 'iva10' }),
      calcularLinea({ cantidad: 1, precioUnitarioGs: 21, tipoIva: 'iva5' }),
      calcularLinea({ cantidad: 0.5, precioUnitarioGs: 33, tipoIva: 'iva5' }),
      calcularLinea({ cantidad: 2.5, precioUnitarioGs: 3, tipoIva: 'exenta' }),
    ];
    assert.deepEqual(
      lineas.map((l) => l.totalLineaGs),
      [33, 20, 11, 21, 17, 8],
    );
    const tipos: TipoIva[] = ['iva10', 'iva10', 'iva10', 'iva5', 'iva5', 'exenta'];
    const t = calcularTotales(lineas.map((l, i) => ({ ...l, tipoIva: tipos[i] })));
    const suma = lineas.reduce((a, l) => a + l.totalLineaGs, 0);
    assert.equal(t.totalGs, suma);
    assert.equal(t.gravada10Gs - t.iva10Gs + t.iva10Gs + t.gravada5Gs - t.iva5Gs + t.iva5Gs + t.exentaGs, t.totalGs);
    assert.equal(t.totalIvaGs, lineas.reduce((a, l) => a + l.ivaGs, 0), 'IVA de cabecera = suma de IVA por línea');
    assert.equal(t.iva10Gs, 3 + 2 + 1);
    assert.equal(t.iva5Gs, 1 + 1);
  });

  test('propiedad: 500 documentos aleatorios — desglose siempre suma el total', () => {
    let semilla = 42;
    const rnd = () => ((semilla = (semilla * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
    const tipos: TipoIva[] = ['iva10', 'iva5', 'exenta'];
    for (let d = 0; d < 500; d++) {
      const lineas = Array.from({ length: 1 + Math.floor(rnd() * 8) }, () => {
        const tipoIva = tipos[Math.floor(rnd() * 3)];
        const cantidad = Math.round(rnd() * 50_000) / 1000 + 0.001;
        const precioUnitarioGs = 1 + Math.floor(rnd() * 200_000);
        const bruto = Math.round(cantidad * precioUnitarioGs);
        const descuentoGs = Math.floor(rnd() * bruto * 0.2);
        return { ...calcularLinea({ cantidad, precioUnitarioGs, descuentoGs, tipoIva }), tipoIva, descuentoGs };
      });
      const t = calcularTotales(lineas);
      assert.equal(t.gravada10Gs + t.gravada5Gs + t.exentaGs, t.totalGs);
      assert.equal(t.totalIvaGs, t.iva10Gs + t.iva5Gs);
      assert.equal(t.totalGs, lineas.reduce((a, l) => a + l.totalLineaGs, 0));
      for (const v of Object.values(t)) assert.ok(Number.isInteger(v) && v >= 0);
    }
  });
});

describe('IVA (integración)', () => {
  let E: Entorno;
  before(async () => {
    E = await crearEntorno();
  });
  after(async () => E?.cerrar());

  test('factura de venta con precios 1, 7, 11, 21 y cantidad 33,333: cabecera = suma de líneas, libro de ventas cuadra', async () => {
    const martillo = await E.art('HM-0001'); // iva10
    const semilla = await E.art('JA-0001'); // iva5, decimales
    const cable = await E.art('EL-0001'); // iva10, decimales
    const cemento = await E.art('CO-0001');
    const r = await E.tx(async (t) => {
      const f = await ventas.guardarFacturaVenta(t, E.admin, {
        condicionOperacion: 'contado',
        detalles: [
          { articuloId: cemento.id, cantidad: 1, precioUnitarioGs: 1 },
          { articuloId: cemento.id, cantidad: 1, precioUnitarioGs: 7 },
          { articuloId: cemento.id, cantidad: 1, precioUnitarioGs: 11 },
          { articuloId: semilla.id, cantidad: 1, precioUnitarioGs: 21 },
          { articuloId: cable.id, cantidad: 33.333, precioUnitarioGs: 1 },
          { articuloId: semilla.id, cantidad: 3.333, precioUnitarioGs: 70 },
          { articuloId: martillo.id, cantidad: 1, descuentoGs: 0, precioUnitarioGs: 33_333 },
        ],
      });
      return ventas.confirmarFacturaVenta(t, E.admin, f.id);
    });
    const [f] = await E.db.select().from(s.facturasVenta).where(eq(s.facturasVenta.id, r.id));
    const det = await E.db.select().from(s.facturaVentaDetalles).where(eq(s.facturaVentaDetalles.factura_venta_id, r.id)).orderBy(s.facturaVentaDetalles.linea);
    for (const l of det) {
      assert.equal(l.total_linea_gs, Math.round(l.cantidad * l.precio_unitario_gs) - l.descuento_gs);
      assert.equal(l.iva_gs, ivaIncluido(l.total_linea_gs, l.tipo_iva));
    }
    assert.deepEqual(
      det.map((l) => l.iva_gs),
      [0, 1, 1, 1, 3, 11, 3_030],
      'IVA por línea con redondeo',
    );
    assert.equal(f.total_gs, det.reduce((a, l) => a + l.total_linea_gs, 0));
    assert.equal(f.total_iva_gs, det.reduce((a, l) => a + l.iva_gs, 0));
    assert.equal(f.gravada_10_gs + f.gravada_5_gs + f.exenta_gs, f.total_gs);
    assert.equal(f.gravada_10_gs - f.iva_10_gs + f.iva_10_gs + f.gravada_5_gs - f.iva_5_gs + f.iva_5_gs + f.exenta_gs, f.total_gs);

    const lv = await reportes.libroVentas(E.db, E.admin, { desde: E.hoy, hasta: E.hoy, sucursalId: 0 });
    const fila = lv.filas.find((x) => Number((x as { total_gs: number }).total_gs) === f.total_gs) as Record<string, number> | undefined;
    assert.ok(fila);
    assert.equal(fila.base_10_gs + fila.iva_10_gs + fila.base_5_gs + fila.iva_5_gs + fila.exenta_gs, f.total_gs);
    // El asiento de venta cuadra con el desglose
    const [as] = await E.asientosDe('factura_venta', r.id);
    assert.equal(as.total_debe_gs, as.total_haber_gs);
    await E.verificarPartidaDoble();
  });

  test('factura de compra con línea exenta y IVA 5%: libro de compras = facturas', async () => {
    const cemento = await E.art('CO-0001');
    const semilla = await E.art('JA-0001');
    const f = await E.tx((t) =>
      compras.guardarFacturaCompra(t, E.admin, {
        proveedorId: E.proveedor.id,
        timbrado: '12345678',
        numeroComprobante: '001-002-0000033',
        fechaEmision: E.hoy,
        condicionOperacion: 'contado',
        detalles: [
          { articuloId: cemento.id, cantidad: 3, precioUnitarioGs: 7 },
          { articuloId: semilla.id, cantidad: 33.333, precioUnitarioGs: 21 },
          { articuloId: cemento.id, cantidad: 1, precioUnitarioGs: 11, tipoIva: 'exenta' },
        ],
      }),
    );
    await E.tx((t) => compras.confirmarFacturaCompra(t, E.admin, f.id));
    const [fc] = await E.db.select().from(s.facturasCompra).where(eq(s.facturasCompra.id, f.id));
    assert.equal(fc.exenta_gs, 11);
    assert.equal(fc.gravada_10_gs + fc.gravada_5_gs + fc.exenta_gs, fc.total_gs);
    const lc = await reportes.libroCompras(E.db, E.admin, { desde: E.hoy, hasta: E.hoy, sucursalId: 0 });
    const fila = lc.filas[0] as Record<string, number>;
    assert.equal(fila.base_10_gs + fila.iva_10_gs + fila.base_5_gs + fila.iva_5_gs + fila.exenta_gs, fc.total_gs);
  });
});
