import { obtenerRecepcion } from '@/server/queries/compras';
import { NoEncontrado } from '@/components/ui/Pagina';
import { primerParam } from '@/lib/ui/datos';
import { cargarCatalogos } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';
import { FormularioRecepcion } from './FormularioRecepcion';

export const metadata = { title: 'Recepción' };

export default async function FichaRecepcion({ params, searchParams }: PropsFicha) {
  const id = idRuta((await params).id);
  const facturaId = Number(primerParam((await searchParams).factura)) || null;
  const [registro, cat] = await Promise.all([cargarFicha(id, obtenerRecepcion), cargarCatalogos()]);
  if (id && !registro) return <NoEncontrado volverHref="/compras/recepciones" />;
  return <FormularioRecepcion registro={registro} depositos={cat.depositos} facturaInicial={facturaId} />;
}
