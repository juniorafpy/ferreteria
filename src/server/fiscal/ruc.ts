/**
 * RUC paraguayo: dígito verificador módulo 11 (algoritmo SET, base máxima 11).
 * PURO: seguro para Client Components.
 */
export function calcularDvModulo11(numero: string, baseMax = 11): number {
  const digitos = numero
    .toUpperCase()
    .split('')
    .map((c) => (/[0-9]/.test(c) ? c : String(c.charCodeAt(0))))
    .join('');
  let total = 0;
  let k = 2;
  for (let i = digitos.length - 1; i >= 0; i--) {
    if (k > baseMax) k = 2;
    total += Number(digitos[i]) * k;
    k++;
  }
  const resto = total % 11;
  return resto > 1 ? 11 - resto : 0;
}

export const calcularDvRuc = (ruc: string) => calcularDvModulo11(ruc.trim());

/** true si `ruc` (sin DV) tiene formato válido y `dv` coincide. */
export function validarRuc(ruc: string, dv: string | number): boolean {
  const r = String(ruc ?? '').trim();
  const d = String(dv ?? '').trim();
  if (!/^[0-9A-Za-z]{1,8}$/.test(r) || !/^[0-9]$/.test(d)) return false;
  return calcularDvRuc(r) === Number(d);
}

/** Acepta "80012345-6" y devuelve { ruc, dv } o null. */
export function separarRuc(rucConDv: string): { ruc: string; dv: string } | null {
  const m = /^([0-9A-Za-z]{1,8})-([0-9])$/.exec(rucConDv.trim());
  return m ? { ruc: m[1], dv: m[2] } : null;
}
