'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { crearFacturaDesdePresupuesto } from '@/server/actions/ventas';
import { Boton } from '@/components/ui/Campos';
import { idDeResultado, type ResultadoAccion } from '@/lib/ui/datos';

/** "Facturar presupuesto": crea una factura borrador con los pendientes y navega a ella. */
export function BotonFacturar({ presupuestoId }: { presupuestoId: number }) {
  const router = useRouter();
  const [ocupado, start] = useTransition();
  return (
    <Boton
      tamano="sm"
      variante="primario"
      disabled={ocupado}
      onClick={() =>
        start(async () => {
          const r = (await crearFacturaDesdePresupuesto(presupuestoId)) as ResultadoAccion;
          if (!r.ok) return alert(r.error);
          const id = idDeResultado(r);
          router.push(id ? `/ventas/facturas/${id}` : '/ventas/facturas');
        })
      }
    >
      {ocupado ? 'Generando…' : 'Facturar'}
    </Boton>
  );
}
