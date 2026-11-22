import { obtenerDescuento } from '@/server/queries/definiciones';
import { NoEncontrado } from '@/components/ui/Pagina';
import { cargarCatalogos } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';
import { FormularioDescuento } from './FormularioDescuento';

export const metadata = { title: 'Descuento' };

export default async function FichaDescuento({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [registro, cat] = await Promise.all([cargarFicha(id, obtenerDescuento), cargarCatalogos()]);
  if (id && !registro) return <NoEncontrado volverHref="/definiciones/descuentos" />;
  return <FormularioDescuento registro={registro} sucursales={cat.sucursales} />;
}
