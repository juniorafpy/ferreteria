'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { calcularLinea, calcularTotales } from '@/server/fiscal/iva';
import { buscarArticulosUI, buscarArticulosVentaUI, resolverDescuentoUI } from '@/app/(dashboard)/_acciones/busqueda';
import { comoFilas, leer, leerPrimero, num, numONulo, texto, type Fila } from '@/lib/ui/datos';
import { formatoCantidad, formatoGs, formatoMiles, hoyISO, parseDecimal, parseEntero } from '@/lib/ui/formato';
import { useSesion } from '@/components/layout/SesionContexto';
import { Badge } from './Badge';
import { BuscadorEntidad, etiquetaArticulo } from './BuscadorEntidad';
import { Boton } from './Campos';
import { Icono } from './Icono';
import { Modal } from './Modal';
import type { TotalesIva } from './PanelTotalesIva';

export type TipoIva = 'iva10' | 'iva5' | 'exenta';
export type OrigenDescuento = 'automatico' | 'manual' | 'ninguno';

export type LineaDetalle = {
  key: string;
  id?: number | null;
  articuloId: number | null;
  codigo: string;
  descripcion: string;
  unidadMedidaId: number | null;
  cantidad: number;
  precioUnitarioGs: number;
  descuentoGs: number;
  origenDescuento: OrigenDescuento;
  descuentoId: number | null;
  /** Etiqueta del descuento automático aplicado (código · nombre). */
  descuentoNombre?: string;
  tipoIva: TipoIva;
  totalLineaGs: number;
  ivaGs: number;
  detalleOrigenId: number | null;
  /** Cantidad máxima pendiente del documento origen (informativa). */
  cantidadPendiente?: number | null;
  stock?: number | null;
  observacion?: string;
};

let contador = 0;
export const nuevaClave = () => `l${Date.now().toString(36)}${(contador++).toString(36)}`;

export function lineaVacia(): LineaDetalle {
  return {
    key: nuevaClave(),
    articuloId: null,
    codigo: '',
    descripcion: '',
    unidadMedidaId: null,
    cantidad: 1,
    precioUnitarioGs: 0,
    descuentoGs: 0,
    origenDescuento: 'ninguno',
    descuentoId: null,
    tipoIva: 'iva10',
    totalLineaGs: 0,
    ivaGs: 0,
    detalleOrigenId: null,
  };
}

/** Recalcula total e IVA de la línea con la función fiscal compartida del backend. */
export function recalcular(l: LineaDetalle): LineaDetalle {
  const r = calcularLinea({
    cantidad: l.cantidad,
    precioUnitarioGs: l.precioUnitarioGs,
    descuentoGs: l.descuentoGs,
    tipoIva: l.tipoIva,
  });
  return { ...l, totalLineaGs: r.totalLineaGs, ivaGs: r.ivaGs };
}

export function totalesDe(lineas: LineaDetalle[]): TotalesIva {
  const validas = lineas.filter((l) => l.articuloId);
  const t = calcularTotales(validas);
  return {
    gravada10Gs: num(t.gravada10Gs),
    gravada5Gs: num(t.gravada5Gs),
    exentaGs: num(t.exentaGs),
    iva10Gs: num(t.iva10Gs),
    iva5Gs: num(t.iva5Gs),
    totalIvaGs: num(t.totalIvaGs),
    totalDescuentoGs: num(t.totalDescuentoGs),
    totalGs: num(t.totalGs),
  };
}

/** Convierte detalles del backend (snake o camel) a líneas de la grilla. */
export function lineasDesde(detalles: unknown, opciones: { pendienteComoCantidad?: boolean } = {}): LineaDetalle[] {
  return comoFilas(detalles).map((d) => {
    const cantidadPendiente = numONulo(leerPrimero(d, 'cantidad_pendiente', 'pendiente'));
    const l: LineaDetalle = {
      key: nuevaClave(),
      id: opciones.pendienteComoCantidad ? null : numONulo(leer(d, 'id')),
      articuloId: numONulo(leerPrimero(d, 'articulo_id', 'articulo.id')),
      codigo: texto(leerPrimero(d, 'codigo', 'articulo.codigo', 'articulo_codigo')),
      descripcion: texto(leerPrimero(d, 'descripcion', 'articulo.descripcion', 'articulo_descripcion')),
      unidadMedidaId: numONulo(leer(d, 'unidad_medida_id')),
      cantidad: opciones.pendienteComoCantidad && cantidadPendiente !== null ? cantidadPendiente : num(leer(d, 'cantidad'), 1),
      precioUnitarioGs: num(leerPrimero(d, 'precio_unitario_gs', 'costo_unitario_gs', 'articulo.costo_referencia_gs')),
      descuentoGs: num(leer(d, 'descuento_gs')),
      origenDescuento: (texto(leer(d, 'origen_descuento')) || 'ninguno') as OrigenDescuento,
      descuentoId: numONulo(leer(d, 'descuento_id')),
      tipoIva: (texto(leerPrimero(d, 'tipo_iva', 'articulo.tipo_iva')) || 'iva10') as TipoIva,
      totalLineaGs: num(leer(d, 'total_linea_gs')),
      ivaGs: num(leer(d, 'iva_gs')),
      detalleOrigenId: opciones.pendienteComoCantidad ? numONulo(leer(d, 'id')) : numONulo(leer(d, 'detalle_origen_id')),
      cantidadPendiente,
      observacion: texto(leer(d, 'observacion')),
    };
    return opciones.pendienteComoCantidad ? recalcular(l) : l;
  });
}

/** Payload de detalles para las acciones (camelCase). */
export function detallesParaGuardar(lineas: LineaDetalle[], modo: 'comercial' | 'cantidad' = 'comercial') {
  return lineas
    .filter((l) => l.articuloId)
    .map((l, i) =>
      modo === 'cantidad'
        ? {
            id: l.id ?? undefined,
            linea: i + 1,
            articuloId: l.articuloId,
            unidadMedidaId: l.unidadMedidaId,
            cantidad: l.cantidad,
            observacion: l.observacion || null,
            detalleOrigenId: l.detalleOrigenId,
          }
        : {
            id: l.id ?? undefined,
            linea: i + 1,
            articuloId: l.articuloId,
            descripcion: l.descripcion,
            unidadMedidaId: l.unidadMedidaId,
            cantidad: l.cantidad,
            precioUnitarioGs: l.precioUnitarioGs,
            // Contrato: descuentoGs omitido => el backend aplica el descuento automático vigente.
            // Solo se envía cuando es manual (el backend valida permiso y tope del rol).
            ...(l.origenDescuento === 'manual' ? { descuentoGs: l.descuentoGs } : {}),
            tipoIva: l.tipoIva,
            detalleOrigenId: l.detalleOrigenId,
          },
    );
}

const celdaInput =
  'h-7 w-full rounded-sm border border-transparent bg-transparent px-1.5 text-[12.5px] hover:border-borde focus:border-foco focus:bg-panel focus:outline-none disabled:text-tenue';

export function GrillaDetalle({
  lineas,
  onCambiar,
  modo = 'comercial',
  precio = 'venta',
  conDescuento = false,
  ivaEditable = false,
  precioEditable = true,
  soloLectura = false,
  fecha,
  mostrarPendiente = false,
  mostrarStock = false,
}: {
  lineas: LineaDetalle[];
  onCambiar: (l: LineaDetalle[]) => void;
  modo?: 'comercial' | 'cantidad';
  precio?: 'venta' | 'costo';
  conDescuento?: boolean;
  ivaEditable?: boolean;
  precioEditable?: boolean;
  soloLectura?: boolean;
  /** Fecha del documento para resolver descuentos automáticos. */
  fecha?: string;
  mostrarPendiente?: boolean;
  mostrarStock?: boolean;
}) {
  const sesion = useSesion();
  // Coherente con el backend (prepararLineasVenta): permiso exacto ventas.descuento_manual, sin comodín '*'
  // (la sesión nunca contiene '*': el rol ADMIN recibe todos los códigos).
  const puedeDescManual = !!sesion && sesion.permisos.includes('ventas.descuento_manual');
  const topePct = sesion?.descuentoManualMaxPct ?? 0;
  // En ventas, un precio distinto al de lista exige articulos.precio.modificar (el backend revalida).
  const puedeModificarPrecio = precio !== 'venta' || (!!sesion && sesion.permisos.includes('articulos.precio.modificar'));
  const gid = useId();
  const ref = useRef(lineas);
  ref.current = lineas;
  const [busqueda, setBusqueda] = useState<{ key: string; q: string } | null>(null);
  const focoPendiente = useRef<{ f: number; c: number } | null>(null);

  const comercial = modo === 'comercial';
  const tipoBusqueda = precio === 'venta' ? 'articuloVenta' : 'articulo';
  const buscarFn = precio === 'venta' ? buscarArticulosVentaUI : buscarArticulosUI;

  useEffect(() => {
    const p = focoPendiente.current;
    if (!p) return;
    focoPendiente.current = null;
    const el = document.querySelector<HTMLElement>(`[data-grilla="${gid}"][data-f="${p.f}"][data-c="${p.c}"]`);
    el?.focus();
  });

  const actualizar = (key: string, cambio: (l: LineaDetalle) => LineaDetalle) => {
    onCambiar(ref.current.map((l) => (l.key === key ? recalcular(cambio(l)) : l)));
  };

  async function aplicarDescuentoAuto(key: string) {
    if (!conDescuento) return;
    const l = ref.current.find((x) => x.key === key);
    if (!l || !l.articuloId || l.origenDescuento === 'manual') return;
    const r = await resolverDescuentoUI({
      articuloId: l.articuloId,
      cantidad: l.cantidad,
      fecha: fecha ?? hoyISO(),
      sucursalId: sesion?.sucursalId,
    });
    const actual = ref.current.find((x) => x.key === key);
    if (!actual || actual.origenDescuento === 'manual') return;
    const d = num(leerPrimero(r, 'descuentoGs', 'descuento_gs'));
    actualizar(key, (x) =>
      r && d > 0
        ? {
            ...x,
            descuentoGs: d,
            origenDescuento: 'automatico',
            descuentoId: numONulo(leerPrimero(r, 'descuentoId', 'descuento_id')),
            descuentoNombre: [texto(leer(r, 'codigo')), texto(leer(r, 'nombre'))].filter(Boolean).join(' · '),
          }
        : { ...x, descuentoGs: 0, origenDescuento: 'ninguno', descuentoId: null },
    );
  }

  function asignarArticulo(key: string, a: Fila) {
    const precioArt =
      precio === 'venta'
        ? num(leerPrimero(a, 'precio_venta_gs', 'precio_gs', 'precio'))
        : num(leerPrimero(a, 'ultimo_costo_gs', 'costo_promedio_gs', 'costo_referencia_gs'));
    actualizar(key, (l) => ({
      ...l,
      articuloId: numONulo(leer(a, 'id')),
      codigo: texto(leer(a, 'codigo')),
      descripcion: texto(leer(a, 'descripcion')),
      unidadMedidaId: numONulo(leer(a, 'unidad_medida_id')),
      tipoIva: (texto(leer(a, 'tipo_iva')) || 'iva10') as TipoIva,
      precioUnitarioGs: precioArt,
      stock: numONulo(leerPrimero(a, 'stock_deposito', 'stock_sucursal', 'stock', 'stock_disponible', 'existencia')),
      descuentoGs: l.origenDescuento === 'manual' ? l.descuentoGs : 0,
      origenDescuento: l.origenDescuento === 'manual' ? 'manual' : 'ninguno',
      descuentoId: null,
    }));
    void aplicarDescuentoAuto(key);
  }

  async function buscarPorCodigo(key: string, q: string, fila: number) {
    const term = q.trim();
    if (!term) return setBusqueda({ key, q: '' });
    const r = comoFilas(await buscarFn(term));
    const exacto = r.find((a) => [texto(leer(a, 'codigo')), texto(leer(a, 'codigo_barras'))].some((c) => c.toLowerCase() === term.toLowerCase()));
    if (exacto || r.length === 1) {
      asignarArticulo(key, exacto ?? r[0]);
      focoPendiente.current = { f: fila, c: 1 };
    } else {
      setBusqueda({ key, q: term });
    }
  }

  function agregarLinea() {
    onCambiar([...ref.current, lineaVacia()]);
    focoPendiente.current = { f: ref.current.length, c: 0 };
  }

  function eliminar(key: string) {
    const r = ref.current.filter((l) => l.key !== key);
    onCambiar(r.length ? r : [lineaVacia()]);
  }

  /** Enter avanza a la siguiente celda editable; al final agrega una línea. */
  function onTecla(e: React.KeyboardEvent<HTMLElement>, f: number, c: number, key: string) {
    if (e.key === 'F2') {
      e.preventDefault();
      setBusqueda({ key, q: '' });
      return;
    }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const celdas = Array.from(document.querySelectorAll<HTMLElement>(`[data-grilla="${gid}"]`)).filter(
      (el) => !(el as HTMLInputElement).disabled,
    );
    const i = celdas.findIndex((el) => el.dataset.f === String(f) && el.dataset.c === String(c));
    const sig = celdas[i + 1];
    if (sig) sig.focus();
    else agregarLinea();
  }

  const attrs = (f: number, c: number, key: string) => ({
    'data-grilla': gid,
    'data-f': f,
    'data-c': c,
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onTecla(e, f, c, key),
  });

  const th = 'px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-tenue border-b border-borde';

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded border border-borde bg-panel">
        <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
          <thead className="bg-panel-2">
            <tr>
              <th className={`${th} w-8 text-right`}>#</th>
              <th className={`${th} w-36 text-left`}>Artículo</th>
              <th className={`${th} text-left`}>Descripción</th>
              {mostrarStock ? <th className={`${th} w-20 text-right`}>Stock</th> : null}
              {mostrarPendiente ? <th className={`${th} w-24 text-right`}>Pendiente</th> : null}
              <th className={`${th} w-24 text-right`}>Cantidad</th>
              {comercial ? (
                <>
                  <th className={`${th} w-32 text-right`}>Precio unit.</th>
                  {conDescuento ? <th className={`${th} w-36 text-right`}>Descuento</th> : null}
                  <th className={`${th} w-20 text-left`}>IVA</th>
                  <th className={`${th} w-32 text-right`}>Total</th>
                </>
              ) : (
                <th className={`${th} text-left`}>Observación</th>
              )}
              {!soloLectura ? <th className={`${th} w-8`} aria-label="Acciones" /> : null}
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, f) => {
              const bruto = Math.round(l.cantidad * l.precioUnitarioGs);
              const excedeTope = l.origenDescuento === 'manual' && bruto > 0 && (l.descuentoGs / bruto) * 100 > topePct + 1e-9;
              const excedePend =
                l.detalleOrigenId !== null && l.cantidadPendiente !== null && l.cantidadPendiente !== undefined && l.cantidad > l.cantidadPendiente;
              return (
                <tr key={l.key} className="border-b border-borde/60 last:border-0 focus-within:bg-acento/40">
                  <td className="px-1.5 text-right text-tenue tabular-nums">{f + 1}</td>
                  <td className="px-0.5">
                    <input
                      {...attrs(f, 0, l.key)}
                      aria-label={`Artículo línea ${f + 1}`}
                      defaultValue={l.codigo}
                      key={`${l.key}-${l.articuloId ?? 'n'}`}
                      disabled={soloLectura || l.detalleOrigenId !== null}
                      placeholder="Código / F2"
                      className={`${celdaInput} font-mono`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = (e.target as HTMLInputElement).value;
                          if (v.trim() && v.trim() !== l.codigo) {
                            e.preventDefault();
                            void buscarPorCodigo(l.key, v, f);
                            return;
                          }
                          if (!l.articuloId) {
                            e.preventDefault();
                            setBusqueda({ key: l.key, q: v });
                            return;
                          }
                        }
                        onTecla(e, f, 0, l.key);
                      }}
                    />
                  </td>
                  <td className="truncate px-1.5" title={l.descripcion}>
                    {l.descripcion || <span className="text-tenue">—</span>}
                  </td>
                  {mostrarStock ? (
                    <td className={`px-1.5 text-right tabular-nums ${l.stock !== null && l.stock !== undefined && l.stock < l.cantidad ? 'text-peligro' : 'text-tenue'}`}>
                      {l.stock === null || l.stock === undefined ? '' : formatoCantidad(l.stock)}
                    </td>
                  ) : null}
                  {mostrarPendiente ? (
                    <td className="px-1.5 text-right tabular-nums text-tenue">{formatoCantidad(l.cantidadPendiente)}</td>
                  ) : null}
                  <td className="px-0.5">
                    <input
                      {...attrs(f, 1, l.key)}
                      aria-label={`Cantidad línea ${f + 1}`}
                      inputMode="decimal"
                      disabled={soloLectura}
                      defaultValue={String(l.cantidad).replace('.', ',')}
                      key={`${l.key}-c-${l.cantidad}`}
                      aria-invalid={excedePend}
                      title={excedePend ? 'Supera la cantidad pendiente del documento origen' : undefined}
                      onBlur={(e) => {
                        const n = parseDecimal(e.target.value);
                        if (n !== l.cantidad) {
                          actualizar(l.key, (x) => ({ ...x, cantidad: n }));
                          void aplicarDescuentoAuto(l.key);
                        }
                      }}
                      className={`${celdaInput} text-right tabular-nums ${excedePend ? 'text-peligro' : ''}`}
                    />
                  </td>
                  {comercial ? (
                    <>
                      <td className="px-0.5">
                        <input
                          {...attrs(f, 2, l.key)}
                          aria-label={`Precio unitario línea ${f + 1}`}
                          inputMode="numeric"
                          disabled={soloLectura || !precioEditable || !puedeModificarPrecio}
                          title={!puedeModificarPrecio ? 'Precio de lista (sin permiso articulos.precio.modificar)' : undefined}
                          value={formatoMiles(l.precioUnitarioGs)}
                          onChange={(e) => actualizar(l.key, (x) => ({ ...x, precioUnitarioGs: Math.abs(parseEntero(e.target.value)) }))}
                          className={`${celdaInput} text-right tabular-nums`}
                        />
                      </td>
                      {conDescuento ? (
                        <td className="px-0.5">
                          <div className="flex items-center gap-1">
                            {l.origenDescuento !== 'ninguno' ? (
                              <Badge tono={l.origenDescuento === 'automatico' ? 'violeta' : 'ambar'} titulo={l.origenDescuento === 'automatico' ? `Descuento automático ${l.descuentoNombre || `#${l.descuentoId ?? ''}`}` : 'Descuento manual'}>
                                {l.origenDescuento === 'automatico' ? 'A' : 'M'}
                              </Badge>
                            ) : null}
                            <input
                              {...attrs(f, 3, l.key)}
                              aria-label={`Descuento línea ${f + 1}`}
                              inputMode="numeric"
                              disabled={soloLectura || !puedeDescManual}
                              title={
                                !puedeDescManual
                                  ? 'Sin permiso ventas.descuento_manual'
                                  : excedeTope
                                    ? `Supera el tope de ${topePct}% del rol`
                                    : `Descuento manual (tope ${topePct}%)`
                              }
                              aria-invalid={excedeTope}
                              value={formatoMiles(l.descuentoGs)}
                              onChange={(e) => {
                                const d = Math.abs(parseEntero(e.target.value));
                                actualizar(l.key, (x) => ({
                                  ...x,
                                  descuentoGs: d,
                                  origenDescuento: d > 0 ? 'manual' : 'ninguno',
                                  descuentoId: null,
                                }));
                                if (d === 0) void aplicarDescuentoAuto(l.key);
                              }}
                              className={`${celdaInput} text-right tabular-nums ${excedeTope ? 'text-peligro' : ''}`}
                            />
                          </div>
                        </td>
                      ) : null}
                      <td className="px-0.5">
                        {ivaEditable && !soloLectura ? (
                          <select
                            {...attrs(f, 4, l.key)}
                            aria-label={`IVA línea ${f + 1}`}
                            value={l.tipoIva}
                            onChange={(e) => actualizar(l.key, (x) => ({ ...x, tipoIva: e.target.value as TipoIva }))}
                            className={celdaInput}
                          >
                            <option value="iva10">10%</option>
                            <option value="iva5">5%</option>
                            <option value="exenta">Exenta</option>
                          </select>
                        ) : (
                          <span className="px-1.5">{l.tipoIva === 'iva10' ? '10%' : l.tipoIva === 'iva5' ? '5%' : 'Exenta'}</span>
                        )}
                      </td>
                      <td className="px-1.5 text-right font-medium tabular-nums">{formatoGs(l.totalLineaGs)}</td>
                    </>
                  ) : (
                    <td className="px-0.5">
                      <input
                        {...attrs(f, 2, l.key)}
                        aria-label={`Observación línea ${f + 1}`}
                        disabled={soloLectura}
                        value={l.observacion ?? ''}
                        onChange={(e) => onCambiar(ref.current.map((x) => (x.key === l.key ? { ...x, observacion: e.target.value } : x)))}
                        className={celdaInput}
                      />
                    </td>
                  )}
                  {!soloLectura ? (
                    <td className="px-0.5 text-center">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => eliminar(l.key)}
                        className="rounded p-1 text-tenue hover:bg-peligro/10 hover:text-peligro"
                        aria-label={`Eliminar línea ${f + 1}`}
                      >
                        <Icono nombre="basura" className="size-3.5" />
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!soloLectura ? (
        <div className="no-imprimir flex flex-wrap items-center gap-3 text-[11px] text-tenue">
          <Boton tamano="sm" onClick={agregarLinea}>
            <Icono nombre="mas" className="size-3.5" /> Agregar línea
          </Boton>
          <span>
            <kbd>Enter</kbd> avanza · <kbd>F2</kbd> buscar artículo
            {conDescuento ? (puedeDescManual ? ` · Descuento manual hasta ${topePct}%` : ' · Descuento manual no habilitado') : ''}
          </span>
        </div>
      ) : null}

      <Modal
        abierto={busqueda !== null}
        onCerrar={() => setBusqueda(null)}
        titulo="Buscar artículo (F2)"
        ancho="max-w-4xl"
      >
        {busqueda ? (
          <div className="text-[13.5px] [&_input]:h-11 [&_input]:px-3 [&_input]:pr-9 [&_input]:text-[14px] [&_li]:py-2.5 [&_li]:text-[13.5px] [&_ul]:max-h-[60vh]">
            <BuscadorEntidad
              key={busqueda.key + busqueda.q}
              tipo={tipoBusqueda}
              valor={null}
              autoFocus
              textoInicial={busqueda.q}
              onCambiar={(a) => {
                if (a) {
                  const f = ref.current.findIndex((x) => x.key === busqueda.key);
                  asignarArticulo(busqueda.key, a);
                  focoPendiente.current = { f, c: 1 };
                }
                setBusqueda(null);
              }}
            />
          </div>
        ) : null}
        <p className="mt-3 text-[12px] text-tenue">↑/↓ para moverse, Enter para seleccionar. {busqueda?.q ? `Resultados para “${busqueda.q}”.` : ''}</p>
      </Modal>
    </div>
  );
}

export { etiquetaArticulo };
