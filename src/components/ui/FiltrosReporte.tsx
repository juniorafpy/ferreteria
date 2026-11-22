'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Opcion } from '@/lib/ui/datos';
import { inicioMesISO, hoyISO } from '@/lib/ui/formato';
import { BuscadorEntidad, type TipoEntidad, type ValorEntidad } from './BuscadorEntidad';
import { Boton, DateInput, Field, Select } from './Campos';
import { Icono } from './Icono';

export type FiltroReporte = 'fechas' | 'sucursal' | 'proveedor' | 'cliente' | 'articulo' | 'cuenta' | 'deposito' | 'estado';

const ENTIDADES: Partial<Record<FiltroReporte, { clave: string; tipo: TipoEntidad; etiqueta: string }>> = {
  proveedor: { clave: 'proveedorId', tipo: 'proveedor', etiqueta: 'Proveedor' },
  cliente: { clave: 'clienteId', tipo: 'cliente', etiqueta: 'Cliente' },
  articulo: { clave: 'articuloId', tipo: 'articulo', etiqueta: 'Artículo' },
};

/** Filtros de reporte sincronizados con la URL (?desde&hasta&sucursalId&…). */
export function FiltrosReporte({
  filtros,
  valores,
  sucursales = [],
  cuentas = [],
  depositos = [],
  estados = [],
  csvHref,
  etiquetasEntidad = {},
  requeridos = [],
}: {
  filtros: FiltroReporte[];
  valores: Record<string, string>;
  sucursales?: Opcion[];
  cuentas?: Opcion[];
  depositos?: Opcion[];
  estados?: Opcion[];
  /** Endpoint CSV del backend, ej. "/api/reportes/libro-ventas/csv". */
  csvHref?: string;
  etiquetasEntidad?: Record<string, string>;
  requeridos?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [v, setV] = useState<Record<string, string>>({
    desde: valores.desde ?? inicioMesISO(),
    hasta: valores.hasta ?? hoyISO(),
    ...valores,
  });
  const [ents, setEnts] = useState<Record<string, ValorEntidad>>(() => {
    const o: Record<string, ValorEntidad> = {};
    for (const f of filtros) {
      const e = ENTIDADES[f];
      if (e && valores[e.clave]) o[e.clave] = { id: Number(valores[e.clave]), etiqueta: etiquetasEntidad[e.clave] ?? `#${valores[e.clave]}` };
    }
    return o;
  });

  const qs = () => {
    const p = new URLSearchParams();
    for (const [k, val] of Object.entries(v)) if (val) p.set(k, val);
    return p.toString();
  };
  const faltan = requeridos.filter((r) => !v[r]);

  return (
    <form
      className="no-imprimir flex flex-wrap items-end gap-3 rounded border border-borde bg-panel p-3"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`${pathname}?${qs()}`);
      }}
    >
      {filtros.includes('fechas') ? (
        <>
          <Field etiqueta="Desde" className="w-36">
            <DateInput value={v.desde} onChange={(x) => setV({ ...v, desde: x })} />
          </Field>
          <Field etiqueta="Hasta" className="w-36">
            <DateInput value={v.hasta} onChange={(x) => setV({ ...v, hasta: x })} />
          </Field>
        </>
      ) : null}
      {filtros.includes('sucursal') ? (
        <Field etiqueta="Sucursal" className="w-44">
          <Select value={v.sucursalId ?? ''} onChange={(e) => setV({ ...v, sucursalId: e.target.value })} opciones={sucursales} placeholder="Todas" />
        </Field>
      ) : null}
      {filtros.includes('deposito') ? (
        <Field etiqueta="Depósito" className="w-44">
          <Select value={v.depositoId ?? ''} onChange={(e) => setV({ ...v, depositoId: e.target.value })} opciones={depositos} placeholder="Todos" />
        </Field>
      ) : null}
      {filtros.includes('cuenta') ? (
        <Field etiqueta="Cuenta" className="w-64" requerido={requeridos.includes('cuentaId')}>
          <Select value={v.cuentaId ?? ''} onChange={(e) => setV({ ...v, cuentaId: e.target.value })} opciones={cuentas} placeholder="Seleccione…" />
        </Field>
      ) : null}
      {filtros.includes('estado') ? (
        <Field etiqueta="Estado" className="w-40">
          <Select value={v.estado ?? ''} onChange={(e) => setV({ ...v, estado: e.target.value })} opciones={estados} placeholder="Todos" />
        </Field>
      ) : null}
      {filtros.map((f) => {
        const e = ENTIDADES[f];
        if (!e) return null;
        return (
          <Field key={f} etiqueta={e.etiqueta} className="w-72" requerido={requeridos.includes(e.clave)}>
            <BuscadorEntidad
              tipo={e.tipo}
              permitirCrear={false}
              valor={ents[e.clave] ?? null}
              onCambiar={(item) => {
                const id = item ? String(item.id ?? '') : '';
                setEnts({ ...ents, [e.clave]: item ? { id: Number(id), etiqueta: String(item.razon_social ?? item.descripcion ?? id) } : null });
                setV({ ...v, [e.clave]: id });
              }}
            />
          </Field>
        );
      })}
      <div className="flex gap-2">
        <Boton type="submit" variante="primario" disabled={faltan.length > 0}>
          <Icono nombre="buscar" className="size-3.5" /> Consultar
        </Boton>
        {csvHref ? (
          <a
            href={`${csvHref}?${qs()}`}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-borde bg-panel px-3 text-[13px] hover:bg-panel-2"
          >
            <Icono nombre="descargar" className="size-3.5" /> Exportar CSV
          </a>
        ) : null}
      </div>
    </form>
  );
}
