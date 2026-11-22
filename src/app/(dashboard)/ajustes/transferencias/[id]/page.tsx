import { listarTransferencias } from '@/server/queries/ajustes';
import { anularTransferencia, enviarTransferencia, guardarTransferencia, recibirTransferencia } from '@/server/actions/ajustes';
import { BotonAccion } from '@/components/forms/BotonAccion';
import { FormularioDocumento } from '@/components/forms/FormularioDocumento';
import { NoEncontrado } from '@/components/ui/Pagina';
import { comoFilas, leer } from '@/lib/ui/datos';
import { hoyISO } from '@/lib/ui/formato';
import { cargarCatalogos, seguro } from '../../../_lib/catalogos';
import { idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Transferencia' };

export default async function FichaTransferencia({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  // Sin obtenerTransferencia(id) en el contrato: se toma del listado (debería incluir `detalles`).
  const [lista, cat] = await Promise.all([seguro(() => listarTransferencias(), []), cargarCatalogos()]);
  const registro = id ? (comoFilas(lista).find((a) => Number(leer(a, 'id')) === id) ?? null) : null;
  if (id && !registro) return <NoEncontrado volverHref="/ajustes/transferencias" />;
  const estado = String(leer(registro, 'estado') ?? '');
  return (
    <FormularioDocumento
      titulo="Transferencia"
      listaHref="/ajustes/transferencias"
      registro={registro}
      modo="cantidad"
      precio="costo"
      mostrarStock
      guardar={guardarTransferencia}
      confirmar={enviarTransferencia}
      etiquetaConfirmar="Enviar"
      anular={anularTransferencia}
      extras={
        id && estado === 'enviado' ? (
          <BotonAccion accion={recibirTransferencia} args={[id]} variante="primario" confirmar="¿Confirmar la recepción de la mercadería en el depósito destino?">
            Recibir
          </BotonAccion>
        ) : null
      }
      camposCabecera={[
        { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
        { clave: 'depositoOrigenId', etiqueta: 'Depósito origen', tipo: 'select', opciones: cat.depositos, requerido: true },
        { clave: 'depositoDestinoId', etiqueta: 'Depósito destino', tipo: 'select', opciones: cat.depositos, requerido: true },
        { clave: 'observacion', etiqueta: 'Observación', tipo: 'area', ancho: 4 },
      ]}
    />
  );
}
