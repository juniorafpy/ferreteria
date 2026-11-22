'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icono } from './Icono';

/**
 * Modal accesible basado en <dialog> nativo (foco atrapado, Esc cierra).
 * Se renderiza en un portal a <body> para no quedar dentro del <form> del documento
 * (evita envíos implícitos del formulario de fondo al presionar Enter).
 * `onEnviar`: acción al presionar Enter en un campo de texto del modal.
 */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  pie,
  ancho = 'max-w-lg',
  onEnviar,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: string;
  onEnviar?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto, montado]);

  if (!montado) return null;

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onKeyDown={(e) => {
        // Evita que las teclas del modal disparen atajos/handlers del formulario de fondo.
        e.stopPropagation();
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'checkbox') {
          e.preventDefault();
          onEnviar?.();
        }
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${ancho} rounded-lg border border-borde bg-panel p-0 text-texto shadow-2xl backdrop:bg-black/50`}
    >
      {abierto ? (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between border-b border-borde px-4 py-2.5">
            <h2 id={idTitulo} className="text-sm font-semibold">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={onCerrar}
              className="rounded p-1 text-tenue hover:bg-panel-2 hover:text-texto"
              aria-label="Cerrar"
            >
              <Icono nombre="cerrar" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
          {pie ? <div className="flex justify-end gap-2 border-t border-borde px-4 py-2.5">{pie}</div> : null}
        </div>
      ) : null}
    </dialog>,
    document.body,
  );
}
