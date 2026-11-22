import { listarTransferencias } from '@/server/queries/ajustes';
import { ListadoDocumentos } from '@/components/ui/Listado';
import { comoFilas, valoresParams } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Transferencias' };

export default async function Transferencias({ searchParams }: PropsLista) {
  const sp = await searchParams;
  const filas = comoFilas(await seguro(() => listarTransferencias(), []));
  return (
    <ListadoDocumentos
      titulo="Transferencias de stock"
      descripcion="Movimientos entre depósitos/sucursales: borrador → enviado → recibido."
      nuevoHref="/ajustes/transferencias/nuevo"
      enlace="/ajustes/transferencias/{id}"
      filtros={[]}
      valores={valoresParams(sp)}
      filas={filas}
      columnas={[
        { clave: 'numero', titulo: 'Número', tipo: 'numero' },
        { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
        { clave: 'deposito_origen', titulo: 'Origen', alternativas: ['depositoOrigen.nombre', 'deposito_origen_nombre'] },
        { clave: 'deposito_destino', titulo: 'Destino', alternativas: ['depositoDestino.nombre', 'deposito_destino_nombre'] },
        { clave: 'total_costo_gs', titulo: 'Costo', tipo: 'gs' },
        { clave: 'enviado_en', titulo: 'Enviado', tipo: 'fechaHora' },
        { clave: 'recibido_en', titulo: 'Recibido', tipo: 'fechaHora' },
        { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
      ]}
    />
  );
}
