'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { anularAsiento, guardarAsientoManual } from '@/server/actions/contabilidad';
import { BadgeEstado } from '@/components/ui/Badge';
import { Aviso, Boton, DateInput, Field, Input, MoneyInput, Select } from '@/components/ui/Campos';
import { Icono } from '@/components/ui/Icono';
import { Seccion } from '@/components/ui/Pagina';
import { ToolbarDocumento } from '@/components/ui/ToolbarDocumento';
import { comoFilas, erroresPorCampo, idDeResultado, leer, leerPrimero, num, texto, type Fila, type Opcion, type ResultadoAccion } from '@/lib/ui/datos';
import { formatoGs, hoyISO } from '@/lib/ui/formato';

type Linea = { key: number; cuentaId: string; debeGs: number; haberGs: number; glosa: string };
let k = 0;
const nueva = (): Linea => ({ key: k++, cuentaId: '', debeGs: 0, haberGs: 0, glosa: '' });

export function FormularioAsiento({ registro, cuentas }: { registro: Fila | null; cuentas: Fila[] }) {
  const router = useRouter();
  const id = registro ? num(leer(registro, 'id')) || null : null;
  const estado = texto(leer(registro, 'estado')) || 'borrador';
  const origen = texto(leer(registro, 'origen_tipo')) || 'manual';
  const editable = (!id || estado === 'borrador') && origen === 'manual';
  const [fecha, setFecha] = useState(texto(leer(registro, 'fecha')) || hoyISO());
  const [concepto, setConcepto] = useState(texto(leer(registro, 'concepto')));
  const [lineas, setLineas] = useState<Linea[]>(() => {
    const l = comoFilas(leerPrimero(registro, 'detalles', 'lineas')).map((d) => ({
      key: k++,
      cuentaId: texto(leer(d, 'cuenta_id')),
      debeGs: num(leer(d, 'debe_gs')),
      haberGs: num(leer(d, 'haber_gs')),
      glosa: texto(leer(d, 'glosa')),
    }));
    return l.length ? l : [nueva(), nueva()];
  });
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();

  const opc: Opcion[] = cuentas
    .filter((c) => leer(c, 'imputable') !== false)
    .map((c) => ({ valor: texto(leer(c, 'id')), etiqueta: `${texto(leer(c, 'codigo'))} ${texto(leer(c, 'nombre'))}` }));
  const nombreCuenta = (cid: string) => opc.find((o) => o.valor === cid)?.etiqueta ?? cid;

  const validas = lineas.filter((l) => l.cuentaId && (l.debeGs > 0 || l.haberGs > 0));
  const debe = validas.reduce((a, l) => a + l.debeGs, 0);
  const haber = validas.reduce((a, l) => a + l.haberGs, 0);
  const dif = debe - haber;
  const lineasAmbas = lineas.some((l) => l.debeGs > 0 && l.haberGs > 0);
  const cuadra = dif === 0 && debe > 0 && validas.length >= 2 && !lineasAmbas;

  const set = (key: number, c: Partial<Linea>) => setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, ...c } : l)));

  const guardar = (confirmar: boolean) =>
    start(async () => {
      if (!cuadra) return;
      const r = (await guardarAsientoManual({
        ...(id ? { id } : {}),
        fecha,
        concepto: concepto.trim(),
        confirmar,
        lineas: validas.map((l) => ({ cuentaId: Number(l.cuentaId), debeGs: l.debeGs, haberGs: l.haberGs, glosa: l.glosa || null })),
      } as never)) as ResultadoAccion;
      setRes(r);
      if (r.ok) {
        const nid = idDeResultado(r) ?? id;
        if (!id && nid) router.push(`/contabilidad/asientos/${nid}`);
        router.refresh();
      }
    });

  const anular = (motivo: string) =>
    start(async () => {
      if (!id) return;
      const r = (await anularAsiento(id, motivo)) as ResultadoAccion;
      setRes(r);
      if (r.ok) router.refresh();
    });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (editable) guardar(false);
      }}
    >
      <ToolbarDocumento
        titulo={id ? `Asiento ${texto(leer(registro, 'numero'))}` : 'Nuevo asiento manual'}
        subtitulo={origen !== 'manual' ? `Asiento automático (origen: ${origen.replace(/_/g, ' ')})` : 'Debe = Haber para poder guardar'}
        estado={<BadgeEstado estado={estado} />}
        onNuevo={() => router.push('/contabilidad/asientos/nuevo')}
        onGuardar={editable ? () => guardar(false) : undefined}
        puedeGuardar={cuadra && concepto.trim().length > 0}
        onConfirmar={editable ? () => guardar(true) : undefined}
        puedeConfirmar={cuadra && concepto.trim().length > 0}
        onAnular={id && estado === 'confirmado' ? anular : undefined}
        onCancelar={() => router.push('/contabilidad/asientos')}
        ocupado={ocupado}
      />
      {res ? res.ok ? <Aviso tipo="exito">Asiento guardado.</Aviso> : <Aviso>{res.error}</Aviso> : null}

      <Seccion titulo="Cabecera">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field etiqueta="Fecha" requerido>
            <DateInput value={fecha} onChange={setFecha} disabled={!editable} />
          </Field>
          <Field etiqueta="Concepto" requerido className="sm:col-span-3" error={erroresPorCampo(res).concepto}>
            <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} disabled={!editable} maxLength={255} />
          </Field>
        </div>
      </Seccion>

      <div className="overflow-x-auto rounded border border-borde bg-panel">
        <table className="w-full min-w-[760px] text-[12.5px]">
          <thead className="bg-panel-2 text-[11px] uppercase tracking-wide text-tenue">
            <tr>
              <th className="w-8 px-2 py-1 text-right">#</th>
              <th className="px-2 py-1 text-left">Cuenta</th>
              <th className="w-40 px-2 py-1 text-right">Debe</th>
              <th className="w-40 px-2 py-1 text-right">Haber</th>
              <th className="px-2 py-1 text-left">Glosa</th>
              {editable ? <th className="w-8" /> : null}
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => {
              const ambas = l.debeGs > 0 && l.haberGs > 0;
              return (
                <tr key={l.key} className="border-b border-borde/60">
                  <td className="px-2 text-right tabular-nums text-tenue">{i + 1}</td>
                  <td className="px-1 py-0.5">
                    {editable ? (
                      <Select value={l.cuentaId} onChange={(e) => set(l.key, { cuentaId: e.target.value })} opciones={opc} placeholder="Seleccione cuenta…" aria-label={`Cuenta línea ${i + 1}`} />
                    ) : (
                      <span className="px-1">{texto(leerPrimero(comoFilas(leerPrimero(registro, 'detalles', 'lineas'))[i], 'cuenta.nombre', 'cuenta_nombre')) || nombreCuenta(l.cuentaId)}</span>
                    )}
                  </td>
                  <td className="px-1 py-0.5">
                    <MoneyInput value={l.debeGs} disabled={!editable} aria-invalid={ambas} onChange={(v) => set(l.key, { debeGs: v, haberGs: v > 0 ? 0 : l.haberGs })} aria-label={`Debe línea ${i + 1}`} />
                  </td>
                  <td className="px-1 py-0.5">
                    <MoneyInput value={l.haberGs} disabled={!editable} aria-invalid={ambas} onChange={(v) => set(l.key, { haberGs: v, debeGs: v > 0 ? 0 : l.debeGs })} aria-label={`Haber línea ${i + 1}`} />
                  </td>
                  <td className="px-1 py-0.5">
                    <Input value={l.glosa} disabled={!editable} onChange={(e) => set(l.key, { glosa: e.target.value })} aria-label={`Glosa línea ${i + 1}`} />
                  </td>
                  {editable ? (
                    <td className="px-1 text-center">
                      <button type="button" onClick={() => setLineas((x) => x.filter((y) => y.key !== l.key))} className="rounded p-1 text-tenue hover:text-peligro" aria-label="Quitar línea">
                        <Icono nombre="basura" className="size-3.5" />
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-panel-2 font-semibold">
            <tr>
              <td />
              <td className="px-2 py-1.5">
                {editable ? (
                  <Boton tamano="sm" onClick={() => setLineas((x) => [...x, nueva()])}>
                    <Icono nombre="mas" className="size-3.5" /> Agregar línea
                  </Boton>
                ) : (
                  'Totales'
                )}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">{formatoGs(debe)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{formatoGs(haber)}</td>
              <td colSpan={editable ? 2 : 1} className="px-2 py-1.5">
                <span
                  role="status"
                  className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[12px] ${cuadra ? 'bg-exito/10 text-exito' : 'bg-peligro/10 text-peligro'}`}
                >
                  <Icono nombre={cuadra ? 'check' : 'alerta'} className="size-3.5" />
                  {cuadra
                    ? 'Cuadra: Debe = Haber'
                    : lineasAmbas
                      ? 'Cada línea va al Debe o al Haber'
                      : validas.length < 2
                        ? 'Mínimo dos líneas'
                        : `No cuadra: diferencia ${formatoGs(Math.abs(dif))} ${dif > 0 ? '(falta Haber)' : '(falta Debe)'}`}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <button type="submit" hidden />
    </form>
  );
}
