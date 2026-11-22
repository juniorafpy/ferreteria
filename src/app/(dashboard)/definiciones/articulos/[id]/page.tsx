import { obtenerArticulo } from '@/server/queries/definiciones';
import { guardarArticulo } from '@/server/actions/definiciones';
import { FormularioMaestro } from '@/components/forms/FormularioMaestro';
import type { CampoDef } from '@/components/forms/CamposGrid';
import { DataTable } from '@/components/ui/DataTable';
import { NoEncontrado, Seccion } from '@/components/ui/Pagina';
import { comoFilas, leerPrimero } from '@/lib/ui/datos';
import { cargarCatalogos, OPC_TIPO_IVA } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Artículo' };

export default async function FichaArticulo({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [registro, cat] = await Promise.all([cargarFicha(id, obtenerArticulo), cargarCatalogos()]);
  if (id && !registro) return <NoEncontrado volverHref="/definiciones/articulos" />;

  const campos: CampoDef[] = [
    { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 30 },
    { clave: 'codigoBarras', etiqueta: 'Código de barras', maxLength: 50 },
    { clave: 'descripcion', etiqueta: 'Descripción', requerido: true, ancho: 2, maxLength: 200 },
    { clave: 'descripcionLarga', etiqueta: 'Descripción larga', tipo: 'area', ancho: 4 },
    { clave: 'clasificacion', etiqueta: 'Clasificación', tipo: 'separador' },
    { clave: 'categoriaId', etiqueta: 'Categoría', tipo: 'select', opciones: cat.categorias },
    { clave: 'marcaId', etiqueta: 'Marca', tipo: 'select', opciones: cat.marcas },
    { clave: 'modeloId', etiqueta: 'Modelo', tipo: 'select', opciones: cat.modelos },
    { clave: 'unidadMedidaId', etiqueta: 'Unidad base', tipo: 'select', opciones: cat.unidadesMedida, requerido: true },
    { clave: 'precios', etiqueta: 'Precios e impuestos', tipo: 'separador' },
    { clave: 'tipoIva', etiqueta: 'Tipo de IVA', tipo: 'select', opciones: OPC_TIPO_IVA, requerido: true, defecto: 'iva10' },
    { clave: 'precioVentaGs', etiqueta: 'Precio de venta (IVA incl.)', tipo: 'gs', requerido: true },
    { clave: 'costoReferenciaGs', etiqueta: 'Costo de referencia (sin IVA)', tipo: 'gs' },
    { clave: 'stockMinimo', etiqueta: 'Stock mínimo', tipo: 'numero' },
    { clave: 'controlaStock', etiqueta: 'Controla stock', tipo: 'check', defecto: true },
    { clave: 'permiteDecimales', etiqueta: 'Permite decimales', tipo: 'check', ayuda: 'Venta por metro/kg' },
  ];

  const presentaciones = comoFilas(leerPrimero(registro, 'unidades', 'presentaciones'));
  const stock = comoFilas(leerPrimero(registro, 'stock', 'existencias'));

  return (
    <FormularioMaestro titulo="Artículo" campos={campos} registro={registro} accion={guardarArticulo} listaHref="/definiciones/articulos" entidadEstado="articulos">
      {id ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Seccion titulo="Presentaciones">
            <DataTable
              buscar={false}
              filas={presentaciones}
              columnas={[
                { clave: 'unidad', titulo: 'Unidad', alternativas: ['unidadMedida.nombre', 'unidad_nombre'] },
                { clave: 'factor_conversion', titulo: 'Factor', tipo: 'cantidad' },
                { clave: 'codigo_barras', titulo: 'Barras', tipo: 'mono' },
                { clave: 'precio_venta_gs', titulo: 'Precio', tipo: 'gs', sumar: false },
              ]}
              vacio="Sin presentaciones alternativas."
            />
          </Seccion>
          <Seccion titulo="Existencias por depósito">
            <DataTable
              buscar={false}
              filas={stock}
              columnas={[
                { clave: 'deposito', titulo: 'Depósito', alternativas: ['deposito.nombre', 'deposito_nombre'] },
                { clave: 'cantidad', titulo: 'Cantidad', tipo: 'cantidad' },
                { clave: 'costo_promedio_gs', titulo: 'Costo prom.', tipo: 'gs', sumar: false },
              ]}
              vacio="Sin existencias registradas."
            />
          </Seccion>
        </div>
      ) : null}
    </FormularioMaestro>
  );
}
