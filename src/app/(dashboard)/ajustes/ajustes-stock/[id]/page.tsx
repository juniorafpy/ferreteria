import { obtenerAjusteStock } from '@/server/queries/ajustes';
import { anularAjusteStock, confirmarAjusteStock, guardarAjusteStock } from '@/server/actions/ajustes';
import { FormularioDocumento } from '@/components/forms/FormularioDocumento';
import { NoEncontrado } from '@/components/ui/Pagina';
import { hoyISO } from '@/lib/ui/formato';
import { cargarCatalogos } from '../../../_lib/catalogos';
import { cargarFicha, idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Ajuste de stock' };

export default async function FichaAjuste({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  const [registro, cat] = await Promise.all([cargarFicha(id, obtenerAjusteStock), cargarCatalogos()]);
  if (id && !registro) return <NoEncontrado volverHref="/ajustes/ajustes-stock" />;
  return (
    <FormularioDocumento
      titulo="Ajuste de stock"
      listaHref="/ajustes/ajustes-stock"
      registro={registro}
      modo="cantidad"
      precio="costo"
      mostrarStock
      guardar={guardarAjusteStock}
      confirmar={confirmarAjusteStock}
      anular={anularAjusteStock}
      camposCabecera={[
        { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, defecto: hoyISO() },
        { clave: 'depositoId', etiqueta: 'Depósito', tipo: 'select', opciones: cat.depositos, requerido: true },
        {
          clave: 'tipoAjuste',
          etiqueta: 'Tipo',
          tipo: 'select',
          requerido: true,
          defecto: 'merma',
          opciones: [
            { valor: 'merma', etiqueta: 'Merma (salida)' },
            { valor: 'sobrante', etiqueta: 'Sobrante (entrada)' },
          ],
        },
        { clave: 'motivo', etiqueta: 'Motivo', requerido: true, maxLength: 255 },
        { clave: 'observacion', etiqueta: 'Observación', tipo: 'area', ancho: 4 },
      ]}
    />
  );
}
