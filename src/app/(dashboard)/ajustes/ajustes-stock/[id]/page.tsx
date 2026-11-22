import { listarAjustesStock } from '@/server/queries/ajustes';
import { anularAjusteStock, confirmarAjusteStock, guardarAjusteStock } from '@/server/actions/ajustes';
import { FormularioDocumento } from '@/components/forms/FormularioDocumento';
import { NoEncontrado } from '@/components/ui/Pagina';
import { comoFilas, leer } from '@/lib/ui/datos';
import { hoyISO } from '@/lib/ui/formato';
import { cargarCatalogos, seguro } from '../../../_lib/catalogos';
import { idRuta, type PropsFicha } from '../../../_lib/pagina';

export const metadata = { title: 'Ajuste de stock' };

export default async function FichaAjuste({ params }: PropsFicha) {
  const id = idRuta((await params).id);
  // Sin obtenerAjusteStock(id) en el contrato: se toma del listado (debería incluir `detalles`).
  const [lista, cat] = await Promise.all([seguro(() => listarAjustesStock(), []), cargarCatalogos()]);
  const registro = id ? (comoFilas(lista).find((a) => Number(leer(a, 'id')) === id) ?? null) : null;
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
