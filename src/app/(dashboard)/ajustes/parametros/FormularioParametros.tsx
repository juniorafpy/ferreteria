'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { guardarParametros } from '@/server/actions/ajustes';
import { Aviso, Boton, Input, Select } from '@/components/ui/Campos';
import { Icono } from '@/components/ui/Icono';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { leer, texto, type Fila, type Opcion, type ResultadoAccion } from '@/lib/ui/datos';

type Param = { key: number; clave: string; valor: string; descripcion: string };
let k = 0;

export function FormularioParametros({ parametros, sucursales }: { parametros: Fila[]; sucursales: Opcion[] }) {
  const router = useRouter();
  const [sucursalId, setSucursalId] = useState('');
  const delAmbito = (s: string) =>
    parametros
      .filter((p) => texto(leer(p, 'sucursal_id')) === s)
      .map((p) => ({ key: k++, clave: texto(leer(p, 'clave')), valor: texto(leer(p, 'valor')), descripcion: texto(leer(p, 'descripcion')) }));
  const [filas, setFilas] = useState<Param[]>(() => delAmbito(''));
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();

  const set = (key: number, c: Partial<Param>) => setFilas((f) => f.map((x) => (x.key === key ? { ...x, ...c } : x)));

  const guardar = () =>
    start(async () => {
      const r = (await guardarParametros({
        sucursalId: sucursalId ? Number(sucursalId) : null,
        valores: filas.filter((f) => f.clave.trim()).map((f) => ({ clave: f.clave.trim(), valor: f.valor, descripcion: f.descripcion || null })),
      } as never)) as ResultadoAccion;
      setRes(r);
      if (r.ok) router.refresh();
    });

  return (
    <>
      <EncabezadoPagina
        titulo="Parámetros generales"
        descripcion="Clave/valor por empresa (global) o por sucursal."
        acciones={
          <>
            <Boton tamano="sm" onClick={() => setFilas((f) => [...f, { key: k++, clave: '', valor: '', descripcion: '' }])}>
              <Icono nombre="mas" className="size-3.5" /> Agregar
            </Boton>
            <Boton tamano="sm" variante="primario" onClick={guardar} disabled={ocupado}>
              <Icono nombre="guardar" className="size-3.5" /> Guardar
            </Boton>
          </>
        }
      />
      {res ? res.ok ? <Aviso tipo="exito">Parámetros guardados.</Aviso> : <Aviso>{res.error}</Aviso> : null}
      <div className="my-2 w-64">
        <Select
          aria-label="Ámbito"
          value={sucursalId}
          onChange={(e) => {
            setSucursalId(e.target.value);
            setFilas(delAmbito(e.target.value));
          }}
          opciones={sucursales}
          placeholder="Global (empresa)"
        />
      </div>
      <div className="overflow-x-auto rounded border border-borde bg-panel">
        <table className="w-full min-w-[720px] text-[12.5px]">
          <thead className="bg-panel-2 text-[11px] uppercase tracking-wide text-tenue">
            <tr>
              <th className="w-64 px-2 py-1 text-left">Clave</th>
              <th className="px-2 py-1 text-left">Valor</th>
              <th className="px-2 py-1 text-left">Descripción</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.key} className="border-b border-borde/60">
                <td className="px-1 py-0.5">
                  <Input value={f.clave} onChange={(e) => set(f.key, { clave: e.target.value })} className="font-mono" aria-label="Clave" />
                </td>
                <td className="px-1 py-0.5">
                  <Input value={f.valor} onChange={(e) => set(f.key, { valor: e.target.value })} aria-label="Valor" />
                </td>
                <td className="px-1 py-0.5">
                  <Input value={f.descripcion} onChange={(e) => set(f.key, { descripcion: e.target.value })} aria-label="Descripción" />
                </td>
                <td className="px-1 text-center">
                  <button type="button" onClick={() => setFilas((x) => x.filter((y) => y.key !== f.key))} className="rounded p-1 text-tenue hover:text-peligro" aria-label="Quitar parámetro">
                    <Icono nombre="basura" className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {filas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-center text-tenue">
                  Sin parámetros en este ámbito.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
