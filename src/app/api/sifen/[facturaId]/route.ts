import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/db';
import { facturasVenta } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getSesion } from '@/server/auth/session';
import { getAdaptadorSifen } from '@/server/services/sifen/adaptador';
import { configuracionSifenDe, obtenerKude, registrarEventoSifen } from '@/server/services/sifen';

export const dynamic = 'force-dynamic';

const PERMISOS = ['ventas.factura.crear', 'ventas.factura.confirmar', 'ventas.sifen.gestionar', 'reportes.ventas.ver'];

/**
 * GET /api/sifen/{facturaId} → estado SIFEN + datos del KuDE (JSON) + bitácora de eventos.
 * `?consultar=1` además consulta el estado en SIFEN por el adaptador y registra el evento `consulta`.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ facturaId: string }> }) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!PERMISOS.some((p) => sesion.permisos.includes(p))) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }
  const id = Number((await params).facturaId);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Id inválido' }, { status: 400 });

  if (req.nextUrl.searchParams.get('consultar') === '1') {
    const [f] = await db
      .select()
      .from(facturasVenta)
      .where(and(eq(facturasVenta.id, id), eq(facturasVenta.empresa_id, sesion.empresaId)));
    if (f?.cdc) {
      const config = await configuracionSifenDe(db, f.empresa_id, f.sucursal_id);
      try {
        const r = await getAdaptadorSifen().consultar(f.cdc, config?.ambiente ?? 'test');
        await registrarEventoSifen(db, f, { tipo: 'consulta', codigo: r.codigo, mensaje: r.mensaje, usuarioId: sesion.usuarioId });
      } catch (e) {
        await registrarEventoSifen(db, f, { tipo: 'error', mensaje: e instanceof Error ? e.message : String(e), usuarioId: sesion.usuarioId });
      }
    }
  }

  const kude = await obtenerKude(db, sesion, id);
  if (!kude) return NextResponse.json({ error: 'Factura inexistente' }, { status: 404 });
  return NextResponse.json(kude, { headers: { 'Cache-Control': 'no-store' } });
}
