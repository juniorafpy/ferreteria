/**
 * Contexto de ejecución de los servicios de dominio. Es un subconjunto de la `Sesion`
 * para que los servicios se puedan probar sin Next (PGlite + objeto literal).
 */
export type Ctx = {
  usuarioId: number;
  empresaId: number;
  sucursalId: number;
  permisos: readonly string[];
  /** Tope de descuento manual por línea (%), máximo entre los roles del usuario. */
  descuentoManualMaxPct: number;
};

export const tienePermisoCtx = (ctx: Pick<Ctx, 'permisos'>, codigo: string) => ctx.permisos.includes(codigo);
