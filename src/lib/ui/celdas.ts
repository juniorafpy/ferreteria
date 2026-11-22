/* Definición y formateo de celdas de tabla (módulo compartido servidor/cliente). */
import { leer, texto, type Fila } from './datos';
import {
  etiquetaEstado,
  formatoCantidad,
  formatoFecha,
  formatoFechaHora,
  formatoGs,
  formatoNumeroFactura,
  formatoPct,
} from './formato';

export type TipoColumna =
  | 'texto'
  | 'gs'
  | 'numero'
  | 'cantidad'
  | 'pct'
  | 'fecha'
  | 'fechaHora'
  | 'estado'
  | 'estadoSifen'
  | 'bool'
  | 'factura'
  | 'mono';

/** Definición serializable de columna (se puede pasar desde Server Components). */
export type ColumnaDef = {
  clave: string;
  titulo: string;
  tipo?: TipoColumna;
  /** Rutas alternativas a probar si `clave` está vacía. */
  alternativas?: string[];
  /** Para tipo `factura`: prefijo de claves establecimiento/punto/numero (por defecto sin prefijo). */
  ancho?: string;
  /** Sumar en el pie (por defecto true para `gs`). */
  sumar?: boolean;
};

export function valorCelda(fila: Fila, c: ColumnaDef): unknown {
  if (c.tipo === 'factura') {
    const ya = leer(fila, 'numero_factura') ?? leer(fila, 'numero_formateado');
    if (ya) return ya;
    return formatoNumeroFactura(leer(fila, 'establecimiento'), leer(fila, 'punto_expedicion'), leer(fila, c.clave));
  }
  let v = leer(fila, c.clave);
  if ((v === undefined || v === null || v === '') && c.alternativas) {
    for (const a of c.alternativas) {
      v = leer(fila, a);
      if (v !== undefined && v !== null && v !== '') break;
    }
  }
  return v;
}

export function formatearCelda(v: unknown, tipo: TipoColumna = 'texto'): string {
  switch (tipo) {
    case 'gs':
      return formatoGs(v);
    case 'numero':
    case 'cantidad':
      return formatoCantidad(v);
    case 'pct':
      return formatoPct(v);
    case 'fecha':
      return formatoFecha(v);
    case 'fechaHora':
      return formatoFechaHora(v);
    case 'estado':
    case 'estadoSifen':
      return etiquetaEstado(v);
    case 'bool':
      return v === true || v === 'true' ? 'Sí' : v === false || v === 'false' ? 'No' : '';
    default:
      return texto(v);
  }
}

export const esNumerica = (t?: TipoColumna) => t === 'gs' || t === 'numero' || t === 'cantidad' || t === 'pct';

