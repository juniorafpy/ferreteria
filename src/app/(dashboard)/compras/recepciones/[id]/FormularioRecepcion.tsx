'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { anularRecepcion, confirmarRecepcion, guardarRecepcion } from '@/server/actions/compras';
import type { RecepcionInput } from '@/server/validation/compras';
import { facturasPendientesRecepcionUI, obtenerFacturaCompraUI } from '@/app/(dashboard)/_acciones/busqueda';
import { BadgeEstado } from '@/components/ui/Badge';
import { Aviso, Boton, DateInput, Field, NumberInput, Select, Textarea } from '@/components/ui/Campos';
import { Seccion } from '@/components/ui/Pagina';
import { docsRel, PanelDocumentosRelacionados } from '@/components/ui/PanelDocumentosRelacionados';
import { ToolbarDocumento } from '@/components/ui/ToolbarDocumento';
import { comoFilas, comoRegistro, erroresPorCampo, idDeResultado, leer, leerPrimero, num, numONulo, texto, type Fila, type Opcion, type ResultadoAccion } from '@/lib/ui/datos';
import { formatoCantidad, formatoGs, formatoNumeroFactura, hoyISO } from '@/lib/ui/formato';

type LineaRec = {
  detalleOrigenId: number;
  codigo: string;
  descripcion: string;
  facturada: number;
  yaRecibida: number;
  cantidad: number;
  costoUnitarioGs: number;
};

function lineasDeFactura(f: Fila | null): LineaRec[] {
  return comoFilas(leerPrimero(f, 'detalles', 'lineas')).map((d) => {
    const facturada = num(leer(d, 'cantidad'));
    const yaRecibida = num(leer(d, 'cantidad_recibida'));
    const pend = numONulo(leer(d, 'cantidad_pendiente')) ?? Math.max(facturada - yaRecibida, 0);
    return {
      detalleOrigenId: num(leer(d, 'id')),
      codigo: texto(leerPrimero(d, 'codigo', 'articulo.codigo')),
      descripcion: texto(leerPrimero(d, 'descripcion', 'articulo.descripcion')),
      facturada,
      yaRecibida,
      cantidad: pend,
      costoUnitarioGs: num(leer(d, 'costo_unitario_gs')),
    };
  });
}

function etiquetaFactura(f: Fila): string {
  const nro = texto(leer(f, 'numero_comprobante')) || formatoNumeroFactura(leer(f, 'establecimiento'), leer(f, 'punto_expedicion'), leer(f, 'numero'));
  const prov = texto(leerPrimero(f, 'proveedor_nombre', 'proveedor.persona.razon_social', 'proveedor.razon_social'));
  return `${nro || `#${texto(leer(f, 'id'))}`} · ${prov}`;
}

export function FormularioRecepcion({
  registro,
  depositos,
  facturaInicial,
}: {
  registro: Fila | null;
  depositos: Opcion[];
  facturaInicial: number | null;
}) {
  const router = useRouter();
  const id = registro ? num(leer(registro, 'id')) || null : null;
  const estado = texto(leer(registro, 'estado')) || 'borrador';
  const editable = !id || estado === 'borrador';
  const [pendientes, setPendientes] = useState<Fila[]>([]);
  const [facturaId, setFacturaId] = useState<string>(texto(leer(registro, 'factura_compra_id') ?? facturaInicial ?? ''));
  const [fecha, setFecha] = useState(texto(leer(registro, 'fecha')) || hoyISO());
  const [depositoId, setDepositoId] = useState(texto(leer(registro, 'deposito_id')));
  const [observacion, setObservacion] = useState(texto(leer(registro, 'observacion')));
  const [lineas, setLineas] = useState<LineaRec[]>(() =>
    comoFilas(leer(registro, 'detalles')).map((d) => ({
      detalleOrigenId: num(leer(d, 'detalle_origen_id')),
      codigo: texto(leerPrimero(d, 'codigo', 'articulo.codigo')),
      descripcion: texto(leerPrimero(d, 'descripcion', 'articulo.descripcion')),
      facturada: num(leerPrimero(d, 'cantidad_facturada', 'cantidad')),
      yaRecibida: num(leer(d, 'cantidad_recibida')),
      cantidad: num(leer(d, 'cantidad')),
      costoUnitarioGs: num(leer(d, 'costo_unitario_gs')),
    })),
  );
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();

  useEffect(() => {
    if (!editable) return;
    facturasPendientesRecepcionUI().then((r) => setPendientes(comoFilas(r)));
  }, [editable]);

  async function levantarFactura(fid: string) {
    setFacturaId(fid);
    if (!fid) return setLineas([]);
    const f = comoRegistro(await obtenerFacturaCompraUI(Number(fid)));
    setLineas(lineasDeFactura(f));
    const dep = texto(leer(f, 'deposito_id'));
    if (dep && !depositoId) setDepositoId(dep);
  }

  useEffect(() => {
    if (!id && facturaInicial) void levantarFactura(String(facturaInicial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ejecutar = (fn: () => Promise<ResultadoAccion>) =>
    start(async () => {
      const r = await fn();
      setRes(r);
      if (r.ok) {
        const nid = idDeResultado(r) ?? id;
        if (!id && nid) router.push(`/compras/recepciones/${nid}`);
        router.refresh();
      }
    });

  const guardar = () => {
    const aRecibir = lineas.filter((l) => l.cantidad > 0);
    // QA: un arreglo vacío no debe llegar al backend (antes significaba "recibir todo lo pendiente").
    if (aRecibir.length === 0) return setRes({ ok: false, error: 'Indique al menos una cantidad a recibir' });
    const datos: RecepcionInput = {
      ...(id ? { id } : {}),
      fecha,
      facturaCompraId: Number(facturaId),
      depositoId: Number(depositoId),
      observacion: observacion || null,
      detalles: aRecibir.map((l) => ({ detalleOrigenId: l.detalleOrigenId, cantidad: l.cantidad })),
    };
    ejecutar(async () => (await guardarRecepcion(datos)) as ResultadoAccion);
  };

  const err = erroresPorCampo(res);
  const totalCosto = lineas.reduce((a, l) => a + Math.round(l.cantidad * l.costoUnitarioGs), 0);
  const opcFacturas: Opcion[] = pendientes.map((f) => ({ valor: texto(leer(f, 'id')), etiqueta: etiquetaFactura(f) }));
  if (facturaId && !opcFacturas.some((o) => o.valor === facturaId)) {
    opcFacturas.unshift({ valor: facturaId, etiqueta: registro && leer(registro, 'factura') ? etiquetaFactura(leer(registro, 'factura') as Fila) : `Factura #${facturaId}` });
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (editable) guardar();
      }}
    >
      <ToolbarDocumento
        titulo={id ? `Recepción ${texto(leer(registro, 'numero'))}` : 'Nueva recepción'}
        subtitulo="Levante una factura de compra pendiente e indique las cantidades recibidas (parcial admitido)"
        estado={<BadgeEstado estado={estado} />}
        onNuevo={() => router.push('/compras/recepciones/nuevo')}
        onGuardar={editable ? guardar : undefined}
        puedeGuardar={Boolean(facturaId && depositoId && lineas.some((l) => l.cantidad > 0))}
        onConfirmar={id && estado === 'borrador' ? () => ejecutar(async () => (await confirmarRecepcion(id)) as ResultadoAccion) : undefined}
        etiquetaConfirmar="Confirmar ingreso"
        onAnular={id && estado === 'confirmado' ? (m) => ejecutar(async () => (await anularRecepcion(id, m)) as ResultadoAccion) : undefined}
        onCancelar={() => router.push('/compras/recepciones')}
        ocupado={ocupado}
      />
      {res ? res.ok ? <Aviso tipo="exito">Operación realizada.</Aviso> : <Aviso>{res.error}</Aviso> : null}

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-3">
          <Seccion titulo="Cabecera">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Field etiqueta="Factura de compra pendiente" requerido className="sm:col-span-2" error={err.facturaCompraId}>
                <Select value={facturaId} disabled={!editable || !!id} onChange={(e) => levantarFactura(e.target.value)} opciones={opcFacturas} placeholder="Seleccione factura…" />
              </Field>
              <Field etiqueta="Fecha" requerido error={err.fecha}>
                <DateInput value={fecha} onChange={setFecha} disabled={!editable} />
              </Field>
              <Field etiqueta="Depósito" requerido error={err.depositoId}>
                <Select value={depositoId} onChange={(e) => setDepositoId(e.target.value)} opciones={depositos} placeholder="Seleccione…" disabled={!editable} />
              </Field>
              <Field etiqueta="Observación" className="sm:col-span-4">
                <Textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} disabled={!editable} rows={2} />
              </Field>
            </div>
          </Seccion>

          <div className="overflow-x-auto rounded border border-borde bg-panel">
            <table className="w-full min-w-[720px] text-[12.5px]">
              <thead className="bg-panel-2 text-[11px] uppercase tracking-wide text-tenue">
                <tr>
                  <th className="px-2 py-1 text-left">Código</th>
                  <th className="px-2 py-1 text-left">Descripción</th>
                  <th className="px-2 py-1 text-right">Facturado</th>
                  <th className="px-2 py-1 text-right">Ya recibido</th>
                  <th className="px-2 py-1 text-right">Pendiente</th>
                  <th className="w-32 px-2 py-1 text-right">A recibir</th>
                  <th className="px-2 py-1 text-right">Costo unit.</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, i) => {
                  const pend = Math.max(l.facturada - l.yaRecibida, 0);
                  const excede = l.cantidad > pend + 1e-9;
                  return (
                    <tr key={`${l.detalleOrigenId}-${i}`} className="border-b border-borde/60">
                      <td className="px-2 py-1 font-mono text-[12px]">{l.codigo}</td>
                      <td className="px-2 py-1">{l.descripcion}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{formatoCantidad(l.facturada)}</td>
                      <td className="px-2 py-1 text-right tabular-nums text-tenue">{formatoCantidad(l.yaRecibida)}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{formatoCantidad(pend)}</td>
                      <td className="px-1 py-1">
                        <NumberInput
                          value={l.cantidad}
                          disabled={!editable}
                          aria-label={`Cantidad a recibir ${l.descripcion}`}
                          aria-invalid={excede}
                          title={excede ? 'Supera lo pendiente de recibir' : undefined}
                          onChange={(v) => setLineas((ls) => ls.map((x, j) => (j === i ? { ...x, cantidad: v } : x)))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-rec]'));
                              const k = inputs.indexOf(e.currentTarget);
                              inputs[k + 1]?.focus();
                            }
                          }}
                          data-rec=""
                        />
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums">{formatoGs(l.costoUnitarioGs)}</td>
                    </tr>
                  );
                })}
                {lineas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-6 text-center text-tenue">
                      Seleccione una factura de compra para levantar sus ítems pendientes.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="flex flex-col gap-3">
          <Seccion titulo="Resumen">
            <dl className="grid gap-1 text-[12.5px]">
              <div className="flex justify-between">
                <dt className="text-tenue">Ítems a recibir</dt>
                <dd className="tabular-nums">{lineas.filter((l) => l.cantidad > 0).length}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Costo estimado</dt>
                <dd className="tabular-nums">{formatoGs(totalCosto)}</dd>
              </div>
            </dl>
            {editable && lineas.length ? (
              <Boton tamano="sm" className="mt-2 w-full" onClick={() => setLineas((ls) => ls.map((l) => ({ ...l, cantidad: Math.max(l.facturada - l.yaRecibida, 0) })))}>
                Recibir todo lo pendiente
              </Boton>
            ) : null}
          </Seccion>
          {id ? <PanelDocumentosRelacionados relacionados={{ origen: docsRel('factura_compra', leer(registro, 'factura')), destino: [] }} /> : null}
        </aside>
      </div>
      <button type="submit" hidden />
    </form>
  );
}
