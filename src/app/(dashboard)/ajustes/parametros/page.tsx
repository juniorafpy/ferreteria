import { obtenerParametros } from '@/server/queries/ajustes';
import { comoFilas } from '@/lib/ui/datos';
import { cargarCatalogos, seguro } from '../../_lib/catalogos';
import { FormularioParametros } from './FormularioParametros';

export const metadata = { title: 'Parámetros' };

export default async function Parametros() {
  const [params, cat] = await Promise.all([seguro(() => obtenerParametros(), []), cargarCatalogos()]);
  return <FormularioParametros parametros={comoFilas(params)} sucursales={cat.sucursales} />;
}
