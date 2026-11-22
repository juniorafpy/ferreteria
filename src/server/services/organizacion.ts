import { and, eq, inArray } from 'drizzle-orm';
import type { DbLike } from '@/db';
import {
  configuracionSifen,
  empresas,
  establecimientos,
  numeracionesDocumento,
  parametrosGenerales,
  permisos,
  puntosExpedicion,
  roles,
  rolPermisos,
  sucursales,
  timbrados,
  usuarioRoles,
  usuarios,
} from '@/db/schema';
import { hashPassword } from '@/db/utils/password';
import type { Ctx } from '../lib/contexto';
import { asegurar } from '../lib/result';
import type {
  ConfiguracionSifenInput,
  EmpresaInput,
  ParametrosInput,
  PuntoExpedicionInput,
  RolInput,
  SucursalInput,
  TimbradoInput,
  UsuarioInput,
} from '../validation/ajustes';

const nulo = <T>(v: T | undefined | null) => (v === undefined || v === '' ? null : v) as T | null;

export async function guardarEmpresa(tx: DbLike, ctx: Ctx, d: EmpresaInput) {
  asegurar(!d.id || d.id === ctx.empresaId, 'Solo puede editar la empresa de la sesión');
  const valores = {
    ruc: d.ruc.ruc,
    dv: d.ruc.dv,
    razon_social: d.razonSocial,
    nombre_fantasia: nulo(d.nombreFantasia),
    direccion: nulo(d.direccion),
    numero_casa: nulo(d.numeroCasa),
    ciudad_id: nulo(d.ciudadId),
    telefono: nulo(d.telefono),
    email: nulo(d.email),
    actividad_economica_id: nulo(d.actividadEconomicaId),
    ...(d.estado ? { estado: d.estado } : {}),
  };
  await tx.update(empresas).set(valores).where(eq(empresas.id, ctx.empresaId));
  return { id: ctx.empresaId };
}

export async function guardarSucursal(tx: DbLike, ctx: Ctx, d: SucursalInput) {
  const valores = {
    empresa_id: ctx.empresaId,
    codigo: d.codigo,
    nombre: d.nombre,
    direccion: nulo(d.direccion),
    ciudad_id: nulo(d.ciudadId),
    telefono: nulo(d.telefono),
    email: nulo(d.email),
    es_casa_matriz: d.esCasaMatriz ?? false,
    ...(d.estado ? { estado: d.estado } : {}),
  };
  let id: number;
  if (d.id) {
    const r = await tx
      .update(sucursales)
      .set(valores)
      .where(and(eq(sucursales.id, d.id), eq(sucursales.empresa_id, ctx.empresaId)))
      .returning({ id: sucursales.id });
    asegurar(r.length, 'Sucursal inexistente');
    id = r[0].id;
  } else {
    const [r] = await tx.insert(sucursales).values(valores).returning({ id: sucursales.id });
    id = r.id;
  }
  if (d.establecimiento) {
    const [e] = await tx.select().from(establecimientos).where(eq(establecimientos.sucursal_id, id));
    const ev = {
      empresa_id: ctx.empresaId,
      sucursal_id: id,
      codigo: d.establecimiento.codigo,
      denominacion: d.establecimiento.denominacion,
      direccion: nulo(d.establecimiento.direccion),
    };
    if (e) await tx.update(establecimientos).set(ev).where(eq(establecimientos.id, e.id));
    else await tx.insert(establecimientos).values(ev);
  }
  return { id };
}

export async function guardarTimbrado(tx: DbLike, ctx: Ctx, d: TimbradoInput) {
  const valores = {
    empresa_id: ctx.empresaId,
    numero: d.numero,
    modalidad: d.modalidad,
    fecha_inicio_vigencia: d.fechaInicioVigencia,
    fecha_fin_vigencia: nulo(d.fechaFinVigencia),
    ...(d.estado ? { estado: d.estado } : {}),
  };
  if (d.id) {
    const r = await tx
      .update(timbrados)
      .set(valores)
      .where(and(eq(timbrados.id, d.id), eq(timbrados.empresa_id, ctx.empresaId)))
      .returning({ id: timbrados.id });
    asegurar(r.length, 'Timbrado inexistente');
    return { id: r[0].id };
  }
  const [r] = await tx.insert(timbrados).values(valores).returning({ id: timbrados.id });
  return { id: r.id };
}

export async function guardarPuntoExpedicion(tx: DbLike, ctx: Ctx, d: PuntoExpedicionInput) {
  const [e] = await tx
    .select()
    .from(establecimientos)
    .where(and(eq(establecimientos.id, d.establecimientoId), eq(establecimientos.empresa_id, ctx.empresaId)));
  asegurar(e && e.sucursal_id === d.sucursalId, 'El establecimiento no corresponde a la sucursal');
  const valores = {
    empresa_id: ctx.empresaId,
    sucursal_id: d.sucursalId,
    establecimiento_id: d.establecimientoId,
    codigo: d.codigo,
    descripcion: nulo(d.descripcion),
    ...(d.estado ? { estado: d.estado } : {}),
  };
  let id: number;
  if (d.id) {
    const r = await tx
      .update(puntosExpedicion)
      .set(valores)
      .where(and(eq(puntosExpedicion.id, d.id), eq(puntosExpedicion.empresa_id, ctx.empresaId)))
      .returning({ id: puntosExpedicion.id });
    asegurar(r.length, 'Punto de expedición inexistente');
    id = r[0].id;
  } else {
    const [r] = await tx.insert(puntosExpedicion).values(valores).returning({ id: puntosExpedicion.id });
    id = r.id;
  }
  for (const n of d.numeraciones ?? []) {
    const [t] = await tx
      .select({ id: timbrados.id })
      .from(timbrados)
      .where(and(eq(timbrados.id, n.timbradoId), eq(timbrados.empresa_id, ctx.empresaId)));
    asegurar(t, 'Timbrado inexistente');
    const v = {
      empresa_id: ctx.empresaId,
      sucursal_id: d.sucursalId,
      timbrado_id: n.timbradoId,
      punto_expedicion_id: id,
      tipo_documento: n.tipoDocumento,
      numero_desde: n.numeroDesde ?? 1,
      numero_hasta: n.numeroHasta ?? 9_999_999,
    };
    // numero_actual nunca se modifica desde aquí (lo controla la facturación).
    await tx
      .insert(numeracionesDocumento)
      .values(v)
      .onConflictDoUpdate({
        target: [numeracionesDocumento.timbrado_id, numeracionesDocumento.punto_expedicion_id, numeracionesDocumento.tipo_documento],
        set: { numero_desde: v.numero_desde, numero_hasta: v.numero_hasta },
      });
  }
  return { id };
}

export async function guardarConfiguracionSifen(tx: DbLike, ctx: Ctx, d: ConfiguracionSifenInput) {
  const valores = {
    empresa_id: ctx.empresaId,
    sucursal_id: nulo(d.sucursalId),
    ambiente: d.ambiente,
    id_csc: nulo(d.idCsc),
    csc_ref: nulo(d.cscRef),
    certificado_ruta: nulo(d.certificadoRuta),
    certificado_password_ref: nulo(d.certificadoPasswordRef),
    url_ws_recepcion: nulo(d.urlWsRecepcion),
    url_ws_consulta: nulo(d.urlWsConsulta),
    url_qr_base: nulo(d.urlQrBase),
    envio_por_lote: d.envioPorLote ?? false,
    activo: d.activo ?? true,
  };
  const [r] = await tx
    .insert(configuracionSifen)
    .values(valores)
    .onConflictDoUpdate({ target: [configuracionSifen.empresa_id, configuracionSifen.sucursal_id], set: valores })
    .returning({ id: configuracionSifen.id });
  return { id: r.id };
}

export async function guardarUsuario(tx: DbLike, ctx: Ctx, d: UsuarioInput) {
  const valores = {
    empresa_id: ctx.empresaId,
    usuario: d.usuario,
    nombre: d.nombre,
    email: nulo(d.email),
    sucursal_predeterminada_id: nulo(d.sucursalPredeterminadaId),
    ...(d.estado ? { estado: d.estado } : {}),
    ...(d.password ? { password_hash: hashPassword(d.password) } : {}),
  };
  let id: number;
  if (d.id) {
    const r = await tx
      .update(usuarios)
      .set(valores)
      .where(and(eq(usuarios.id, d.id), eq(usuarios.empresa_id, ctx.empresaId)))
      .returning({ id: usuarios.id });
    asegurar(r.length, 'Usuario inexistente');
    id = r[0].id;
  } else {
    asegurar(d.password, 'La contraseña es obligatoria al crear el usuario');
    const [r] = await tx
      .insert(usuarios)
      .values({ ...valores, password_hash: hashPassword(d.password) })
      .returning({ id: usuarios.id });
    id = r.id;
  }
  if (d.roles) {
    const rolIds = [...new Set(d.roles.map((r) => r.rolId))];
    if (rolIds.length) {
      const rs = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.empresa_id, ctx.empresaId), inArray(roles.id, rolIds)));
      asegurar(rs.length === rolIds.length, 'Rol inexistente');
    }
    await tx.delete(usuarioRoles).where(eq(usuarioRoles.usuario_id, id));
    if (d.roles.length) {
      await tx
        .insert(usuarioRoles)
        .values(d.roles.map((r) => ({ usuario_id: id, rol_id: r.rolId, sucursal_id: r.sucursalId ?? null })))
        .onConflictDoNothing();
    }
  }
  return { id };
}

export async function guardarRol(tx: DbLike, ctx: Ctx, d: RolInput) {
  const valores = {
    empresa_id: ctx.empresaId,
    codigo: d.codigo,
    nombre: d.nombre,
    descripcion: nulo(d.descripcion),
    descuento_manual_max_pct: d.descuentoManualMaxPct,
    ...(d.estado ? { estado: d.estado } : {}),
  };
  let id: number;
  if (d.id) {
    const r = await tx
      .update(roles)
      .set(valores)
      .where(and(eq(roles.id, d.id), eq(roles.empresa_id, ctx.empresaId)))
      .returning({ id: roles.id });
    asegurar(r.length, 'Rol inexistente');
    id = r[0].id;
  } else {
    const [r] = await tx.insert(roles).values(valores).returning({ id: roles.id });
    id = r.id;
  }
  const codigos = [...new Set(d.permisos)];
  const ps = codigos.length ? await tx.select().from(permisos).where(inArray(permisos.codigo, codigos)) : [];
  asegurar(ps.length === codigos.length, 'Permiso inexistente');
  await tx.delete(rolPermisos).where(eq(rolPermisos.rol_id, id));
  if (ps.length) await tx.insert(rolPermisos).values(ps.map((p) => ({ rol_id: id, permiso_id: p.id })));
  return { id };
}

export async function guardarParametros(tx: DbLike, ctx: Ctx, d: ParametrosInput) {
  for (const v of d.valores) {
    const fila = {
      empresa_id: ctx.empresaId,
      sucursal_id: nulo(d.sucursalId),
      clave: v.clave,
      valor: v.valor,
      descripcion: nulo(v.descripcion),
    };
    await tx
      .insert(parametrosGenerales)
      .values(fila)
      .onConflictDoUpdate({
        target: [parametrosGenerales.empresa_id, parametrosGenerales.sucursal_id, parametrosGenerales.clave],
        set: { valor: fila.valor, ...(fila.descripcion ? { descripcion: fila.descripcion } : {}) },
      });
  }
  return { cantidad: d.valores.length };
}
