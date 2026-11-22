import { notFound } from 'next/navigation';
import * as R from '@/server/queries/reportes';
import { listarPlanCuentas } from '@/server/queries/contabilidad';
import { DataTable, type ColumnaDef, type TipoColumna } from '@/components/ui/DataTable';
import { FiltrosReporte } from '@/components/ui/FiltrosReporte';
import { Aviso } from '@/components/ui/Campos';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas, leer, leerPrimero, primerParam, texto, valoresParams, type Fila } from '@/lib/ui/datos';
import { formatearCeldaServidor } from './formato';
import { hoyISO, inicioMesISO } from '@/lib/ui/formato';
import { REPORTES, reportePorSlug } from '@/lib/ui/reportes';
import { cargarCatalogos, seguro } from '../../_lib/catalogos';

type Props = { params: Promise<{ reporte: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateStaticParams() {
  return REPORTES.map((r) => ({ reporte: r.slug }));
}

export async function generateMetadata({ params }: Props) {
  const def = reportePorSlug((await params).reporte);
  return { title: def?.titulo ?? 'Reporte' };
}

/** Funciones del backend por nombre (contrato). */
const FUNCIONES: Record<string, (f: never) => Promise<unknown>> = {
  libroCompras: R.libroCompras,
  comprasPorProveedor: R.comprasPorProveedor,
  comprasPorArticulo: R.comprasPorArticulo,
  historicoCostos: R.historicoCostos,
  estadoCuentasPagar: R.estadoCuentasPagar,
  libroVentas: R.libroVentas,
  ventasPorCliente: R.ventasPorCliente,
  ventasPorArticulo: R.ventasPorArticulo,
  presupuestosPendientesVsFacturados: R.presupuestosPendientesVsFacturados,
  estadoCuentasCobrar: R.estadoCuentasCobrar,
  kardex: R.kardex,
  libroDiario: R.libroDiario,
  libroMayor: R.libroMayor,
  balanceSumasSaldos: R.balanceSumasSaldos,
};

const TIPOS: Record<string, TipoColumna> = { monto: 'gs', cantidad: 'cantidad', numero: 'numero', fecha: 'fecha', texto: 'texto' };

function columnasDe(resultado: unknown, filas: Fila[]): ColumnaDef[] {
  const cols = leer(resultado, 'columnas');
  if (Array.isArray(cols) && cols.length) {
    return cols.map((c) =>
      typeof c === 'string'
        ? { clave: c, titulo: c }
        : {
            clave: texto(leerPrimero(c, 'key', 'clave')),
            titulo: texto(leerPrimero(c, 'label', 'titulo', 'key')),
            tipo: TIPOS[texto(leer(c, 'tipo'))] ?? 'texto',
          },
    );
  }
  // Filas tipadas sin metadatos: se infieren columnas de la primera fila.
  const primera = filas[0] ?? {};
  return Object.keys(primera).map((k) => ({
    clave: k,
    titulo: k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'),
    tipo: /gs$|Gs$|monto|total|saldo|debe|haber/i.test(k) ? 'gs' : /cantidad/i.test(k) ? 'cantidad' : /fecha/i.test(k) ? 'fecha' : 'texto',
  }));
}

export default async function PaginaReporte({ params, searchParams }: Props) {
  const def = reportePorSlug((await params).reporte);
  if (!def) notFound();
  const sp = await searchParams;
  const valores = valoresParams(sp);
  const num = (k: string) => {
    const v = primerParam(sp[k]);
    return v && /^\d+$/.test(v) ? Number(v) : undefined;
  };
  const filtro = {
    desde: primerParam(sp.desde) || inicioMesISO(),
    hasta: primerParam(sp.hasta) || hoyISO(),
    sucursalId: num('sucursalId'),
    proveedorId: num('proveedorId'),
    clienteId: num('clienteId'),
    articuloId: num('articuloId'),
    depositoId: num('depositoId'),
    cuentaId: num('cuentaId'),
  };
  const faltan = (def.requeridos ?? []).filter((r) => !filtro[r as keyof typeof filtro]);

  const [cat, cuentas] = await Promise.all([
    cargarCatalogos(),
    def.filtros.includes('cuenta') ? seguro(() => listarPlanCuentas(), []) : Promise.resolve([]),
  ]);

  let resultado: unknown = null;
  let error: string | null = null;
  if (!faltan.length) {
    try {
      resultado = await FUNCIONES[def.funcion](filtro as never);
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo generar el reporte.';
    }
  }
  const filas = comoFilas(resultado);
  const columnas = columnasDe(resultado, filas);
  const totales = leer(resultado, 'totales') as Record<string, unknown> | undefined;
  const extra = leer(resultado, 'extra') as Record<string, unknown> | undefined;
  const qs = new URLSearchParams(Object.entries({ ...valores, desde: filtro.desde, hasta: filtro.hasta })).toString();

  return (
    <>
      <EncabezadoPagina titulo={def.titulo} descripcion={def.descripcion} />
      <div className="mb-3">
        <FiltrosReporte
          filtros={def.filtros}
          valores={{ ...valores, desde: filtro.desde, hasta: filtro.hasta }}
          sucursales={[{ valor: '0', etiqueta: 'Todas las sucursales' }, ...cat.sucursales]}
          depositos={cat.depositos}
          cuentas={comoFilas(cuentas)
            .filter((c) => leer(c, 'imputable') !== false)
            .map((c) => ({ valor: texto(leer(c, 'id')), etiqueta: `${texto(leer(c, 'codigo'))} ${texto(leer(c, 'nombre'))}` }))}
          requeridos={def.requeridos}
          csvHref={`/api/reportes/${def.funcion}/csv`}
        />
      </div>
      {faltan.length ? <Aviso tipo="info">Complete los filtros obligatorios ({faltan.join(', ')}) y presione Consultar.</Aviso> : null}
      {error ? <Aviso>{error}</Aviso> : null}
      {extra && Object.keys(extra).length ? (
        <dl className="mb-2 flex flex-wrap gap-4 rounded border border-borde bg-panel px-3 py-2 text-[12.5px]">
          {Object.entries(extra).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] text-tenue">{k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}</dt>
              <dd className="font-semibold tabular-nums">{formatearCeldaServidor(k, v)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {!faltan.length && !error ? (
        <>
          <DataTable columnas={columnas} filas={filas} exportar={`${def.slug}_${filtro.desde}_${filtro.hasta}`} totales={!totales} />
          {totales && Object.keys(totales).length ? (
            <dl className="mt-2 flex flex-wrap justify-end gap-x-6 gap-y-1 rounded border border-borde bg-panel-2 px-3 py-2 text-[12.5px]">
              {Object.entries(totales).map(([k, v]) => {
                const col = columnas.find((c) => c.clave === k);
                return (
                  <div key={k} className="flex gap-2">
                    <dt className="text-tenue">{col?.titulo ?? k}</dt>
                    <dd className="font-semibold tabular-nums">{formatearCeldaServidor(k, v, col?.tipo)}</dd>
                  </div>
                );
              })}
            </dl>
          ) : null}
          <p className="mt-2 text-[11px] text-tenue">
            Exportación oficial: <a className="text-primario hover:underline" href={`/api/reportes/${def.funcion}/csv?${qs}`}>CSV del servidor</a>
          </p>
        </>
      ) : null}
    </>
  );
}
