'use client';

import { useRouter } from 'next/navigation';
import { useTransition, type ReactNode } from 'react';
import { Boton } from '@/components/ui/Campos';
import type { AccionUI, ResultadoAccion } from '@/lib/ui/datos';

/** Botón que ejecuta una Server Action recibida por props (con confirmación opcional) y refresca. */
export function BotonAccion({
  accion,
  args,
  children,
  confirmar,
  variante = 'secundario',
}: {
  accion: AccionUI;
  args: unknown[];
  children: ReactNode;
  confirmar?: string;
  variante?: 'primario' | 'secundario' | 'peligro';
}) {
  const router = useRouter();
  const [ocupado, start] = useTransition();
  return (
    <Boton
      tamano="sm"
      variante={variante}
      disabled={ocupado}
      onClick={() => {
        if (confirmar && !window.confirm(confirmar)) return;
        start(async () => {
          const r = (await accion(...args)) as ResultadoAccion;
          if (!r.ok) alert(r.error);
          router.refresh();
        });
      }}
    >
      {ocupado ? 'Procesando…' : children}
    </Boton>
  );
}
