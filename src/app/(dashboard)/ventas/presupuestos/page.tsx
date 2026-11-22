import { listarPresupuestos } from '@/server/queries/ventas';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, filtroLista, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Presupuestos' };

export default async function Presupuestos({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarPresupuestos(filtroLista(sp)), []));
  return (
    <ListadoDocumentos
      titulo="Presupuestos"
      nuevoHref="/ventas/presupuestos/nuevo"
      enlace="/ventas/presupuestos/{id}"
      filtros={['fechas', 'estado', 'cliente']}
      estados={['borrador', 'confirmado', 'facturado_parcial', 'facturado', 'vencido', 'anulado']}
      valores={valoresParams(sp)}
      filas={filas}
      columnas={[
        { clave: 'numero', titulo: 'Número', tipo: 'numero' },
        { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
        { clave: 'fecha_validez', titulo: 'Válido hasta', tipo: 'fecha' },
        { clave: 'cliente', titulo: 'Cliente', alternativas: ['cliente.razon_social', 'cliente_razon_social', 'cliente.persona.razon_social'] },
        { clave: 'condicion_operacion', titulo: 'Condición' },
        { clave: 'total_descuento_gs', titulo: 'Descuento', tipo: 'gs' },
        { clave: 'total_gs', titulo: 'Total', tipo: 'gs' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
