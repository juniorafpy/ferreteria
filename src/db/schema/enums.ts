import { pgEnum } from 'drizzle-orm/pg-core';

/* ---------------------------------------------------------------------------
 * Enums del ERP ferretero. Los valores son el contrato con backend/frontend:
 * usar SIEMPRE estos literales (snake_case, sin acentos).
 * ------------------------------------------------------------------------- */

// Estado de registro maestro
export const estadoRegistroEnum = pgEnum('estado_registro', ['activo', 'inactivo']);

// Estado genérico de documento (ajustes, recepciones, cobros, órdenes de pago, asientos, facturas venta)
export const estadoDocumentoEnum = pgEnum('estado_documento', ['borrador', 'confirmado', 'anulado']);

// Estados propios por documento (con avance parcial)
export const estadoPresupuestoEnum = pgEnum('estado_presupuesto', [
  'borrador',
  'confirmado',
  'facturado_parcial',
  'facturado',
  'vencido',
  'anulado',
]);
export const estadoPedidoCompraEnum = pgEnum('estado_pedido_compra', [
  'borrador',
  'confirmado',
  'ordenado_parcial',
  'ordenado',
  'anulado',
]);
export const estadoOrdenCompraEnum = pgEnum('estado_orden_compra', [
  'borrador',
  'confirmado',
  'facturado_parcial',
  'facturado',
  'anulado',
]);
export const estadoFacturaCompraEnum = pgEnum('estado_factura_compra', [
  'borrador',
  'confirmado',
  'recibido_parcial',
  'recibido',
  'anulado',
]);
export const estadoTransferenciaEnum = pgEnum('estado_transferencia', [
  'borrador',
  'enviado',
  'recibido',
  'anulado',
]);
export const estadoCuentaEnum = pgEnum('estado_cuenta', ['pendiente', 'parcial', 'pagado', 'anulado']);
export const estadoSesionCajaEnum = pgEnum('estado_sesion_caja', ['abierta', 'cerrada']);

// Descuentos
export const tipoDescuentoEnum = pgEnum('tipo_descuento', ['porcentaje', 'monto']);
export const origenDescuentoEnum = pgEnum('origen_descuento', ['automatico', 'manual', 'ninguno']);

// Impuestos / operación
export const tipoIvaEnum = pgEnum('tipo_iva', ['iva10', 'iva5', 'exenta']);
export const condicionOperacionEnum = pgEnum('condicion_operacion', ['contado', 'credito']);

// SIFEN
export const ambienteSifenEnum = pgEnum('ambiente_sifen', ['test', 'produccion']);
export const modalidadFacturacionEnum = pgEnum('modalidad_facturacion', [
  'electronica',
  'autoimpresor',
  'preimpreso',
]);
export const tipoDocumentoElectronicoEnum = pgEnum('tipo_documento_electronico', [
  'factura',
  'autofactura',
  'nota_credito',
  'nota_debito',
  'nota_remision',
]);
export const tipoEmisionEnum = pgEnum('tipo_emision', ['normal', 'contingencia']);
export const tipoTransaccionEnum = pgEnum('tipo_transaccion', [
  'venta_mercaderia',
  'prestacion_servicios',
  'mixto',
  'venta_activo_fijo',
  'anticipo',
  'otros',
]);
export const estadoSifenEnum = pgEnum('estado_sifen', [
  'no_aplica',
  'pendiente',
  'enviado',
  'aprobado',
  'aprobado_con_observacion',
  'rechazado',
  'cancelado',
  'inutilizado',
]);
export const tipoEventoSifenEnum = pgEnum('tipo_evento_sifen', [
  'generacion',
  'envio',
  'consulta',
  'respuesta',
  'cancelacion',
  'inutilizacion',
  'conformidad',
  'disconformidad',
  'desconocimiento',
  'notificacion',
  'error',
]);

// Caja
export const medioPagoEnum = pgEnum('medio_pago', ['efectivo', 'transferencia', 'tarjeta', 'qr']);
export const tipoTarjetaEnum = pgEnum('tipo_tarjeta', ['credito', 'debito']);

// Inventario
export const tipoAjusteEnum = pgEnum('tipo_ajuste', ['merma', 'sobrante']);
export const tipoMovimientoKardexEnum = pgEnum('tipo_movimiento_kardex', [
  'inicial',
  'entrada_compra',
  'salida_venta',
  'ajuste_entrada',
  'ajuste_salida',
  'transferencia_salida',
  'transferencia_entrada',
  'anulacion_venta',
  'anulacion_compra',
  'anulacion_ajuste',
  'anulacion_transferencia',
]);

// Documento origen (kardex, asientos)
export const origenDocumentoEnum = pgEnum('origen_documento', [
  'inicial',
  'factura_compra',
  'recepcion',
  'factura_venta',
  'cobro',
  'orden_pago',
  'ajuste_stock',
  'transferencia_stock',
  'sesion_caja',
  'manual',
]);

// Contabilidad
export const tipoCuentaContableEnum = pgEnum('tipo_cuenta_contable', [
  'activo',
  'pasivo',
  'patrimonio',
  'ingreso',
  'costo',
  'gasto',
]);
export const ladoAsientoEnum = pgEnum('lado_asiento', ['debe', 'haber']);
export const operacionContableEnum = pgEnum('operacion_contable', [
  'compra',
  'recepcion',
  'venta',
  'costo_venta',
  'cobro',
  'pago',
  'ajuste_merma',
  'ajuste_sobrante',
  'transferencia',
  'diferencia_caja',
]);
