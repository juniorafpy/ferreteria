import Link from 'next/link';
import { listarCuentasCobrar } from '@/server/queries/caja';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Cuentas a cobrar' };

export default async function CuentasCobrar({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarCuentasCobrar({ clienteId: filtroLista(sp).clienteId ?? null, q: filtroLista(sp).q ?? null }), []));
  return (
    <ListadoDocumentos
      titulo="Cuentas a cobrar"
      filtros={['cliente']}
      valores={valoresParams(sp)}
      filas={filas}
      acciones={
        <Link href="/ventas/cobros/nuevo" className="inline-flex h-8 items-center rounded border border-borde bg-panel px-3 text-[13px] hover:bg-panel-2">
          Cobrar
        </Link>
      }
      columnas={[
        { clave: 'cliente', titulo: 'Cliente', alternativas: ['cliente.razon_social', 'cliente_razon_social', 'receptor_razon_social'] },
        { clave: 'documento', titulo: 'RUC/CI', tipo: 'mono' },
        { clave: 'numero_completo', titulo: 'Factura', tipo: 'mono' },
        { clave: 'numero_cuota', titulo: 'Cuota', tipo: 'numero' },
        { clave: 'fecha_vencimiento', titulo: 'Vencimiento', tipo: 'fecha' },
        { clave: 'monto_gs', titulo: 'Monto', tipo: 'gs' },
        { clave: 'saldo_gs', titulo: 'Saldo', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
