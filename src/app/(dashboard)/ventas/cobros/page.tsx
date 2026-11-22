import Link from 'next/link';
import { sesionCajaActual } from '@/server/queries/caja';
import { DataTable } from '@/components/ui/DataTable';
import { EncabezadoPagina, Seccion } from '@/components/ui/Pagina';
import { comoFilas, comoRegistro, leer } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';

export const metadata = { title: 'Cobros' };

export default async function Cobros() {
  const sesion = comoRegistro(await seguro(() => sesionCajaActual(), null));
  const cobros = comoFilas(leer(sesion, 'cobros'));
  return (
    <>
      <EncabezadoPagina
        titulo="Cobros"
        descripcion="Cobros registrados en la sesión de caja actual. Anulaciones desde Caja."
        nuevoHref={sesion ? '/ventas/cobros/nuevo' : undefined}
        nuevoTexto="Nuevo cobro"
        acciones={
          <Link href="/ventas/caja" className="inline-flex h-8 items-center rounded border border-borde bg-panel px-3 text-[13px] hover:bg-panel-2">
            Ir a caja
          </Link>
        }
      />
      {!sesion ? (
        <Seccion>
          <p className="text-[13px] text-tenue">
            No hay una sesión de caja abierta. <Link className="text-primario hover:underline" href="/ventas/caja">Abra la caja</Link> para registrar cobros.
          </p>
        </Seccion>
      ) : (
        <DataTable
          filas={cobros}
          exportar="cobros"
          totales
          columnas={[
            { clave: 'numero', titulo: 'Número', tipo: 'numero' },
            { clave: 'fecha', titulo: 'Fecha', tipo: 'fechaHora' },
            { clave: 'cliente', titulo: 'Cliente', alternativas: ['cliente.razon_social', 'cliente_razon_social'] },
            { clave: 'total_gs', titulo: 'Total', tipo: 'gs' },
            { clave: 'vuelto_gs', titulo: 'Vuelto', tipo: 'gs' },
            { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
          ]}
        />
      )}
    </>
  );
}
