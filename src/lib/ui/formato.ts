/* Formateadores de presentación (sin dependencias, seguros en cliente y servidor). */

const fmtDecimalBase = (n: number) => {
  const [ent, dec] = n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '').split('.');
  return dec ? `${agruparManual(Number(ent))},${dec}` : agruparManual(Number(ent));
};
const fmtDecimal = { format: fmtDecimalBase };

function aNumero(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Separador de miles con punto (es-PY), sin decimales: 150000 -> "150.000". */
export function formatoMiles(v: unknown): string {
  const n = aNumero(v);
  if (n === null) return '';
  // Agrupado manual: determinista entre servidor y navegador (evita diferencias ICU e hidratación).
  return agruparManual(Math.round(n));
}

function agruparManual(n: number): string {
  const neg = n < 0;
  const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return neg ? `-${s}` : s;
}

/** Monto en Guaraníes: 150000 -> "Gs. 150.000". */
export function formatoGs(v: unknown, conPrefijo = true): string {
  const n = aNumero(v);
  if (n === null) return '';
  const s = formatoMiles(n);
  return conPrefijo ? `Gs. ${s}` : s;
}

/** Cantidad con hasta 3 decimales y coma decimal. */
export function formatoCantidad(v: unknown): string {
  const n = aNumero(v);
  if (n === null) return '';
  if (Number.isInteger(n)) return formatoMiles(n);
  return fmtDecimal.format(n);
}

/** Porcentaje: 12.5 -> "12,5 %". */
export function formatoPct(v: unknown): string {
  const n = aNumero(v);
  if (n === null) return '';
  return `${fmtDecimal.format(n)} %`;
}

/** Fecha dd/mm/aaaa desde 'YYYY-MM-DD', ISO o Date. */
export function formatoFecha(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Fecha y hora dd/mm/aaaa hh:mm. */
export function formatoFechaHora(v: unknown): string {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${formatoFecha(d)} ${hh}:${mi}`;
}

/** Número de factura 001-001-0000001. */
export function formatoNumeroFactura(est: unknown, pto: unknown, nro: unknown): string {
  if (nro === null || nro === undefined || nro === '') return '';
  const e = String(est ?? '').padStart(3, '0');
  const p = String(pto ?? '').padStart(3, '0');
  return `${e}-${p}-${String(nro).padStart(7, '0')}`;
}

/** CDC agrupado de a 4 dígitos para lectura. */
export function formatoCdc(cdc: unknown): string {
  if (!cdc) return '';
  return String(cdc).replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Hoy en formato YYYY-MM-DD (hora local). */
export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Primer día del mes actual YYYY-MM-DD. */
export function inicioMesISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Convierte texto a entero de Gs. (descarta todo lo que no sea dígito o signo). */
export function parseEntero(s: string): number {
  const neg = s.trim().startsWith('-');
  const dig = s.replace(/\D/g, '');
  if (!dig) return 0;
  const n = parseInt(dig, 10);
  return neg ? -n : n;
}

/** Convierte texto con coma o punto decimal a número. */
export function parseDecimal(s: string): number {
  const limpio = s.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(limpio);
  return Number.isFinite(n) ? n : 0;
}

export const ETIQUETAS_ESTADO: Record<string, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  borrador: 'Borrador',
  confirmado: 'Confirmado',
  anulado: 'Anulado',
  facturado_parcial: 'Facturado parcial',
  facturado: 'Facturado',
  vencido: 'Vencido',
  ordenado_parcial: 'Ordenado parcial',
  ordenado: 'Ordenado',
  recibido_parcial: 'Recibido parcial',
  recibido: 'Recibido',
  enviado: 'Enviado',
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
  abierta: 'Abierta',
  cerrada: 'Cerrada',
  no_aplica: 'No aplica',
  aprobado: 'Aprobado',
  aprobado_con_observacion: 'Aprobado c/obs.',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  inutilizado: 'Inutilizado',
  automatico: 'Automático',
  manual: 'Manual',
  ninguno: 'Ninguno',
};

export function etiquetaEstado(v: unknown): string {
  const s = String(v ?? '');
  return ETIQUETAS_ESTADO[s] ?? s.replace(/_/g, ' ');
}
