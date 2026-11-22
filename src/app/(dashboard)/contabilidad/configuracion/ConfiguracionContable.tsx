'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { guardarConfiguracionContable } from '@/server/actions/contabilidad';
import { Aviso, Boton, Input, Select } from '@/components/ui/Campos';
import { Icono } from '@/components/ui/Icono';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { leer, num, texto, type Fila, type Opcion, type ResultadoAccion } from '@/lib/ui/datos';

const OPERACIONES = ['compra', 'recepcion', 'venta', 'costo_venta', 'cobro', 'pago', 'ajuste_merma', 'ajuste_sobrante', 'transferencia', 'diferencia_caja'];

type FilaCfg = { key: string; id: number | null; operacion: string; concepto: string; lado: string; cuentaId: string; descripcion: string; sucio: boolean };

let n = 0;

export function ConfiguracionContable({ filas, cuentas }: { filas: Fila[]; cuentas: Fila[] }) {
  const router = useRouter();
  const [datos, setDatos] = useState<FilaCfg[]>(() =>
    filas.map((f) => ({
      key: `c${n++}`,
      id: num(leer(f, 'id')) || null,
      operacion: texto(leer(f, 'operacion')),
      concepto: texto(leer(f, 'concepto')),
      lado: texto(leer(f, 'lado')),
      cuentaId: texto(leer(f, 'cuenta_id')),
      descripcion: texto(leer(f, 'descripcion')),
      sucio: false,
    })),
  );
  const [msg, setMsg] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();
  const [filtroOp, setFiltroOp] = useState('');

  const opcCuentas: Opcion[] = cuentas
    .filter((c) => leer(c, 'imputable'))
    .map((c) => ({ valor: texto(leer(c, 'id')), etiqueta: `${texto(leer(c, 'codigo'))} ${texto(leer(c, 'nombre'))}` }));

  const set = (key: string, c: Partial<FilaCfg>) => setDatos((d) => d.map((x) => (x.key === key ? { ...x, ...c, sucio: true } : x)));

  const guardarTodo = () =>
    start(async () => {
      for (const f of datos.filter((d) => d.sucio)) {
        const r = (await guardarConfiguracionContable({
          ...(f.id ? { id: f.id } : {}),
          operacion: f.operacion,
          concepto: f.concepto.trim(),
          lado: f.lado,
          cuentaId: Number(f.cuentaId),
          descripcion: f.descripcion || null,
        } as never)) as ResultadoAccion;
        if (!r.ok) {
          setMsg({ ok: false, error: `${f.operacion}/${f.concepto}: ${r.error}` });
          return;
        }
      }
      setMsg({ ok: true });
      router.refresh();
    });

  const visibles = datos.filter((d) => !filtroOp || d.operacion === filtroOp);
  const pendientes = datos.filter((d) => d.sucio).length;

  return (
    <>
      <EncabezadoPagina
        titulo="Configuración contable"
        descripcion="Mapeo operación → cuenta para los asientos automáticos (cada concepto es una pata del asiento)."
        acciones={
          <>
            <Boton
              tamano="sm"
              onClick={() =>
                setDatos((d) => [...d, { key: `c${n++}`, id: null, operacion: filtroOp || 'venta', concepto: '', lado: 'debe', cuentaId: '', descripcion: '', sucio: true }])
              }
            >
              <Icono nombre="mas" className="size-3.5" /> Agregar
            </Boton>
            <Boton tamano="sm" variante="primario" disabled={!pendientes || ocupado} onClick={guardarTodo}>
              <Icono nombre="guardar" className="size-3.5" /> Guardar cambios {pendientes ? `(${pendientes})` : ''}
            </Boton>
          </>
        }
      />
      {msg ? msg.ok ? <Aviso tipo="exito">Configuración guardada.</Aviso> : <Aviso>{msg.error}</Aviso> : null}
      <div className="my-2 w-56">
        <Select value={filtroOp} onChange={(e) => setFiltroOp(e.target.value)} opciones={OPERACIONES.map((o) => ({ valor: o, etiqueta: o }))} placeholder="Todas las operaciones" aria-label="Filtrar operación" />
      </div>
      <div className="overflow-x-auto rounded border border-borde bg-panel">
        <table className="w-full min-w-[860px] text-[12.5px]">
          <thead className="bg-panel-2 text-[11px] uppercase tracking-wide text-tenue">
            <tr>
              <th className="w-40 px-2 py-1 text-left">Operación</th>
              <th className="w-44 px-2 py-1 text-left">Concepto</th>
              <th className="w-24 px-2 py-1 text-left">Lado</th>
              <th className="px-2 py-1 text-left">Cuenta</th>
              <th className="px-2 py-1 text-left">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.key} className={`border-b border-borde/60 ${f.sucio ? 'bg-aviso/5' : ''}`}>
                <td className="px-1 py-0.5">
                  <Select value={f.operacion} onChange={(e) => set(f.key, { operacion: e.target.value })} opciones={OPERACIONES.map((o) => ({ valor: o, etiqueta: o }))} aria-label="Operación" />
                </td>
                <td className="px-1 py-0.5">
                  <Input value={f.concepto} onChange={(e) => set(f.key, { concepto: e.target.value })} aria-label="Concepto" className="font-mono" />
                </td>
                <td className="px-1 py-0.5">
                  <Select
                    value={f.lado}
                    onChange={(e) => set(f.key, { lado: e.target.value })}
                    opciones={[
                      { valor: 'debe', etiqueta: 'Debe' },
                      { valor: 'haber', etiqueta: 'Haber' },
                    ]}
                    aria-label="Lado"
                  />
                </td>
                <td className="px-1 py-0.5">
                  <Select value={f.cuentaId} onChange={(e) => set(f.key, { cuentaId: e.target.value })} opciones={opcCuentas} placeholder="Seleccione…" aria-label="Cuenta" />
                </td>
                <td className="px-1 py-0.5">
                  <Input value={f.descripcion} onChange={(e) => set(f.key, { descripcion: e.target.value })} aria-label="Descripción" />
                </td>
              </tr>
            ))}
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-tenue">
                  Sin configuración.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
