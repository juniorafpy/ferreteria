import { NextResponse, type NextRequest } from 'next/server';
import { getSesion } from '@/server/auth/session';
import { aResultado } from '@/server/lib/accion';
import { ejecutarReporte, type FiltroReporteEntrada } from '@/server/queries/reportes';

export const dynamic = 'force-dynamic';

const celda = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const num = (v: string | null) => (v === null || v === '' ? undefined : Number(v));

/**
 * GET /api/reportes/{reporte}/csv?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&sucursalId=&articuloId=&cuentaId=...
 * CSV separado por ";" con BOM UTF-8 (Excel es-PY). Incluye fila de totales.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ reporte: string }> }) {
  const { reporte } = await params;
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const q = req.nextUrl.searchParams;
  const filtro: FiltroReporteEntrada = {
    desde: q.get('desde') || undefined,
    hasta: q.get('hasta') || undefined,
    sucursalId: num(q.get('sucursalId')),
    proveedorId: num(q.get('proveedorId')),
    clienteId: num(q.get('clienteId')),
    articuloId: num(q.get('articuloId')),
    depositoId: num(q.get('depositoId')),
    cuentaId: num(q.get('cuentaId')),
  };
  let rep;
  try {
    rep = await ejecutarReporte(reporte, filtro);
  } catch (e) {
    const r = aResultado(e);
    const error = r.ok ? 'Error' : r.error;
    return NextResponse.json({ error, fieldErrors: r.ok ? undefined : r.fieldErrors }, { status: /permiso/i.test(error) ? 403 : 400 });
  }
  if (!rep) return NextResponse.json({ error: `Reporte desconocido: ${reporte}` }, { status: 404 });

  const lineas = [rep.columnas.map((c) => celda(c.label)).join(';')];
  for (const f of rep.filas) lineas.push(rep.columnas.map((c) => celda((f as Record<string, unknown>)[c.key])).join(';'));
  if (Object.keys(rep.totales).length) {
    lineas.push(rep.columnas.map((c, i) => (i === 0 ? 'TOTALES' : celda(rep.totales[c.key]))).join(';'));
  }
  const nombre = `${reporte}_${filtro.desde ?? ''}_${filtro.hasta ?? ''}.csv`.replace(/[^\w.-]/g, '');
  return new NextResponse('﻿' + lineas.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Cache-Control': 'no-store',
    },
  });
}
