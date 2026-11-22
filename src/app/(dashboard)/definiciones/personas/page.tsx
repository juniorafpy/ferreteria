import { listarPersonas } from '@/server/queries/definiciones';
import { DataTable, type ColumnaDef } from '@/components/ui/DataTable';
import { BusquedaServidor, EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas, primerParam } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Personas' };

const COLUMNAS: ColumnaDef[] = [
  { clave: 'razon_social', titulo: 'Nombre / Razón social' },
  { clave: 'numero_documento', titulo: 'Documento', tipo: 'mono' },
  { clave: 'dv', titulo: 'DV', ancho: '3rem' },
  { clave: 'tipo_documento', titulo: 'Tipo doc.', alternativas: ['tipoDocumento.nombre', 'tipo_documento_nombre'] },
  { clave: 'telefono', titulo: 'Teléfono', alternativas: ['celular'] },
  { clave: 'email', titulo: 'Email' },
  { clave: 'es_contribuyente', titulo: 'Contrib.', tipo: 'bool' },
  { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
];

export default async function Personas({ searchParams }: PropsLista) {
  const q = primerParam((await searchParams).q);
  const filas = comoFilas(await seguro(() => listarPersonas(q), []));
  return (
    <>
      <EncabezadoPagina titulo="Personas" descripcion="Ficha única de personas físicas y jurídicas (base de clientes y proveedores)." nuevoHref="/definiciones/personas/nuevo" />
      <BusquedaServidor q={q} placeholder="Nombre, RUC o cédula…" />
      <DataTable columnas={COLUMNAS} filas={filas} enlace="/definiciones/personas/{id}" exportar="personas" />
    </>
  );
}
