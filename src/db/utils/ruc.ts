/**
 * Dígito verificador de RUC paraguayo (módulo 11, algoritmo SET, base máxima 11).
 * Ej.: calcularDvRuc('80012345').
 */
export function calcularDvRuc(ruc: string, baseMax = 11): number {
  const digitos = ruc
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
