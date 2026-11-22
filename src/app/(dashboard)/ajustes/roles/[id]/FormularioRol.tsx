'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { guardarRol } from '@/server/actions/ajustes';
import { BadgeEstado } from '@/components/ui/Badge';
import { Aviso, Checkbox, Field, Input, NumberInput, Select } from '@/components/ui/Campos';
import { Seccion } from '@/components/ui/Pagina';
import { ToolbarDocumento } from '@/components/ui/ToolbarDocumento';
import { comoFilas, erroresPorCampo, idDeResultado, leer, leerPrimero, num, texto, type Fila, type ResultadoAccion } from '@/lib/ui/datos';
import { normalizar } from '@/lib/ui/navegacion';

/** Matriz de permisos agrupada por módulo + tope de descuento manual. */
export function FormularioRol({ registro, permisos }: { registro: Fila | null; permisos: Fila[] }) {
  const router = useRouter();
  const id = registro ? num(leer(registro, 'id')) || null : null;
  const esSistema = Boolean(leer(registro, 'es_sistema'));
  const [codigo, setCodigo] = useState(texto(leer(registro, 'codigo')));
  const [nombre, setNombre] = useState(texto(leer(registro, 'nombre')));
  const [descripcion, setDescripcion] = useState(texto(leer(registro, 'descripcion')));
  const [tope, setTope] = useState(num(leer(registro, 'descuento_manual_max_pct')));
  const [estado, setEstado] = useState(texto(leer(registro, 'estado')) || 'activo');
  const [sel, setSel] = useState<Set<string>>(
    () =>
      new Set(
        comoFilas(leer(registro, 'permisos')).map((p) => (typeof p === 'string' ? p : texto(leerPrimero(p, 'codigo', 'permiso.codigo')))),
      ),
  );
  const [filtro, setFiltro] = useState('');
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();

  // listarPermisos puede devolver strings u objetos; también se aceptan códigos sueltos del rol.
  const grupos = useMemo(() => {
    const m = new Map<string, { codigo: string; descripcion: string }[]>();
    const lista = permisos.length
      ? permisos.map((p) => ({
          codigo: texto(leer(p, 'codigo')),
          modulo: texto(leer(p, 'modulo')) || texto(leer(p, 'codigo')).split('.')[0],
          descripcion: texto(leer(p, 'descripcion')),
        }))
      : [...sel].map((c) => ({ codigo: c, modulo: c.split('.')[0], descripcion: c }));
    const nf = normalizar(filtro);
    for (const p of lista) {
      if (nf && !normalizar(`${p.codigo} ${p.descripcion} ${p.modulo}`).includes(nf)) continue;
      if (!m.has(p.modulo)) m.set(p.modulo, []);
      m.get(p.modulo)!.push(p);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [permisos, filtro, sel]);

  const toggle = (c: string, v: boolean) =>
    setSel((s) => {
      const n = new Set(s);
      if (v) n.add(c);
      else n.delete(c);
      return n;
    });

  const guardar = () =>
    start(async () => {
      const r = (await guardarRol({
        ...(id ? { id } : {}),
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        descuentoManualMaxPct: tope,
        estado,
        permisos: [...sel],
      } as never)) as ResultadoAccion;
      setRes(r);
      if (r.ok) {
        const nid = idDeResultado(r) ?? id;
        if (!id && nid) router.push(`/ajustes/roles/${nid}`);
        router.refresh();
      }
    });

  const err = erroresPorCampo(res);
  const tieneDescManual = sel.has('ventas.descuento_manual');

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        guardar();
      }}
    >
      <ToolbarDocumento
        titulo={id ? `Rol ${codigo}` : 'Nuevo rol'}
        subtitulo={`${sel.size} permisos seleccionados${esSistema ? ' · rol de sistema' : ''}`}
        estado={<BadgeEstado estado={estado} />}
        onNuevo={() => router.push('/ajustes/roles/nuevo')}
        onGuardar={guardar}
        onCancelar={() => router.push('/ajustes/roles')}
        ocupado={ocupado}
      />
      {res ? res.ok ? <Aviso tipo="exito">Rol guardado.</Aviso> : <Aviso>{res.error}</Aviso> : null}
      <Seccion titulo="Datos del rol">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field etiqueta="Código" requerido error={err.codigo}>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} maxLength={30} disabled={esSistema} />
          </Field>
          <Field etiqueta="Nombre" requerido className="sm:col-span-2" error={err.nombre}>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Field>
          <Field etiqueta="Estado">
            <Select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              opciones={[
                { valor: 'activo', etiqueta: 'Activo' },
                { valor: 'inactivo', etiqueta: 'Inactivo' },
              ]}
            />
          </Field>
          <Field etiqueta="Descripción" className="sm:col-span-3">
            <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </Field>
          <Field
            etiqueta="Tope % descuento manual"
            error={err.descuentoManualMaxPct}
            ayuda={tieneDescManual ? 'Máximo por línea' : 'Requiere el permiso ventas.descuento_manual'}
          >
            <NumberInput value={tope} onChange={(v) => setTope(Math.min(Math.max(v, 0), 100))} aria-invalid={tope < 0 || tope > 100} />
          </Field>
        </div>
      </Seccion>

      <Seccion
        titulo="Matriz de permisos"
        acciones={
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar permisos…"
            aria-label="Filtrar permisos"
            className="h-7 w-56 rounded border border-borde bg-panel px-2 text-[12px] focus:border-foco focus:outline-none"
          />
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {grupos.map(([modulo, items]) => {
            const todos = items.every((p) => sel.has(p.codigo));
            return (
              <fieldset key={modulo} className="rounded border border-borde p-2">
                <legend className="px-1">
                  <Checkbox
                    checked={todos}
                    onChange={(e) => items.forEach((p) => toggle(p.codigo, e.target.checked))}
                    etiqueta={<span className="text-[12px] font-semibold uppercase tracking-wide">{modulo}</span>}
                  />
                </legend>
                <div className="grid gap-1">
                  {items.map((p) => (
                    <Checkbox
                      key={p.codigo}
                      checked={sel.has(p.codigo)}
                      onChange={(e) => toggle(p.codigo, e.target.checked)}
                      etiqueta={
                        <span className="text-[12px]">
                          {p.descripcion} <span className="font-mono text-[10.5px] text-tenue">{p.codigo}</span>
                        </span>
                      }
                    />
                  ))}
                </div>
              </fieldset>
            );
          })}
          {grupos.length === 0 ? <p className="text-[12px] text-tenue">Sin permisos.</p> : null}
        </div>
      </Seccion>
      <button type="submit" hidden />
    </form>
  );
}
