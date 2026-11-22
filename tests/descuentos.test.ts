/**
 * Descuentos automáticos (sucursal + fecha + artículo + cantidad mínima + prioridad) y control
 * de descuento manual en el BACKEND (permiso ventas.descuento_manual + tope del rol).
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { asc, eq } from 'drizzle-orm';
import { sumarDias } from '@/server/lib/fechas';
import type { Ctx } from '@/server/lib/contexto';
import * as defs from '@/server/services/definiciones';
import { resolverDescuento } from '@/server/services/descuentos';
import * as org from '@/server/services/organizacion';
import * as ventas from '@/server/services/ventas';
import { crearEntorno, rechaza, s, type Entorno } from './helpers/db';

let E: Entorno;
before(async () => {
  E = await crearEntorno();
});
after(async () => E?.cerrar());

let n = 0;
async function nuevoDescuento(p: {
  articuloId: number;
  pct: number;
  desde?: string;
  hasta?: string;
  prioridad?: number;
  sucursalIds?: number[];
  todas?: boolean;
  min?: number;
  tope?: number;
  acumulable?: boolean;
  estado?: 'activo' | 'inactivo';
}) {
  return E.tx((t) =>
    defs.guardarDescuento(t, E.admin, {
      codigo: `T-${++n}`,
      nombre: `Descuento test ${n}`,
      tipo: 'porcentaje',
      fechaDesde: p.desde ?? sumarDias(E.hoy, -1),
      fechaHasta: p.hasta ?? sumarDias(E.hoy, 30),
      prioridad: p.prioridad ?? 100,
      acumulable: p.acumulable ?? false,
      estado: p.estado,
      todasSucursales: p.todas ?? !p.sucursalIds,
      sucursalIds: p.sucursalIds ?? [],
      articulos: [{ articuloId: p.articuloId, porcentaje: p.pct, cantidadMinima: p.min ?? 1, topeGs: p.tope ?? null }],
    }),
  );
}
const resolver = (articuloId: number, cantidad: number, fecha = E.hoy, sucursalId = E.matriz) =>
  resolverDescuento(E.db, { empresaId: E.r.empresaId, sucursalId, articuloId, cantidad, fecha });

describe('descuentos automáticos', () => {
  test('fuera de vigencia no aplica; dentro de vigencia sí (límites inclusivos)', async () => {
    const cemento = await E.art('CO-0001');
    const desde = sumarDias(E.hoy, 5);
    const hasta = sumarDias(E.hoy, 10);
    await nuevoDescuento({ articuloId: cemento.id, pct: 7, desde, hasta });
    assert.equal(await resolver(cemento.id, 1), null, 'antes de vigencia');
    assert.equal(await resolver(cemento.id, 1, sumarDias(E.hoy, 11)), null, 'después de vigencia');
    assert.equal((await resolver(cemento.id, 1, desde))?.descuentoGs, Math.round(62_000 * 0.07));
    assert.equal((await resolver(cemento.id, 1, hasta))?.descuentoGs, Math.round(62_000 * 0.07));
  });

  test('descuento de otra sucursal no aplica', async () => {
    const pintura = await E.art('PI-0001');
    await nuevoDescuento({ articuloId: pintura.id, pct: 15, sucursalIds: [E.sanLorenzo] });
    assert.equal(await resolver(pintura.id, 1, E.hoy, E.matriz), null);
    assert.equal((await resolver(pintura.id, 1, E.hoy, E.sanLorenzo))?.descuentoGs, Math.round(145_000 * 0.15));
    // Integración: presupuesto en Matriz no recibe el descuento de San Lorenzo
    const p = await E.tx((t) =>
      ventas.guardarPresupuesto(t, E.vendedor, { fecha: E.hoy, condicionOperacion: 'contado', detalles: [{ articuloId: pintura.id, cantidad: 1 }] }),
    );
    const [d] = await E.db.select().from(s.presupuestoDetalles).where(eq(s.presupuestoDetalles.presupuesto_id, p.id));
    assert.equal(d.descuento_gs, 0);
    assert.equal(d.origen_descuento, 'ninguno');
  });

  test('cantidad mínima', async () => {
    const tornillo = await E.art('FI-0001');
    await nuevoDescuento({ articuloId: tornillo.id, pct: 20, min: 100 });
    assert.equal(await resolver(tornillo.id, 99), null);
    assert.equal((await resolver(tornillo.id, 100))?.descuentoGs, Math.round(100 * 300 * 0.2));
  });

  test('prioridad: gana menor prioridad; empate → mayor beneficio; acumulables se suman; tope', async () => {
    const semilla = await E.art('JA-0001');
    const a = await nuevoDescuento({ articuloId: semilla.id, pct: 5, prioridad: 5 });
    await nuevoDescuento({ articuloId: semilla.id, pct: 20, prioridad: 50 });
    let r = await resolver(semilla.id, 2);
    assert.equal(r?.descuentoId, a.id, 'gana prioridad 5 aunque el de 50 sea mayor');
    assert.equal(r?.descuentoGs, Math.round(110_000 * 0.05));
    const c = await nuevoDescuento({ articuloId: semilla.id, pct: 8, prioridad: 5 });
    r = await resolver(semilla.id, 2);
    assert.equal(r?.descuentoId, c.id, 'empate de prioridad → mayor beneficio');

    const llave = await E.art('HM-0002');
    // Seed: PROMO-HERR-10 (prioridad 10, no acumulable)
    assert.equal((await resolver(llave.id, 1))?.descuentoGs, 12_000);
    await nuevoDescuento({ articuloId: llave.id, pct: 3, prioridad: 1, acumulable: true });
    await nuevoDescuento({ articuloId: llave.id, pct: 2, prioridad: 2, acumulable: true });
    r = await resolver(llave.id, 1);
    assert.equal(r?.descuentoGs, 3_600 + 2_400, 'ganador acumulable suma solo los acumulables');

    // Tope del seed (50.000) en martillos: 10 × 85.000 × 10% = 85.000 → 50.000
    const martillo = await E.art('HM-0001');
    assert.equal((await resolver(martillo.id, 10))?.descuentoGs, 50_000);
  });

  test('descuento inactivo no aplica', async () => {
    const clavo = await E.art('FI-0002');
    const d = await nuevoDescuento({ articuloId: clavo.id, pct: 10 });
    assert.ok(await resolver(clavo.id, 1));
    await E.tx((t) => defs.cambiarEstado(t, E.admin, 'descuentos', d.id, 'inactivo'));
    assert.equal(await resolver(clavo.id, 1), null);
  });

  test('el estado enviado al guardar se persiste (antes se descartaba en silencio)', async () => {
    const clavo = await E.art('FI-0002');
    const d = await nuevoDescuento({ articuloId: clavo.id, pct: 10, estado: 'inactivo' });
    const [fila] = await E.db.select().from(s.descuentos).where(eq(s.descuentos.id, d.id));
    assert.equal(fila.estado, 'inactivo');
    assert.equal(await resolver(clavo.id, 1), null, 'un descuento inactivo no se aplica');
  });

  test('el servidor recalcula el descuento automático (ignora un descuentoId/importe inventado)', async () => {
    const martillo = await E.art('HM-0001');
    const p = await E.tx((t) =>
      ventas.guardarPresupuesto(t, E.cajero, { fecha: E.hoy, condicionOperacion: 'contado', detalles: [{ articuloId: martillo.id, cantidad: 2 }] }),
    );
    const [d] = await E.db.select().from(s.presupuestoDetalles).where(eq(s.presupuestoDetalles.presupuesto_id, p.id));
    assert.equal(d.origen_descuento, 'automatico');
    assert.equal(d.descuento_gs, 17_000);
    // Quitar el automático (descuentoGs = 0) no requiere permiso
    const p2 = await E.tx((t) =>
      ventas.guardarPresupuesto(t, E.cajero, { fecha: E.hoy, condicionOperacion: 'contado', detalles: [{ articuloId: martillo.id, cantidad: 2, descuentoGs: 0 }] }),
    );
    const [d2] = await E.db.select().from(s.presupuestoDetalles).where(eq(s.presupuestoDetalles.presupuesto_id, p2.id));
    assert.equal(d2.descuento_gs, 0);
    assert.equal(d2.origen_descuento, 'ninguno');
  });
});

describe('descuento manual (backend)', () => {
  test('sin permiso ventas.descuento_manual → rechazo en presupuesto, factura y confirmación', async () => {
    const cemento = await E.art('CO-0001');
    assert.ok(!E.cajero.permisos.includes('ventas.descuento_manual'));
    const linea = [{ articuloId: cemento.id, cantidad: 1, descuentoGs: 1_000 }];
    await rechaza(
      () => E.tx((t) => ventas.guardarPresupuesto(t, E.cajero, { fecha: E.hoy, condicionOperacion: 'contado', detalles: linea })),
      /ventas\.descuento_manual/,
    );
    await rechaza(() => E.tx((t) => ventas.guardarFacturaVenta(t, E.cajero, { condicionOperacion: 'contado', detalles: linea })), /ventas\.descuento_manual/);
    // Borrador cargado por quien tiene permiso, confirmado por quien no: se revalida con el usuario que confirma
    const b = await E.tx((t) => ventas.guardarFacturaVenta(t, E.vendedor, { condicionOperacion: 'contado', detalles: linea }));
    await rechaza(() => E.tx((t) => ventas.confirmarFacturaVenta(t, E.cajero, b.id)), /ventas\.descuento_manual/);
    const pres = await E.tx((t) => ventas.guardarPresupuesto(t, E.vendedor, { fecha: E.hoy, condicionOperacion: 'contado', detalles: linea }));
    await rechaza(() => E.tx((t) => ventas.confirmarPresupuesto(t, E.cajero, pres.id)), /ventas\.descuento_manual/);
  });

  test('tope del rol: por encima → rechazo; exactamente el tope → aceptado', async () => {
    const cemento = await E.art('CO-0001');
    assert.equal(E.vendedor.descuentoManualMaxPct, 10);
    const bruto = 5 * 62_000;
    await rechaza(
      () =>
        E.tx((t) =>
          ventas.guardarPresupuesto(t, E.vendedor, {
            fecha: E.hoy,
            condicionOperacion: 'contado',
            detalles: [{ articuloId: cemento.id, cantidad: 5, descuentoGs: bruto * 0.1 + 1 }],
          }),
        ),
      /supera el máximo/,
    );
    const p = await E.tx((t) =>
      ventas.guardarPresupuesto(t, E.vendedor, {
        fecha: E.hoy,
        condicionOperacion: 'contado',
        detalles: [{ articuloId: cemento.id, cantidad: 5, descuentoGs: bruto * 0.1 }],
      }),
    );
    const [d] = await E.db.select().from(s.presupuestoDetalles).where(eq(s.presupuestoDetalles.presupuesto_id, p.id));
    assert.equal(d.origen_descuento, 'manual');
    assert.equal(d.descuento_gs, bruto * 0.1);
    // Descuento mayor al importe
    await rechaza(
      () =>
        E.tx((t) =>
          ventas.guardarFacturaVenta(t, E.admin, { condicionOperacion: 'contado', detalles: [{ articuloId: cemento.id, cantidad: 1, descuentoGs: 62_001 }] }),
        ),
      /supera el importe/,
    );
  });

  test('precio distinto al de lista sin articulos.precio.modificar → rechazo', async () => {
    const cemento = await E.art('CO-0001');
    await rechaza(
      () =>
        E.tx((t) =>
          ventas.guardarPresupuesto(t, E.vendedor, {
            fecha: E.hoy,
            condicionOperacion: 'contado',
            detalles: [{ articuloId: cemento.id, cantidad: 1, precioUnitarioGs: 1 }],
          }),
        ),
      /modificar el precio/,
    );
  });

  test('tope efectivo = máximo SOLO de los roles que otorgan ventas.descuento_manual', async () => {
    const r1 = await E.tx((t) =>
      org.guardarRol(t, E.admin, { codigo: 'DESC5', nombre: 'Desc 5', descuentoManualMaxPct: 5, permisos: ['ventas.presupuesto.crear', 'ventas.descuento_manual'] }),
    );
    const r2 = await E.tx((t) =>
      org.guardarRol(t, E.admin, { codigo: 'SIN_DESC', nombre: 'Sin permiso con tope alto', descuentoManualMaxPct: 50, permisos: ['inventario.stock.consultar'] }),
    );
    await E.tx((t) =>
      org.guardarUsuario(t, E.admin, {
        usuario: 'mixto',
        nombre: 'Usuario mixto',
        password: 'Mixto.Ferre2026',
        roles: [
          { rolId: r1.id, sucursalId: null },
          { rolId: r2.id, sucursalId: null },
        ],
      }),
    );
    const mixto: Ctx = await E.sesion('mixto', 'Mixto.Ferre2026');
    assert.equal(mixto.descuentoManualMaxPct, 5);
    const cemento = await E.art('CO-0001');
    await rechaza(
      () =>
        E.tx((t) =>
          ventas.guardarPresupuesto(t, mixto, { fecha: E.hoy, condicionOperacion: 'contado', detalles: [{ articuloId: cemento.id, cantidad: 1, descuentoGs: 6_200 }] }),
        ),
      /supera el máximo/,
    );
  });

  test('prorrateo de descuento en facturación parcial: la suma nunca supera el descuento pactado', async () => {
    const cemento = await E.art('CO-0001');
    // 25 Gs en 2 unidades: 12,5 + 12,5 → con redondeo independiente daría 26
    const p = await E.tx((t) =>
      ventas.guardarPresupuesto(t, E.vendedor, {
        fecha: E.hoy,
        clienteId: E.cliente.id,
        condicionOperacion: 'contado',
        detalles: [{ articuloId: cemento.id, cantidad: 2, descuentoGs: 25 }],
      }),
    );
    await E.tx((t) => ventas.confirmarPresupuesto(t, E.vendedor, p.id));
    const [pd] = await E.db.select().from(s.presupuestoDetalles).where(eq(s.presupuestoDetalles.presupuesto_id, p.id));
    for (let i = 0; i < 2; i++) {
      await E.tx(async (t) => {
        const f = await ventas.guardarFacturaVenta(t, E.admin, {
          presupuestoId: p.id,
          condicionOperacion: 'contado',
          detalles: [{ detalleOrigenId: pd.id, articuloId: cemento.id, cantidad: 1 }],
        });
        return ventas.confirmarFacturaVenta(t, E.admin, f.id);
      });
    }
    const lineas = await E.db
      .select()
      .from(s.facturaVentaDetalles)
      .where(eq(s.facturaVentaDetalles.detalle_origen_id, pd.id))
      .orderBy(asc(s.facturaVentaDetalles.id));
    assert.equal(lineas.reduce((a, l) => a + l.descuento_gs, 0), 25);
  });
});
