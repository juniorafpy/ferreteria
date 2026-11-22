'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';
import { cambiarEstado } from '@/server/actions/definiciones';
import { erroresPorCampo, idDeResultado, leer, num, texto, type AccionUI, type Fila, type ResultadoAccion } from '@/lib/ui/datos';
import { BadgeEstado } from '@/components/ui/Badge';
import { Aviso, Boton } from '@/components/ui/Campos';
import { ToolbarDocumento } from '@/components/ui/ToolbarDocumento';
import { CamposGrid, valoresIniciales, valoresParaGuardar, type CampoDef, type Valores } from './CamposGrid';

/**
 * Ficha maestra genérica dirigida por definiciones de campos.
 * La acción de guardado llega como prop desde el Server Component (Server Action).
 */
export function FormularioMaestro({
  titulo,
  campos,
  registro,
  accion,
  listaHref,
  entidadEstado,
  datosFijos,
  subtitulo,
  children,
}: {
  titulo: string;
  campos: CampoDef[];
  registro: Fila | null;
  accion: AccionUI;
  listaHref: string;
  /** Si se indica, muestra botón Activar/Inactivar con `cambiarEstado(entidad, id, estado)`. */
  entidadEstado?: string;
  /** Datos adicionales fijos que se agregan al payload. */
  datosFijos?: Record<string, unknown>;
  subtitulo?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const id = registro ? num(leer(registro, 'id')) || null : null;
  const [valores, setValores] = useState<Valores>(() => valoresIniciales(campos, registro));
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();
  const estado = texto(leer(registro, 'estado'));

  const guardar = () =>
    start(async () => {
      const payload = { ...(id ? { id } : {}), ...datosFijos, ...valoresParaGuardar(campos, valores) };
      const r = (await accion(payload)) as ResultadoAccion;
      setRes(r);
      if (r.ok) {
        const nuevoId = idDeResultado(r) ?? id;
        if (!id && nuevoId) router.push(`${listaHref}/${nuevoId}`);
        router.refresh();
      }
    });

  const toggleEstado = () =>
    start(async () => {
      if (!id || !entidadEstado) return;
      const r = (await cambiarEstado(entidadEstado as never, id, (estado === 'activo' ? 'inactivo' : 'activo') as never)) as ResultadoAccion;
      setRes(r);
      if (r.ok) router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
    <form
      onSubmit={(e) => {
        e.preventDefault();
        guardar();
      }}
      className="flex flex-col gap-3"
    >
      <ToolbarDocumento
        titulo={id ? titulo : `Nuevo: ${titulo}`}
        subtitulo={subtitulo ?? (id ? `ID ${id}` : 'Complete los datos y guarde con Ctrl+S o F10')}
        estado={estado ? <BadgeEstado estado={estado} /> : null}
        onNuevo={() => router.push(`${listaHref}/nuevo`)}
        onGuardar={guardar}
        onCancelar={() => router.push(listaHref)}
        ocupado={ocupado}
        extras={
          id && entidadEstado ? (
            <Boton tamano="sm" onClick={toggleEstado} disabled={ocupado}>
              {estado === 'activo' ? 'Inactivar' : 'Activar'}
            </Boton>
          ) : null
        }
      />
      {res ? res.ok ? <Aviso tipo="exito">Guardado correctamente.</Aviso> : <Aviso>{res.error}</Aviso> : null}
      <div className="rounded border border-borde bg-panel p-4">
        <CamposGrid
          campos={campos}
          valores={valores}
          errores={erroresPorCampo(res)}
          onCambiar={(k, v, extra) => setValores((x) => ({ ...x, ...extra, [k]: v }))}
        />
      </div>
      <button type="submit" hidden />
    </form>
    {/* Fuera del <form> para permitir formularios/modales propios en las secciones hijas. */}
    {children}
    </div>
  );
}
