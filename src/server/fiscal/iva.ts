/**
 * Cálculos de IVA (Paraguay, precios con IVA incluido, Guaraníes enteros).
 * Funciones PURAS: seguras para Client Components.
 */
export type TipoIva = 'iva10' | 'iva5' | 'exenta';

/** IVA contenido en un monto con IVA incluido. */
export function ivaIncluido(totalGs: number, tipoIva: TipoIva): number {
  if (tipoIva === 'iva10') return Math.round(totalGs / 11);
  if (tipoIva === 'iva5') return Math.round(totalGs / 21);
  return 0;
}

/** Monto neto (sin IVA) de un monto con IVA incluido. */
export const netoSinIva = (totalGs: number, tipoIva: TipoIva) => totalGs - ivaIncluido(totalGs, tipoIva);

export type EntradaLinea = {
  cantidad: number;
  precioUnitarioGs: number;
  descuentoGs?: number;
  tipoIva: TipoIva;
};

export type ResultadoLinea = { brutoGs: number; totalLineaGs: number; ivaGs: number };

/** total = round(cantidad * precio) - descuento; IVA por línea (/11, /21). */
export function calcularLinea({ cantidad, precioUnitarioGs, descuentoGs = 0, tipoIva }: EntradaLinea): ResultadoLinea {
  const brutoGs = Math.round(cantidad * precioUnitarioGs);
  const totalLineaGs = brutoGs - Math.round(descuentoGs);
  if (totalLineaGs < 0) throw new Error('El descuento no puede superar el importe de la línea');
  return { brutoGs, totalLineaGs, ivaGs: ivaIncluido(totalLineaGs, tipoIva) };
}

export type LineaTotalizable = {
  totalLineaGs: number;
  ivaGs: number;
  tipoIva: TipoIva;
  descuentoGs?: number;
};

export type Totales = {
  gravada10Gs: number;
  gravada5Gs: number;
  exentaGs: number;
  iva10Gs: number;
  iva5Gs: number;
  totalIvaGs: number;
  totalDescuentoGs: number;
  totalGs: number;
};

/** Totales del documento = SUMA de las líneas (nunca se recalcula el IVA sobre la cabecera). */
export function calcularTotales(lineas: readonly LineaTotalizable[]): Totales {
  const t: Totales = {
    gravada10Gs: 0,
    gravada5Gs: 0,
    exentaGs: 0,
    iva10Gs: 0,
    iva5Gs: 0,
    totalIvaGs: 0,
    totalDescuentoGs: 0,
    totalGs: 0,
  };
  for (const l of lineas) {
    if (l.tipoIva === 'iva10') {
      t.gravada10Gs += l.totalLineaGs;
      t.iva10Gs += l.ivaGs;
    } else if (l.tipoIva === 'iva5') {
      t.gravada5Gs += l.totalLineaGs;
      t.iva5Gs += l.ivaGs;
    } else {
      t.exentaGs += l.totalLineaGs;
    }
    t.totalDescuentoGs += l.descuentoGs ?? 0;
  }
  t.totalIvaGs = t.iva10Gs + t.iva5Gs;
  t.totalGs = t.gravada10Gs + t.gravada5Gs + t.exentaGs;
  return t;
}

/** Mapea Totales a las columnas de cabecera (snake_case del esquema). */
export function totalesAColumnas(t: Totales) {
  return {
    gravada_10_gs: t.gravada10Gs,
    gravada_5_gs: t.gravada5Gs,
    exenta_gs: t.exentaGs,
    iva_10_gs: t.iva10Gs,
    iva_5_gs: t.iva5Gs,
    total_iva_gs: t.totalIvaGs,
    total_descuento_gs: t.totalDescuentoGs,
    total_gs: t.totalGs,
  };
}
