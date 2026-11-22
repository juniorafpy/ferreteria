/**
 * Persona → Cliente / Proveedor sin duplicar fichas; RUC con DV módulo 11.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { and, eq } from 'drizzle-orm';
import { calcularDvRuc, separarRuc, validarRuc } from '@/server/fiscal/ruc';
import { personaInput } from '@/server/validation/definiciones';
import { rucConDv } from '@/server/validation/comunes';
import * as defs from '@/server/services/definiciones';
import { crearEntorno, rechaza, s, type Entorno } from './helpers/db';

let E: Entorno;
before(async () => {
  E = await crearEntorno();
});
after(async () => E?.cerrar());

const ids = async () => {
  const tp = await E.db.select().from(s.tiposPersona);
  const td = await E.db.select().from(s.tiposDocumento);
  return {
    fisica: tp[0].id,
    ruc: td.find((x) => x.requiere_dv)!.id,
    ci: td.find((x) => !x.requiere_dv && x.codigo !== 'INN')!.id,
  };
};

describe('RUC / DV (módulo 11, SET)', () => {
  test('valores calculados a mano', () => {
    // 80055550: 0·2+5·3+5·4+5·5+5·6+0·7+0·8+8·9 = 162; 162 mod 11 = 8 → 11−8 = 3
    assert.equal(calcularDvRuc('80055550'), 3);
    // 1234567: 7·2+6·3+5·4+4·5+3·6+2·7+1·8 = 112; 112 mod 11 = 2 → 9
    assert.equal(calcularDvRuc('1234567'), 9);
    // 6: 6·2 = 12; 12 mod 11 = 1 → resto ≤ 1 ⇒ DV 0
    assert.equal(calcularDvRuc('6'), 0);
    assert.ok(validarRuc('80055550', '3'));
    assert.ok(!validarRuc('80055550', '7'));
    assert.ok(!validarRuc('800555501', '0'), 'más de 8 caracteres');
    assert.ok(!validarRuc('8005-5550', '3'));
    assert.deepEqual(separarRuc('80055550-3'), { ruc: '80055550', dv: '3' });
    assert.equal(separarRuc('80055550'), null);
    assert.equal(rucConDv.safeParse({ ruc: '80055550', dv: '1' }).success, false);
  });

  test('referencia independiente módulo 11 (pesos 2..11 cíclicos) sobre 2.000 números', () => {
    const ref = (n: string) => {
      let t = 0;
      let k = 2;
      for (let i = n.length - 1; i >= 0; i--) {
        if (k > 11) k = 2;
        t += Number(n[i]) * k++;
      }
      const r = t % 11;
      return r > 1 ? 11 - r : 0;
    };
    for (let i = 0; i < 2000; i++) {
      const n = String(1_000_000 + i * 39_119);
      assert.equal(calcularDvRuc(n), ref(n), n);
    }
  });
});

describe('personas, clientes y proveedores', () => {
  test('una persona puede ser cliente y proveedor sin duplicar la ficha', async () => {
    const t = await ids();
    const persona = {
      tipoPersonaId: t.fisica,
      tipoDocumentoId: t.ruc,
      numeroDocumento: '1234567',
      dv: '9',
      razonSocial: 'Ferretería Test',
    };
    const c = await E.tx((x) => defs.guardarCliente(x, E.admin, { persona, limiteCreditoGs: 1_000_000 }));
    const p = await E.tx((x) => defs.guardarProveedor(x, E.admin, { personaId: c.personaId }));
    assert.equal(p.personaId, c.personaId);
    const filas = await E.db
      .select()
      .from(s.personas)
      .where(and(eq(s.personas.empresa_id, E.r.empresaId), eq(s.personas.numero_documento, '1234567'), eq(s.personas.tipo_documento_id, t.ruc)));
    assert.equal(filas.length, 1);
    // Segunda ficha de cliente / proveedor para la misma persona → rechazo
    await rechaza(() => E.tx((x) => defs.guardarCliente(x, E.admin, { personaId: c.personaId })), /clientes_empresa_persona_uq|Ya existe|duplicate/i);
    await rechaza(() => E.tx((x) => defs.guardarProveedor(x, E.admin, { personaId: c.personaId })), /proveedores_empresa_persona_uq|Ya existe|duplicate/i);
  });

  test('persona duplicada por documento → rechazo (alta directa y alta embebida en cliente/proveedor)', async () => {
    const t = await ids();
    const base = { tipoPersonaId: t.fisica, tipoDocumentoId: t.ci, numeroDocumento: '4444444', razonSocial: 'Juan Pérez' };
    await E.tx((x) => defs.guardarPersona(x, E.admin, base));
    await rechaza(() => E.tx((x) => defs.guardarPersona(x, E.admin, { ...base, razonSocial: 'Otro nombre' })), /personas_empresa_documento_uq|Ya existe|duplicate/i);
    await rechaza(() => E.tx((x) => defs.guardarProveedor(x, E.admin, { persona: base })), /personas_empresa_documento_uq|Ya existe|duplicate/i);
    const n = await E.db.select().from(s.personas).where(eq(s.personas.numero_documento, '4444444'));
    assert.equal(n.length, 1);
  });

  test('RUC con DV incorrecto o faltante → rechazo (Zod y servicio)', async () => {
    const t = await ids();
    const base = { tipoPersonaId: t.fisica, tipoDocumentoId: t.ruc, numeroDocumento: '80055551', razonSocial: 'X S.A.' };
    const dv = calcularDvRuc('80055551');
    const malo = String((dv + 1) % 10);
    assert.equal(personaInput.safeParse({ ...base, dv: malo }).success, false);
    await rechaza(() => E.tx((x) => defs.guardarPersona(x, E.admin, { ...base, dv: malo })), /Dígito verificador/);
    await rechaza(() => E.tx((x) => defs.guardarPersona(x, E.admin, { ...base })), /requiere dígito verificador/);
    const ok = await E.tx((x) => defs.guardarPersona(x, E.admin, { ...base, dv: String(dv) }));
    const [row] = await E.db.select().from(s.personas).where(eq(s.personas.id, ok.id));
    assert.equal(row.dv, String(dv));
    assert.equal(row.es_contribuyente, true);
  });

  test('edición de persona de otra empresa → inexistente', async () => {
    const t = await ids();
    const [p] = await E.db.select().from(s.personas).limit(1);
    const ajeno = { ...E.admin, empresaId: E.r.empresaId + 1000 };
    await rechaza(
      () => E.tx((x) => defs.guardarPersona(x, ajeno, { id: p.id, tipoPersonaId: t.fisica, tipoDocumentoId: t.ci, numeroDocumento: '1', razonSocial: 'hack' })),
      /inexistente/,
    );
  });
});
