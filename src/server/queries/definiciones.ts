/**
 * Consultas de lectura de Definiciones (para Server Components). Contexto empresa/sucursal de la sesión.
 * Las filas se devuelven en snake_case (columnas del esquema) con relaciones anidadas.
 */
import { and, asc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import {
  actividadesEconomicas,
  articulos,
  categoriasArticulo,
  ciudades,
  clientes,
  condicionesPago,
  departamentos,
  depositos,
  descuentoArticulos,
  descuentos,
  marcas,
  modelos,
  paises,
  personas,
  proveedores,
  stock,
  sucursales,
  tiposDocumento,
  tiposPersona,
  unidadesMedida,
} from '@/db/schema';
import { requireSesion } from '../auth/session';

const LIMITE = 200;
const patron = (q?: string | null) => (q && q.trim() ? `%${q.trim()}%` : null);

function busquedaPersona(q?: string | null): SQL | undefined {
  const p = patron(q);
  if (!p) return undefined;
  return or(ilike(personas.razon_social, p), ilike(personas.numero_documento, p), ilike(personas.nombre_fantasia, p));
}

export async function listarPersonas(q?: string | null) {
  const s = await requireSesion();
  return db
    .select({
      ...personaCols(),
      tipo_documento: tiposDocumento.codigo,
      es_cliente: sql<boolean>`exists(select 1 from ${clientes} c where c.persona_id = ${personas.id})`,
      es_proveedor: sql<boolean>`exists(select 1 from ${proveedores} p where p.persona_id = ${personas.id})`,
    })
    .from(personas)
    .innerJoin(tiposDocumento, eq(tiposDocumento.id, personas.tipo_documento_id))
    .where(and(eq(personas.empresa_id, s.empresaId), busquedaPersona(q)))
    .orderBy(asc(personas.razon_social))
    .limit(LIMITE);
}

function personaCols() {
  return {
    id: personas.id,
    tipo_persona_id: personas.tipo_persona_id,
    tipo_documento_id: personas.tipo_documento_id,
    numero_documento: personas.numero_documento,
    dv: personas.dv,
    razon_social: personas.razon_social,
    nombre_fantasia: personas.nombre_fantasia,
    es_contribuyente: personas.es_contribuyente,
    telefono: personas.telefono,
    celular: personas.celular,
    email: personas.email,
    direccion: personas.direccion,
    estado: personas.estado,
  };
}

export async function obtenerPersona(id: number) {
  const s = await requireSesion();
  const p = await db.query.personas.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: { tipoPersona: true, tipoDocumento: true, ciudad: true, pais: true, actividadEconomica: true, clientes: true, proveedores: true },
  });
  return p ?? null;
}

export async function listarClientes(q?: string | null) {
  const s = await requireSesion();
  return db
    .select({
      id: clientes.id,
      persona_id: clientes.persona_id,
      codigo: clientes.codigo,
      condicion_pago_id: clientes.condicion_pago_id,
      condicion_pago: condicionesPago.nombre,
      limite_credito_gs: clientes.limite_credito_gs,
      saldo_gs: clientes.saldo_gs,
      estado: clientes.estado,
      razon_social: personas.razon_social,
      numero_documento: personas.numero_documento,
      dv: personas.dv,
      es_contribuyente: personas.es_contribuyente,
      telefono: personas.telefono,
      email: personas.email,
      direccion: personas.direccion,
    })
    .from(clientes)
    .innerJoin(personas, eq(personas.id, clientes.persona_id))
    .leftJoin(condicionesPago, eq(condicionesPago.id, clientes.condicion_pago_id))
    .where(and(eq(clientes.empresa_id, s.empresaId), busquedaPersona(q) ?? (patron(q) ? ilike(clientes.codigo, patron(q)!) : undefined)))
    .orderBy(asc(personas.razon_social))
    .limit(LIMITE);
}

export async function obtenerCliente(id: number) {
  const s = await requireSesion();
  const c = await db.query.clientes.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: { persona: { with: { tipoDocumento: true, tipoPersona: true } }, condicionPago: true },
  });
  return c ? { ...c, razon_social: c.persona.razon_social, numero_documento: c.persona.numero_documento, dv: c.persona.dv } : null;
}

export async function listarProveedores(q?: string | null) {
  const s = await requireSesion();
  return db
    .select({
      id: proveedores.id,
      persona_id: proveedores.persona_id,
      codigo: proveedores.codigo,
      condicion_pago_id: proveedores.condicion_pago_id,
      condicion_pago: condicionesPago.nombre,
      contacto: proveedores.contacto,
      saldo_gs: proveedores.saldo_gs,
      estado: proveedores.estado,
      razon_social: personas.razon_social,
      numero_documento: personas.numero_documento,
      dv: personas.dv,
      telefono: personas.telefono,
      email: personas.email,
    })
    .from(proveedores)
    .innerJoin(personas, eq(personas.id, proveedores.persona_id))
    .leftJoin(condicionesPago, eq(condicionesPago.id, proveedores.condicion_pago_id))
    .where(and(eq(proveedores.empresa_id, s.empresaId), busquedaPersona(q)))
    .orderBy(asc(personas.razon_social))
    .limit(LIMITE);
}

export async function obtenerProveedor(id: number) {
  const s = await requireSesion();
  const p = await db.query.proveedores.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: { persona: { with: { tipoDocumento: true, tipoPersona: true } }, condicionPago: true },
  });
  return p ? { ...p, razon_social: p.persona.razon_social, numero_documento: p.persona.numero_documento, dv: p.persona.dv } : null;
}

export async function listarArticulos(q?: string | null) {
  const s = await requireSesion();
  const p = patron(q);
  return db
    .select({
      id: articulos.id,
      codigo: articulos.codigo,
      codigo_barras: articulos.codigo_barras,
      descripcion: articulos.descripcion,
      categoria_id: articulos.categoria_id,
      categoria: categoriasArticulo.nombre,
      marca_id: articulos.marca_id,
      marca: marcas.nombre,
      unidad_medida_id: articulos.unidad_medida_id,
      unidad: unidadesMedida.codigo,
      tipo_iva: articulos.tipo_iva,
      precio_venta_gs: articulos.precio_venta_gs,
      costo_referencia_gs: articulos.costo_referencia_gs,
      controla_stock: articulos.controla_stock,
      permite_decimales: articulos.permite_decimales,
      stock_minimo: articulos.stock_minimo,
      estado: articulos.estado,
      stock_sucursal: sql<number>`coalesce((select sum(st.cantidad) from ${stock} st where st.articulo_id = ${articulos.id} and st.sucursal_id = ${s.sucursalId}), 0)`.mapWith(Number),
    })
    .from(articulos)
    .innerJoin(unidadesMedida, eq(unidadesMedida.id, articulos.unidad_medida_id))
    .leftJoin(categoriasArticulo, eq(categoriasArticulo.id, articulos.categoria_id))
    .leftJoin(marcas, eq(marcas.id, articulos.marca_id))
    .where(
      and(
        eq(articulos.empresa_id, s.empresaId),
        p ? or(ilike(articulos.codigo, p), ilike(articulos.descripcion, p), ilike(articulos.codigo_barras, p)) : undefined,
      ),
    )
    .orderBy(asc(articulos.codigo))
    .limit(LIMITE);
}

export async function obtenerArticulo(id: number) {
  const s = await requireSesion();
  const a = await db.query.articulos.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: { categoria: true, marca: true, modelo: true, unidadMedida: true, unidades: { with: { unidadMedida: true } } },
  });
  if (!a) return null;
  const existencias = await db
    .select({
      deposito_id: depositos.id,
      deposito: depositos.nombre,
      sucursal: sucursales.nombre,
      cantidad: stock.cantidad,
      costo_promedio_gs: stock.costo_promedio_gs,
      ultimo_costo_gs: stock.ultimo_costo_gs,
    })
    .from(stock)
    .innerJoin(depositos, eq(depositos.id, stock.deposito_id))
    .innerJoin(sucursales, eq(sucursales.id, stock.sucursal_id))
    .where(eq(stock.articulo_id, id))
    .orderBy(asc(depositos.codigo));
  return {
    ...a,
    unidades: a.unidades.map((u) => ({ ...u, unidad: u.unidadMedida.nombre })),
    stock: existencias,
  };
}

export async function listarDescuentos() {
  const s = await requireSesion();
  return db
    .select({
      id: descuentos.id,
      codigo: descuentos.codigo,
      nombre: descuentos.nombre,
      tipo: descuentos.tipo,
      fecha_desde: descuentos.fecha_desde,
      fecha_hasta: descuentos.fecha_hasta,
      prioridad: descuentos.prioridad,
      acumulable: descuentos.acumulable,
      todas_sucursales: descuentos.todas_sucursales,
      estado: descuentos.estado,
      articulos: sql<number>`(select count(*) from ${descuentoArticulos} da where da.descuento_id = ${descuentos.id})`.mapWith(Number),
      vigente: sql<boolean>`${descuentos.estado} = 'activo' and current_date between ${descuentos.fecha_desde} and ${descuentos.fecha_hasta}`,
    })
    .from(descuentos)
    .where(eq(descuentos.empresa_id, s.empresaId))
    .orderBy(asc(descuentos.prioridad), asc(descuentos.codigo));
}

export async function obtenerDescuento(id: number) {
  const s = await requireSesion();
  const d = await db.query.descuentos.findFirst({
    where: (t, { and: y, eq: e }) => y(e(t.id, id), e(t.empresa_id, s.empresaId)),
    with: { sucursales: { with: { sucursal: true } }, articulos: { with: { articulo: true } } },
  });
  if (!d) return null;
  return {
    ...d,
    sucursalIds: d.sucursales.map((x) => x.sucursal_id),
    articulos: d.articulos.map((x) => ({
      ...x,
      articuloId: x.articulo_id,
      codigo: x.articulo.codigo,
      descripcion: x.articulo.descripcion,
      montoGs: x.monto_gs,
      cantidadMinima: x.cantidad_minima,
      topeGs: x.tope_gs,
    })),
  };
}

export async function listarReferenciales() {
  const s = await requireSesion();
  const [tp, td, ps, dps, cds, act, mcs, mds, cats, ums, cps, deps, sucs] = await Promise.all([
    db.select().from(tiposPersona).orderBy(asc(tiposPersona.codigo)),
    db.select().from(tiposDocumento).orderBy(asc(tiposDocumento.id)),
    db.select().from(paises).orderBy(asc(paises.nombre)),
    db.select().from(departamentos).orderBy(asc(departamentos.codigo)),
    db.select().from(ciudades).orderBy(asc(ciudades.nombre)),
    db.select().from(actividadesEconomicas).orderBy(asc(actividadesEconomicas.codigo)),
    db.select().from(marcas).where(eq(marcas.empresa_id, s.empresaId)).orderBy(asc(marcas.nombre)),
    db.select().from(modelos).where(eq(modelos.empresa_id, s.empresaId)).orderBy(asc(modelos.nombre)),
    db.select().from(categoriasArticulo).where(eq(categoriasArticulo.empresa_id, s.empresaId)).orderBy(asc(categoriasArticulo.codigo)),
    db.select().from(unidadesMedida).orderBy(asc(unidadesMedida.codigo)),
    db.select().from(condicionesPago).where(eq(condicionesPago.empresa_id, s.empresaId)).orderBy(asc(condicionesPago.codigo)),
    db.select().from(depositos).where(eq(depositos.empresa_id, s.empresaId)).orderBy(asc(depositos.codigo)),
    db.select().from(sucursales).where(eq(sucursales.empresa_id, s.empresaId)).orderBy(asc(sucursales.codigo)),
  ]);
  return {
    tiposPersona: tp,
    tiposDocumento: td,
    paises: ps,
    departamentos: dps,
    ciudades: cds,
    actividadesEconomicas: act,
    marcas: mcs,
    modelos: mds,
    categorias: cats,
    unidadesMedida: ums,
    condicionesPago: cps,
    depositos: deps,
    sucursales: sucs,
  };
}
