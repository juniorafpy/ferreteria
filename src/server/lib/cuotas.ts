import { sumarDias } from './fechas';

/** Divide un total en cuotas enteras (la última absorbe el redondeo). Pura. */
export function generarCuotas(
  totalGs: number,
  cantidad: number,
  fechaBase: string,
  diasPlazo: number,
  diasEntreCuotas: number,
): { numero: number; fechaVencimiento: string; montoGs: number }[] {
  const n = Math.max(1, Math.trunc(cantidad));
  const base = Math.floor(totalGs / n);
  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    fechaVencimiento: sumarDias(fechaBase, diasPlazo + i * diasEntreCuotas),
    montoGs: i === n - 1 ? totalGs - base * (n - 1) : base,
  }));
}

export const estadoCuenta = (monto: number, saldo: number): 'pendiente' | 'parcial' | 'pagado' =>
  saldo <= 0 ? 'pagado' : saldo < monto ? 'parcial' : 'pendiente';
