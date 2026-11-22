import { z } from 'zod';
import { estadoRegistro, fecha, id, idNulo, montoGs, requerido, textoOpt } from './comunes';

export const cuentaInput = z.object({
  id: id.nullish(),
  codigo: z.string().trim().regex(/^\d+(\.\d+)*$/, 'Código con formato 1.1.01'),
  nombre: requerido(150),
  padreId: idNulo,
  tipo: z.enum(['activo', 'pasivo', 'patrimonio', 'ingreso', 'costo', 'gasto']),
  imputable: z.boolean(),
  estado: estadoRegistro.nullish(),
});
export type CuentaInput = z.infer<typeof cuentaInput>;

export const operacionContable = z.enum([
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

export const configuracionContableInput = z.object({
  id: id.nullish(),
  operacion: operacionContable,
  concepto: z.string().trim().regex(/^[a-z0-9_]{1,40}$/, 'Concepto en snake_case'),
  lado: z.enum(['debe', 'haber']),
  cuentaId: id,
  descripcion: textoOpt(255),
});
export type ConfiguracionContableInput = z.infer<typeof configuracionContableInput>;

export const lineaAsientoInput = z
  .object({ cuentaId: id, debeGs: montoGs, haberGs: montoGs, glosa: textoOpt(255) })
  .refine((l) => (l.debeGs > 0) !== (l.haberGs > 0), { message: 'Cada línea va al Debe o al Haber', path: ['debeGs'] });

export const asientoManualInput = z
  .object({
    id: id.nullish(),
    fecha,
    concepto: requerido(255),
    lineas: z.array(lineaAsientoInput).min(2, 'Mínimo dos líneas'),
    /** false = guardar como borrador. */
    confirmar: z.boolean().nullish(),
  })
  .refine(
    (a) => a.lineas.reduce((s, l) => s + l.debeGs, 0) === a.lineas.reduce((s, l) => s + l.haberGs, 0),
    { message: 'El asiento no cuadra: Debe ≠ Haber', path: ['lineas'] },
  );
export type AsientoManualInput = z.infer<typeof asientoManualInput>;

export const filtroAsientos = z
  .object({
    desde: fecha.nullish(),
    hasta: fecha.nullish(),
    origenTipo: z.string().max(30).nullish(),
    estado: z.string().max(30).nullish(),
    q: z.string().max(100).nullish(),
    limite: z.number().int().positive().max(1000).nullish(),
  })
  .nullish();
export type FiltroAsientos = z.infer<typeof filtroAsientos>;
