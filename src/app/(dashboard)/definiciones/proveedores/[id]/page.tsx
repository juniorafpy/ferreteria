import { obtenerProveedor } from '@/server/queries/definiciones';
import { guardarProveedor } from '@/server/actions/definiciones';
import { FormularioMaestro } from '@/components/forms/FormularioMaestro';
import type { CampoDef } from '@/components/forms/CamposGrid';
import { NoEncontrado } from '@/components/ui/Pagina';
import { cargarCatalogos } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Proveedor' };

export default async function FichaProveedor({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [registro, cat] = await Promise.all([cargarFicha(id, obtenerProveedor), cargarCatalogos()]);
  if (id && !registro) return <NoEncontrado volverHref="/definiciones/proveedores" />;

  const campos: CampoDef[] = [
    {
      clave: 'personaId',
      etiqueta: 'Persona',
      tipo: 'entidad',
      entidad: 'persona',
      requerido: true,
      ancho: 3,
      claveEtiqueta: 'persona.razon_social',
      ayuda: 'Seleccione una persona existente o créela con "+ crear".',
    },
    { clave: 'codigo', etiqueta: 'Código', maxLength: 20 },
    { clave: 'condicionPagoId', etiqueta: 'Condición de pago', tipo: 'select', opciones: cat.condicionesPago, ancho: 2 },
    { clave: 'contacto', etiqueta: 'Contacto', ancho: 2, maxLength: 150 },
    { clave: 'saldoGs', etiqueta: 'Saldo actual', tipo: 'gs', soloLectura: true },
    { clave: 'observacion', etiqueta: 'Observación', tipo: 'area', ancho: 4 },
  ];

  return (
    <FormularioMaestro titulo="Proveedor" campos={campos} registro={registro} accion={guardarProveedor} listaHref="/definiciones/proveedores" entidadEstado="proveedores" />
  );
}
