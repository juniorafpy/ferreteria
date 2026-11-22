import { listarUsuarios } from '@/server/queries/ajustes';
import { DataTable } from '@/components/ui/DataTable';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';

export const metadata = { title: 'Usuarios' };

export default async function Usuarios() {
  const filas = comoFilas(await seguro(() => listarUsuarios(), []));
  return (
    <>
      <EncabezadoPagina titulo="Usuarios" nuevoHref="/ajustes/usuarios/nuevo" />
      <DataTable
        filas={filas}
        enlace="/ajustes/usuarios/{id}"
        exportar="usuarios"
        columnas={[
          { clave: 'usuario', titulo: 'Usuario', tipo: 'mono' },
          { clave: 'nombre', titulo: 'Nombre' },
          { clave: 'email', titulo: 'Email' },
          { clave: 'roles_texto', titulo: 'Roles', alternativas: ['roles_nombres'] },
          { clave: 'ultimo_acceso_en', titulo: 'Último acceso', tipo: 'fechaHora' },
          { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
        ]}
      />
    </>
  );
}
