import { and, eq, exists, gte, lte, or, sql } from 'drizzle-orm';
import type { DbLike } from '@/db';
import { articulos, descuentoArticulos, descuentos, descuentoSucursales } from '@/db/schema';
import { asegurar } from '../lib/result';

export type DescuentoResuelto = {
  descuentoId: number;
  tipo: 'porcentaje' | 'monto';
  /** Porcentaje (tipo porcentaje) o monto Gs por unidad (tipo monto). */
  valor: number;
  descuentoGs: number;
  codigo: string;
  nombre: string;
};

/**
 * Resolución del descuento automático vigente (regla documentada en src/db/schema/descuentos.ts):
 * activos, fecha_desde <= F <= fecha_hasta, (todas_sucursales OR S en descuento_sucursales),
 * artículo con cantidad_minima <= Q; gana menor `prioridad`, desempate por mayor beneficio.
 * Si el ganador es acumulable se suman los demás acumulables. El descuento nunca supera el bruto.
 */
export async function resolverDescuento(
  db: DbLike,
  p: {
    empresaId: number;
    sucursalId: number;
    articuloId: number;
    cantidad: number;
    fecha: string;
    /** Precio unitario de la línea; por defecto precio de lista. */
    precioUnitarioGs?: number;
  },
): Promise<DescuentoResuelto | null> {
  let precio = p.precioUnitarioGs;
  if (precio === undefined) {
    const [a] = await db
      .select({ precio: articulos.precio_venta_gs })
      .from(articulos)
      .where(and(eq(articulos.id, p.articuloId), eq(articulos.empresa_id, p.empresaId)));
    asegurar(a, 'Artículo inexistente');
    precio = a.precio;
  }
  const bruto = Math.round(p.cantidad * precio);
  if (bruto <= 0) return null;

  const candidatos = await db
    .select({
      id: descuentos.id,
      codigo: descuentos.codigo,
      nombre: descuentos.nombre,
      tipo: descuentos.tipo,
      prioridad: descuentos.prioridad,
      acumulable: descuentos.acumulable,
      porcentaje: descuentoArticulos.porcentaje,
      monto: descuentoArticulos.monto_gs,
      tope: descuentoArticulos.tope_gs,
    })
    .from(descuentos)
    .innerJoin(descuentoArticulos, eq(descuentoArticulos.descuento_id, descuentos.id))
    .where(
      and(
        eq(descuentos.empresa_id, p.empresaId),
        eq(descuentos.estado, 'activo'),
        lte(descuentos.fecha_desde, p.fecha),
        gte(descuentos.fecha_hasta, p.fecha),
        eq(descuentoArticulos.articulo_id, p.articuloId),
        lte(descuentoArticulos.cantidad_minima, p.cantidad),
        or(
          eq(descuentos.todas_sucursales, true),
          exists(
            db
              .select({ x: sql`1` })
              .from(descuentoSucursales)
              .where(
                and(
                  eq(descuentoSucursales.descuento_id, descuentos.id),
                  eq(descuentoSucursales.sucursal_id, p.sucursalId),
                ),
              ),
          ),
        ),
      ),
    );
  if (candidatos.length === 0) return null;

  const evaluados = candidatos
    .map((c) => {
      let monto =
        c.tipo === 'porcentaje'
          ? Math.round((bruto * Number(c.porcentaje ?? 0)) / 100)
          : Math.round(Number(c.monto ?? 0) * p.cantidad);
      if (c.tope != null) monto = Math.min(monto, c.tope);
      monto = Math.min(monto, bruto);
      return { ...c, descuentoGs: monto, valor: c.tipo === 'porcentaje' ? Number(c.porcentaje) : Number(c.monto) };
    })
    .filter((c) => c.descuentoGs > 0)
    .sort((a, b) => a.prioridad - b.prioridad || b.descuentoGs - a.descuentoGs || a.id - b.id);
  if (evaluados.length === 0) return null;

  const ganador = evaluados[0];
  let total = ganador.descuentoGs;
  if (ganador.acumulable) {
    total = evaluados.filter((c) => c.acumulable).reduce((s, c) => s + c.descuentoGs, 0);
    total = Math.min(total, bruto);
  }
  return {
    descuentoId: ganador.id,
    tipo: ganador.tipo,
    valor: ganador.valor,
    descuentoGs: total,
    codigo: ganador.codigo,
    nombre: ganador.nombre,
  };
}
