import { listarClientes } from '@/server/queries/definiciones';
import { DataTable, type ColumnaDef } from '@/components/ui/DataTable';
import { BusquedaServidor, EncabezadoPagina } from '@/components/ui/Pagina';
import { comoFilas, primerParam } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import type { PropsLista } from '../../_lib/pagina';

export const metadata = { title: 'Clientes' };

const COLUMNAS: ColumnaDef[] = [
  { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
  { clave: 'razon_social', titulo: 'Cliente', alternativas: ['persona.razon_social'] },
  { clave: 'numero_documento', titulo: 'Documento', tipo: 'mono', alternativas: ['persona.numero_documento'] },
  { clave: 'condicion_pago', titulo: 'Condición', alternativas: ['condicionPago.nombre', 'condicion_pago_nombre'] },
  { clave: 'limite_credito_gs', titulo: 'Límite crédito', tipo: 'gs', sumar: false },
  { clave: 'saldo_gs', titulo: 'Saldo', tipo: 'gs' },
  { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
];

export default async function Clientes({ searchParams }: PropsLista) {
  const q = primerParam((await searchParams).q);
  const filas = comoFilas(await seguro(() => listarClientes(q), []));
  return (
    <>
      <EncabezadoPagina titulo="Clientes" descripcion="Clientes vinculados a una Persona." nuevoHref="/definiciones/clientes/nuevo" />
      <BusquedaServidor q={q} placeholder="Nombre, RUC o código…" />
      <DataTable columnas={COLUMNAS} filas={filas} enlace="/definiciones/clientes/{id}" exportar="clientes" totales />
    </>
  );
}
