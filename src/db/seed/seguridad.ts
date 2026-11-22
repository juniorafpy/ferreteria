import { and, eq, inArray } from 'drizzle-orm';
import type { DbLike } from '../index';
import { permisos, roles, rolPermisos, usuarioRoles, usuarios } from '../schema';
import { hashPassword } from '../utils/password';

/** Catálogo de permisos (código estilo modulo.recurso.accion). Contrato con backend/frontend. */
export const PERMISOS: { codigo: string; descripcion: string }[] = [
  // Organización / seguridad
  { codigo: 'organizacion.empresa.gestionar', descripcion: 'Gestionar datos de la empresa' },
  { codigo: 'organizacion.sucursal.gestionar', descripcion: 'Gestionar sucursales, establecimientos y puntos de expedición' },
  { codigo: 'organizacion.timbrado.gestionar', descripcion: 'Gestionar timbrados y numeraciones' },
  { codigo: 'organizacion.sifen.gestionar', descripcion: 'Gestionar configuración SIFEN' },
  { codigo: 'organizacion.parametros.gestionar', descripcion: 'Gestionar parámetros generales' },
  { codigo: 'seguridad.usuario.gestionar', descripcion: 'Gestionar usuarios' },
  { codigo: 'seguridad.rol.gestionar', descripcion: 'Gestionar roles y permisos' },
  // Maestros
  { codigo: 'referenciales.gestionar', descripcion: 'Gestionar catálogos referenciales' },
  { codigo: 'personas.cliente.gestionar', descripcion: 'Gestionar clientes' },
  { codigo: 'personas.proveedor.gestionar', descripcion: 'Gestionar proveedores' },
  { codigo: 'articulos.gestionar', descripcion: 'Gestionar artículos y presentaciones' },
  { codigo: 'articulos.precio.modificar', descripcion: 'Modificar precios de venta' },
  { codigo: 'descuentos.gestionar', descripcion: 'Gestionar descuentos automáticos' },
  // Compras
  { codigo: 'compras.pedido.crear', descripcion: 'Crear pedidos de compra' },
  { codigo: 'compras.pedido.confirmar', descripcion: 'Confirmar pedidos de compra' },
  { codigo: 'compras.pedido.anular', descripcion: 'Anular pedidos de compra' },
  { codigo: 'compras.orden.crear', descripcion: 'Crear órdenes de compra' },
  { codigo: 'compras.orden.confirmar', descripcion: 'Confirmar órdenes de compra' },
  { codigo: 'compras.orden.anular', descripcion: 'Anular órdenes de compra' },
  { codigo: 'compras.factura.crear', descripcion: 'Cargar facturas de compra' },
  { codigo: 'compras.factura.confirmar', descripcion: 'Confirmar facturas de compra' },
  { codigo: 'compras.factura.anular', descripcion: 'Anular facturas de compra' },
  { codigo: 'compras.recepcion.crear', descripcion: 'Crear recepciones de mercadería' },
  { codigo: 'compras.recepcion.confirmar', descripcion: 'Confirmar recepciones (ingreso a stock)' },
  { codigo: 'compras.recepcion.anular', descripcion: 'Anular recepciones' },
  { codigo: 'compras.pago.crear', descripcion: 'Crear órdenes de pago' },
  { codigo: 'compras.pago.confirmar', descripcion: 'Confirmar órdenes de pago' },
  { codigo: 'compras.pago.anular', descripcion: 'Anular órdenes de pago' },
  // Ventas
  { codigo: 'ventas.presupuesto.crear', descripcion: 'Crear presupuestos' },
  { codigo: 'ventas.presupuesto.confirmar', descripcion: 'Confirmar presupuestos' },
  { codigo: 'ventas.presupuesto.anular', descripcion: 'Anular presupuestos' },
  { codigo: 'ventas.factura.crear', descripcion: 'Crear facturas de venta (borrador)' },
  { codigo: 'ventas.factura.confirmar', descripcion: 'Confirmar/emitir facturas de venta' },
  { codigo: 'ventas.factura.anular', descripcion: 'Anular facturas de venta' },
  { codigo: 'ventas.descuento_manual', descripcion: 'Aplicar descuento manual (hasta el tope del rol)' },
  { codigo: 'ventas.sifen.gestionar', descripcion: 'Reenviar, consultar y cancelar documentos en SIFEN' },
  // Caja
  { codigo: 'caja.sesion.abrir', descripcion: 'Abrir sesión de caja' },
  { codigo: 'caja.sesion.cerrar', descripcion: 'Cerrar sesión de caja y arqueo' },
  { codigo: 'caja.cobro.crear', descripcion: 'Registrar cobros' },
  { codigo: 'caja.cobro.anular', descripcion: 'Anular cobros' },
  // Inventario
  { codigo: 'inventario.stock.consultar', descripcion: 'Consultar existencias' },
  { codigo: 'inventario.kardex.consultar', descripcion: 'Consultar kardex' },
  { codigo: 'ajustes.stock', descripcion: 'Crear y confirmar ajustes de stock (mermas/sobrantes)' },
  { codigo: 'ajustes.stock.anular', descripcion: 'Anular ajustes de stock' },
  { codigo: 'inventario.transferencia.crear', descripcion: 'Crear transferencias de stock' },
  { codigo: 'inventario.transferencia.enviar', descripcion: 'Enviar transferencias de stock' },
  { codigo: 'inventario.transferencia.recibir', descripcion: 'Recibir transferencias de stock' },
  { codigo: 'inventario.transferencia.anular', descripcion: 'Anular transferencias de stock' },
  // Contabilidad / reportes
  { codigo: 'contabilidad.plan_cuentas.gestionar', descripcion: 'Gestionar plan de cuentas' },
  { codigo: 'contabilidad.configuracion.gestionar', descripcion: 'Gestionar configuración contable' },
  { codigo: 'contabilidad.asiento.crear', descripcion: 'Crear asientos contables manuales' },
  { codigo: 'contabilidad.asiento.anular', descripcion: 'Anular asientos contables' },
  { codigo: 'contabilidad.reportes.ver', descripcion: 'Ver libros y reportes contables' },
  { codigo: 'reportes.ventas.ver', descripcion: 'Ver reportes de ventas' },
  { codigo: 'reportes.compras.ver', descripcion: 'Ver reportes de compras' },
  { codigo: 'reportes.inventario.ver', descripcion: 'Ver reportes de inventario' },
];

type DefRol = {
  codigo: string;
  nombre: string;
  descripcion: string;
  descuento_manual_max_pct: number;
  permisos: '*' | string[];
};

export const ROLES: DefRol[] = [
  {
    codigo: 'ADMIN',
    nombre: 'Administrador',
    descripcion: 'Acceso total',
    descuento_manual_max_pct: 100,
    permisos: '*',
  },
  {
    codigo: 'VENDEDOR',
    nombre: 'Vendedor',
    descripcion: 'Presupuestos y facturación',
    descuento_manual_max_pct: 10,
    permisos: [
      'personas.cliente.gestionar',
      'ventas.presupuesto.crear',
      'ventas.presupuesto.confirmar',
      'ventas.presupuesto.anular',
      'ventas.factura.crear',
      'ventas.factura.confirmar',
      'ventas.descuento_manual',
      'inventario.stock.consultar',
      'reportes.ventas.ver',
    ],
  },
  {
    codigo: 'CAJERO',
    nombre: 'Cajero',
    descripcion: 'Caja, cobros y emisión de facturas',
    descuento_manual_max_pct: 0,
    permisos: [
      'caja.sesion.abrir',
      'caja.sesion.cerrar',
      'caja.cobro.crear',
      'ventas.factura.crear',
      'ventas.factura.confirmar',
      'personas.cliente.gestionar',
      'inventario.stock.consultar',
    ],
  },
  {
    codigo: 'COMPRAS',
    nombre: 'Compras',
    descripcion: 'Abastecimiento, recepción e inventario',
    descuento_manual_max_pct: 0,
    permisos: [
      'personas.proveedor.gestionar',
      'articulos.gestionar',
      'compras.pedido.crear',
      'compras.pedido.confirmar',
      'compras.pedido.anular',
      'compras.orden.crear',
      'compras.orden.confirmar',
      'compras.orden.anular',
      'compras.factura.crear',
      'compras.factura.confirmar',
      'compras.recepcion.crear',
      'compras.recepcion.confirmar',
      'compras.pago.crear',
      'inventario.stock.consultar',
      'inventario.kardex.consultar',
      'inventario.transferencia.crear',
      'inventario.transferencia.enviar',
      'inventario.transferencia.recibir',
      'ajustes.stock',
      'reportes.compras.ver',
      'reportes.inventario.ver',
    ],
  },
  {
    codigo: 'CONTADOR',
    nombre: 'Contador',
    descripcion: 'Contabilidad, pagos y reportes',
    descuento_manual_max_pct: 0,
    permisos: [
      'contabilidad.plan_cuentas.gestionar',
      'contabilidad.configuracion.gestionar',
      'contabilidad.asiento.crear',
      'contabilidad.asiento.anular',
      'contabilidad.reportes.ver',
      'compras.pago.crear',
      'compras.pago.confirmar',
      'compras.pago.anular',
      'inventario.kardex.consultar',
      'reportes.ventas.ver',
      'reportes.compras.ver',
      'reportes.inventario.ver',
    ],
  },
];

/** Usuarios demo. Contraseñas documentadas en src/db/seed/README.md. */
export const USUARIOS_DEMO = [
  { usuario: 'admin', nombre: 'Administrador Demo', rol: 'ADMIN', password: 'Admin.Ferre2026' },
  { usuario: 'vendedor', nombre: 'Vendedor Demo', rol: 'VENDEDOR', password: 'Demo.Ferre2026' },
  { usuario: 'cajero', nombre: 'Cajero Demo', rol: 'CAJERO', password: 'Demo.Ferre2026' },
  { usuario: 'compras', nombre: 'Compras Demo', rol: 'COMPRAS', password: 'Demo.Ferre2026' },
  { usuario: 'contador', nombre: 'Contador Demo', rol: 'CONTADOR', password: 'Demo.Ferre2026' },
];

export async function seedPermisos(db: DbLike) {
  await db
    .insert(permisos)
    .values(PERMISOS.map((p) => ({ ...p, modulo: p.codigo.split('.')[0] })))
    .onConflictDoNothing();
}

export async function seedRolesYUsuarios(
  db: DbLike,
  ctx: { empresaId: number; sucursalPredeterminadaId: number },
): Promise<{ adminId: number }> {
  await db
    .insert(roles)
    .values(
      ROLES.map((r) => ({
        empresa_id: ctx.empresaId,
        codigo: r.codigo,
        nombre: r.nombre,
        descripcion: r.descripcion,
        descuento_manual_max_pct: r.descuento_manual_max_pct,
        es_sistema: true,
      })),
    )
    .onConflictDoNothing();

  const filasRoles = await db
    .select({ id: roles.id, codigo: roles.codigo })
    .from(roles)
    .where(eq(roles.empresa_id, ctx.empresaId));
  const rolPorCodigo = new Map(filasRoles.map((r) => [r.codigo, r.id]));

  const filasPermisos = await db.select({ id: permisos.id, codigo: permisos.codigo }).from(permisos);
  const permisoPorCodigo = new Map(filasPermisos.map((p) => [p.codigo, p.id]));

  const asignaciones = ROLES.flatMap((r) => {
    const codigos = r.permisos === '*' ? PERMISOS.map((p) => p.codigo) : r.permisos;
    return codigos.map((c) => {
      const permisoId = permisoPorCodigo.get(c);
      if (!permisoId) throw new Error(`Permiso inexistente en rol ${r.codigo}: ${c}`);
      return { rol_id: rolPorCodigo.get(r.codigo)!, permiso_id: permisoId };
    });
  });
  await db.insert(rolPermisos).values(asignaciones).onConflictDoNothing();

  // Usuarios: solo se hashea si el usuario no existe (idempotente, no pisa contraseñas cambiadas).
  const existentes = await db
    .select({ usuario: usuarios.usuario })
    .from(usuarios)
    .where(
      inArray(
        usuarios.usuario,
        USUARIOS_DEMO.map((u) => u.usuario),
      ),
    );
  const yaExisten = new Set(existentes.map((u) => u.usuario));
  const nuevos = USUARIOS_DEMO.filter((u) => !yaExisten.has(u.usuario));
  if (nuevos.length > 0) {
    await db
      .insert(usuarios)
      .values(
        nuevos.map((u) => ({
          empresa_id: ctx.empresaId,
          usuario: u.usuario,
          nombre: u.nombre,
          email: `${u.usuario}@ferreteria-demo.com.py`,
          password_hash: hashPassword(u.password),
          sucursal_predeterminada_id: ctx.sucursalPredeterminadaId,
        })),
      )
      .onConflictDoNothing();
  }

  const filasUsuarios = await db
    .select({ id: usuarios.id, usuario: usuarios.usuario })
    .from(usuarios)
    .where(
      and(
        eq(usuarios.empresa_id, ctx.empresaId),
        inArray(
          usuarios.usuario,
          USUARIOS_DEMO.map((u) => u.usuario),
        ),
      ),
    );
  const usuarioPorLogin = new Map(filasUsuarios.map((u) => [u.usuario, u.id]));

  // sucursal_id NULL = rol válido en todas las sucursales
  await db
    .insert(usuarioRoles)
    .values(
      USUARIOS_DEMO.map((u) => ({
        usuario_id: usuarioPorLogin.get(u.usuario)!,
        rol_id: rolPorCodigo.get(u.rol)!,
        sucursal_id: null,
      })),
    )
    .onConflictDoNothing();

  return { adminId: usuarioPorLogin.get('admin')! };
}
