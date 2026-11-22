'use client';

import { useState, type ReactNode } from 'react';
import { useAtajos } from '@/lib/ui/teclado';
import { Boton, Field, Textarea } from './Campos';
import { Icono } from './Icono';
import { Modal } from './Modal';

/**
 * Barra de documento: Nuevo (Alt+N), Guardar (Ctrl+S / F10), Confirmar, Anular (pide motivo),
 * Imprimir y Cancelar (Esc).
 */
export function ToolbarDocumento({
  titulo,
  subtitulo,
  estado,
  onNuevo,
  onGuardar,
  onConfirmar,
  onAnular,
  onImprimir,
  onCancelar,
  puedeGuardar = true,
  puedeConfirmar = true,
  puedeAnular = true,
  ocupado = false,
  extras,
  etiquetaConfirmar = 'Confirmar',
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  estado?: ReactNode;
  onNuevo?: () => void;
  onGuardar?: () => void;
  onConfirmar?: () => void;
  onAnular?: (motivo: string) => void;
  onImprimir?: () => void;
  onCancelar?: () => void;
  puedeGuardar?: boolean;
  puedeConfirmar?: boolean;
  puedeAnular?: boolean;
  ocupado?: boolean;
  extras?: ReactNode;
  etiquetaConfirmar?: string;
}) {
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');

  useAtajos(
    {
      'alt+n': () => onNuevo?.(),
      'ctrl+s': () => puedeGuardar && !ocupado && onGuardar?.(),
      f10: () => puedeGuardar && !ocupado && onGuardar?.(),
      escape: () => onCancelar?.(),
    },
    !anulando,
  );

  return (
    <div className="no-imprimir sticky top-0 z-20 -mx-4 mb-3 flex flex-wrap items-center gap-2 border-b border-borde bg-panel/95 px-4 py-2 backdrop-blur">
      <div className="mr-auto flex min-w-0 items-center gap-2">
        {onCancelar ? (
          <button
            type="button"
            onClick={onCancelar}
            className="rounded p-1 text-tenue hover:bg-panel-2 hover:text-texto"
            aria-label="Volver (Esc)"
            title="Volver (Esc)"
          >
            <Icono nombre="atras" />
          </button>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold">{titulo}</h1>
          {subtitulo ? <p className="truncate text-[11px] text-tenue">{subtitulo}</p> : null}
        </div>
        {estado}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {extras}
        {onNuevo ? (
          <Boton onClick={onNuevo} title="Nuevo (Alt+N)" tamano="sm">
            <Icono nombre="mas" className="size-3.5" /> Nuevo <kbd className="hidden text-[10px] text-tenue sm:inline">Alt+N</kbd>
          </Boton>
        ) : null}
        {onGuardar ? (
          <Boton onClick={onGuardar} disabled={!puedeGuardar || ocupado} title="Guardar (Ctrl+S / F10)" tamano="sm" variante="primario">
            <Icono nombre="guardar" className="size-3.5" /> {ocupado ? 'Guardando…' : 'Guardar'}
            <kbd className="hidden text-[10px] opacity-70 sm:inline">F10</kbd>
          </Boton>
        ) : null}
        {onConfirmar ? (
          <Boton onClick={onConfirmar} disabled={!puedeConfirmar || ocupado} tamano="sm">
            <Icono nombre="check" className="size-3.5" /> {etiquetaConfirmar}
          </Boton>
        ) : null}
        {onAnular ? (
          <Boton onClick={() => setAnulando(true)} disabled={!puedeAnular || ocupado} tamano="sm" variante="peligro">
            <Icono nombre="anular" className="size-3.5" /> Anular
          </Boton>
        ) : null}
        <Boton onClick={onImprimir ?? (() => window.print())} tamano="sm" title="Imprimir">
          <Icono nombre="imprimir" className="size-3.5" /> Imprimir
        </Boton>
      </div>

      <Modal
        abierto={anulando}
        onCerrar={() => setAnulando(false)}
        titulo="Anular documento"
        pie={
          <>
            <Boton onClick={() => setAnulando(false)}>Cancelar</Boton>
            <Boton
              variante="peligro"
              disabled={motivo.trim().length < 3}
              onClick={() => {
                onAnular?.(motivo.trim());
                setAnulando(false);
                setMotivo('');
              }}
            >
              Anular
            </Boton>
          </>
        }
      >
        <Field etiqueta="Motivo de anulación" requerido htmlFor="motivo-anulacion">
          <Textarea id="motivo-anulacion" value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus rows={3} />
        </Field>
      </Modal>
    </div>
  );
}
