import Link from 'next/link';
import { listarCuentasPagar } from '@/server/queries/compras';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Cuentas a pagar' };

export default async function CuentasPagar({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarCuentasPagar(filtroLista(sp)), []));
  return (
    <ListadoDocumentos
      titulo="Cuentas a pagar"
      filtros={['fechas', 'estado', 'proveedor']}
      estados={['pendiente', 'parcial', 'pagado', 'anulado']}
      valores={valoresParams(sp)}
      filas={filas}
      acciones={
        <Link href="/compras/ordenes-pago/nuevo" className="inline-flex h-8 items-center rounded border border-borde bg-panel px-3 text-[13px] hover:bg-panel-2">
          Nueva orden de pago
        </Link>
      }
      columnas={[
        { clave: 'proveedor', titulo: 'Proveedor', alternativas: ['proveedor.razon_social', 'proveedor_razon_social'] },
        { clave: 'numero_comprobante', titulo: 'Factura', tipo: 'mono' },
        { clave: 'numero_cuota', titulo: 'Cuota', tipo: 'numero' },
        { clave: 'fecha_vencimiento', titulo: 'Vencimiento', tipo: 'fecha' },
        { clave: 'monto_gs', titulo: 'Monto', tipo: 'gs' },
        { clave: 'saldo_gs', titulo: 'Saldo', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
