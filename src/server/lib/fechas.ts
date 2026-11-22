/** Utilidades de fecha (zona America/Asuncion). Puras. */

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Asuncion',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Fecha local Paraguay YYYY-MM-DD. */
export function hoyPy(base: Date = new Date()): string {
  return fmt.format(base);
}

/** Suma días a una fecha YYYY-MM-DD (aritmética de calendario, sin zona). */
export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

/** YYYY-MM-DD -> YYYYMMDD */
export const compactarFecha = (fecha: string) => fecha.replaceAll('-', '');
