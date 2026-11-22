import { z } from 'zod';
import { fecha, id } from './comunes';

export const filtroReporte = z
  .object({
    desde: fecha,
    hasta: fecha,
    /** Omitido = sucursal de la sesión. 0 = todas las sucursales de la empresa. */
    sucursalId: z.number().int().nonnegative().nullish(),
    proveedorId: id.nullish(),
    clienteId: id.nullish(),
    articuloId: id.nullish(),
    depositoId: id.nullish(),
    cuentaId: id.nullish(),
  })
  .refine((f) => f.hasta >= f.desde, { message: 'Rango de fechas inválido', path: ['hasta'] });
export type FiltroReporte = z.infer<typeof filtroReporte>;

export type ColumnaReporte = {
  key: string;
  label: string;
  tipo: 'texto' | 'fecha' | 'monto' | 'cantidad' | 'numero';
};

export type Reporte<F extends Record<string, unknown> = Record<string, unknown>> = {
  titulo: string;
  columnas: ColumnaReporte[];
  filas: F[];
  totales: Record<string, number>;
  /** Datos adicionales (p. ej. saldo inicial del libro mayor). */
  extra?: Record<string, unknown>;
};
