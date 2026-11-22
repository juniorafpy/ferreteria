import { eq } from 'drizzle-orm';
import type { DbLike } from '../index';
import { configuracionContable, planCuentas } from '../schema';

type Tipo = 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'costo' | 'gasto';

/** Plan de cuentas base para ferretería (Paraguay). Imputables = último nivel (xx.xx.xx). */
export const PLAN_CUENTAS: { codigo: string; nombre: string; tipo: Tipo }[] = [
  { codigo: '1', nombre: 'ACTIVO', tipo: 'activo' },
  { codigo: '1.1', nombre: 'Activo corriente', tipo: 'activo' },
  { codigo: '1.1.01', nombre: 'Caja', tipo: 'activo' },
  { codigo: '1.1.02', nombre: 'Bancos', tipo: 'activo' },
  { codigo: '1.1.03', nombre: 'Deudores por ventas', tipo: 'activo' },
  { codigo: '1.1.04', nombre: 'IVA crédito fiscal', tipo: 'activo' },
  { codigo: '1.1.05', nombre: 'Mercaderías', tipo: 'activo' },
  { codigo: '1.1.06', nombre: 'Mercaderías en tránsito / a recibir', tipo: 'activo' },
  { codigo: '1.1.07', nombre: 'Tarjetas y billeteras a cobrar', tipo: 'activo' },
  { codigo: '1.2', nombre: 'Activo no corriente', tipo: 'activo' },
  { codigo: '1.2.01', nombre: 'Muebles, útiles e instalaciones', tipo: 'activo' },
  { codigo: '1.2.02', nombre: 'Rodados', tipo: 'activo' },
  { codigo: '2', nombre: 'PASIVO', tipo: 'pasivo' },
  { codigo: '2.1', nombre: 'Pasivo corriente', tipo: 'pasivo' },
  { codigo: '2.1.01', nombre: 'Proveedores', tipo: 'pasivo' },
  { codigo: '2.1.02', nombre: 'IVA débito fiscal', tipo: 'pasivo' },
  { codigo: '2.1.03', nombre: 'Sueldos y cargas sociales a pagar', tipo: 'pasivo' },
  { codigo: '3', nombre: 'PATRIMONIO NETO', tipo: 'patrimonio' },
  { codigo: '3.1', nombre: 'Capital', tipo: 'patrimonio' },
  { codigo: '3.1.01', nombre: 'Capital social', tipo: 'patrimonio' },
  { codigo: '3.2', nombre: 'Resultados', tipo: 'patrimonio' },
  { codigo: '3.2.01', nombre: 'Resultados acumulados', tipo: 'patrimonio' },
  { codigo: '3.2.02', nombre: 'Resultado del ejercicio', tipo: 'patrimonio' },
  { codigo: '4', nombre: 'INGRESOS', tipo: 'ingreso' },
  { codigo: '4.1', nombre: 'Ventas', tipo: 'ingreso' },
  { codigo: '4.1.01', nombre: 'Ventas gravadas 10%', tipo: 'ingreso' },
  { codigo: '4.1.02', nombre: 'Ventas gravadas 5%', tipo: 'ingreso' },
  { codigo: '4.1.03', nombre: 'Ventas exentas', tipo: 'ingreso' },
  { codigo: '4.2', nombre: 'Otros ingresos', tipo: 'ingreso' },
  { codigo: '4.2.01', nombre: 'Sobrantes de inventario', tipo: 'ingreso' },
  { codigo: '4.2.02', nombre: 'Sobrantes de caja', tipo: 'ingreso' },
  { codigo: '5', nombre: 'COSTOS', tipo: 'costo' },
  { codigo: '5.1', nombre: 'Costo de ventas', tipo: 'costo' },
  { codigo: '5.1.01', nombre: 'Costo de mercaderías vendidas', tipo: 'costo' },
  { codigo: '6', nombre: 'GASTOS', tipo: 'gasto' },
  { codigo: '6.1', nombre: 'Gastos operativos', tipo: 'gasto' },
  { codigo: '6.1.01', nombre: 'Mermas y pérdidas de inventario', tipo: 'gasto' },
  { codigo: '6.1.02', nombre: 'Sueldos y jornales', tipo: 'gasto' },
  { codigo: '6.1.03', nombre: 'Alquileres', tipo: 'gasto' },
  { codigo: '6.1.04', nombre: 'Servicios básicos (ANDE, ESSAP, telefonía)', tipo: 'gasto' },
  { codigo: '6.1.05', nombre: 'Comisiones bancarias y de tarjetas', tipo: 'gasto' },
  { codigo: '6.1.06', nombre: 'Faltantes de caja', tipo: 'gasto' },
];

type Lado = 'debe' | 'haber';
type Operacion =
  | 'compra'
  | 'recepcion'
  | 'venta'
  | 'costo_venta'
  | 'cobro'
  | 'pago'
  | 'ajuste_merma'
  | 'ajuste_sobrante'
  | 'transferencia'
  | 'diferencia_caja';

/**
 * Mapeo operación/concepto -> cuenta. CONTRATO con el backend (generador de asientos):
 *  compra:          mercaderias_transito (D, neto sin IVA), iva_credito (D), proveedores (H, total)
 *  recepcion:       mercaderias (D), mercaderias_transito (H)    [a costo]
 *  venta:           deudores (D, total), ventas_10/ventas_5/ventas_exentas (H, neto), iva_debito (H)
 *  costo_venta:     cmv (D), mercaderias (H)                    [a costo promedio]
 *  cobro:           efectivo/transferencia/tarjeta/qr (D), deudores (H)
 *  pago:            proveedores (D), efectivo/transferencia (H)
 *  ajuste_merma:    mermas (D), mercaderias (H)
 *  ajuste_sobrante: mercaderias (D), sobrantes (H)
 *  transferencia:   mercaderias_destino (D), mercaderias_origen (H)  [misma cuenta, traza por sucursal]
 *  diferencia_caja: faltante (D) / sobrante (H), contra efectivo
 */
export const CONFIG_CONTABLE: { operacion: Operacion; concepto: string; lado: Lado; cuenta: string; descripcion: string }[] = [
  { operacion: 'compra', concepto: 'mercaderias_transito', lado: 'debe', cuenta: '1.1.06', descripcion: 'Neto de la compra' },
  { operacion: 'compra', concepto: 'iva_credito', lado: 'debe', cuenta: '1.1.04', descripcion: 'IVA 10% y 5% de la compra' },
  { operacion: 'compra', concepto: 'proveedores', lado: 'haber', cuenta: '2.1.01', descripcion: 'Total factura de compra' },
  { operacion: 'recepcion', concepto: 'mercaderias', lado: 'debe', cuenta: '1.1.05', descripcion: 'Ingreso a depósito' },
  { operacion: 'recepcion', concepto: 'mercaderias_transito', lado: 'haber', cuenta: '1.1.06', descripcion: 'Baja de mercadería a recibir' },
  { operacion: 'venta', concepto: 'deudores', lado: 'debe', cuenta: '1.1.03', descripcion: 'Total factura de venta' },
  { operacion: 'venta', concepto: 'ventas_10', lado: 'haber', cuenta: '4.1.01', descripcion: 'Neto gravado 10%' },
  { operacion: 'venta', concepto: 'ventas_5', lado: 'haber', cuenta: '4.1.02', descripcion: 'Neto gravado 5%' },
  { operacion: 'venta', concepto: 'ventas_exentas', lado: 'haber', cuenta: '4.1.03', descripcion: 'Ventas exentas' },
  { operacion: 'venta', concepto: 'iva_debito', lado: 'haber', cuenta: '2.1.02', descripcion: 'IVA débito 10% y 5%' },
  { operacion: 'costo_venta', concepto: 'cmv', lado: 'debe', cuenta: '5.1.01', descripcion: 'Costo de lo vendido' },
  { operacion: 'costo_venta', concepto: 'mercaderias', lado: 'haber', cuenta: '1.1.05', descripcion: 'Salida de mercadería' },
  { operacion: 'cobro', concepto: 'efectivo', lado: 'debe', cuenta: '1.1.01', descripcion: 'Cobro en efectivo' },
  { operacion: 'cobro', concepto: 'transferencia', lado: 'debe', cuenta: '1.1.02', descripcion: 'Cobro por transferencia' },
  { operacion: 'cobro', concepto: 'tarjeta', lado: 'debe', cuenta: '1.1.07', descripcion: 'Cobro con tarjeta' },
  { operacion: 'cobro', concepto: 'qr', lado: 'debe', cuenta: '1.1.07', descripcion: 'Cobro con QR / billetera' },
  { operacion: 'cobro', concepto: 'deudores', lado: 'haber', cuenta: '1.1.03', descripcion: 'Cancelación de deudores' },
  { operacion: 'pago', concepto: 'proveedores', lado: 'debe', cuenta: '2.1.01', descripcion: 'Cancelación de proveedores' },
  { operacion: 'pago', concepto: 'efectivo', lado: 'haber', cuenta: '1.1.01', descripcion: 'Pago en efectivo' },
  { operacion: 'pago', concepto: 'transferencia', lado: 'haber', cuenta: '1.1.02', descripcion: 'Pago por transferencia' },
  { operacion: 'ajuste_merma', concepto: 'mermas', lado: 'debe', cuenta: '6.1.01', descripcion: 'Pérdida por merma' },
  { operacion: 'ajuste_merma', concepto: 'mercaderias', lado: 'haber', cuenta: '1.1.05', descripcion: 'Baja de mercadería' },
  { operacion: 'ajuste_sobrante', concepto: 'mercaderias', lado: 'debe', cuenta: '1.1.05', descripcion: 'Alta de mercadería' },
  { operacion: 'ajuste_sobrante', concepto: 'sobrantes', lado: 'haber', cuenta: '4.2.01', descripcion: 'Sobrante de inventario' },
  { operacion: 'transferencia', concepto: 'mercaderias_destino', lado: 'debe', cuenta: '1.1.05', descripcion: 'Ingreso en sucursal destino' },
  { operacion: 'transferencia', concepto: 'mercaderias_origen', lado: 'haber', cuenta: '1.1.05', descripcion: 'Salida de sucursal origen' },
  { operacion: 'diferencia_caja', concepto: 'faltante', lado: 'debe', cuenta: '6.1.06', descripcion: 'Faltante en arqueo' },
  { operacion: 'diferencia_caja', concepto: 'sobrante', lado: 'haber', cuenta: '4.2.02', descripcion: 'Sobrante en arqueo' },
  { operacion: 'diferencia_caja', concepto: 'efectivo', lado: 'haber', cuenta: '1.1.01', descripcion: 'Contrapartida en caja (lado según signo)' },
];

const nivelDe = (codigo: string) => codigo.split('.').length;
const padreDe = (codigo: string) => (codigo.includes('.') ? codigo.slice(0, codigo.lastIndexOf('.')) : null);

export async function seedContabilidad(db: DbLike, empresaId: number) {
  const todos = new Set(PLAN_CUENTAS.map((c) => c.codigo));
  const esPadre = new Set(PLAN_CUENTAS.map((c) => padreDe(c.codigo)).filter((p): p is string => !!p));

  // Insertar por nivel para poder resolver padre_id
  const maxNivel = Math.max(...PLAN_CUENTAS.map((c) => nivelDe(c.codigo)));
  for (let nivel = 1; nivel <= maxNivel; nivel++) {
    const existentes = await db
      .select({ id: planCuentas.id, codigo: planCuentas.codigo })
      .from(planCuentas)
      .where(eq(planCuentas.empresa_id, empresaId));
    const idPorCodigo = new Map(existentes.map((c) => [c.codigo, c.id]));
    const filas = PLAN_CUENTAS.filter((c) => nivelDe(c.codigo) === nivel).map((c) => {
      const padre = padreDe(c.codigo);
      if (padre && !todos.has(padre)) throw new Error(`Cuenta ${c.codigo} sin padre ${padre}`);
      return {
        empresa_id: empresaId,
        codigo: c.codigo,
        nombre: c.nombre,
        tipo: c.tipo,
        nivel,
        padre_id: padre ? idPorCodigo.get(padre)! : null,
        imputable: !esPadre.has(c.codigo),
      };
    });
    if (filas.length) await db.insert(planCuentas).values(filas).onConflictDoNothing();
  }

  const cuentas = await db
    .select({ id: planCuentas.id, codigo: planCuentas.codigo })
    .from(planCuentas)
    .where(eq(planCuentas.empresa_id, empresaId));
  const idPorCodigo = new Map(cuentas.map((c) => [c.codigo, c.id]));

  await db
    .insert(configuracionContable)
    .values(
      CONFIG_CONTABLE.map((c) => {
        const cuentaId = idPorCodigo.get(c.cuenta);
        if (!cuentaId) throw new Error(`Cuenta ${c.cuenta} no existe para ${c.operacion}.${c.concepto}`);
        return {
          empresa_id: empresaId,
          operacion: c.operacion,
          concepto: c.concepto,
          lado: c.lado,
          cuenta_id: cuentaId,
          descripcion: c.descripcion,
        };
      }),
    )
    .onConflictDoNothing();
}
