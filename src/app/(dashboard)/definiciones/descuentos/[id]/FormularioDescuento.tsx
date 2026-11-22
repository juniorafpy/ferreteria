'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { guardarDescuento } from '@/server/actions/definiciones';
import { CamposGrid, valoresIniciales, valoresParaGuardar, type CampoDef, type Valores } from '@/components/forms/CamposGrid';
import { BadgeEstado } from '@/components/ui/Badge';
import { BuscadorEntidad, etiquetaArticulo } from '@/components/ui/BuscadorEntidad';
import { Aviso, Boton, Checkbox, MoneyInput, NumberInput } from '@/components/ui/Campos';
import { Icono } from '@/components/ui/Icono';
import { Seccion } from '@/components/ui/Pagina';
import { ToolbarDocumento } from '@/components/ui/ToolbarDocumento';
import { comoFilas, erroresPorCampo, idDeResultado, leer, leerPrimero, num, numONulo, texto, type Fila, type Opcion, type ResultadoAccion } from '@/lib/ui/datos';
import { hoyISO } from '@/lib/ui/formato';

type LineaDesc = {
  key: string;
  articuloId: number | null;
  etiqueta: string;
  valor: number | null;
  cantidadMinima: number;
  topeGs: number | null;
};

const CAMPOS: CampoDef[] = [
  { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 30 },
  { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2, maxLength: 120 },
  {
    clave: 'tipo',
    etiqueta: 'Tipo',
    tipo: 'select',
    requerido: true,
    defecto: 'porcentaje',
    opciones: [
      { valor: 'porcentaje', etiqueta: 'Porcentaje (%)' },
      { valor: 'monto', etiqueta: 'Monto fijo por unidad (Gs.)' },
    ],
  },
  { clave: 'fechaDesde', etiqueta: 'Vigente desde', tipo: 'fecha', requerido: true, defecto: hoyISO() },
  { clave: 'fechaHasta', etiqueta: 'Vigente hasta', tipo: 'fecha', requerido: true },
  { clave: 'prioridad', etiqueta: 'Prioridad', tipo: 'entero', requerido: true, defecto: 100, ayuda: '1 = más alta' },
  {
    clave: 'estado',
    etiqueta: 'Estado',
    tipo: 'select',
    defecto: 'activo',
    opciones: [
      { valor: 'activo', etiqueta: 'Activo' },
      { valor: 'inactivo', etiqueta: 'Inactivo' },
    ],
  },
  { clave: 'acumulable', etiqueta: 'Acumulable', tipo: 'check', ayuda: 'Se suma a otros descuentos' },
  { clave: 'descripcion', etiqueta: 'Descripción', tipo: 'area', ancho: 3 },
];

let n = 0;
const clave = () => `d${n++}`;

export function FormularioDescuento({ registro, sucursales }: { registro: Fila | null; sucursales: Opcion[] }) {
  const router = useRouter();
  const id = registro ? num(leer(registro, 'id')) || null : null;
  const [cab, setCab] = useState<Valores>(() => valoresIniciales(CAMPOS, registro));
  const [todas, setTodas] = useState<boolean>(Boolean(leer(registro, 'todas_sucursales')));
  const [sucs, setSucs] = useState<string[]>(() =>
    comoFilas(leerPrimero(registro, 'sucursales', 'sucursalIds')).map((s) => texto(typeof s === 'object' ? leerPrimero(s, 'sucursal_id', 'id') : s)),
  );
  const [lineas, setLineas] = useState<LineaDesc[]>(() =>
    comoFilas(leer(registro, 'articulos')).map((a) => ({
      key: clave(),
      articuloId: numONulo(leerPrimero(a, 'articulo_id', 'articulo.id')),
      etiqueta: etiquetaArticulo((leer(a, 'articulo') as Fila) ?? a),
      valor: numONulo(leerPrimero(a, 'porcentaje', 'monto_gs')),
      cantidadMinima: num(leer(a, 'cantidad_minima'), 1),
      topeGs: numONulo(leer(a, 'tope_gs')),
    })),
  );
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();
  const esPct = cab.tipo !== 'monto';
  const rangoInvalido = Boolean(cab.fechaDesde && cab.fechaHasta && String(cab.fechaHasta) < String(cab.fechaDesde));

  const guardar = () =>
    start(async () => {
      const r = (await guardarDescuento({
        ...(id ? { id } : {}),
        ...valoresParaGuardar(CAMPOS, cab),
        todasSucursales: todas,
        sucursalIds: todas ? [] : sucs.map(Number),
        articulos: lineas
          .filter((l) => l.articuloId)
          .map((l) => ({
            articuloId: l.articuloId,
            porcentaje: esPct ? l.valor : null,
            montoGs: esPct ? null : l.valor,
            cantidadMinima: l.cantidadMinima || 1,
            topeGs: l.topeGs || null,
          })),
      } as never)) as ResultadoAccion;
      setRes(r);
      if (r.ok) {
        const nid = idDeResultado(r) ?? id;
        if (!id && nid) router.push(`/definiciones/descuentos/${nid}`);
        router.refresh();
      }
    });

  const set = (key: string, cambio: Partial<LineaDesc>) => setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, ...cambio } : l)));

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        guardar();
      }}
    >
      <ToolbarDocumento
        titulo={id ? `Descuento ${texto(leer(registro, 'codigo'))}` : 'Nuevo descuento'}
        subtitulo="Cabecera de vigencia/prioridad, sucursales y artículos alcanzados"
        estado={<BadgeEstado estado={cab.estado} />}
        onNuevo={() => router.push('/definiciones/descuentos/nuevo')}
        onGuardar={guardar}
        puedeGuardar={!rangoInvalido}
        onCancelar={() => router.push('/definiciones/descuentos')}
        ocupado={ocupado}
      />
      {res ? res.ok ? <Aviso tipo="exito">Descuento guardado.</Aviso> : <Aviso>{res.error}</Aviso> : null}
      {rangoInvalido ? <Aviso>La fecha “hasta” debe ser igual o posterior a “desde”.</Aviso> : null}

      <Seccion titulo="Cabecera">
        <CamposGrid campos={CAMPOS} valores={cab} errores={erroresPorCampo(res)} onCambiar={(k, v) => setCab((x) => ({ ...x, [k]: v }))} />
      </Seccion>

      <Seccion titulo="Sucursales">
        <div className="flex flex-col gap-2">
          <Checkbox checked={todas} onChange={(e) => setTodas(e.target.checked)} etiqueta="Aplica a todas las sucursales" />
          {!todas ? (
            <fieldset className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              <legend className="sr-only">Sucursales alcanzadas</legend>
              {sucursales.map((s) => (
                <Checkbox
                  key={s.valor}
                  checked={sucs.includes(s.valor)}
                  onChange={(e) => setSucs((x) => (e.target.checked ? [...x, s.valor] : x.filter((v) => v !== s.valor)))}
                  etiqueta={s.etiqueta}
                />
              ))}
              {sucursales.length === 0 ? <p className="text-[12px] text-tenue">No hay sucursales cargadas.</p> : null}
            </fieldset>
          ) : null}
        </div>
      </Seccion>

      <Seccion
        titulo="Artículos"
        acciones={
          <Boton
            tamano="sm"
            onClick={() => setLineas((l) => [...l, { key: clave(), articuloId: null, etiqueta: '', valor: null, cantidadMinima: 1, topeGs: null }])}
          >
            <Icono nombre="mas" className="size-3.5" /> Agregar artículo
          </Boton>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[12.5px]">
            <thead className="bg-panel-2 text-[11px] uppercase tracking-wide text-tenue">
              <tr>
                <th className="px-2 py-1 text-left">Artículo</th>
                <th className="w-40 px-2 py-1 text-right">{esPct ? 'Porcentaje %' : 'Monto por unidad'}</th>
                <th className="w-32 px-2 py-1 text-right">Cant. mínima</th>
                <th className="w-40 px-2 py-1 text-right">Tope por línea</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lineas.map((l) => {
                const pctInvalido = esPct && l.valor !== null && (l.valor <= 0 || l.valor > 100);
                return (
                  <tr key={l.key} className="border-b border-borde/60">
                    <td className="px-1 py-1">
                      <BuscadorEntidad
                        tipo="articulo"
                        valor={l.articuloId ? { id: l.articuloId, etiqueta: l.etiqueta } : null}
                        onCambiar={(a) => set(l.key, { articuloId: a ? numONulo(leer(a, 'id')) : null, etiqueta: a ? etiquetaArticulo(a) : '' })}
                      />
                    </td>
                    <td className="px-1 py-1">
                      {esPct ? (
                        <NumberInput value={l.valor} onChange={(v) => set(l.key, { valor: v })} aria-invalid={pctInvalido} aria-label="Porcentaje" />
                      ) : (
                        <MoneyInput value={l.valor} onChange={(v) => set(l.key, { valor: v })} aria-label="Monto por unidad" />
                      )}
                    </td>
                    <td className="px-1 py-1">
                      <NumberInput value={l.cantidadMinima} onChange={(v) => set(l.key, { cantidadMinima: v })} aria-label="Cantidad mínima" />
                    </td>
                    <td className="px-1 py-1">
                      <MoneyInput value={l.topeGs} onChange={(v) => set(l.key, { topeGs: v || null })} placeholder="Sin tope" aria-label="Tope" />
                    </td>
                    <td className="px-1 text-center">
                      <button
                        type="button"
                        onClick={() => setLineas((x) => x.filter((y) => y.key !== l.key))}
                        className="rounded p-1 text-tenue hover:text-peligro"
                        aria-label="Quitar artículo"
                      >
                        <Icono nombre="basura" className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {lineas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-tenue">
                    Agregue los artículos alcanzados por el descuento.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Seccion>
      <button type="submit" hidden />
    </form>
  );
}
