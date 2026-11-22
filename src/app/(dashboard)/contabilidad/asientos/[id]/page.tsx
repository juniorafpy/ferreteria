import { listarPlanCuentas, obtenerAsiento } from '@/server/queries/contabilidad';
import { NoEncontrado } from '@/components/ui/Pagina';
import { comoFilas } from '@/lib/ui/datos';
import { seguro } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';
import { FormularioAsiento } from './FormularioAsiento';

export const metadata = { title: 'Asiento' };

export default async function FichaAsiento({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [registro, cuentas] = await Promise.all([cargarFicha(id, obtenerAsiento), seguro(() => listarPlanCuentas(), [])]);
  if (id && !registro) return <NoEncontrado volverHref="/contabilidad/asientos" />;
  return <FormularioAsiento registro={registro} cuentas={comoFilas(cuentas)} />;
}
