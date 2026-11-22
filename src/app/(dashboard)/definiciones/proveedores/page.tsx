import { listarProveedores } from '@/server/queries/definiciones';
import { DataTable, type ColumnaDef } from '@/components/ui/DataTable';
import { BusquedaServidor, EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas, primerParam } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Proveedores' };

const COLUMNAS: ColumnaDef[] = [
  { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
  { clave: 'razon_social', titulo: 'Proveedor', alternativas: ['persona.razon_social'] },
  { clave: 'numero_documento', titulo: 'RUC', tipo: 'mono', alternativas: ['persona.numero_documento'] },
  { clave: 'contacto', titulo: 'Contacto' },
  { clave: 'condicion_pago', titulo: 'Condición', alternativas: ['condicionPago.nombre', 'condicion_pago_nombre'] },
  { clave: 'saldo_gs', titulo: 'Saldo', tipo: 'gs' },
  { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
];

export default async function Proveedores({ searchParams }: PropsLista) {
  const q = primerParam((await searchParams).q);
  const filas = comoFilas(await seguro(() => listarProveedores(q), []));
  return (
    <>
      <EncabezadoPagina titulo="Proveedores" descripcion="Proveedores vinculados a una Persona." nuevoHref="/definiciones/proveedores/nuevo" />
      <BusquedaServidor q={q} placeholder="Nombre, RUC o código…" />
      <DataTable columnas={COLUMNAS} filas={filas} enlace="/definiciones/proveedores/{id}" exportar="proveedores" totales />
    </>
  );
}
