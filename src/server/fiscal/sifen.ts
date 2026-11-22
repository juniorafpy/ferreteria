/**
 * Utilidades SIFEN puras (sin BD ni node:crypto): seguras para Client Components.
 */
import { calcularDvModulo11 } from './ruc';

export const pad = (v: number | string, largo: number) => String(v).padStart(largo, '0');

/** 001-001-0000001 */
export function formatearNumeroFactura(est: string | number, pto: string | number, nro: number | string): string {
  return `${pad(est, 3)}-${pad(pto, 3)}-${pad(nro, 7)}`;
}

export const REGEX_NUMERO_FACTURA = /^(\d{3})-(\d{3})-(\d{7})$/;

export function parsearNumeroFactura(
  numero: string,
): { establecimiento: string; puntoExpedicion: string; numero: number } | null {
  const m = REGEX_NUMERO_FACTURA.exec(numero.trim());
  if (!m) return null;
  const n = Number(m[3]);
  if (n < 1) return null;
  return { establecimiento: m[1], puntoExpedicion: m[2], numero: n };
}

/** iTiDE SIFEN por tipo de documento electrónico. */
export const CODIGO_TIPO_DE = {
  factura: '01',
  autofactura: '04',
  nota_credito: '05',
  nota_debito: '06',
  nota_remision: '07',
} as const;

export type DatosCdc = {
  tipoDocumento: keyof typeof CODIGO_TIPO_DE;
  rucEmisor: string;
  dvEmisor: string | number;
  establecimiento: string;
  puntoExpedicion: string;
  numero: number;
  /** 1 = persona física, 2 = persona jurídica. */
  tipoContribuyente: 1 | 2;
  /** YYYY-MM-DD */
  fechaEmision: string;
  /** 1 = normal, 2 = contingencia. */
  tipoEmision: 1 | 2;
  /** 9 dígitos. */
  codigoSeguridad: string;
};

/**
 * CDC de 44 dígitos: iTiDE(2) + RUC(8) + DV(1) + est(3) + pto(3) + nro(7) +
 * tipoContribuyente(1) + fecha AAAAMMDD(8) + tipoEmision(1) + codSeguridad(9) + DV módulo 11 (1).
 */
export function generarCdc(d: DatosCdc): string {
  const base =
    CODIGO_TIPO_DE[d.tipoDocumento] +
    pad(d.rucEmisor, 8) +
    String(d.dvEmisor) +
    pad(d.establecimiento, 3) +
    pad(d.puntoExpedicion, 3) +
    pad(d.numero, 7) +
    String(d.tipoContribuyente) +
    d.fechaEmision.replaceAll('-', '') +
    String(d.tipoEmision) +
    pad(d.codigoSeguridad, 9);
  if (!/^\d{43}$/.test(base)) throw new Error(`Datos inválidos para CDC (${base.length} caracteres)`);
  return base + String(calcularDvModulo11(base));
}

/** 44 dígitos y DV correcto. */
export function validarCdc(cdc: string): boolean {
  if (!/^\d{44}$/.test(cdc)) return false;
  return calcularDvModulo11(cdc.slice(0, 43)) === Number(cdc[43]);
}

/** Texto -> hexadecimal (UTF-8), usado en dFeEmiDE y DigestValue del QR. */
export function aHex(texto: string): string {
  return Array.from(new TextEncoder().encode(texto))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export type DatosQr = {
  cdc: string;
  /** ISO local AAAA-MM-DDThh:mm:ss */
  fechaEmisionIso: string;
  rucReceptor?: string | null;
  documentoReceptor?: string | null;
  totalGs: number;
  totalIvaGs: number;
  cantidadItems: number;
  digestValue: string;
  idCsc: string;
};

/** Cadena de parámetros del QR (sin cHashQR). El hash SHA-256(params + CSC) lo agrega el servidor. */
export function parametrosQr(d: DatosQr): string {
  const receptor = d.rucReceptor
    ? `dRucRec=${d.rucReceptor}`
    : `dNumIDRec=${d.documentoReceptor && d.documentoReceptor !== '' ? d.documentoReceptor : '0'}`;
  return [
    'nVersion=150',
    `Id=${d.cdc}`,
    `dFeEmiDE=${aHex(d.fechaEmisionIso)}`,
    receptor,
    `dTotGralOpe=${d.totalGs}`,
    `dTotIVA=${d.totalIvaGs}`,
    `cItems=${d.cantidadItems}`,
    `DigestValue=${aHex(d.digestValue)}`,
    `IdCSC=${d.idCsc}`,
  ].join('&');
}

export const ETIQUETA_ESTADO_SIFEN: Record<string, string> = {
  no_aplica: 'No aplica',
  pendiente: 'Pendiente',
  enviado: 'Enviado',
  aprobado: 'Aprobado',
  aprobado_con_observacion: 'Aprobado con observación',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  inutilizado: 'Inutilizado',
};
