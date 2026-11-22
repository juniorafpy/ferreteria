import { and, eq, inArray, notInArray } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { DbLike } from '@/db';
import {
  actividadesEconomicas,
  articulos,
  articuloUnidades,
  cajas,
  categoriasArticulo,
  ciudades,
  clientes,
  condicionesPago,
  departamentos,
  depositos,
  descuentoArticulos,
  descuentos,
  descuentoSucursales,
  marcas,
  modelos,
  paises,
  personas,
  planCuentas,
  proveedores,
  puntosExpedicion,
  roles,
  sucursales,
  timbrados,
  tiposDocumento,
  tiposPersona,
  unidadesMedida,
  usuarios,
} from '@/db/schema';
import { validarRuc } from '../fiscal/ruc';
import type { Ctx } from '../lib/contexto';
import { asegurar } from '../lib/result';
import type {
  ArticuloInput,
  ClienteInput,
  DescuentoInput,
  EntidadEstado,
  PersonaInput,
  ProveedorInput,
  ReferencialInput,
  TablaReferencial,
} from '../validation/definiciones';

const nulo = <T>(v: T | undefined | null) => (v === undefined || v === '' ? null : v) as T | null;

/* =============================== Personas =============================== */

export async function guardarPersona(tx: DbLike, ctx: Ctx, d: PersonaInput) {
  const [td] = await tx.select().from(tiposDocumento).where(eq(tiposDocumento.id, d.tipoDocumentoId));
  asegurar(td, 'Tipo de documento inexistente');
  if (td.requiere_dv) {
    asegurar(d.dv, 'El RUC requiere dígito verificador');
    asegurar(validarRuc(d.numeroDocumento, d.dv), 'Dígito verificador del RUC incorrecto');
  }
  const valores = {
    empresa_id: ctx.empresaId,
    tipo_persona_id: d.tipoPersonaId,
    tipo_documento_id: d.tipoDocumentoId,
    numero_documento: d.numeroDocumento,
    dv: td.requiere_dv ? d.dv! : nulo(d.dv),
    razon_social: d.razonSocial,
    nombres: nulo(d.nombres),
    apellidos: nulo(d.apellidos),
    nombre_fantasia: nulo(d.nombreFantasia),
    es_contribuyente: d.esContribuyente ?? td.requiere_dv,
    actividad_economica_id: nulo(d.actividadEconomicaId),
    pais_id: nulo(d.paisId),
    ciudad_id: nulo(d.ciudadId),
    direccion: nulo(d.direccion),
    numero_casa: nulo(d.numeroCasa),
    telefono: nulo(d.telefono),
    celular: nulo(d.celular),
    email: nulo(d.email),
    observacion: nulo(d.observacion),
  };
  if (d.id) {
    const r = await tx
      .update(personas)
      .set(valores)
      .where(and(eq(personas.id, d.id), eq(personas.empresa_id, ctx.empresaId)))
      .returning({ id: personas.id });
    asegurar(r.length, 'Persona inexistente');
    return { id: r[0].id };
  }
  const [r] = await tx.insert(personas).values(valores).returning({ id: personas.id });
  return { id: r.id };
}

async function personaPara(tx: DbLike, ctx: Ctx, personaId?: number | null, persona?: PersonaInput | null) {
  if (persona) return (await guardarPersona(tx, ctx, { ...persona, id: persona.id ?? personaId ?? undefined })).id;
  const [p] = await tx
    .select({ id: personas.id })
    .from(personas)
    .where(and(eq(personas.id, personaId!), eq(personas.empresa_id, ctx.empresaId)));
  asegurar(p, 'Persona inexistente');
  return p.id;
}

export async function guardarCliente(tx: DbLike, ctx: Ctx, d: ClienteInput) {
  const personaId = await personaPara(tx, ctx, d.personaId, d.persona);
  const valores = {
    empresa_id: ctx.empresaId,
    persona_id: personaId,
    codigo: nulo(d.codigo),
    condicion_pago_id: nulo(d.condicionPagoId),
    limite_credito_gs: d.limiteCreditoGs ?? 0,
    observacion: nulo(d.observacion),
  };
  if (d.id) {
    const r = await tx
      .update(clientes)
      .set(valores)
      .where(and(eq(clientes.id, d.id), eq(clientes.empresa_id, ctx.empresaId)))
      .returning({ id: clientes.id });
    asegurar(r.length, 'Cliente inexistente');
    return { id: r[0].id, personaId };
  }
  const [r] = await tx.insert(clientes).values(valores).returning({ id: clientes.id });
  return { id: r.id, personaId };
}

export async function guardarProveedor(tx: DbLike, ctx: Ctx, d: ProveedorInput) {
  const personaId = await personaPara(tx, ctx, d.personaId, d.persona);
  const valores = {
    empresa_id: ctx.empresaId,
    persona_id: personaId,
    codigo: nulo(d.codigo),
    condicion_pago_id: nulo(d.condicionPagoId),
    contacto: nulo(d.contacto),
    observacion: nulo(d.observacion),
  };
  if (d.id) {
    const r = await tx
      .update(proveedores)
      .set(valores)
      .where(and(eq(proveedores.id, d.id), eq(proveedores.empresa_id, ctx.empresaId)))
      .returning({ id: proveedores.id });
    asegurar(r.length, 'Proveedor inexistente');
    return { id: r[0].id, personaId };
  }
  const [r] = await tx.insert(proveedores).values(valores).returning({ id: proveedores.id });
  return { id: r.id, personaId };
}

/* =============================== Artículos =============================== */

export async function guardarArticulo(tx: DbLike, ctx: Ctx, d: ArticuloInput, opciones: { puedeModificarPrecio: boolean }) {
  const valores = {
    empresa_id: ctx.empresaId,
    codigo: d.codigo,
    codigo_barras: nulo(d.codigoBarras),
    descripcion: d.descripcion,
    descripcion_larga: nulo(d.descripcionLarga),
    categoria_id: nulo(d.categoriaId),
    marca_id: nulo(d.marcaId),
    modelo_id: nulo(d.modeloId),
    unidad_medida_id: d.unidadMedidaId,
    tipo_iva: d.tipoIva,
    precio_venta_gs: d.precioVentaGs,
    costo_referencia_gs: d.costoReferenciaGs ?? 0,
    controla_stock: d.controlaStock ?? true,
    permite_decimales: d.permiteDecimales ?? false,
    stock_minimo: d.stockMinimo ?? 0,
  };
  let id: number;
  if (d.id) {
    const [a] = await tx
      .select()
      .from(articulos)
      .where(and(eq(articulos.id, d.id), eq(articulos.empresa_id, ctx.empresaId)));
    asegurar(a, 'Artículo inexistente');
    if (a.precio_venta_gs !== d.precioVentaGs) {
      asegurar(opciones.puedeModificarPrecio, 'No tiene permiso para modificar precios (articulos.precio.modificar)');
    }
    await tx.update(articulos).set(valores).where(eq(articulos.id, a.id));
    id = a.id;
  } else {
    const [a] = await tx.insert(articulos).values(valores).returning({ id: articulos.id });
    id = a.id;
  }
  if (d.unidades) {
    const conservar = d.unidades.map((u) => u.unidadMedidaId);
    await tx
      .delete(articuloUnidades)
      .where(
        and(
          eq(articuloUnidades.articulo_id, id),
          conservar.length ? notInArray(articuloUnidades.unidad_medida_id, conservar) : undefined,
        ),
      );
    for (const u of d.unidades) {
      asegurar(u.unidadMedidaId !== d.unidadMedidaId, 'La presentación no puede ser la unidad base');
      const v = {
        empresa_id: ctx.empresaId,
        articulo_id: id,
        unidad_medida_id: u.unidadMedidaId,
        factor_conversion: u.factorConversion,
        codigo_barras: nulo(u.codigoBarras),
        precio_venta_gs: nulo(u.precioVentaGs),
        es_predeterminada: u.esPredeterminada ?? false,
      };
      await tx
        .insert(articuloUnidades)
        .values(v)
        .onConflictDoUpdate({ target: [articuloUnidades.articulo_id, articuloUnidades.unidad_medida_id], set: v });
    }
  }
  return { id };
}

/* =============================== Descuentos =============================== */

export async function guardarDescuento(tx: DbLike, ctx: Ctx, d: DescuentoInput) {
  if (d.sucursalIds.length) {
    const s = await tx
      .select({ id: sucursales.id })
      .from(sucursales)
      .where(and(eq(sucursales.empresa_id, ctx.empresaId), inArray(sucursales.id, d.sucursalIds)));
    asegurar(s.length === new Set(d.sucursalIds).size, 'Sucursal inexistente');
  }
  const artIds = d.articulos.map((a) => a.articuloId);
  asegurar(new Set(artIds).size === artIds.length, 'Artículo repetido en el descuento');
  const arts = await tx
    .select({ id: articulos.id })
    .from(articulos)
    .where(and(eq(articulos.empresa_id, ctx.empresaId), inArray(articulos.id, artIds)));
  asegurar(arts.length === artIds.length, 'Artículo inexistente');

  const valores = {
    empresa_id: ctx.empresaId,
    codigo: d.codigo,
    nombre: d.nombre,
    descripcion: nulo(d.descripcion),
    tipo: d.tipo,
    fecha_desde: d.fechaDesde,
    fecha_hasta: d.fechaHasta,
    prioridad: d.prioridad ?? 100,
    acumulable: d.acumulable ?? false,
    todas_sucursales: d.todasSucursales ?? false,
  };
  let id: number;
  if (d.id) {
    const r = await tx
      .update(descuentos)
      .set(valores)
      .where(and(eq(descuentos.id, d.id), eq(descuentos.empresa_id, ctx.empresaId)))
      .returning({ id: descuentos.id });
    asegurar(r.length, 'Descuento inexistente');
    id = r[0].id;
    await tx.delete(descuentoSucursales).where(eq(descuentoSucursales.descuento_id, id));
    await tx.delete(descuentoArticulos).where(eq(descuentoArticulos.descuento_id, id));
  } else {
    const [r] = await tx
      .insert(descuentos)
      .values({ ...valores, creado_por: ctx.usuarioId, confirmado_por: ctx.usuarioId, confirmado_en: new Date() })
      .returning({ id: descuentos.id });
    id = r.id;
  }
  if (!valores.todas_sucursales && d.sucursalIds.length) {
    await tx
      .insert(descuentoSucursales)
      .values([...new Set(d.sucursalIds)].map((s) => ({ empresa_id: ctx.empresaId, descuento_id: id, sucursal_id: s })));
  }
  await tx.insert(descuentoArticulos).values(
    d.articulos.map((a) => ({
      empresa_id: ctx.empresaId,
      descuento_id: id,
      articulo_id: a.articuloId,
      porcentaje: d.tipo === 'porcentaje' ? a.porcentaje! : null,
      monto_gs: d.tipo === 'monto' ? a.montoGs! : null,
      cantidad_minima: a.cantidadMinima ?? 1,
      tope_gs: nulo(a.topeGs),
    })),
  );
  return { id };
}

/* =============================== Referenciales =============================== */

/** Catálogos globales (sin empresa_id). */
export const REFERENCIALES_GLOBALES: TablaReferencial[] = [
  'unidadesMedida',
  'tiposPersona',
  'tiposDocumento',
  'paises',
  'departamentos',
  'ciudades',
  'actividadesEconomicas',
];

export async function guardarReferencial<T extends TablaReferencial>(
  tx: DbLike,
  ctx: Ctx,
  tabla: T,
  datos: ReferencialInput<T>,
): Promise<{ id: number }> {
  const d = datos as Record<string, unknown> & { id?: number | null };
  const emp = { empresa_id: ctx.empresaId };
  const upsert = async <V extends Record<string, unknown>>(t: PgTable & { id: never }, valores: V, porEmpresa: boolean) => {
    const tt = t as unknown as typeof marcas;
    if (d.id) {
      const cond = porEmpresa ? and(eq(tt.id, d.id), eq(tt.empresa_id, ctx.empresaId)) : eq(tt.id, d.id);
      const r = await tx.update(tt).set(valores as never).where(cond).returning({ id: tt.id });
      asegurar(r.length, 'Registro inexistente');
      return { id: r[0].id };
    }
    const [r] = await tx.insert(tt).values(valores as never).returning({ id: tt.id });
    return { id: r.id };
  };
  const T = <X>(x: X) => x as unknown as PgTable & { id: never };
  switch (tabla) {
    case 'marcas':
      return upsert(T(marcas), { ...emp, nombre: d.nombre, ...(d.estado ? { estado: d.estado } : {}) }, true);
    case 'modelos': {
      const [m] = await tx
        .select({ id: marcas.id })
        .from(marcas)
        .where(and(eq(marcas.id, d.marcaId as number), eq(marcas.empresa_id, ctx.empresaId)));
      asegurar(m, 'Marca inexistente');
      return upsert(T(modelos), { ...emp, marca_id: d.marcaId, nombre: d.nombre, ...(d.estado ? { estado: d.estado } : {}) }, true);
    }
    case 'categorias':
      return upsert(
        T(categoriasArticulo),
        { ...emp, codigo: d.codigo, nombre: d.nombre, padre_id: nulo(d.padreId), ...(d.estado ? { estado: d.estado } : {}) },
        true,
      );
    case 'condicionesPago':
      return upsert(
        T(condicionesPago),
        {
          ...emp,
          codigo: d.codigo,
          nombre: d.nombre,
          condicion: d.condicion,
          dias_plazo: d.diasPlazo ?? 0,
          cantidad_cuotas: d.cantidadCuotas ?? 1,
          dias_entre_cuotas: d.diasEntreCuotas ?? 30,
          ...(d.estado ? { estado: d.estado } : {}),
        },
        true,
      );
    case 'depositos': {
      const [s] = await tx
        .select({ id: sucursales.id })
        .from(sucursales)
        .where(and(eq(sucursales.id, d.sucursalId as number), eq(sucursales.empresa_id, ctx.empresaId)));
      asegurar(s, 'Sucursal inexistente');
      return upsert(
        T(depositos),
        {
          ...emp,
          sucursal_id: d.sucursalId,
          codigo: d.codigo,
          nombre: d.nombre,
          es_principal: d.esPrincipal ?? false,
          permite_venta: d.permiteVenta ?? true,
          ...(d.estado ? { estado: d.estado } : {}),
        },
        true,
      );
    }
    case 'unidadesMedida':
      return upsert(
        T(unidadesMedida),
        { codigo: d.codigo, nombre: d.nombre, codigo_sifen: nulo(d.codigoSifen), permite_decimales: d.permiteDecimales ?? false },
        false,
      );
    case 'tiposPersona':
      return upsert(T(tiposPersona), { codigo: d.codigo, nombre: d.nombre }, false);
    case 'tiposDocumento':
      return upsert(
        T(tiposDocumento),
        { codigo: d.codigo, nombre: d.nombre, codigo_sifen: nulo(d.codigoSifen), requiere_dv: d.requiereDv ?? false },
        false,
      );
    case 'paises':
      return upsert(T(paises), { codigo_iso: d.codigoIso, nombre: d.nombre, nacionalidad: nulo(d.nacionalidad) }, false);
    case 'departamentos':
      return upsert(T(departamentos), { pais_id: d.paisId, codigo: d.codigo, nombre: d.nombre }, false);
    case 'ciudades':
      return upsert(T(ciudades), { departamento_id: d.departamentoId, nombre: d.nombre, codigo_sifen: nulo(d.codigoSifen) }, false);
    case 'actividadesEconomicas':
      return upsert(T(actividadesEconomicas), { codigo: d.codigo, descripcion: d.descripcion }, false);
  }
  throw new Error(`Tabla referencial no soportada: ${String(tabla)}`);
}

/* =============================== Cambio de estado =============================== */

const TABLAS_ESTADO = {
  personas,
  clientes,
  proveedores,
  articulos,
  descuentos,
  marcas,
  modelos,
  categorias: categoriasArticulo,
  condicionesPago,
  depositos,
  usuarios,
  roles,
  sucursales,
  cajas,
  timbrados,
  puntosExpedicion,
  planCuentas,
} as const;

/** Permiso requerido para cambiar el estado de cada entidad. */
export const PERMISO_ESTADO: Record<EntidadEstado, string> = {
  personas: 'personas.cliente.gestionar',
  clientes: 'personas.cliente.gestionar',
  proveedores: 'personas.proveedor.gestionar',
  articulos: 'articulos.gestionar',
  descuentos: 'descuentos.gestionar',
  marcas: 'referenciales.gestionar',
  modelos: 'referenciales.gestionar',
  categorias: 'referenciales.gestionar',
  condicionesPago: 'referenciales.gestionar',
  depositos: 'referenciales.gestionar',
  usuarios: 'seguridad.usuario.gestionar',
  roles: 'seguridad.rol.gestionar',
  sucursales: 'organizacion.sucursal.gestionar',
  cajas: 'organizacion.sucursal.gestionar',
  timbrados: 'organizacion.timbrado.gestionar',
  puntosExpedicion: 'organizacion.sucursal.gestionar',
  planCuentas: 'contabilidad.plan_cuentas.gestionar',
};

/** Acepta alias en singular / snake_case ("articulo", "punto_expedicion", "plan_cuenta"...). */
export function normalizarEntidad(entidad: string): EntidadEstado | null {
  const e = entidad.trim();
  const camel = e.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  const candidatos = [camel, `${camel}s`, `${camel}es`, camel.replace(/on$/, 'ones')];
  for (const c of candidatos) if (c in TABLAS_ESTADO) return c as EntidadEstado;
  if (camel === 'categoria') return 'categorias';
  if (camel === 'condicionPago') return 'condicionesPago';
  if (camel === 'puntoExpedicion') return 'puntosExpedicion';
  if (camel === 'planCuenta' || camel === 'cuenta') return 'planCuentas';
  return null;
}

export async function cambiarEstado(tx: DbLike, ctx: Ctx, entidad: EntidadEstado, id: number, estado: 'activo' | 'inactivo') {
  const t = TABLAS_ESTADO[entidad] as unknown as typeof marcas;
  if (entidad === 'usuarios') asegurar(!(id === ctx.usuarioId && estado === 'inactivo'), 'No puede desactivarse a sí mismo');
  const r = await tx
    .update(t)
    .set({ estado } as never)
    .where(and(eq(t.id, id), eq(t.empresa_id, ctx.empresaId)))
    .returning({ id: t.id });
  asegurar(r.length, 'Registro inexistente');
  return { id, estado };
}
