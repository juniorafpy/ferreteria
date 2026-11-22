'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { registrarCobro } from '@/server/actions/caja';
import { cuentasCobrarUI } from '@/app/(dashboard)/_acciones/busqueda';
import { TablaAplicacion } from '@/components/forms/TablaAplicacion';
import { BuscadorEntidad, type ValorEntidad } from '@/components/ui/BuscadorEntidad';
import { Aviso, Boton, Field, Input, MoneyInput, Select, Textarea } from '@/components/ui/Campos';
import { Icono } from '@/components/ui/Icono';
import { Seccion } from '@/components/ui/Pagina';
import { ToolbarDocumento } from '@/components/ui/ToolbarDocumento';
import { comoFilas, erroresPorCampo, leer, leerPrimero, num, texto, type Fila, type ResultadoAccion } from '@/lib/ui/datos';
import { formatoGs } from '@/lib/ui/formato';

type Medio = {
  key: number;
  medioPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'qr';
  montoGs: number;
  referencia: string;
  banco: string;
  tipoTarjeta: '' | 'credito' | 'debito';
  marcaTarjeta: string;
  ultimosDigitos: string;
};

let k = 0;
const medioNuevo = (monto = 0): Medio => ({
  key: k++,
  medioPago: 'efectivo',
  montoGs: monto,
  referencia: '',
  banco: '',
  tipoTarjeta: '',
  marcaTarjeta: '',
  ultimosDigitos: '',
});

export function FormularioCobro() {
  const router = useRouter();
  const [cliente, setCliente] = useState<ValorEntidad>(null);
  const [cuentas, setCuentas] = useState<Fila[]>([]);
  const [aplicado, setAplicado] = useState<Record<string, number>>({});
  const [medios, setMedios] = useState<Medio[]>([medioNuevo()]);
  const [observacion, setObservacion] = useState('');
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();

  useEffect(() => {
    cuentasCobrarUI(cliente?.id).then((r) => {
      setCuentas(comoFilas(r).filter((c) => num(leer(c, 'saldo_gs')) > 0 && texto(leer(c, 'estado')) !== 'anulado'));
      setAplicado({});
    });
  }, [cliente]);

  const totalAplicado = Object.values(aplicado).reduce((a, b) => a + b, 0);
  const totalMedios = medios.reduce((a, m) => a + m.montoGs, 0);
  const vuelto = Math.max(totalMedios - totalAplicado, 0);
  const falta = Math.max(totalAplicado - totalMedios, 0);
  const vueltoSinEfectivo = vuelto > 0 && !medios.some((m) => m.medioPago === 'efectivo' && m.montoGs > 0);
  const err = erroresPorCampo(res);

  const setMedio = (key: number, c: Partial<Medio>) => setMedios((ms) => ms.map((m) => (m.key === key ? { ...m, ...c } : m)));

  const guardar = () =>
    start(async () => {
      const r = (await registrarCobro({
        clienteId: cliente?.id ?? null,
        cuentas: Object.entries(aplicado)
          .filter(([, m]) => m > 0)
          .map(([id, m]) => ({ cuentaCobrarId: Number(id), montoGs: m })),
        medios: medios
          .filter((m) => m.montoGs > 0)
          .map((m) => ({
            medioPago: m.medioPago,
            montoGs: m.montoGs,
            referencia: m.referencia || null,
            banco: m.banco || null,
            tipoTarjeta: m.medioPago === 'tarjeta' ? m.tipoTarjeta || null : null,
            marcaTarjeta: m.medioPago === 'tarjeta' ? m.marcaTarjeta || null : null,
            ultimosDigitos: m.medioPago === 'tarjeta' && m.ultimosDigitos ? m.ultimosDigitos : null,
          })),
        observacion: observacion || null,
      } as never)) as ResultadoAccion;
      setRes(r);
      if (r.ok) {
        router.push('/ventas/cobros');
        router.refresh();
      }
    });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        guardar();
      }}
    >
      <ToolbarDocumento
        titulo="Nuevo cobro"
        subtitulo="Seleccione cuentas a cobrar y registre los medios de pago"
        onNuevo={() => router.refresh()}
        onGuardar={guardar}
        puedeGuardar={totalAplicado > 0 && falta === 0 && !vueltoSinEfectivo}
        onCancelar={() => router.push('/ventas/cobros')}
        ocupado={ocupado}
      />
      {res && !res.ok ? <Aviso>{res.error}</Aviso> : null}

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-3">
          <Seccion titulo="Cliente y cuentas">
            <Field etiqueta="Cliente" className="mb-3 max-w-xl" ayuda="Vacío = todas las cuentas pendientes de la sucursal">
              <BuscadorEntidad
                tipo="cliente"
                permitirCrear={false}
                valor={cliente}
                onCambiar={(c) => setCliente(c ? { id: num(leer(c, 'id')), etiqueta: texto(leerPrimero(c, 'razon_social', 'persona.razon_social')) } : null)}
              />
            </Field>
            {err.cuentas ? <p className="mb-2 text-[12px] text-peligro">{err.cuentas}</p> : null}
            <TablaAplicacion cuentas={cuentas} aplicado={aplicado} onCambiar={setAplicado} />
          </Seccion>

          <Seccion
            titulo="Medios de pago"
            acciones={
              <Boton tamano="sm" onClick={() => setMedios((m) => [...m, medioNuevo(falta)])}>
                <Icono nombre="mas" className="size-3.5" /> Agregar medio
              </Boton>
            }
          >
            {err.medios ? <p className="mb-2 text-[12px] text-peligro">{err.medios}</p> : null}
            <div className="grid gap-2">
              {medios.map((m) => (
                <div key={m.key} className="grid grid-cols-2 items-end gap-2 rounded border border-borde/70 p-2 sm:grid-cols-6">
                  <Field etiqueta="Medio">
                    <Select
                      value={m.medioPago}
                      onChange={(e) => setMedio(m.key, { medioPago: e.target.value as Medio['medioPago'] })}
                      opciones={[
                        { valor: 'efectivo', etiqueta: 'Efectivo' },
                        { valor: 'transferencia', etiqueta: 'Transferencia' },
                        { valor: 'tarjeta', etiqueta: 'Tarjeta' },
                        { valor: 'qr', etiqueta: 'QR' },
                      ]}
                    />
                  </Field>
                  <Field etiqueta="Monto">
                    <MoneyInput value={m.montoGs} onChange={(v) => setMedio(m.key, { montoGs: v })} />
                  </Field>
                  {m.medioPago !== 'efectivo' ? (
                    <Field etiqueta={m.medioPago === 'tarjeta' ? 'Autorización' : 'Referencia'} requerido>
                      <Input value={m.referencia} onChange={(e) => setMedio(m.key, { referencia: e.target.value })} />
                    </Field>
                  ) : null}
                  {m.medioPago === 'transferencia' ? (
                    <Field etiqueta="Banco">
                      <Input value={m.banco} onChange={(e) => setMedio(m.key, { banco: e.target.value })} />
                    </Field>
                  ) : null}
                  {m.medioPago === 'tarjeta' ? (
                    <>
                      <Field etiqueta="Tipo" requerido>
                        <Select
                          value={m.tipoTarjeta}
                          onChange={(e) => setMedio(m.key, { tipoTarjeta: e.target.value as Medio['tipoTarjeta'] })}
                          opciones={[
                            { valor: 'credito', etiqueta: 'Crédito' },
                            { valor: 'debito', etiqueta: 'Débito' },
                          ]}
                          placeholder="—"
                        />
                      </Field>
                      <Field etiqueta="Marca">
                        <Input value={m.marcaTarjeta} onChange={(e) => setMedio(m.key, { marcaTarjeta: e.target.value })} />
                      </Field>
                      <Field etiqueta="Últimos 4">
                        <Input
                          inputMode="numeric"
                          maxLength={4}
                          value={m.ultimosDigitos}
                          onChange={(e) => setMedio(m.key, { ultimosDigitos: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        />
                      </Field>
                    </>
                  ) : null}
                  <div className="flex items-end justify-end">
                    <Boton tamano="sm" variante="fantasma" onClick={() => setMedios((x) => (x.length > 1 ? x.filter((y) => y.key !== m.key) : x))} aria-label="Quitar medio">
                      <Icono nombre="basura" className="size-3.5" />
                    </Boton>
                  </div>
                </div>
              ))}
            </div>
          </Seccion>
          <Field etiqueta="Observación">
            <Textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={2} />
          </Field>
        </div>

        <aside>
          <Seccion titulo="Resumen">
            <dl className="grid gap-1 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-tenue">Total a cobrar</dt>
                <dd className="tabular-nums">{formatoGs(totalAplicado)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tenue">Total medios</dt>
                <dd className="tabular-nums">{formatoGs(totalMedios)}</dd>
              </div>
              {falta > 0 ? (
                <div className="flex justify-between font-semibold text-peligro">
                  <dt>Falta</dt>
                  <dd className="tabular-nums">{formatoGs(falta)}</dd>
                </div>
              ) : (
                <div className="flex justify-between border-t border-borde pt-1 text-[15px] font-semibold">
                  <dt>Vuelto</dt>
                  <dd className="tabular-nums">{formatoGs(vuelto)}</dd>
                </div>
              )}
              {vueltoSinEfectivo ? <p className="text-[11px] text-peligro">El vuelto solo puede darse en efectivo.</p> : null}
            </dl>
          </Seccion>
        </aside>
      </div>
      <button type="submit" hidden />
    </form>
  );
}
