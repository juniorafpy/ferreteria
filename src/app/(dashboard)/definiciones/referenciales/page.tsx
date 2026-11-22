import { cargarCatalogos } from '../../_lib/catalogos';
import { Referenciales } from './Referenciales';

export const metadata = { title: 'Referenciales' };

export default async function PaginaReferenciales() {
  const cat = await cargarCatalogos();
  return (
    <Referenciales
      datos={cat.crudo}
      opciones={{
        paises: cat.paises,
        departamentos: cat.departamentos,
        marcas: cat.marcas,
        categorias: cat.categorias,
        sucursales: cat.sucursales,
      }}
    />
  );
}
