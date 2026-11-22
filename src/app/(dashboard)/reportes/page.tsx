import Link from 'next/link';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { Icono } from '@/components/ui/Icono';
import { REPORTES } from '@/lib/ui/reportes';

export const metadata = { title: 'Reportes' };

export default function IndiceReportes() {
  const grupos = ['Compras', 'Ventas', 'Inventario', 'Contabilidad'] as const;
  return (
    <>
      <EncabezadoPagina titulo="Reportes" descripcion="Todos los reportes admiten filtros por fechas y sucursal, y exportación CSV." />
      <div className="grid gap-3 md:grid-cols-2">
        {grupos.map((g) => (
          <section key={g} className="rounded border border-borde bg-panel">
            <h2 className="border-b border-borde px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-tenue">{g}</h2>
            <ul className="divide-y divide-borde/60">
              {REPORTES.filter((r) => r.grupo === g).map((r) => (
                <li key={r.slug}>
                  <Link href={`/reportes/${r.slug}`} className="flex items-center gap-3 px-3 py-2 hover:bg-panel-2">
                    <Icono nombre="reportes" className="size-4 shrink-0 text-primario" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium">{r.titulo}</span>
                      <span className="block truncate text-[11.5px] text-tenue">{r.descripcion}</span>
                    </span>
                    <Icono nombre="chevron" className="size-3 text-tenue" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
