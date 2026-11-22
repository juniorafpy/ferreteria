import { z } from 'zod';
import { id, idNulo, medioPago, montoGs, montoPositivo, textoOpt } from './comunes';

export const abrirCajaInput = z.object({ cajaId: id, montoAperturaGs: montoGs });
export type AbrirCajaInput = z.infer<typeof abrirCajaInput>;

export const cerrarCajaInput = z.object({
  sesionCajaId: id,
  /** Montos declarados por medio de pago (los medios omitidos se toman como 0). */
  arqueo: z.array(z.object({ medioPago, montoDeclaradoGs: montoGs, observacion: textoOpt(255) })),
  observacion: textoOpt(2000),
});
export type CerrarCajaInput = z.infer<typeof cerrarCajaInput>;

export const medioCobroInput = z
  .object({
    medioPago,
    montoGs: montoPositivo,
    referencia: textoOpt(100),
    banco: textoOpt(100),
    tipoTarjeta: z.enum(['credito', 'debito']).nullish(),
    marcaTarjeta: textoOpt(40),
    ultimosDigitos: z.string().regex(/^\d{4}$/).nullish(),
  })
  .refine((m) => m.medioPago !== 'tarjeta' || !!m.tipoTarjeta, {
    message: 'Indique crédito o débito',
    path: ['tipoTarjeta'],
  })
  .refine((m) => m.medioPago === 'efectivo' || !!m.referencia, {
    message: 'Indique la referencia / autorización',
    path: ['referencia'],
  });

export const cobroInput = z
  .object({
    clienteId: idNulo,
    cuentas: z.array(z.object({ cuentaCobrarId: id, montoGs: montoPositivo })).min(1, 'Seleccione cuentas'),
    medios: z.array(medioCobroInput).min(1, 'Agregue un medio de pago'),
    observacion: textoOpt(2000),
  })
  .refine(
    (c) => c.medios.reduce((a, m) => a + m.montoGs, 0) >= c.cuentas.reduce((a, x) => a + x.montoGs, 0),
    { message: 'Los medios de pago no cubren el total', path: ['medios'] },
  );
export type CobroInput = z.infer<typeof cobroInput>;

export const filtroCuentasCobrar = z
  .object({
    clienteId: id.nullish(),
    soloPendientes: z.boolean().nullish(),
    vencidas: z.boolean().nullish(),
    q: z.string().trim().max(100).nullish(),
    limite: z.number().int().positive().max(1000).nullish(),
  })
  .nullish();
export type FiltroCuentasCobrar = z.infer<typeof filtroCuentasCobrar>;
