import { and, eq, inArray } from 'drizzle-orm';
import type { DbLike } from '../index';
import {
  actividadesEconomicas,
  articuloUnidades,
  articulos,
  cajas,
  categoriasArticulo,
  ciudades,
  clientes,
  condicionesPago,
  configuracionSifen,
  depositos,
  descuentoArticulos,
  descuentos,
  descuentoSucursales,
  empresas,
  establecimientos,
  kardex,
  marcas,
  numeracionesDocumento,
  parametrosGenerales,
  personas,
  proveedores,
  puntosExpedicion,
  stock,
  sucursales,
  timbrados,
  tiposDocumento,
  tiposPersona,
  unidadesMedida,
} from '../schema';
import { calcularDvRuc } from '../utils/ruc';

export const RUC_EMPRESA_DEMO = '80012345';

/** Fecha local Paraguay en formato YYYY-MM-DD, desplazada `dias`. */
export function fechaPy(dias = 0): string {
  const d = new Date(Date.now() + dias * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(d);
}

async function idCiudad(db: DbLike, nombre: string) {
  const [c] = await db.select({ id: ciudades.id }).from(ciudades).where(eq(ciudades.nombre, nombre));
  return c?.id ?? null;
}

export type CtxEmpresa = {
  empresaId: number;
  matrizId: number;
  sanLorenzoId: number;
};

export async function seedEmpresaBase(db: DbLike): Promise<CtxEmpresa> {
  const [act] = await db
    .select({ id: actividadesEconomicas.id })
    .from(actividadesEconomicas)
    .where(eq(actividadesEconomicas.codigo, '47521'));
  const asuncion = await idCiudad(db, 'Asunción');
  const sanLorenzo = await idCiudad(db, 'San Lorenzo');

  await db
    .insert(empresas)
    .values({
      ruc: RUC_EMPRESA_DEMO,
      dv: String(calcularDvRuc(RUC_EMPRESA_DEMO)),
      razon_social: 'FERRETERÍA DEMO S.A.',
      nombre_fantasia: 'Ferre Demo',
      direccion: 'Avda. Mariscal López 1234',
      numero_casa: '1234',
      ciudad_id: asuncion,
      telefono: '021 600 000',
      email: 'contacto@ferreteria-demo.com.py',
      actividad_economica_id: act?.id ?? null,
    })
    .onConflictDoNothing();
  const [empresa] = await db
    .select({ id: empresas.id })
    .from(empresas)
    .where(eq(empresas.ruc, RUC_EMPRESA_DEMO));

  await db
    .insert(sucursales)
    .values([
      {
        empresa_id: empresa.id,
        codigo: '001',
        nombre: 'Casa Matriz',
        direccion: 'Avda. Mariscal López 1234, Asunción',
        ciudad_id: asuncion,
        es_casa_matriz: true,
      },
      {
        empresa_id: empresa.id,
        codigo: '002',
        nombre: 'Sucursal San Lorenzo',
        direccion: 'Ruta PY02 km 12, San Lorenzo',
        ciudad_id: sanLorenzo,
      },
    ])
    .onConflictDoNothing();
  const sucs = await db
    .select({ id: sucursales.id, codigo: sucursales.codigo })
    .from(sucursales)
    .where(eq(sucursales.empresa_id, empresa.id));
  const s = new Map(sucs.map((x) => [x.codigo, x.id]));

  return { empresaId: empresa.id, matrizId: s.get('001')!, sanLorenzoId: s.get('002')! };
}

export async function seedOrganizacionDemo(db: DbLike, ctx: CtxEmpresa) {
  const { empresaId, matrizId, sanLorenzoId } = ctx;

  await db
    .insert(establecimientos)
    .values([
      { empresa_id: empresaId, sucursal_id: matrizId, codigo: '001', denominacion: 'Casa Matriz' },
      { empresa_id: empresaId, sucursal_id: sanLorenzoId, codigo: '002', denominacion: 'San Lorenzo' },
    ])
    .onConflictDoNothing();
  const ests = await db
    .select({ id: establecimientos.id, codigo: establecimientos.codigo, sucursal_id: establecimientos.sucursal_id })
    .from(establecimientos)
    .where(eq(establecimientos.empresa_id, empresaId));

  await db
    .insert(puntosExpedicion)
    .values(
      ests.map((e) => ({
        empresa_id: empresaId,
        sucursal_id: e.sucursal_id,
        establecimiento_id: e.id,
        codigo: '001',
        descripcion: `Caja principal ${e.codigo}`,
      })),
    )
    .onConflictDoNothing();
  const puntos = await db
    .select({ id: puntosExpedicion.id, sucursal_id: puntosExpedicion.sucursal_id })
    .from(puntosExpedicion)
    .where(eq(puntosExpedicion.empresa_id, empresaId));

  await db
    .insert(timbrados)
    .values({
      empresa_id: empresaId,
      numero: '18000001',
      modalidad: 'electronica',
      fecha_inicio_vigencia: '2026-01-01',
      fecha_fin_vigencia: null,
    })
    .onConflictDoNothing();
  const [timbrado] = await db
    .select({ id: timbrados.id })
    .from(timbrados)
    .where(and(eq(timbrados.empresa_id, empresaId), eq(timbrados.numero, '18000001')));

  await db
    .insert(numeracionesDocumento)
    .values(
      puntos.flatMap((p) =>
        (['factura', 'nota_credito'] as const).map((tipo) => ({
          empresa_id: empresaId,
          sucursal_id: p.sucursal_id,
          timbrado_id: timbrado.id,
          punto_expedicion_id: p.id,
          tipo_documento: tipo,
        })),
      ),
    )
    .onConflictDoNothing();

  await db
    .insert(configuracionSifen)
    .values({
      empresa_id: empresaId,
      sucursal_id: null,
      ambiente: 'test',
      id_csc: '0001',
      csc_ref: 'SIFEN_CSC',
      certificado_ruta: './certs/empresa-demo.p12',
      certificado_password_ref: 'SIFEN_CERT_PASSWORD',
      url_ws_recepcion: 'https://sifen-test.set.gov.py/de/ws/sync/recibe.wsdl',
      url_ws_consulta: 'https://sifen-test.set.gov.py/de/ws/consultas/consulta.wsdl',
      url_qr_base: 'https://ekuatia.set.gov.py/consultas-test/qr?',
    })
    .onConflictDoNothing();

  await db
    .insert(parametrosGenerales)
    .values(
      [
        ['moneda', 'PYG', 'Moneda base'],
        ['stock.permitir_negativo', 'false', 'Permitir vender sin stock'],
        ['costo.metodo', 'promedio_ponderado', 'Método de costeo'],
        ['ventas.validez_presupuesto_dias', '15', 'Días de validez del presupuesto'],
        ['ventas.cliente_innominado_documento', '0', 'Documento del cliente SIN NOMBRE'],
        ['ventas.redondeo_gs', '1', 'Redondeo de montos en Gs'],
        ['caja.monto_apertura_sugerido_gs', '500000', 'Fondo fijo sugerido al abrir caja'],
      ].map(([clave, valor, descripcion]) => ({
        empresa_id: empresaId,
        sucursal_id: null,
        clave,
        valor,
        descripcion,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(depositos)
    .values([
      { empresa_id: empresaId, sucursal_id: matrizId, codigo: 'DEP-001', nombre: 'Depósito salón Matriz', es_principal: true },
      {
        empresa_id: empresaId,
        sucursal_id: matrizId,
        codigo: 'DEP-001-PATIO',
        nombre: 'Patio de materiales Matriz',
        es_principal: false,
        permite_venta: false,
      },
      { empresa_id: empresaId, sucursal_id: sanLorenzoId, codigo: 'DEP-002', nombre: 'Depósito San Lorenzo', es_principal: true },
    ])
    .onConflictDoNothing();
  const deps = await db
    .select({ id: depositos.id, codigo: depositos.codigo })
    .from(depositos)
    .where(eq(depositos.empresa_id, empresaId));
  const d = new Map(deps.map((x) => [x.codigo, x.id]));
  const puntoDe = new Map(puntos.map((p) => [p.sucursal_id, p.id]));

  await db
    .insert(cajas)
    .values([
      {
        empresa_id: empresaId,
        sucursal_id: matrizId,
        codigo: 'CAJA-01',
        nombre: 'Caja 1 Matriz',
        punto_expedicion_id: puntoDe.get(matrizId),
        deposito_id: d.get('DEP-001'),
      },
      {
        empresa_id: empresaId,
        sucursal_id: sanLorenzoId,
        codigo: 'CAJA-01',
        nombre: 'Caja 1 San Lorenzo',
        punto_expedicion_id: puntoDe.get(sanLorenzoId),
        deposito_id: d.get('DEP-002'),
      },
    ])
    .onConflictDoNothing();

  return { depositoMatrizId: d.get('DEP-001')!, depositoSanLorenzoId: d.get('DEP-002')! };
}

export async function seedPersonasDemo(db: DbLike, empresaId: number) {
  await db
    .insert(condicionesPago)
    .values([
      { empresa_id: empresaId, codigo: 'CONTADO', nombre: 'Contado', condicion: 'contado' as const },
      { empresa_id: empresaId, codigo: 'CRED30', nombre: 'Crédito 30 días', condicion: 'credito' as const, dias_plazo: 30 },
      {
        empresa_id: empresaId,
        codigo: 'CRED-3C',
        nombre: 'Crédito 3 cuotas mensuales',
        condicion: 'credito' as const,
        dias_plazo: 30,
        cantidad_cuotas: 3,
        dias_entre_cuotas: 30,
      },
    ])
    .onConflictDoNothing();
  const conds = await db
    .select({ id: condicionesPago.id, codigo: condicionesPago.codigo })
    .from(condicionesPago)
    .where(eq(condicionesPago.empresa_id, empresaId));
  const cond = new Map(conds.map((c) => [c.codigo, c.id]));

  const tps = await db.select({ id: tiposPersona.id, codigo: tiposPersona.codigo }).from(tiposPersona);
  const tp = new Map(tps.map((x) => [x.codigo, x.id]));
  const tds = await db.select({ id: tiposDocumento.id, codigo: tiposDocumento.codigo }).from(tiposDocumento);
  const td = new Map(tds.map((x) => [x.codigo, x.id]));
  const asuncion = await idCiudad(db, 'Asunción');
  const luque = await idCiudad(db, 'Luque');

  const PERSONAS = [
    {
      clave: 'innominado',
      tipo_persona_id: tp.get('F')!,
      tipo_documento_id: td.get('INN')!,
      numero_documento: '0',
      dv: null,
      razon_social: 'SIN NOMBRE',
      es_contribuyente: false,
      ciudad_id: asuncion,
    },
    {
      clave: 'juan',
      tipo_persona_id: tp.get('F')!,
      tipo_documento_id: td.get('CI')!,
      numero_documento: '1234567',
      dv: null,
      razon_social: 'JUAN PÉREZ',
      nombres: 'Juan',
      apellidos: 'Pérez',
      es_contribuyente: false,
      ciudad_id: luque,
      telefono: '0981 000 111',
    },
    {
      clave: 'constructora',
      tipo_persona_id: tp.get('J')!,
      tipo_documento_id: td.get('RUC')!,
      numero_documento: '80099990',
      dv: String(calcularDvRuc('80099990')),
      razon_social: 'CONSTRUCTORA EJEMPLO S.A.',
      es_contribuyente: true,
      ciudad_id: asuncion,
      email: 'compras@constructora-ejemplo.com.py',
    },
    {
      clave: 'distribuidora',
      tipo_persona_id: tp.get('J')!,
      tipo_documento_id: td.get('RUC')!,
      numero_documento: '80055550',
      dv: String(calcularDvRuc('80055550')),
      razon_social: 'DISTRIBUIDORA FERRETERA DEL SUR S.A.',
      es_contribuyente: true,
      ciudad_id: asuncion,
      email: 'ventas@distribuidora-sur.com.py',
    },
  ];
  await db
    .insert(personas)
    .values(PERSONAS.map(({ clave: _clave, ...p }) => ({ ...p, empresa_id: empresaId })))
    .onConflictDoNothing();
  const pers = await db
    .select({ id: personas.id, numero_documento: personas.numero_documento })
    .from(personas)
    .where(eq(personas.empresa_id, empresaId));
  const p = new Map(pers.map((x) => [x.numero_documento, x.id]));

  await db
    .insert(clientes)
    .values([
      { empresa_id: empresaId, persona_id: p.get('0')!, codigo: 'CLI-0000', condicion_pago_id: cond.get('CONTADO') },
      { empresa_id: empresaId, persona_id: p.get('1234567')!, codigo: 'CLI-0001', condicion_pago_id: cond.get('CONTADO') },
      {
        empresa_id: empresaId,
        persona_id: p.get('80099990')!,
        codigo: 'CLI-0002',
        condicion_pago_id: cond.get('CRED30'),
        limite_credito_gs: 50_000_000,
      },
      // La distribuidora es proveedor y también cliente: misma persona, dos roles.
      { empresa_id: empresaId, persona_id: p.get('80055550')!, codigo: 'CLI-0003', condicion_pago_id: cond.get('CONTADO') },
    ])
    .onConflictDoNothing();
  await db
    .insert(proveedores)
    .values({
      empresa_id: empresaId,
      persona_id: p.get('80055550')!,
      codigo: 'PRO-0001',
      condicion_pago_id: cond.get('CRED30'),
      contacto: 'Departamento comercial',
    })
    .onConflictDoNothing();
}

type DefArticulo = {
  codigo: string;
  barras: string;
  descripcion: string;
  categoria: string;
  marca: string;
  unidad: string;
  iva: 'iva10' | 'iva5' | 'exenta';
  precio: number;
  costo: number;
  stockMatriz: number;
  stockSL: number;
  decimales?: boolean;
  presentaciones?: { unidad: string; factor: number; precio?: number }[];
};

export const ARTICULOS_DEMO: DefArticulo[] = [
  { codigo: 'HM-0001', barras: '7790000000011', descripcion: 'Martillo carpintero 27 mm mango fibra', categoria: 'HER-MAN', marca: 'Tramontina', unidad: 'UNI', iva: 'iva10', precio: 85_000, costo: 52_000, stockMatriz: 25, stockSL: 10 },
  { codigo: 'HM-0002', barras: '7790000000028', descripcion: 'Llave ajustable 10 pulgadas', categoria: 'HER-MAN', marca: 'Stanley', unidad: 'UNI', iva: 'iva10', precio: 120_000, costo: 75_000, stockMatriz: 15, stockSL: 6 },
  { codigo: 'HM-0003', barras: '7790000000035', descripcion: 'Cinta métrica 5 m', categoria: 'HER-MAN', marca: 'Truper', unidad: 'UNI', iva: 'iva10', precio: 35_000, costo: 19_000, stockMatriz: 40, stockSL: 20 },
  { codigo: 'HE-0001', barras: '7790000000042', descripcion: 'Taladro percutor 650 W 13 mm', categoria: 'HER-ELE', marca: 'Bosch', unidad: 'UNI', iva: 'iva10', precio: 650_000, costo: 430_000, stockMatriz: 8, stockSL: 3 },
  { codigo: 'EL-0001', barras: '7790000000059', descripcion: 'Cable unipolar 2,5 mm² (por metro)', categoria: 'ELEC', marca: 'Genérica', unidad: 'MTR', iva: 'iva10', precio: 4_500, costo: 2_700, stockMatriz: 500, stockSL: 300, decimales: true, presentaciones: [{ unidad: 'ROL', factor: 100, precio: 420_000 }] },
  { codigo: 'FI-0001', barras: '7790000000066', descripcion: 'Tornillo autoperforante 8x1"', categoria: 'FIJ', marca: 'Genérica', unidad: 'UNI', iva: 'iva10', precio: 300, costo: 150, stockMatriz: 5_000, stockSL: 2_000, presentaciones: [{ unidad: 'CJ', factor: 100, precio: 25_000 }] },
  { codigo: 'FI-0002', barras: '7790000000073', descripcion: 'Clavo punta parís 2" (por kg)', categoria: 'FIJ', marca: 'Genérica', unidad: 'KG', iva: 'iva10', precio: 18_000, costo: 11_000, stockMatriz: 120, stockSL: 60, decimales: true },
  { codigo: 'PI-0001', barras: '7790000000080', descripcion: 'Pintura látex interior blanco 4 L', categoria: 'PINT', marca: 'Genérica', unidad: 'UNI', iva: 'iva10', precio: 145_000, costo: 92_000, stockMatriz: 30, stockSL: 12 },
  { codigo: 'CO-0001', barras: '7790000000097', descripcion: 'Cemento Portland bolsa 50 kg', categoria: 'CONS', marca: 'Genérica', unidad: 'BLS', iva: 'iva10', precio: 62_000, costo: 48_000, stockMatriz: 200, stockSL: 80 },
  { codigo: 'JA-0001', barras: '7790000000103', descripcion: 'Semilla de césped 1 kg', categoria: 'JARD', marca: 'Genérica', unidad: 'KG', iva: 'iva5', precio: 55_000, costo: 36_000, stockMatriz: 20, stockSL: 10, decimales: true },
];

export async function seedArticulosDemo(
  db: DbLike,
  ctx: CtxEmpresa & { depositoMatrizId: number; depositoSanLorenzoId: number; adminId: number },
) {
  const { empresaId } = ctx;

  await db
    .insert(categoriasArticulo)
    .values([
      { empresa_id: empresaId, codigo: 'HER', nombre: 'Herramientas' },
      { empresa_id: empresaId, codigo: 'ELEC', nombre: 'Electricidad' },
      { empresa_id: empresaId, codigo: 'FIJ', nombre: 'Fijaciones y bulonería' },
      { empresa_id: empresaId, codigo: 'PINT', nombre: 'Pinturas' },
      { empresa_id: empresaId, codigo: 'CONS', nombre: 'Materiales de construcción' },
      { empresa_id: empresaId, codigo: 'JARD', nombre: 'Jardinería' },
    ])
    .onConflictDoNothing();
  const [her] = await db
    .select({ id: categoriasArticulo.id })
    .from(categoriasArticulo)
    .where(and(eq(categoriasArticulo.empresa_id, empresaId), eq(categoriasArticulo.codigo, 'HER')));
  await db
    .insert(categoriasArticulo)
    .values([
      { empresa_id: empresaId, codigo: 'HER-MAN', nombre: 'Herramientas manuales', padre_id: her.id },
      { empresa_id: empresaId, codigo: 'HER-ELE', nombre: 'Herramientas eléctricas', padre_id: her.id },
    ])
    .onConflictDoNothing();

  const nombresMarcas = [...new Set(ARTICULOS_DEMO.map((a) => a.marca))];
  await db
    .insert(marcas)
    .values(nombresMarcas.map((nombre) => ({ empresa_id: empresaId, nombre })))
    .onConflictDoNothing();

  const cats = await db
    .select({ id: categoriasArticulo.id, codigo: categoriasArticulo.codigo })
    .from(categoriasArticulo)
    .where(eq(categoriasArticulo.empresa_id, empresaId));
  const cat = new Map(cats.map((c) => [c.codigo, c.id]));
  const mars = await db
    .select({ id: marcas.id, nombre: marcas.nombre })
    .from(marcas)
    .where(eq(marcas.empresa_id, empresaId));
  const mar = new Map(mars.map((m) => [m.nombre, m.id]));
  const ums = await db.select({ id: unidadesMedida.id, codigo: unidadesMedida.codigo }).from(unidadesMedida);
  const um = new Map(ums.map((u) => [u.codigo, u.id]));

  await db
    .insert(articulos)
    .values(
      ARTICULOS_DEMO.map((a) => ({
        empresa_id: empresaId,
        codigo: a.codigo,
        codigo_barras: a.barras,
        descripcion: a.descripcion,
        categoria_id: cat.get(a.categoria)!,
        marca_id: mar.get(a.marca)!,
        unidad_medida_id: um.get(a.unidad)!,
        tipo_iva: a.iva,
        precio_venta_gs: a.precio,
        costo_referencia_gs: a.costo,
        permite_decimales: a.decimales ?? false,
        stock_minimo: 5,
      })),
    )
    .onConflictDoNothing();
  const arts = await db
    .select({ id: articulos.id, codigo: articulos.codigo })
    .from(articulos)
    .where(eq(articulos.empresa_id, empresaId));
  const art = new Map(arts.map((a) => [a.codigo, a.id]));

  const presentaciones = ARTICULOS_DEMO.flatMap((a) =>
    (a.presentaciones ?? []).map((pr) => ({
      empresa_id: empresaId,
      articulo_id: art.get(a.codigo)!,
      unidad_medida_id: um.get(pr.unidad)!,
      factor_conversion: pr.factor,
      precio_venta_gs: pr.precio ?? null,
    })),
  );
  if (presentaciones.length) await db.insert(articuloUnidades).values(presentaciones).onConflictDoNothing();

  // Stock inicial + kardex 'inicial' (solo para filas de stock recién creadas → idempotente)
  const filasStock = ARTICULOS_DEMO.flatMap((a) => [
    { sucursal: ctx.matrizId, deposito: ctx.depositoMatrizId, a, cant: a.stockMatriz },
    { sucursal: ctx.sanLorenzoId, deposito: ctx.depositoSanLorenzoId, a, cant: a.stockSL },
  ]);
  const insertados = await db
    .insert(stock)
    .values(
      filasStock.map((f) => ({
        empresa_id: empresaId,
        sucursal_id: f.sucursal,
        deposito_id: f.deposito,
        articulo_id: art.get(f.a.codigo)!,
        cantidad: f.cant,
        costo_promedio_gs: f.a.costo,
        ultimo_costo_gs: f.a.costo,
      })),
    )
    .onConflictDoNothing()
    .returning();
  if (insertados.length) {
    await db.insert(kardex).values(
      insertados.map((s) => ({
        empresa_id: s.empresa_id,
        sucursal_id: s.sucursal_id,
        deposito_id: s.deposito_id,
        articulo_id: s.articulo_id,
        tipo_movimiento: 'inicial' as const,
        origen_tipo: 'inicial' as const,
        cantidad_entrada: s.cantidad,
        cantidad_salida: 0,
        saldo_cantidad: s.cantidad,
        costo_unitario_gs: s.costo_promedio_gs,
        costo_promedio_gs: s.costo_promedio_gs,
        saldo_valorizado_gs: Math.round(s.cantidad * s.costo_promedio_gs),
        usuario_id: ctx.adminId,
      })),
    );
  }

  // Descuento vigente: 10% en herramientas manuales, todas las sucursales demo.
  await db
    .insert(descuentos)
    .values({
      empresa_id: empresaId,
      codigo: 'PROMO-HERR-10',
      nombre: 'Promo herramientas manuales 10%',
      descripcion: '10% de descuento en herramientas manuales seleccionadas',
      tipo: 'porcentaje',
      fecha_desde: fechaPy(-30),
      fecha_hasta: fechaPy(90),
      prioridad: 10,
      creado_por: ctx.adminId,
      confirmado_por: ctx.adminId,
      confirmado_en: new Date(),
    })
    .onConflictDoNothing();
  const [promo] = await db
    .select({ id: descuentos.id })
    .from(descuentos)
    .where(and(eq(descuentos.empresa_id, empresaId), eq(descuentos.codigo, 'PROMO-HERR-10')));

  await db
    .insert(descuentoSucursales)
    .values([ctx.matrizId, ctx.sanLorenzoId].map((sucursal_id) => ({ empresa_id: empresaId, descuento_id: promo.id, sucursal_id })))
    .onConflictDoNothing();

  const herramientas = await db
    .select({ id: articulos.id })
    .from(articulos)
    .where(and(eq(articulos.empresa_id, empresaId), inArray(articulos.codigo, ['HM-0001', 'HM-0002', 'HM-0003'])));
  await db
    .insert(descuentoArticulos)
    .values(
      herramientas.map((h) => ({
        empresa_id: empresaId,
        descuento_id: promo.id,
        articulo_id: h.id,
        porcentaje: 10,
        cantidad_minima: 1,
        tope_gs: 50_000,
      })),
    )
    .onConflictDoNothing();
}
