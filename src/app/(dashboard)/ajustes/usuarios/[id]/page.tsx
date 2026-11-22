import { listarRoles, listarUsuarios } from '@/server/queries/ajustes';
import { NoEncontrado } from '@/components/ui/Pagina';
import { comoFilas, leer } from '@/lib/ui/datos';
import { cargarCatalogos, seguro } from '../../../_lib/catalogos';
import { idRuta, type PropsFicha } from '../../../_lib/pagina';
import { FormularioUsuario } from './FormularioUsuario';

export const metadata = { title: 'Usuario' };

export default async function FichaUsuario({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [usuarios, roles, cat] = await Promise.all([seguro(() => listarUsuarios(), []), seguro(() => listarRoles(), []), cargarCatalogos()]);
  const registro = id ? (comoFilas(usuarios).find((u) => Number(leer(u, 'id')) === id) ?? null) : null;
  if (id && !registro) return <NoEncontrado volverHref="/ajustes/usuarios" />;
  return <FormularioUsuario registro={registro} roles={comoFilas(roles)} sucursales={cat.sucursales} />;
}
