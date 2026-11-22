import { consultarStock } from '@/server/queries/ajustes';
import { DataTable } from '@/components/ui/DataTable';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas, primerParam } from '@/lib/ui/datos';
import { cargarCatalogos, seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Consulta de stock' };

export default async function Stock({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const q = primerParam(sp.q) ?? '';
  const depositoId = Number(primerParam(sp.depositoId)) || null;
  const soloBajoMinimo = primerParam(sp.bajoMinimo) === '1';
  const [filas, cat] = await Promise.all([seguro(() => consultarStock({ q: q || null, depositoId, soloBajoMinimo }), []), cargarCatalogos()]);
  return (
    <>
      <EncabezadoPagina titulo="Consulta de stock" descripcion="Existencias por depósito (unidad base) y costo promedio sin IVA." />
      <form method="get" className="mb-3 flex flex-wrap items-end gap-2 rounded border border-borde bg-panel p-3">
        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-tenue">
          Artículo
          <input name="q" defaultValue={q} placeholder="Código o descripción" className="h-8 w-64 rounded border border-borde bg-panel px-2 text-[13px] normal-case text-texto" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-tenue">
          Depósito
          <select name="depositoId" defaultValue={depositoId ?? ''} className="h-8 w-56 rounded border border-borde bg-panel px-2 text-[13px] normal-case text-texto">
            <option value="">Todos</option>
            {cat.depositos.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex h-8 items-center gap-2 text-[13px]">
          <input type="checkbox" name="bajoMinimo" value="1" defaultChecked={soloBajoMinimo} className="accent-primario" /> Solo bajo mínimo
        </label>
        <button type="submit" className="h-8 rounded bg-primario px-3 text-[13px] font-medium text-primario-texto hover:bg-primario-hover">
          Consultar
        </button>
      </form>
      <DataTable
        filas={comoFilas(filas)}
        exportar="stock"
        totales
        columnas={[
          { clave: 'codigo', titulo: 'Código', tipo: 'mono', alternativas: ['articulo.codigo', 'articulo_codigo'] },
          { clave: 'descripcion', titulo: 'Artículo', alternativas: ['articulo.descripcion', 'articulo_descripcion'] },
          { clave: 'deposito', titulo: 'Depósito', alternativas: ['deposito.nombre', 'deposito_nombre'] },
          { clave: 'cantidad', titulo: 'Existencia', tipo: 'cantidad' },
          { clave: 'cantidad_reservada', titulo: 'Reservado', tipo: 'cantidad' },
          { clave: 'stock_minimo', titulo: 'Mínimo', tipo: 'cantidad', alternativas: ['articulo.stock_minimo'] },
          { clave: 'costo_promedio_gs', titulo: 'Costo prom.', tipo: 'gs', sumar: false },
          { clave: 'ultimo_costo_gs', titulo: 'Último costo', tipo: 'gs', sumar: false },
          { clave: 'valorizado_gs', titulo: 'Valorizado', tipo: 'gs', alternativas: ['saldo_valorizado_gs'] },
        ]}
      />
    </>
  );
}
