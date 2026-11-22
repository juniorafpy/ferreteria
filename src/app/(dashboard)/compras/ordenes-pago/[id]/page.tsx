import { listarOrdenesPago } from '@/server/queries/compras';
import { NoEncontrado } from '@/components/ui/Pagina';
import { comoFilas, leer } from '@/lib/ui/datos';
import { seguro } from '../../../_lib/catalogos';
import { idRuta, type PropsFicha } from '../../../_lib/pagina';
import { FormularioOrdenPago } from './FormularioOrdenPago';

export const metadata = { title: 'Orden de pago' };

export default async function FichaOrdenPago({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  // El contrato no define obtenerOrdenPago(id): se ubica el registro en el listado.
  const registro = id ? (comoFilas(await seguro(() => listarOrdenesPago({}), [])).find((o) => Number(leer(o, 'id')) === id) ?? null) : null;
  if (id && !registro) return <NoEncontrado volverHref="/compras/ordenes-pago" />;
  return <FormularioOrdenPago registro={registro} />;
}
