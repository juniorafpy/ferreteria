import { listarPermisos, listarRoles } from '@/server/queries/ajustes';
import { NoEncontrado } from '@/components/ui/Pagina';
import { comoFilas, leer } from '@/lib/ui/datos';
import { seguro } from '../../../_lib/catalogos';
import { idRuta, type PropsFicha } from '../../../_lib/pagina';
import { FormularioRol } from './FormularioRol';

export const metadata = { title: 'Rol' };

export default async function FichaRol({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [roles, permisos] = await Promise.all([seguro(() => listarRoles(), []), seguro(() => listarPermisos(), [])]);
  const registro = id ? (comoFilas(roles).find((r) => Number(leer(r, 'id')) === id) ?? null) : null;
  if (id && !registro) return <NoEncontrado volverHref="/ajustes/roles" />;
  return <FormularioRol registro={registro} permisos={comoFilas(permisos)} />;
}
