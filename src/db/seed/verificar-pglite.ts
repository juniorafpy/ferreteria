/**
 * Verificación sin servidor: aplica las migraciones de ./drizzle sobre PGlite en memoria,
 * corre el seed dos veces (idempotencia) y valida restricciones clave.
 * Uso: npx tsx src/db/seed/verificar-pglite.ts
 */
import { PGlite } from '@electric-sql/pglite';
import { count, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import assert from 'node:assert/strict';
import * as schema from '../schema';
import { verifyPassword } from '../utils/password';
import { seed } from './seed';
import { USUARIOS_DEMO } from './seguridad';

async function esperarError(nombre: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    const err = e as { cause?: { message?: string }; message?: string };
    const motivo = (err.cause?.message ?? err.message ?? '').split('\n')[0].slice(0, 110);
    console.log(`  ok  rechazado: ${nombre} -> ${motivo}`);
    return;
  }
  throw new Error(`Se esperaba error: ${nombre}`);
}

async function main() {
  const client = new PGlite();
  const db = drizzle({ client, schema });

  console.log('Aplicando migraciones...');
  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('Seed (1ª pasada)...');
  const r1 = await seed(db);
  const conteo = async () => {
    const tablas = {
      permisos: schema.permisos,
      roles: schema.roles,
      usuarios: schema.usuarios,
      departamentos: schema.departamentos,
      ciudades: schema.ciudades,
      plan_cuentas: schema.planCuentas,
      configuracion_contable: schema.configuracionContable,
      articulos: schema.articulos,
      stock: schema.stock,
      kardex: schema.kardex,
      descuento_articulos: schema.descuentoArticulos,
      rol_permisos: schema.rolPermisos,
    };
    const out: Record<string, number> = {};
    for (const [k, t] of Object.entries(tablas)) {
      const [{ n }] = await db.select({ n: count() }).from(t);
      out[k] = n;
    }
    return out;
  };
  const c1 = await conteo();
  console.log('  conteos:', c1);

  console.log('Seed (2ª pasada, idempotencia)...');
  const r2 = await seed(db);
  const c2 = await conteo();
  assert.deepEqual(c2, c1, 'El seed no es idempotente');
  assert.equal(r2.empresaId, r1.empresaId);
  console.log('  ok  idempotente');

  assert.equal(c1.departamentos, 18, 'Capital + 17 departamentos');
  assert.ok(c1.configuracion_contable >= 9);

  // Contraseña admin
  const [admin] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.usuario, 'admin'));
  assert.ok(admin.password_hash.startsWith('scrypt$'));
  assert.equal(verifyPassword('incorrecta', admin.password_hash), false);
  assert.equal(verifyPassword(USUARIOS_DEMO[0].password, admin.password_hash), true);
  console.log('  ok  hash scrypt admin');

  // Query relacional
  const art = await db.query.articulos.findFirst({
    with: { stock: true, unidades: true, categoria: true, descuentos: { with: { descuento: true } } },
    where: (a, { eq: e }) => e(a.codigo, 'HM-0001'),
  });
  assert.ok(art && art.stock.length === 2 && art.descuentos.length === 1);
  console.log('  ok  relaciones (articulo + stock + descuentos)');

  // Operaciones config: todas las requeridas están mapeadas
  const ops = await db
    .selectDistinct({ op: schema.configuracionContable.operacion })
    .from(schema.configuracionContable);
  for (const op of ['compra', 'recepcion', 'venta', 'costo_venta', 'cobro', 'pago', 'ajuste_merma', 'ajuste_sobrante', 'transferencia']) {
    assert.ok(ops.some((o) => o.op === op), `Falta configuracion_contable para ${op}`);
  }
  console.log('  ok  configuracion_contable completa');

  console.log('Pruebas de restricciones...');
  const empresaId = r1.empresaId;
  const sucursalId = r1.sucursalIds[0];
  const cuentas = await db.select().from(schema.planCuentas).where(eq(schema.planCuentas.imputable, true));
  const [caja, ventas] = [cuentas.find((c) => c.codigo === '1.1.01')!, cuentas.find((c) => c.codigo === '4.1.01')!];

  await esperarError('asiento cabecera desbalanceada', () =>
    db.insert(schema.asientosContables).values({
      empresa_id: empresaId, sucursal_id: sucursalId, numero: 9001, fecha: '2026-11-01', concepto: 'x',
      total_debe_gs: 100, total_haber_gs: 90, creado_por: admin.id,
    }),
  );
  await esperarError('línea con debe y haber a la vez', () =>
    db.transaction(async (tx) => {
      const [a] = await tx.insert(schema.asientosContables).values({
        empresa_id: empresaId, sucursal_id: sucursalId, numero: 9002, fecha: '2026-11-01', concepto: 'x', creado_por: admin.id,
      }).returning();
      await tx.insert(schema.detallesAsientoContable).values({
        empresa_id: empresaId, sucursal_id: sucursalId, asiento_id: a.id, linea: 1, cuenta_id: caja.id, debe_gs: 10, haber_gs: 10,
      });
    }),
  );
  await esperarError('asiento confirmado con líneas que no cuadran (trigger diferido)', () =>
    db.transaction(async (tx) => {
      const [a] = await tx.insert(schema.asientosContables).values({
        empresa_id: empresaId, sucursal_id: sucursalId, numero: 9003, fecha: '2026-11-01', concepto: 'x',
        total_debe_gs: 1000, total_haber_gs: 1000, estado: 'confirmado', creado_por: admin.id,
      }).returning();
      await tx.insert(schema.detallesAsientoContable).values([
        { empresa_id: empresaId, sucursal_id: sucursalId, asiento_id: a.id, linea: 1, cuenta_id: caja.id, debe_gs: 1000 },
        { empresa_id: empresaId, sucursal_id: sucursalId, asiento_id: a.id, linea: 2, cuenta_id: ventas.id, haber_gs: 900 },
      ]);
    }),
  );
  // Asiento correcto confirmado
  await db.transaction(async (tx) => {
    const [a] = await tx.insert(schema.asientosContables).values({
      empresa_id: empresaId, sucursal_id: sucursalId, numero: 9004, fecha: '2026-11-01', concepto: 'ok',
      total_debe_gs: 1000, total_haber_gs: 1000, estado: 'confirmado', creado_por: admin.id,
    }).returning();
    await tx.insert(schema.detallesAsientoContable).values([
      { empresa_id: empresaId, sucursal_id: sucursalId, asiento_id: a.id, linea: 1, cuenta_id: caja.id, debe_gs: 1000 },
      { empresa_id: empresaId, sucursal_id: sucursalId, asiento_id: a.id, linea: 2, cuenta_id: ventas.id, haber_gs: 1000 },
    ]);
  });
  console.log('  ok  asiento balanceado aceptado');
  await esperarError('borrar asiento confirmado', () =>
    db.delete(schema.asientosContables).where(eq(schema.asientosContables.numero, 9004)),
  );
  await esperarError('UPDATE en kardex (append-only)', () =>
    db.update(schema.kardex).set({ cantidad_entrada: 1 }).where(sql`true`),
  );

  // Factura de venta: confirmada sin numeración, CDC duplicado
  const [deposito] = await db.select().from(schema.depositos).where(eq(schema.depositos.sucursal_id, sucursalId));
  const baseFactura = {
    empresa_id: empresaId, sucursal_id: sucursalId, deposito_id: deposito.id, creado_por: admin.id,
  };
  await esperarError('factura confirmada sin número', () =>
    db.insert(schema.facturasVenta).values({ ...baseFactura, estado: 'confirmado' }),
  );
  await esperarError('totales de factura que no cuadran', () =>
    db.insert(schema.facturasVenta).values({ ...baseFactura, gravada_10_gs: 11000, total_gs: 10000 }),
  );
  const cdc = '0'.repeat(44);
  await db.insert(schema.facturasVenta).values({
    ...baseFactura, estado: 'confirmado', timbrado: '18000001', establecimiento: '001', punto_expedicion: '001',
    numero: 1, cdc, gravada_10_gs: 11000, iva_10_gs: 1000, total_iva_gs: 1000, total_gs: 11000,
  });
  await esperarError('número de factura duplicado', () =>
    db.insert(schema.facturasVenta).values({
      ...baseFactura, estado: 'confirmado', timbrado: '18000001', establecimiento: '001', punto_expedicion: '001', numero: 1,
    }),
  );
  await esperarError('CDC duplicado', () =>
    db.insert(schema.facturasVenta).values({
      ...baseFactura, estado: 'confirmado', timbrado: '18000001', establecimiento: '001', punto_expedicion: '001', numero: 2, cdc,
    }),
  );
  await esperarError('borrar factura confirmada', () =>
    db.delete(schema.facturasVenta).where(eq(schema.facturasVenta.numero, 1)),
  );

  // Una sola sesión abierta por caja
  const [cajaRow] = await db.select().from(schema.cajas).where(eq(schema.cajas.sucursal_id, sucursalId));
  await db.insert(schema.sesionesCaja).values({ empresa_id: empresaId, sucursal_id: sucursalId, caja_id: cajaRow.id, usuario_id: admin.id });
  await esperarError('segunda sesión abierta en la misma caja', () =>
    db.insert(schema.sesionesCaja).values({ empresa_id: empresaId, sucursal_id: sucursalId, caja_id: cajaRow.id, usuario_id: admin.id }),
  );

  // Persona -> rol: la distribuidora es cliente y proveedor con una sola ficha
  const [dist] = await db.select().from(schema.personas).where(eq(schema.personas.numero_documento, '80055550'));
  const [{ nc }] = await db.select({ nc: count() }).from(schema.clientes).where(eq(schema.clientes.persona_id, dist.id));
  const [{ np }] = await db.select({ np: count() }).from(schema.proveedores).where(eq(schema.proveedores.persona_id, dist.id));
  assert.equal(nc, 1);
  assert.equal(np, 1);
  console.log('  ok  persona con rol cliente + proveedor');

  await client.close();
  console.log('\nVERIFICACIÓN PGlite OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
