'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { anularOrdenPago, registrarOrdenPago } from '@/server/actions/compras';
import type { OrdenPagoInput } from '@/server/validation/compras';
import { cuentasPagarUI } from '@/app/(dashboard)/_acciones/busqueda';
import { TablaAplicacion } from '@/components/forms/TablaAplicacion';
import { BadgeEstado } from '@/components/ui/Badge';
import { BuscadorEntidad, type ValorEntidad } from '@/components/ui/BuscadorEntidad';
import { Aviso, DateInput, Field, Input, Select, Textarea } from '@/components/ui/Campos';
import { Seccion } from '@/components/ui/Pagina';
import { ToolbarDocumento } from '@/components/ui/ToolbarDocumento';
import { comoFilas, erroresPorCampo, idDeResultado, leer, leerPrimero, num, texto, type Fila, type ResultadoAccion } from '@/lib/ui/datos';
import { formatoGs, hoyISO } from '@/lib/ui/formato';

export function FormularioOrdenPago({ registro }: { registro: Fila | null }) {
  const router = useRouter();
  const id = registro ? num(leer(registro, 'id')) || null : null;
  const estado = texto(leer(registro, 'estado'));
  const editable = !id;
  const [proveedor, setProveedor] = useState<ValorEntidad>(
    registro ? { id: num(leer(registro, 'proveedor_id')), etiqueta: texto(leerPrimero(registro, 'proveedor.razon_social', 'proveedor_razon_social', 'proveedor')) } : null,
  );
  const [fecha, setFecha] = useState(texto(leer(registro, 'fecha')) || hoyISO());
  const [medio, setMedio] = useState(texto(leer(registro, 'medio_pago')) || 'transferencia');
  const [referencia, setReferencia] = useState(texto(leer(registro, 'referencia')));
  const [banco, setBanco] = useState(texto(leer(registro, 'banco')));
  const [observacion, setObservacion] = useState(texto(leer(registro, 'observacion')));
  const [cuentas, setCuentas] = useState<Fila[]>(() => comoFilas(leerPrimero(registro, 'detalles', 'cuentas')));
  const [aplicado, setAplicado] = useState<Record<string, number>>({});
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();

  useEffect(() => {
    if (!editable || !proveedor) return;
    cuentasPagarUI(proveedor.id).then((r) => {
      setCuentas(comoFilas(r).filter((c) => num(leer(c, 'saldo_gs')) > 0 && texto(leer(c, 'estado')) !== 'anulado'));
      setAplicado({});
    });
  }, [proveedor, editable]);

  const total = Object.values(aplicado).reduce((a, b) => a + b, 0);
  const err = erroresPorCampo(res);

  const ejecutar = (fn: () => Promise<ResultadoAccion>) =>
    start(async () => {
      const r = await fn();
      setRes(r);
      if (r.ok) {
        const nid = idDeResultado(r);
        if (!id && nid) router.push(`/compras/ordenes-pago/${nid}`);
        else if (!id) router.push('/compras/ordenes-pago');
        router.refresh();
      }
    });

  const guardar = () =>
    ejecutar(
      async () =>
        (await registrarOrdenPago({
          fecha,
          proveedorId: proveedor?.id ?? 0,
          medioPago: medio as OrdenPagoInput['medioPago'],
          referencia: referencia || null,
          banco: banco || null,
          observacion: observacion || null,
          cuentas: Object.entries(aplicado)
            .filter(([, m]) => m > 0)
            .map(([cid, m]) => ({ cuentaPagarId: Number(cid), montoGs: m })),
        })) as ResultadoAccion,
    );

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (editable) guardar();
      }}
    >
      <ToolbarDocumento
        titulo={id ? `Orden de pago ${texto(leer(registro, 'numero'))}` : 'Nueva orden de pago'}
        subtitulo={`Total ${formatoGs(id ? leer(registro, 'total_gs') : total)}`}
        estado={estado ? <BadgeEstado estado={estado} /> : null}
        onNuevo={() => router.push('/compras/ordenes-pago/nuevo')}
        onGuardar={editable ? guardar : undefined}
        puedeGuardar={Boolean(proveedor && total > 0)}
        onAnular={id && estado !== 'anulado' ? (m) => ejecutar(async () => (await anularOrdenPago(id, m)) as ResultadoAccion) : undefined}
        onCancelar={() => router.push('/compras/ordenes-pago')}
        ocupado={ocupado}
      />
      {res ? res.ok ? <Aviso tipo="exito">Operación realizada.</Aviso> : <Aviso>{res.error}</Aviso> : null}
      <Seccion titulo="Datos del pago">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field etiqueta="Proveedor" requerido className="sm:col-span-2" error={err.proveedorId}>
            <BuscadorEntidad tipo="proveedor" valor={proveedor} deshabilitado={!editable} permitirCrear={false} onCambiar={(p) => setProveedor(p ? { id: num(leer(p, 'id')), etiqueta: texto(leerPrimero(p, 'razon_social', 'persona.razon_social')) } : null)} />
          </Field>
          <Field etiqueta="Fecha" requerido>
            <DateInput value={fecha} onChange={setFecha} disabled={!editable} />
          </Field>
          <Field etiqueta="Medio de pago" requerido>
            <Select
              value={medio}
              disabled={!editable}
              onChange={(e) => setMedio(e.target.value)}
              opciones={[
                { valor: 'transferencia', etiqueta: 'Transferencia' },
                { valor: 'efectivo', etiqueta: 'Efectivo' },
              ]}
            />
          </Field>
          <Field etiqueta="Referencia" error={err.referencia}>
            <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} disabled={!editable} />
          </Field>
          <Field etiqueta="Banco">
            <Input value={banco} onChange={(e) => setBanco(e.target.value)} disabled={!editable} />
          </Field>
          <Field etiqueta="Observación" className="sm:col-span-2">
            <Textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} disabled={!editable} rows={1} />
          </Field>
        </div>
      </Seccion>
      <Seccion titulo="Cuentas a pagar">
        {err.cuentas ? <p className="mb-2 text-[12px] text-peligro">{err.cuentas}</p> : null}
        <TablaAplicacion cuentas={cuentas} aplicado={aplicado} onCambiar={setAplicado} soloLectura={!editable} />
      </Seccion>
      <button type="submit" hidden />
    </form>
  );
}
