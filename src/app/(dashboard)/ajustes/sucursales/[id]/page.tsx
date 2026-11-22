import { listarPuntosExpedicion, listarSucursales, listarTimbrados } from '@/server/queries/ajustes';
import { guardarSucursal } from '@/server/actions/ajustes';
import { FormularioMaestro } from '@/components/forms/FormularioMaestro';
import type { CampoDef } from '@/components/forms/CamposGrid';
import { NoEncontrado } from '@/components/ui/Pagina';
import { comoFilas, leer, leerPrimero } from '@/lib/ui/datos';
import { cargarCatalogos, OPC_ESTADO_REGISTRO, seguro } from '../../../_lib/catalogos';
import { idRuta, type PropsFicha } from '../../../_lib/pagina';
import { GestionSifenSucursal } from './GestionSifenSucursal';

export const metadata = { title: 'Sucursal' };

/** Adapta campos planos del establecimiento al objeto `establecimiento` del backend. */
async function guardar(datos: Record<string, unknown>) {
  'use server';
  const { establecimientoCodigo, establecimientoDenominacion, establecimientoDireccion, ...resto } = datos;
  return guardarSucursal({
    ...resto,
    establecimiento: establecimientoCodigo
      ? { codigo: String(establecimientoCodigo), denominacion: String(establecimientoDenominacion ?? resto.nombre ?? ''), direccion: establecimientoDireccion ?? null }
      : null,
  } as never);
}

export default async function FichaSucursal({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [sucursales, puntos, timbrados, cat] = await Promise.all([
    seguro(() => listarSucursales(), []),
    seguro(() => listarPuntosExpedicion(), []),
    seguro(() => listarTimbrados(), []),
    cargarCatalogos(),
  ]);
  const base = id ? (comoFilas(sucursales).find((s) => Number(leer(s, 'id')) === id) ?? null) : null;
  if (id && !base) return <NoEncontrado volverHref="/ajustes/sucursales" />;
  const registro = base
    ? {
        ...base,
        establecimientoCodigo: leerPrimero(base, 'establecimiento.codigo', 'establecimiento_codigo'),
        establecimientoDenominacion: leerPrimero(base, 'establecimiento.denominacion', 'establecimiento_denominacion'),
        establecimientoDireccion: leerPrimero(base, 'establecimiento.direccion', 'establecimiento_direccion'),
      }
    : null;

  const campos: CampoDef[] = [
    { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 10 },
    { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
    { clave: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: OPC_ESTADO_REGISTRO, defecto: 'activo' },
    { clave: 'direccion', etiqueta: 'Dirección', ancho: 2 },
    { clave: 'ciudadId', etiqueta: 'Ciudad', tipo: 'select', opciones: cat.ciudades },
    { clave: 'esCasaMatriz', etiqueta: 'Casa matriz', tipo: 'check' },
    { clave: 'telefono', etiqueta: 'Teléfono' },
    { clave: 'email', etiqueta: 'Email', tipo: 'email' },
    { clave: 'sep', etiqueta: 'Establecimiento SIFEN', tipo: 'separador' },
    { clave: 'establecimientoCodigo', etiqueta: 'Código (3 dígitos)', maxLength: 3, placeholder: '001' },
    { clave: 'establecimientoDenominacion', etiqueta: 'Denominación', ancho: 2 },
    { clave: 'establecimientoDireccion', etiqueta: 'Dirección establecimiento' },
  ];

  const establecimientoId = leerPrimero(base, 'establecimiento.id', 'establecimiento_id');
  return (
    <FormularioMaestro titulo="Sucursal" campos={campos} registro={registro} accion={guardar} listaHref="/ajustes/sucursales">
      {id ? (
        <GestionSifenSucursal
          sucursalId={id}
          establecimientoId={establecimientoId ? Number(establecimientoId) : null}
          puntos={comoFilas(puntos).filter((p) => Number(leer(p, 'sucursal_id')) === id)}
          timbrados={comoFilas(timbrados)}
          configSifen={(leerPrimero(base, 'configuracionSifen', 'configuracion_sifen', 'sifen') as Record<string, unknown> | undefined) ?? null}
        />
      ) : null}
    </FormularioMaestro>
  );
}
