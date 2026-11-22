'use client';

import { useEffect, useState } from 'react';
import { guardarPersona } from '@/server/actions/definiciones';
import { validarRuc } from '@/server/fiscal/ruc';
import { referencialesUI } from '@/app/(dashboard)/_acciones/busqueda';
import { erroresPorCampo, idDeResultado, leer, opciones, texto, type Fila, type ResultadoAccion } from '@/lib/ui/datos';
import { Aviso, Boton, Field, Input, Select } from './Campos';
import { Modal } from './Modal';

type Datos = {
  tipoPersonaId: string;
  tipoDocumentoId: string;
  numeroDocumento: string;
  dv: string;
  razonSocial: string;
  telefono: string;
  email: string;
  direccion: string;
  esContribuyente: boolean;
};

const VACIO: Datos = {
  tipoPersonaId: '',
  tipoDocumentoId: '',
  numeroDocumento: '',
  dv: '',
  razonSocial: '',
  telefono: '',
  email: '',
  direccion: '',
  esContribuyente: false,
};

/** Alta rápida de Persona sin salir del flujo (desde BuscadorEntidad "+ crear"). */
export function AltaRapidaPersona({
  abierto,
  onCerrar,
  onCreada,
  textoInicial = '',
}: {
  abierto: boolean;
  onCerrar: () => void;
  onCreada: (persona: Fila) => void;
  textoInicial?: string;
}) {
  const [refs, setRefs] = useState<Fila | null>(null);
  const [d, setD] = useState<Datos>(VACIO);
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const esDoc = /^\d[\d-]*$/.test(textoInicial.trim());
    setD({ ...VACIO, razonSocial: esDoc ? '' : textoInicial, numeroDocumento: esDoc ? textoInicial.split('-')[0] : '' });
    setRes(null);
    if (!refs) referencialesUI().then((r) => setRefs((r as Fila) ?? {}));
  }, [abierto, textoInicial, refs]);

  const tiposDoc = (leer(refs, 'tiposDocumento') as Fila[] | undefined) ?? [];
  const docSel = tiposDoc.find((t) => texto(leer(t, 'id')) === d.tipoDocumentoId);
  const requiereDv = Boolean(leer(docSel, 'requiere_dv'));
  const rucValido = !requiereDv || !d.numeroDocumento || !d.dv || validarRuc(d.numeroDocumento, d.dv);
  const err = erroresPorCampo(res);

  const set = <K extends keyof Datos>(k: K, v: Datos[K]) => setD((x) => ({ ...x, [k]: v }));

  async function guardar() {
    setOcupado(true);
    const r = (await guardarPersona({
      tipoPersonaId: Number(d.tipoPersonaId) || undefined,
      tipoDocumentoId: Number(d.tipoDocumentoId) || undefined,
      numeroDocumento: d.numeroDocumento.trim(),
      dv: requiereDv ? d.dv.trim() || null : null,
      razonSocial: d.razonSocial.trim(),
      telefono: d.telefono || null,
      email: d.email || null,
      direccion: d.direccion || null,
      esContribuyente: requiereDv ? true : d.esContribuyente,
    } as never)) as ResultadoAccion;
    setOcupado(false);
    setRes(r);
    if (r.ok) {
      const id = idDeResultado(r);
      onCreada({
        ...(typeof r.data === 'object' && r.data ? (r.data as Fila) : {}),
        id,
        razon_social: d.razonSocial.trim(),
        numero_documento: d.numeroDocumento.trim(),
        dv: d.dv || null,
      });
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Alta rápida de persona"
      ancho="max-w-2xl"
      onEnviar={() => {
        if (!ocupado && d.razonSocial.trim() && d.numeroDocumento.trim()) void guardar();
      }}
      pie={
        <>
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" onClick={guardar} disabled={ocupado || !d.razonSocial.trim() || !d.numeroDocumento.trim()}>
            {ocupado ? 'Guardando…' : 'Crear persona'}
          </Boton>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {res && !res.ok ? (
          <div className="sm:col-span-4">
            <Aviso>{res.error}</Aviso>
          </div>
        ) : null}
        <Field etiqueta="Tipo de persona" requerido className="sm:col-span-2" error={err.tipoPersonaId}>
          <Select
            value={d.tipoPersonaId}
            onChange={(e) => set('tipoPersonaId', e.target.value)}
            opciones={opciones(leer(refs, 'tiposPersona'))}
            placeholder="Seleccione…"
          />
        </Field>
        <Field etiqueta="Tipo de documento" requerido className="sm:col-span-2" error={err.tipoDocumentoId}>
          <Select
            value={d.tipoDocumentoId}
            onChange={(e) => set('tipoDocumentoId', e.target.value)}
            opciones={opciones(tiposDoc)}
            placeholder="Seleccione…"
          />
        </Field>
        <Field etiqueta="Nro. documento" requerido className={requiereDv ? 'sm:col-span-3' : 'sm:col-span-4'} error={err.numeroDocumento}>
          <Input value={d.numeroDocumento} onChange={(e) => set('numeroDocumento', e.target.value)} autoFocus maxLength={20} />
        </Field>
        {requiereDv ? (
          <Field etiqueta="DV" requerido error={err.dv ?? (rucValido ? undefined : 'DV no coincide con el RUC')}>
            <Input value={d.dv} onChange={(e) => set('dv', e.target.value.replace(/\D/g, '').slice(0, 1))} maxLength={1} aria-invalid={!rucValido} />
          </Field>
        ) : null}
        <Field etiqueta="Nombre / Razón social" requerido className="sm:col-span-4" error={err.razonSocial}>
          <Input value={d.razonSocial} onChange={(e) => set('razonSocial', e.target.value)} maxLength={200} />
        </Field>
        <Field etiqueta="Teléfono" className="sm:col-span-2">
          <Input value={d.telefono} onChange={(e) => set('telefono', e.target.value)} />
        </Field>
        <Field etiqueta="Email" className="sm:col-span-2" error={err.email}>
          <Input type="email" value={d.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field etiqueta="Dirección" className="sm:col-span-4">
          <Input value={d.direccion} onChange={(e) => set('direccion', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
