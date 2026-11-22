import { obtenerPersona } from '@/server/queries/definiciones';
import { guardarPersona } from '@/server/actions/definiciones';
import { FormularioMaestro } from '@/components/forms/FormularioMaestro';
import type { CampoDef } from '@/components/forms/CamposGrid';
import { NoEncontrado } from '@/components/ui/Pagina';
import { cargarCatalogos } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Persona' };

export default async function FichaPersona({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [registro, cat] = await Promise.all([cargarFicha(id, obtenerPersona), cargarCatalogos()]);
  if (id && !registro) return <NoEncontrado volverHref="/definiciones/personas" />;

  const campos: CampoDef[] = [
    { clave: 'tipoPersonaId', etiqueta: 'Tipo de persona', tipo: 'select', opciones: cat.tiposPersona, requerido: true },
    { clave: 'tipoDocumentoId', etiqueta: 'Tipo de documento', tipo: 'select', opciones: cat.tiposDocumento, requerido: true },
    { clave: 'numeroDocumento', etiqueta: 'Nro. documento', requerido: true, maxLength: 20 },
    { clave: 'dv', etiqueta: 'DV (RUC)', maxLength: 1, ayuda: 'Dígito verificador, solo RUC' },
    { clave: 'razonSocial', etiqueta: 'Nombre / Razón social', requerido: true, ancho: 2, maxLength: 200 },
    { clave: 'nombreFantasia', etiqueta: 'Nombre de fantasía', ancho: 2, maxLength: 200 },
    { clave: 'nombres', etiqueta: 'Nombres', ancho: 2 },
    { clave: 'apellidos', etiqueta: 'Apellidos', ancho: 2 },
    { clave: 'esContribuyente', etiqueta: 'Contribuyente', tipo: 'check', ayuda: 'Es contribuyente (IVA)' },
    { clave: 'actividadEconomicaId', etiqueta: 'Actividad económica', tipo: 'select', opciones: cat.actividadesEconomicas, ancho: 3 },
    { clave: 'contacto', etiqueta: 'Contacto y ubicación', tipo: 'separador' },
    { clave: 'paisId', etiqueta: 'País', tipo: 'select', opciones: cat.paises },
    { clave: 'ciudadId', etiqueta: 'Ciudad', tipo: 'select', opciones: cat.ciudades },
    { clave: 'direccion', etiqueta: 'Dirección', ancho: 2 },
    { clave: 'numeroCasa', etiqueta: 'Nro. casa', maxLength: 10 },
    { clave: 'telefono', etiqueta: 'Teléfono' },
    { clave: 'celular', etiqueta: 'Celular' },
    { clave: 'email', etiqueta: 'Email', tipo: 'email' },
    { clave: 'observacion', etiqueta: 'Observación', tipo: 'area', ancho: 4 },
  ];

  return (
    <FormularioMaestro
      titulo="Persona"
      campos={campos}
      registro={registro}
      accion={guardarPersona}
      listaHref="/definiciones/personas"
      entidadEstado="personas"
    />
  );
}
