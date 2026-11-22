/**
 * Caja: una sesión solo la puede cerrar su titular o un supervisor de la MISMA sucursal.
 * (Antes cualquier usuario con caja.sesion.cerrar cerraba sesiones ajenas de cualquier sucursal.)
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import * as caja from '@/server/services/caja';
import { crearEntorno, rechaza, s, type Entorno } from './helpers/db';

let E: Entorno;
before(async () => {
  E = await crearEntorno();
});
after(async () => E?.cerrar());

const arqueo = (monto: number) => [{ medioPago: 'efectivo' as const, montoDeclaradoGs: monto }];

async function cajaMatriz() {
  const filas = await E.db.select().from(s.cajas).where(eq(s.cajas.sucursal_id, E.matriz));
  assert.ok(filas.length > 0, 'caja de la matriz');
  return filas[0];
}

describe('caja', () => {
  test('cerrar sesión: solo el titular o un supervisor de la misma sucursal', async () => {
    const c = await cajaMatriz();

    // Sesión del cajero
    const { id } = await E.tx((t) => caja.abrirCaja(t, E.cajero, { cajaId: c.id, montoAperturaGs: 500_000 }));

    // Otro usuario de la misma sucursal sin caja.cobro.anular no puede cerrarla
    assert.ok(!E.vendedor.permisos.includes('caja.cobro.anular'));
    await rechaza(
      () => E.tx((t) => caja.cerrarCaja(t, E.vendedor, { sesionCajaId: id, arqueo: arqueo(500_000) })),
      /pertenece a otro usuario/,
    );

    // Un supervisor con la sucursal cambiada tampoco cierra sesiones de otra sucursal
    await rechaza(
      () =>
        E.tx((t) =>
          caja.cerrarCaja(t, { ...E.admin, sucursalId: E.sanLorenzo }, { sesionCajaId: id, arqueo: arqueo(500_000) }),
        ),
      /pertenece a otro usuario/,
    );

    // El titular sí puede
    const r = await E.tx((t) => caja.cerrarCaja(t, E.cajero, { sesionCajaId: id, arqueo: arqueo(500_000) }));
    assert.equal(r.id, id);
    assert.equal(r.diferenciaEfectivoGs, 0, 'sin movimientos, el arqueo coincide con la apertura');

    // Sesión del admin: un cajero (aunque tenga caja.sesion.cerrar) no puede cerrarla
    const { id: idAdmin } = await E.tx((t) => caja.abrirCaja(t, E.admin, { cajaId: c.id, montoAperturaGs: 300_000 }));
    await rechaza(
      () => E.tx((t) => caja.cerrarCaja(t, E.cajero, { sesionCajaId: idAdmin, arqueo: arqueo(300_000) })),
      /pertenece a otro usuario/,
    );

    // El admin de la misma sucursal (supervisor) sí puede
    const r2 = await E.tx((t) => caja.cerrarCaja(t, E.admin, { sesionCajaId: idAdmin, arqueo: arqueo(300_000) }));
    assert.equal(r2.id, idAdmin);

    // Cerrada una vez, no se vuelve a cerrar
    await rechaza(
      () => E.tx((t) => caja.cerrarCaja(t, E.admin, { sesionCajaId: idAdmin, arqueo: arqueo(300_000) })),
      /ya está cerrada/,
    );
  });
});
