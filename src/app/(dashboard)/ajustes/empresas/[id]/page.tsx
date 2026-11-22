import { listarEmpresas } from '@/server/queries/ajustes';
import { guardarEmpresa } from '@/server/actions/ajustes';
import { FormularioMaestro } from '@/components/forms/FormularioMaestro';
import type { CampoDef } from '@/components/forms/CamposGrid';
import { NoEncontrado } from '@/components/ui/Pagina';
import { comoFilas, leer } from '@/lib/ui/datos';
import { cargarCatalogos, OPC_ESTADO_REGISTRO, seguro } from '../../../_lib/catalogos';
import { idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Empresa' };

/** Adapta el formulario plano (ruc, dv) al esquema `ruc: { ruc, dv }` del backend. */
async function guardar(datos: Record<string, unknown>) {
  'use server';
  const { ruc, dv, ...resto } = datos;
  return guardarEmpresa({ ...resto, ruc: { ruc: String(ruc ?? ''), dv: String(dv ?? '') } } as never);
}

export default async function FichaEmpresa({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  // Sin obtenerEmpresa(id) en el contrato: se toma del listado.
  const [empresas, cat] = await Promise.all([seguro(() => listarEmpresas(), []), cargarCatalogos()]);
  const registro = id ? (comoFilas(empresas).find((e) => Number(leer(e, 'id')) === id) ?? null) : null;
  if (id && !registro) return <NoEncontrado volverHref="/ajustes/empresas" />;

  const campos: CampoDef[] = [
    { clave: 'ruc', etiqueta: 'RUC', requerido: true, maxLength: 8 },
    { clave: 'dv', etiqueta: 'DV', requerido: true, maxLength: 1 },
    { clave: 'razonSocial', etiqueta: 'Razón social', requerido: true, ancho: 2 },
    { clave: 'nombreFantasia', etiqueta: 'Nombre de fantasía', ancho: 2 },
    { clave: 'actividadEconomicaId', etiqueta: 'Actividad económica', tipo: 'select', opciones: cat.actividadesEconomicas, ancho: 2 },
    { clave: 'ciudadId', etiqueta: 'Ciudad', tipo: 'select', opciones: cat.ciudades },
    { clave: 'direccion', etiqueta: 'Dirección', ancho: 2 },
    { clave: 'numeroCasa', etiqueta: 'Nro. casa' },
    { clave: 'telefono', etiqueta: 'Teléfono' },
    { clave: 'email', etiqueta: 'Email', tipo: 'email' },
    { clave: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: OPC_ESTADO_REGISTRO, defecto: 'activo' },
  ];
  return <FormularioMaestro titulo="Empresa" campos={campos} registro={registro} accion={guardar} listaHref="/ajustes/empresas" />;
}
