import { relations } from 'drizzle-orm';
import { articuloUnidades, articulos, depositos } from './articulos';
import {
  cuentasPagar,
  facturaCompraDetalles,
  facturasCompra,
  historicoCostos,
  ordenCompraDetalles,
  ordenCompraPedidos,
  ordenesCompra,
  ordenesPago,
  ordenPagoDetalles,
  pedidoCompraDetalles,
  pedidosCompra,
  recepcionDetalles,
  recepciones,
} from './compras';
import {
  asientosContables,
  configuracionContable,
  detallesAsientoContable,
  planCuentas,
} from './contabilidad';
import { descuentoArticulos, descuentos, descuentoSucursales } from './descuentos';
import {
  ajustesStock,
  ajusteStockDetalles,
  kardex,
  stock,
  transferenciasStock,
  transferenciaStockDetalles,
} from './inventario';
import {
  configuracionSifen,
  empresas,
  establecimientos,
  numeracionesDocumento,
  parametrosGenerales,
  puntosExpedicion,
  sucursales,
  timbrados,
} from './organizacion';
import { clientes, condicionesPago, personas, proveedores } from './personas';
import {
  actividadesEconomicas,
  categoriasArticulo,
  ciudades,
  departamentos,
  marcas,
  modelos,
  paises,
  tiposDocumento,
  tiposPersona,
  unidadesMedida,
} from './referenciales';
import { permisos, roles, rolPermisos, usuarioRoles, usuarios } from './seguridad';
import {
  arqueosCaja,
  cajas,
  cobroDetalles,
  cobroMedios,
  cobros,
  cuentasCobrar,
  cuotasVenta,
  facturasVenta,
  facturaVentaDetalles,
  presupuestoDetalles,
  presupuestos,
  sesionesCaja,
  sifenEventos,
} from './ventas';

/* ------------------------------ Organización ------------------------------ */

export const empresasRelations = relations(empresas, ({ one, many }) => ({
  ciudad: one(ciudades, { fields: [empresas.ciudad_id], references: [ciudades.id] }),
  actividadEconomica: one(actividadesEconomicas, {
    fields: [empresas.actividad_economica_id],
    references: [actividadesEconomicas.id],
  }),
  sucursales: many(sucursales),
  establecimientos: many(establecimientos),
  timbrados: many(timbrados),
  usuarios: many(usuarios),
  roles: many(roles),
  depositos: many(depositos),
  parametros: many(parametrosGenerales),
  configuracionesSifen: many(configuracionSifen),
  planCuentas: many(planCuentas),
}));

export const sucursalesRelations = relations(sucursales, ({ one, many }) => ({
  empresa: one(empresas, { fields: [sucursales.empresa_id], references: [empresas.id] }),
  ciudad: one(ciudades, { fields: [sucursales.ciudad_id], references: [ciudades.id] }),
  establecimientos: many(establecimientos),
  depositos: many(depositos),
  cajas: many(cajas),
}));

export const establecimientosRelations = relations(establecimientos, ({ one, many }) => ({
  empresa: one(empresas, { fields: [establecimientos.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [establecimientos.sucursal_id], references: [sucursales.id] }),
  puntosExpedicion: many(puntosExpedicion),
}));

export const puntosExpedicionRelations = relations(puntosExpedicion, ({ one, many }) => ({
  empresa: one(empresas, { fields: [puntosExpedicion.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [puntosExpedicion.sucursal_id], references: [sucursales.id] }),
  establecimiento: one(establecimientos, {
    fields: [puntosExpedicion.establecimiento_id],
    references: [establecimientos.id],
  }),
  numeraciones: many(numeracionesDocumento),
}));

export const timbradosRelations = relations(timbrados, ({ one, many }) => ({
  empresa: one(empresas, { fields: [timbrados.empresa_id], references: [empresas.id] }),
  numeraciones: many(numeracionesDocumento),
}));

export const numeracionesDocumentoRelations = relations(numeracionesDocumento, ({ one }) => ({
  empresa: one(empresas, { fields: [numeracionesDocumento.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [numeracionesDocumento.sucursal_id], references: [sucursales.id] }),
  timbrado: one(timbrados, { fields: [numeracionesDocumento.timbrado_id], references: [timbrados.id] }),
  puntoExpedicion: one(puntosExpedicion, {
    fields: [numeracionesDocumento.punto_expedicion_id],
    references: [puntosExpedicion.id],
  }),
}));

export const configuracionSifenRelations = relations(configuracionSifen, ({ one }) => ({
  empresa: one(empresas, { fields: [configuracionSifen.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [configuracionSifen.sucursal_id], references: [sucursales.id] }),
}));

export const parametrosGeneralesRelations = relations(parametrosGenerales, ({ one }) => ({
  empresa: one(empresas, { fields: [parametrosGenerales.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [parametrosGenerales.sucursal_id], references: [sucursales.id] }),
}));

/* ------------------------------ Seguridad ------------------------------ */

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  empresa: one(empresas, { fields: [usuarios.empresa_id], references: [empresas.id] }),
  sucursalPredeterminada: one(sucursales, {
    fields: [usuarios.sucursal_predeterminada_id],
    references: [sucursales.id],
  }),
  roles: many(usuarioRoles),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  empresa: one(empresas, { fields: [roles.empresa_id], references: [empresas.id] }),
  permisos: many(rolPermisos),
  usuarios: many(usuarioRoles),
}));

export const permisosRelations = relations(permisos, ({ many }) => ({
  roles: many(rolPermisos),
}));

export const rolPermisosRelations = relations(rolPermisos, ({ one }) => ({
  rol: one(roles, { fields: [rolPermisos.rol_id], references: [roles.id] }),
  permiso: one(permisos, { fields: [rolPermisos.permiso_id], references: [permisos.id] }),
}));

export const usuarioRolesRelations = relations(usuarioRoles, ({ one }) => ({
  usuario: one(usuarios, { fields: [usuarioRoles.usuario_id], references: [usuarios.id] }),
  rol: one(roles, { fields: [usuarioRoles.rol_id], references: [roles.id] }),
  sucursal: one(sucursales, { fields: [usuarioRoles.sucursal_id], references: [sucursales.id] }),
}));

/* ------------------------------ Referenciales ------------------------------ */

export const tiposPersonaRelations = relations(tiposPersona, ({ many }) => ({
  personas: many(personas),
}));

export const tiposDocumentoRelations = relations(tiposDocumento, ({ many }) => ({
  personas: many(personas),
}));

export const paisesRelations = relations(paises, ({ many }) => ({
  departamentos: many(departamentos),
}));

export const departamentosRelations = relations(departamentos, ({ one, many }) => ({
  pais: one(paises, { fields: [departamentos.pais_id], references: [paises.id] }),
  ciudades: many(ciudades),
}));

export const ciudadesRelations = relations(ciudades, ({ one }) => ({
  departamento: one(departamentos, { fields: [ciudades.departamento_id], references: [departamentos.id] }),
}));

export const actividadesEconomicasRelations = relations(actividadesEconomicas, () => ({}));

export const unidadesMedidaRelations = relations(unidadesMedida, () => ({}));

export const marcasRelations = relations(marcas, ({ one, many }) => ({
  empresa: one(empresas, { fields: [marcas.empresa_id], references: [empresas.id] }),
  modelos: many(modelos),
  articulos: many(articulos),
}));

export const modelosRelations = relations(modelos, ({ one, many }) => ({
  empresa: one(empresas, { fields: [modelos.empresa_id], references: [empresas.id] }),
  marca: one(marcas, { fields: [modelos.marca_id], references: [marcas.id] }),
  articulos: many(articulos),
}));

export const categoriasArticuloRelations = relations(categoriasArticulo, ({ one, many }) => ({
  empresa: one(empresas, { fields: [categoriasArticulo.empresa_id], references: [empresas.id] }),
  padre: one(categoriasArticulo, {
    fields: [categoriasArticulo.padre_id],
    references: [categoriasArticulo.id],
    relationName: 'categoria_padre',
  }),
  hijas: many(categoriasArticulo, { relationName: 'categoria_padre' }),
  articulos: many(articulos),
}));

/* ------------------------------ Personas ------------------------------ */

export const personasRelations = relations(personas, ({ one, many }) => ({
  empresa: one(empresas, { fields: [personas.empresa_id], references: [empresas.id] }),
  tipoPersona: one(tiposPersona, { fields: [personas.tipo_persona_id], references: [tiposPersona.id] }),
  tipoDocumento: one(tiposDocumento, {
    fields: [personas.tipo_documento_id],
    references: [tiposDocumento.id],
  }),
  actividadEconomica: one(actividadesEconomicas, {
    fields: [personas.actividad_economica_id],
    references: [actividadesEconomicas.id],
  }),
  pais: one(paises, { fields: [personas.pais_id], references: [paises.id] }),
  ciudad: one(ciudades, { fields: [personas.ciudad_id], references: [ciudades.id] }),
  clientes: many(clientes),
  proveedores: many(proveedores),
}));

export const condicionesPagoRelations = relations(condicionesPago, ({ one }) => ({
  empresa: one(empresas, { fields: [condicionesPago.empresa_id], references: [empresas.id] }),
}));

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  empresa: one(empresas, { fields: [clientes.empresa_id], references: [empresas.id] }),
  persona: one(personas, { fields: [clientes.persona_id], references: [personas.id] }),
  condicionPago: one(condicionesPago, {
    fields: [clientes.condicion_pago_id],
    references: [condicionesPago.id],
  }),
  facturas: many(facturasVenta),
  presupuestos: many(presupuestos),
  cuentasCobrar: many(cuentasCobrar),
}));

export const proveedoresRelations = relations(proveedores, ({ one, many }) => ({
  empresa: one(empresas, { fields: [proveedores.empresa_id], references: [empresas.id] }),
  persona: one(personas, { fields: [proveedores.persona_id], references: [personas.id] }),
  condicionPago: one(condicionesPago, {
    fields: [proveedores.condicion_pago_id],
    references: [condicionesPago.id],
  }),
  ordenesCompra: many(ordenesCompra),
  facturasCompra: many(facturasCompra),
  cuentasPagar: many(cuentasPagar),
}));

/* ------------------------------ Artículos ------------------------------ */

export const depositosRelations = relations(depositos, ({ one, many }) => ({
  empresa: one(empresas, { fields: [depositos.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [depositos.sucursal_id], references: [sucursales.id] }),
  stock: many(stock),
}));

export const articulosRelations = relations(articulos, ({ one, many }) => ({
  empresa: one(empresas, { fields: [articulos.empresa_id], references: [empresas.id] }),
  categoria: one(categoriasArticulo, {
    fields: [articulos.categoria_id],
    references: [categoriasArticulo.id],
  }),
  marca: one(marcas, { fields: [articulos.marca_id], references: [marcas.id] }),
  modelo: one(modelos, { fields: [articulos.modelo_id], references: [modelos.id] }),
  unidadMedida: one(unidadesMedida, {
    fields: [articulos.unidad_medida_id],
    references: [unidadesMedida.id],
  }),
  unidades: many(articuloUnidades),
  stock: many(stock),
  descuentos: many(descuentoArticulos),
}));

export const articuloUnidadesRelations = relations(articuloUnidades, ({ one }) => ({
  articulo: one(articulos, { fields: [articuloUnidades.articulo_id], references: [articulos.id] }),
  unidadMedida: one(unidadesMedida, {
    fields: [articuloUnidades.unidad_medida_id],
    references: [unidadesMedida.id],
  }),
}));

/* ------------------------------ Descuentos ------------------------------ */

export const descuentosRelations = relations(descuentos, ({ one, many }) => ({
  empresa: one(empresas, { fields: [descuentos.empresa_id], references: [empresas.id] }),
  sucursales: many(descuentoSucursales),
  articulos: many(descuentoArticulos),
}));

export const descuentoSucursalesRelations = relations(descuentoSucursales, ({ one }) => ({
  descuento: one(descuentos, { fields: [descuentoSucursales.descuento_id], references: [descuentos.id] }),
  sucursal: one(sucursales, { fields: [descuentoSucursales.sucursal_id], references: [sucursales.id] }),
}));

export const descuentoArticulosRelations = relations(descuentoArticulos, ({ one }) => ({
  descuento: one(descuentos, { fields: [descuentoArticulos.descuento_id], references: [descuentos.id] }),
  articulo: one(articulos, { fields: [descuentoArticulos.articulo_id], references: [articulos.id] }),
}));

/* ------------------------------ Compras ------------------------------ */

export const pedidosCompraRelations = relations(pedidosCompra, ({ one, many }) => ({
  empresa: one(empresas, { fields: [pedidosCompra.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [pedidosCompra.sucursal_id], references: [sucursales.id] }),
  proveedor: one(proveedores, { fields: [pedidosCompra.proveedor_id], references: [proveedores.id] }),
  deposito: one(depositos, { fields: [pedidosCompra.deposito_id], references: [depositos.id] }),
  creadoPor: one(usuarios, { fields: [pedidosCompra.creado_por], references: [usuarios.id] }),
  detalles: many(pedidoCompraDetalles),
  ordenes: many(ordenCompraPedidos),
}));

export const pedidoCompraDetallesRelations = relations(pedidoCompraDetalles, ({ one, many }) => ({
  pedido: one(pedidosCompra, {
    fields: [pedidoCompraDetalles.pedido_compra_id],
    references: [pedidosCompra.id],
  }),
  articulo: one(articulos, { fields: [pedidoCompraDetalles.articulo_id], references: [articulos.id] }),
  detallesDestino: many(ordenCompraDetalles),
}));

export const ordenesCompraRelations = relations(ordenesCompra, ({ one, many }) => ({
  empresa: one(empresas, { fields: [ordenesCompra.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [ordenesCompra.sucursal_id], references: [sucursales.id] }),
  proveedor: one(proveedores, { fields: [ordenesCompra.proveedor_id], references: [proveedores.id] }),
  condicionPago: one(condicionesPago, {
    fields: [ordenesCompra.condicion_pago_id],
    references: [condicionesPago.id],
  }),
  deposito: one(depositos, { fields: [ordenesCompra.deposito_id], references: [depositos.id] }),
  creadoPor: one(usuarios, { fields: [ordenesCompra.creado_por], references: [usuarios.id] }),
  detalles: many(ordenCompraDetalles),
  pedidos: many(ordenCompraPedidos),
  facturas: many(facturasCompra),
}));

export const ordenCompraPedidosRelations = relations(ordenCompraPedidos, ({ one }) => ({
  orden: one(ordenesCompra, { fields: [ordenCompraPedidos.orden_compra_id], references: [ordenesCompra.id] }),
  pedido: one(pedidosCompra, {
    fields: [ordenCompraPedidos.pedido_compra_id],
    references: [pedidosCompra.id],
  }),
}));

export const ordenCompraDetallesRelations = relations(ordenCompraDetalles, ({ one, many }) => ({
  orden: one(ordenesCompra, { fields: [ordenCompraDetalles.orden_compra_id], references: [ordenesCompra.id] }),
  detalleOrigen: one(pedidoCompraDetalles, {
    fields: [ordenCompraDetalles.detalle_origen_id],
    references: [pedidoCompraDetalles.id],
  }),
  articulo: one(articulos, { fields: [ordenCompraDetalles.articulo_id], references: [articulos.id] }),
  descuento: one(descuentos, { fields: [ordenCompraDetalles.descuento_id], references: [descuentos.id] }),
  detallesDestino: many(facturaCompraDetalles),
}));

export const facturasCompraRelations = relations(facturasCompra, ({ one, many }) => ({
  empresa: one(empresas, { fields: [facturasCompra.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [facturasCompra.sucursal_id], references: [sucursales.id] }),
  proveedor: one(proveedores, { fields: [facturasCompra.proveedor_id], references: [proveedores.id] }),
  ordenCompra: one(ordenesCompra, { fields: [facturasCompra.orden_compra_id], references: [ordenesCompra.id] }),
  condicionPago: one(condicionesPago, {
    fields: [facturasCompra.condicion_pago_id],
    references: [condicionesPago.id],
  }),
  deposito: one(depositos, { fields: [facturasCompra.deposito_id], references: [depositos.id] }),
  creadoPor: one(usuarios, { fields: [facturasCompra.creado_por], references: [usuarios.id] }),
  detalles: many(facturaCompraDetalles),
  recepciones: many(recepciones),
  cuentasPagar: many(cuentasPagar),
}));

export const facturaCompraDetallesRelations = relations(facturaCompraDetalles, ({ one, many }) => ({
  factura: one(facturasCompra, {
    fields: [facturaCompraDetalles.factura_compra_id],
    references: [facturasCompra.id],
  }),
  detalleOrigen: one(ordenCompraDetalles, {
    fields: [facturaCompraDetalles.detalle_origen_id],
    references: [ordenCompraDetalles.id],
  }),
  articulo: one(articulos, { fields: [facturaCompraDetalles.articulo_id], references: [articulos.id] }),
  descuento: one(descuentos, { fields: [facturaCompraDetalles.descuento_id], references: [descuentos.id] }),
  detallesDestino: many(recepcionDetalles),
  historicoCosto: one(historicoCostos, {
    fields: [facturaCompraDetalles.id],
    references: [historicoCostos.detalle_factura_compra_id],
  }),
}));

export const recepcionesRelations = relations(recepciones, ({ one, many }) => ({
  empresa: one(empresas, { fields: [recepciones.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [recepciones.sucursal_id], references: [sucursales.id] }),
  factura: one(facturasCompra, { fields: [recepciones.factura_compra_id], references: [facturasCompra.id] }),
  deposito: one(depositos, { fields: [recepciones.deposito_id], references: [depositos.id] }),
  creadoPor: one(usuarios, { fields: [recepciones.creado_por], references: [usuarios.id] }),
  detalles: many(recepcionDetalles),
}));

export const recepcionDetallesRelations = relations(recepcionDetalles, ({ one }) => ({
  recepcion: one(recepciones, { fields: [recepcionDetalles.recepcion_id], references: [recepciones.id] }),
  detalleOrigen: one(facturaCompraDetalles, {
    fields: [recepcionDetalles.detalle_origen_id],
    references: [facturaCompraDetalles.id],
  }),
  articulo: one(articulos, { fields: [recepcionDetalles.articulo_id], references: [articulos.id] }),
}));

export const historicoCostosRelations = relations(historicoCostos, ({ one }) => ({
  empresa: one(empresas, { fields: [historicoCostos.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [historicoCostos.sucursal_id], references: [sucursales.id] }),
  articulo: one(articulos, { fields: [historicoCostos.articulo_id], references: [articulos.id] }),
  deposito: one(depositos, { fields: [historicoCostos.deposito_id], references: [depositos.id] }),
  proveedor: one(proveedores, { fields: [historicoCostos.proveedor_id], references: [proveedores.id] }),
  detalleFacturaCompra: one(facturaCompraDetalles, {
    fields: [historicoCostos.detalle_factura_compra_id],
    references: [facturaCompraDetalles.id],
  }),
  recepcionDetalle: one(recepcionDetalles, {
    fields: [historicoCostos.recepcion_detalle_id],
    references: [recepcionDetalles.id],
  }),
}));

export const cuentasPagarRelations = relations(cuentasPagar, ({ one, many }) => ({
  empresa: one(empresas, { fields: [cuentasPagar.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [cuentasPagar.sucursal_id], references: [sucursales.id] }),
  proveedor: one(proveedores, { fields: [cuentasPagar.proveedor_id], references: [proveedores.id] }),
  factura: one(facturasCompra, { fields: [cuentasPagar.factura_compra_id], references: [facturasCompra.id] }),
  pagos: many(ordenPagoDetalles),
}));

export const ordenesPagoRelations = relations(ordenesPago, ({ one, many }) => ({
  empresa: one(empresas, { fields: [ordenesPago.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [ordenesPago.sucursal_id], references: [sucursales.id] }),
  proveedor: one(proveedores, { fields: [ordenesPago.proveedor_id], references: [proveedores.id] }),
  creadoPor: one(usuarios, { fields: [ordenesPago.creado_por], references: [usuarios.id] }),
  detalles: many(ordenPagoDetalles),
}));

export const ordenPagoDetallesRelations = relations(ordenPagoDetalles, ({ one }) => ({
  ordenPago: one(ordenesPago, { fields: [ordenPagoDetalles.orden_pago_id], references: [ordenesPago.id] }),
  cuentaPagar: one(cuentasPagar, {
    fields: [ordenPagoDetalles.cuenta_pagar_id],
    references: [cuentasPagar.id],
  }),
}));

/* ------------------------------ Ventas ------------------------------ */

export const presupuestosRelations = relations(presupuestos, ({ one, many }) => ({
  empresa: one(empresas, { fields: [presupuestos.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [presupuestos.sucursal_id], references: [sucursales.id] }),
  cliente: one(clientes, { fields: [presupuestos.cliente_id], references: [clientes.id] }),
  vendedor: one(usuarios, { fields: [presupuestos.vendedor_id], references: [usuarios.id] }),
  creadoPor: one(usuarios, { fields: [presupuestos.creado_por], references: [usuarios.id] }),
  detalles: many(presupuestoDetalles),
  facturas: many(facturasVenta),
}));

export const presupuestoDetallesRelations = relations(presupuestoDetalles, ({ one, many }) => ({
  presupuesto: one(presupuestos, {
    fields: [presupuestoDetalles.presupuesto_id],
    references: [presupuestos.id],
  }),
  articulo: one(articulos, { fields: [presupuestoDetalles.articulo_id], references: [articulos.id] }),
  descuento: one(descuentos, { fields: [presupuestoDetalles.descuento_id], references: [descuentos.id] }),
  detallesDestino: many(facturaVentaDetalles),
}));

export const cajasRelations = relations(cajas, ({ one, many }) => ({
  empresa: one(empresas, { fields: [cajas.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [cajas.sucursal_id], references: [sucursales.id] }),
  puntoExpedicion: one(puntosExpedicion, {
    fields: [cajas.punto_expedicion_id],
    references: [puntosExpedicion.id],
  }),
  deposito: one(depositos, { fields: [cajas.deposito_id], references: [depositos.id] }),
  sesiones: many(sesionesCaja),
}));

export const sesionesCajaRelations = relations(sesionesCaja, ({ one, many }) => ({
  empresa: one(empresas, { fields: [sesionesCaja.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [sesionesCaja.sucursal_id], references: [sucursales.id] }),
  caja: one(cajas, { fields: [sesionesCaja.caja_id], references: [cajas.id] }),
  usuario: one(usuarios, { fields: [sesionesCaja.usuario_id], references: [usuarios.id] }),
  arqueos: many(arqueosCaja),
  cobros: many(cobros),
  facturas: many(facturasVenta),
}));

export const arqueosCajaRelations = relations(arqueosCaja, ({ one }) => ({
  sesion: one(sesionesCaja, { fields: [arqueosCaja.sesion_caja_id], references: [sesionesCaja.id] }),
}));

export const facturasVentaRelations = relations(facturasVenta, ({ one, many }) => ({
  empresa: one(empresas, { fields: [facturasVenta.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [facturasVenta.sucursal_id], references: [sucursales.id] }),
  presupuesto: one(presupuestos, { fields: [facturasVenta.presupuesto_id], references: [presupuestos.id] }),
  cliente: one(clientes, { fields: [facturasVenta.cliente_id], references: [clientes.id] }),
  vendedor: one(usuarios, { fields: [facturasVenta.vendedor_id], references: [usuarios.id] }),
  creadoPor: one(usuarios, { fields: [facturasVenta.creado_por], references: [usuarios.id] }),
  deposito: one(depositos, { fields: [facturasVenta.deposito_id], references: [depositos.id] }),
  sesionCaja: one(sesionesCaja, { fields: [facturasVenta.sesion_caja_id], references: [sesionesCaja.id] }),
  timbradoRef: one(timbrados, { fields: [facturasVenta.timbrado_id], references: [timbrados.id] }),
  puntoExpedicionRef: one(puntosExpedicion, {
    fields: [facturasVenta.punto_expedicion_id],
    references: [puntosExpedicion.id],
  }),
  receptorTipoDocumento: one(tiposDocumento, {
    fields: [facturasVenta.receptor_tipo_documento_id],
    references: [tiposDocumento.id],
  }),
  detalles: many(facturaVentaDetalles),
  cuotas: many(cuotasVenta),
  cuentasCobrar: many(cuentasCobrar),
  eventosSifen: many(sifenEventos),
}));

export const facturaVentaDetallesRelations = relations(facturaVentaDetalles, ({ one }) => ({
  factura: one(facturasVenta, {
    fields: [facturaVentaDetalles.factura_venta_id],
    references: [facturasVenta.id],
  }),
  detalleOrigen: one(presupuestoDetalles, {
    fields: [facturaVentaDetalles.detalle_origen_id],
    references: [presupuestoDetalles.id],
  }),
  articulo: one(articulos, { fields: [facturaVentaDetalles.articulo_id], references: [articulos.id] }),
  unidadMedida: one(unidadesMedida, {
    fields: [facturaVentaDetalles.unidad_medida_id],
    references: [unidadesMedida.id],
  }),
  descuento: one(descuentos, { fields: [facturaVentaDetalles.descuento_id], references: [descuentos.id] }),
}));

export const sifenEventosRelations = relations(sifenEventos, ({ one }) => ({
  factura: one(facturasVenta, { fields: [sifenEventos.factura_venta_id], references: [facturasVenta.id] }),
  usuario: one(usuarios, { fields: [sifenEventos.usuario_id], references: [usuarios.id] }),
}));

export const cuotasVentaRelations = relations(cuotasVenta, ({ one }) => ({
  factura: one(facturasVenta, { fields: [cuotasVenta.factura_venta_id], references: [facturasVenta.id] }),
  cuentaCobrar: one(cuentasCobrar, {
    fields: [cuotasVenta.id],
    references: [cuentasCobrar.cuota_venta_id],
  }),
}));

export const cuentasCobrarRelations = relations(cuentasCobrar, ({ one, many }) => ({
  empresa: one(empresas, { fields: [cuentasCobrar.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [cuentasCobrar.sucursal_id], references: [sucursales.id] }),
  cliente: one(clientes, { fields: [cuentasCobrar.cliente_id], references: [clientes.id] }),
  factura: one(facturasVenta, { fields: [cuentasCobrar.factura_venta_id], references: [facturasVenta.id] }),
  cobros: many(cobroDetalles),
}));

export const cobrosRelations = relations(cobros, ({ one, many }) => ({
  empresa: one(empresas, { fields: [cobros.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [cobros.sucursal_id], references: [sucursales.id] }),
  cliente: one(clientes, { fields: [cobros.cliente_id], references: [clientes.id] }),
  sesionCaja: one(sesionesCaja, { fields: [cobros.sesion_caja_id], references: [sesionesCaja.id] }),
  creadoPor: one(usuarios, { fields: [cobros.creado_por], references: [usuarios.id] }),
  detalles: many(cobroDetalles),
  medios: many(cobroMedios),
}));

export const cobroDetallesRelations = relations(cobroDetalles, ({ one }) => ({
  cobro: one(cobros, { fields: [cobroDetalles.cobro_id], references: [cobros.id] }),
  cuentaCobrar: one(cuentasCobrar, {
    fields: [cobroDetalles.cuenta_cobrar_id],
    references: [cuentasCobrar.id],
  }),
}));

export const cobroMediosRelations = relations(cobroMedios, ({ one }) => ({
  cobro: one(cobros, { fields: [cobroMedios.cobro_id], references: [cobros.id] }),
}));

/* ------------------------------ Inventario ------------------------------ */

export const stockRelations = relations(stock, ({ one }) => ({
  empresa: one(empresas, { fields: [stock.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [stock.sucursal_id], references: [sucursales.id] }),
  deposito: one(depositos, { fields: [stock.deposito_id], references: [depositos.id] }),
  articulo: one(articulos, { fields: [stock.articulo_id], references: [articulos.id] }),
}));

export const kardexRelations = relations(kardex, ({ one }) => ({
  empresa: one(empresas, { fields: [kardex.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [kardex.sucursal_id], references: [sucursales.id] }),
  deposito: one(depositos, { fields: [kardex.deposito_id], references: [depositos.id] }),
  articulo: one(articulos, { fields: [kardex.articulo_id], references: [articulos.id] }),
  usuario: one(usuarios, { fields: [kardex.usuario_id], references: [usuarios.id] }),
}));

export const ajustesStockRelations = relations(ajustesStock, ({ one, many }) => ({
  empresa: one(empresas, { fields: [ajustesStock.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [ajustesStock.sucursal_id], references: [sucursales.id] }),
  deposito: one(depositos, { fields: [ajustesStock.deposito_id], references: [depositos.id] }),
  creadoPor: one(usuarios, { fields: [ajustesStock.creado_por], references: [usuarios.id] }),
  detalles: many(ajusteStockDetalles),
}));

export const ajusteStockDetallesRelations = relations(ajusteStockDetalles, ({ one }) => ({
  ajuste: one(ajustesStock, { fields: [ajusteStockDetalles.ajuste_stock_id], references: [ajustesStock.id] }),
  articulo: one(articulos, { fields: [ajusteStockDetalles.articulo_id], references: [articulos.id] }),
}));

export const transferenciasStockRelations = relations(transferenciasStock, ({ one, many }) => ({
  empresa: one(empresas, { fields: [transferenciasStock.empresa_id], references: [empresas.id] }),
  sucursalOrigen: one(sucursales, { fields: [transferenciasStock.sucursal_id], references: [sucursales.id] }),
  sucursalDestino: one(sucursales, {
    fields: [transferenciasStock.sucursal_destino_id],
    references: [sucursales.id],
  }),
  depositoOrigen: one(depositos, {
    fields: [transferenciasStock.deposito_origen_id],
    references: [depositos.id],
  }),
  depositoDestino: one(depositos, {
    fields: [transferenciasStock.deposito_destino_id],
    references: [depositos.id],
  }),
  creadoPor: one(usuarios, { fields: [transferenciasStock.creado_por], references: [usuarios.id] }),
  detalles: many(transferenciaStockDetalles),
}));

export const transferenciaStockDetallesRelations = relations(transferenciaStockDetalles, ({ one }) => ({
  transferencia: one(transferenciasStock, {
    fields: [transferenciaStockDetalles.transferencia_stock_id],
    references: [transferenciasStock.id],
  }),
  articulo: one(articulos, { fields: [transferenciaStockDetalles.articulo_id], references: [articulos.id] }),
}));

/* ------------------------------ Contabilidad ------------------------------ */

export const planCuentasRelations = relations(planCuentas, ({ one, many }) => ({
  empresa: one(empresas, { fields: [planCuentas.empresa_id], references: [empresas.id] }),
  padre: one(planCuentas, {
    fields: [planCuentas.padre_id],
    references: [planCuentas.id],
    relationName: 'cuenta_padre',
  }),
  hijas: many(planCuentas, { relationName: 'cuenta_padre' }),
  movimientos: many(detallesAsientoContable),
}));

export const configuracionContableRelations = relations(configuracionContable, ({ one }) => ({
  empresa: one(empresas, { fields: [configuracionContable.empresa_id], references: [empresas.id] }),
  cuenta: one(planCuentas, { fields: [configuracionContable.cuenta_id], references: [planCuentas.id] }),
}));

export const asientosContablesRelations = relations(asientosContables, ({ one, many }) => ({
  empresa: one(empresas, { fields: [asientosContables.empresa_id], references: [empresas.id] }),
  sucursal: one(sucursales, { fields: [asientosContables.sucursal_id], references: [sucursales.id] }),
  creadoPor: one(usuarios, { fields: [asientosContables.creado_por], references: [usuarios.id] }),
  asientoRevertido: one(asientosContables, {
    fields: [asientosContables.asiento_revertido_id],
    references: [asientosContables.id],
    relationName: 'asiento_reversion',
  }),
  detalles: many(detallesAsientoContable),
}));

export const detallesAsientoContableRelations = relations(detallesAsientoContable, ({ one }) => ({
  asiento: one(asientosContables, {
    fields: [detallesAsientoContable.asiento_id],
    references: [asientosContables.id],
  }),
  cuenta: one(planCuentas, { fields: [detallesAsientoContable.cuenta_id], references: [planCuentas.id] }),
}));
