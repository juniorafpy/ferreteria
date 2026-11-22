import { listarCajas, sesionCajaActual } from '@/server/queries/caja';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas, comoRegistro } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import { PanelCaja } from './PanelCaja';

export const metadata = { title: 'Caja' };

export default async function Caja() {
  const [cajas, sesion] = await Promise.all([seguro(() => listarCajas(), []), seguro(() => sesionCajaActual(), null)]);
  return (
    <>
      <EncabezadoPagina titulo="Caja" descripcion="Apertura, cobros del turno, cierre y arqueo por medio de pago." />
      <PanelCaja cajas={comoFilas(cajas)} sesion={comoRegistro(sesion)} />
    </>
  );
}
