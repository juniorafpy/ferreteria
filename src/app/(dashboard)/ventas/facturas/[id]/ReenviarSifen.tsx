'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { reenviarSifen } from '@/server/actions/ventas';
import { useTienePermiso } from '@/components/layout/SesionContexto';
import { Boton } from '@/components/ui/Campos';
import type { ResultadoAccion } from '@/lib/ui/datos';

export function ReenviarSifen({ facturaId }: { facturaId: number }) {
  const router = useRouter();
  const puede = useTienePermiso('ventas.sifen.gestionar');
  const [ocupado, start] = useTransition();
  if (!puede) return null;
  return (
    <Boton
      tamano="sm"
      disabled={ocupado}
      onClick={() =>
        start(async () => {
          const r = (await reenviarSifen(facturaId)) as ResultadoAccion;
          if (!r.ok) alert(r.error);
          router.refresh();
        })
      }
    >
      {ocupado ? 'Enviando…' : 'Reenviar a SIFEN'}
    </Boton>
  );
}
