'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { abrirCaja, anularCobro, cerrarCaja } from '@/server/actions/caja';
import { useTienePermiso } from '@/components/layout/SesionContexto';
import { BadgeEstado } from '@/components/ui/Badge';
import { Aviso, Boton, Field, Input, MoneyInput, Select, Textarea } from '@/components/ui/Campos';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { Seccion } from '@/components/ui/Pagina';
import { comoFilas, leer, leerPrimero, num, texto, type Fila, type ResultadoAccion } from '@/lib/ui/datos';
import { formatoFechaHora, formatoGs } from '@/lib/ui/formato';

const MEDIOS = [
  { medio: 'efectivo', titulo: 'Efectivo', clave: 'total_efectivo_gs' },
  { medio: 'transferencia', titulo: 'Transferencia', clave: 'total_transferencia_gs' },
  { medio: 'tarjeta', titulo: 'Tarjeta', clave: 'total_tarjeta_gs' },
  { medio: 'qr', titulo: 'QR', clave: 'total_qr_gs' },
] as const;

export function PanelCaja({ cajas, sesion }: { cajas: Fila[]; sesion: Fila | null }) {
  const router = useRouter();
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();
  const puedeAbrir = useTienePermiso('caja.sesion.abrir');
  const puedeCerrar = useTienePermiso('caja.sesion.cerrar');
  const puedeAnularCobro = useTienePermiso('caja.cobro.anular');

  // Apertura
  const [cajaId, setCajaId] = useState(texto(leer(cajas[0], 'id')));
  const [apertura, setApertura] = useState(0);

  // Cierre / arqueo
  const [declarado, setDeclarado] = useState<Record<string, number>>({});
  const [obsCierre, setObsCierre] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const [anulando, setAnulando] = useState<{ id: number; motivo: string } | null>(null);

  const ejecutar = (fn: () => Promise<ResultadoAccion>, despues?: () => void) =>
    start(async () => {
      const r = await fn();
      setRes(r);
      if (r.ok) {
        despues?.();
        router.refresh();
      }
    });

  if (!sesion || texto(leer(sesion, 'estado')) === 'cerrada') {
    return (
      <div className="grid max-w-xl gap-3">
        {res ? res.ok ? <Aviso tipo="exito">Caja abierta.</Aviso> : <Aviso>{res.error}</Aviso> : null}
        <Seccion titulo="Apertura de caja">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              ejecutar(async () => (await abrirCaja({ cajaId: Number(cajaId), montoAperturaGs: apertura })) as ResultadoAccion);
            }}
          >
            <Field etiqueta="Caja" requerido htmlFor="caja-sel">
              <Select
                id="caja-sel"
                value={cajaId}
                onChange={(e) => setCajaId(e.target.value)}
                opciones={cajas.map((c) => ({ valor: texto(leer(c, 'id')), etiqueta: `${texto(leer(c, 'codigo'))} · ${texto(leer(c, 'nombre'))}` }))}
                placeholder="Seleccione…"
              />
            </Field>
            <Field etiqueta="Fondo de apertura" htmlFor="caja-apertura">
              <MoneyInput id="caja-apertura" value={apertura} onChange={setApertura} />
            </Field>
            <div className="sm:col-span-2">
              <Boton type="submit" variante="primario" disabled={ocupado || !cajaId || !puedeAbrir}>
                <Icono nombre="caja" className="size-4" /> Abrir caja
              </Boton>
              {!puedeAbrir ? <p className="mt-1 text-[11px] text-tenue">Requiere permiso caja.sesion.abrir.</p> : null}
            </div>
          </form>
        </Seccion>
      </div>
    );
  }

  const sesionId = num(leer(sesion, 'id'));
  const montoApertura = num(leer(sesion, 'monto_apertura_gs'));
  // Durante la sesión abierta el backend expone `totales.{medio}`; al cierre quedan en total_*_gs.
  const sistema = (m: (typeof MEDIOS)[number]) => num(leerPrimero(sesion, `totales.${m.medio}`, m.clave)) + (m.medio === 'efectivo' ? montoApertura : 0);
  const cobros = comoFilas(leer(sesion, 'cobros'));
  const totalDif = MEDIOS.reduce((a, m) => a + ((declarado[m.medio] ?? 0) - sistema(m)), 0);

  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-3">
        {res ? res.ok ? <Aviso tipo="exito">Operación realizada.</Aviso> : <Aviso>{res.error}</Aviso> : null}
        <Seccion
          titulo="Sesión de caja abierta"
          acciones={
            <div className="flex gap-1.5">
              <Link href="/ventas/cobros/nuevo" className="inline-flex h-7 items-center gap-1 rounded bg-primario px-2 text-[12px] text-primario-texto hover:bg-primario-hover">
                <Icono nombre="mas" className="size-3.5" /> Nuevo cobro
              </Link>
              <Link href="/ventas/facturas/nuevo" className="inline-flex h-7 items-center gap-1 rounded border border-borde px-2 text-[12px] hover:bg-panel-2">
                Nueva factura
              </Link>
            </div>
          }
        >
          <dl className="grid grid-cols-2 gap-2 text-[12.5px] sm:grid-cols-4">
            <div>
              <dt className="text-[11px] text-tenue">Caja</dt>
              <dd className="font-medium">{texto(leerPrimero(sesion, 'caja.nombre', 'caja_nombre', 'caja'))}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-tenue">Abierta</dt>
              <dd>{formatoFechaHora(leer(sesion, 'abierta_en'))}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-tenue">Fondo inicial</dt>
              <dd className="tabular-nums">{formatoGs(montoApertura)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-tenue">Estado</dt>
              <dd>
                <BadgeEstado estado={leer(sesion, 'estado')} />
              </dd>
            </div>
          </dl>
        </Seccion>
        <Seccion titulo="Cobros de la sesión">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-panel-2 text-[11px] uppercase tracking-wide text-tenue">
                <tr>
                  <th className="px-2 py-1 text-left">Nro.</th>
                  <th className="px-2 py-1 text-left">Fecha</th>
                  <th className="px-2 py-1 text-left">Cliente</th>
                  <th className="px-2 py-1 text-right">Total</th>
                  <th className="px-2 py-1 text-left">Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cobros.map((c) => (
                  <tr key={texto(leer(c, 'id'))} className="border-b border-borde/60">
                    <td className="px-2 py-1 tabular-nums">{texto(leer(c, 'numero'))}</td>
                    <td className="px-2 py-1">{formatoFechaHora(leer(c, 'fecha'))}</td>
                    <td className="px-2 py-1">{texto(leerPrimero(c, 'cliente.razon_social', 'cliente_razon_social', 'cliente'))}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{formatoGs(leer(c, 'total_gs'))}</td>
                    <td className="px-2 py-1">
                      <BadgeEstado estado={leer(c, 'estado')} />
                    </td>
                    <td className="px-2 py-1 text-right">
                      {puedeAnularCobro && texto(leer(c, 'estado')) !== 'anulado' ? (
                        <Boton tamano="sm" variante="peligro" onClick={() => setAnulando({ id: num(leer(c, 'id')), motivo: '' })}>
                          Anular
                        </Boton>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {cobros.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-tenue">
                      Sin cobros en esta sesión.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Seccion>
      </div>

      <Seccion titulo="Cierre y arqueo">
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setCerrando(true);
          }}
        >
          <table className="w-full text-[12.5px]">
            <thead className="text-[11px] uppercase tracking-wide text-tenue">
              <tr>
                <th className="py-1 text-left">Medio</th>
                <th className="py-1 text-right">Sistema</th>
                <th className="w-36 py-1 text-right">Declarado</th>
                <th className="py-1 text-right">Dif.</th>
              </tr>
            </thead>
            <tbody>
              {MEDIOS.map((m) => {
                const dif = (declarado[m.medio] ?? 0) - sistema(m);
                return (
                  <tr key={m.medio} className="border-b border-borde/60">
                    <td className="py-1">{m.titulo}</td>
                    <td className="py-1 text-right tabular-nums">{formatoGs(sistema(m), false)}</td>
                    <td className="py-1 pl-2">
                      <MoneyInput value={declarado[m.medio] ?? 0} onChange={(v) => setDeclarado((d) => ({ ...d, [m.medio]: v }))} aria-label={`Declarado ${m.titulo}`} />
                    </td>
                    <td className={`py-1 text-right tabular-nums ${dif < 0 ? 'text-peligro' : dif > 0 ? 'text-aviso' : 'text-exito'}`}>{formatoGs(dif, false)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={3} className="py-1 text-right">
                  Diferencia total
                </td>
                <td className={`py-1 text-right tabular-nums ${totalDif < 0 ? 'text-peligro' : totalDif > 0 ? 'text-aviso' : 'text-exito'}`}>{formatoGs(totalDif, false)}</td>
              </tr>
            </tfoot>
          </table>
          <Field etiqueta="Observación de cierre">
            <Textarea value={obsCierre} onChange={(e) => setObsCierre(e.target.value)} rows={2} />
          </Field>
          <Boton type="submit" variante="primario" disabled={ocupado || !puedeCerrar}>
            Cerrar caja
          </Boton>
          {!puedeCerrar ? <p className="text-[11px] text-tenue">Requiere permiso caja.sesion.cerrar.</p> : null}
        </form>
      </Seccion>

      <Modal
        abierto={cerrando}
        onCerrar={() => setCerrando(false)}
        titulo="Confirmar cierre de caja"
        pie={
          <>
            <Boton onClick={() => setCerrando(false)}>Cancelar</Boton>
            <Boton
              variante="primario"
              disabled={ocupado}
              onClick={() =>
                ejecutar(
                  async () =>
                    (await cerrarCaja({
                      sesionCajaId: sesionId,
                      arqueo: MEDIOS.map((m) => ({ medioPago: m.medio, montoDeclaradoGs: declarado[m.medio] ?? 0 })),
                      observacion: obsCierre || null,
                    })) as ResultadoAccion,
                  () => setCerrando(false),
                )
              }
            >
              Cerrar caja
            </Boton>
          </>
        }
      >
        <p className="text-[13px]">
          Diferencia total del arqueo: <strong className="tabular-nums">{formatoGs(totalDif)}</strong>. Esta operación no se puede deshacer.
        </p>
      </Modal>

      <Modal
        abierto={anulando !== null}
        onCerrar={() => setAnulando(null)}
        titulo="Anular cobro"
        pie={
          <>
            <Boton onClick={() => setAnulando(null)}>Cancelar</Boton>
            <Boton
              variante="peligro"
              disabled={!anulando || anulando.motivo.trim().length < 3}
              onClick={() => anulando && ejecutar(async () => (await anularCobro(anulando.id, anulando.motivo.trim())) as ResultadoAccion, () => setAnulando(null))}
            >
              Anular
            </Boton>
          </>
        }
      >
        <Field etiqueta="Motivo" requerido>
          <Input autoFocus value={anulando?.motivo ?? ''} onChange={(e) => setAnulando((a) => (a ? { ...a, motivo: e.target.value } : a))} />
        </Field>
      </Modal>
    </div>
  );
}
