import { listarReferenciales } from '@/server/queries/definiciones';
import { comoFilas, leer, leerPrimero, opciones, texto, type Fila, type Opcion } from '@/lib/ui/datos';

export type Catalogos = Record<
  | 'tiposPersona'
  | 'tiposDocumento'
  | 'paises'
  | 'departamentos'
  | 'ciudades'
  | 'actividadesEconomicas'
  | 'marcas'
  | 'modelos'
  | 'categorias'
  | 'unidadesMedida'
  | 'condicionesPago'
  | 'depositos'
  | 'sucursales',
  Opcion[]
> & { crudo: Fila };

/** Catálogos referenciales como opciones para selects (tolerante a errores). */
export async function cargarCatalogos(): Promise<Catalogos> {
  let r: Fila = {};
  try {
    r = ((await listarReferenciales()) as unknown as Fila) ?? {};
  } catch (e) {
    console.error('[catalogos]', e);
  }
  const conCodigo = (f: Fila) => {
    const c = texto(leer(f, 'codigo'));
    const n = texto(leerPrimero(f, 'nombre', 'descripcion'));
    return c ? `${c} · ${n}` : n;
  };
  return {
    crudo: r,
    tiposPersona: opciones(leer(r, 'tiposPersona')),
    tiposDocumento: opciones(leer(r, 'tiposDocumento')),
    paises: opciones(leer(r, 'paises')),
    departamentos: opciones(leer(r, 'departamentos')),
    ciudades: opciones(leer(r, 'ciudades')),
    actividadesEconomicas: opciones(leer(r, 'actividadesEconomicas'), conCodigo),
    marcas: opciones(leer(r, 'marcas')),
    modelos: opciones(leer(r, 'modelos')),
    categorias: opciones(leer(r, 'categorias'), conCodigo),
    unidadesMedida: opciones(leer(r, 'unidadesMedida'), conCodigo),
    condicionesPago: opciones(leer(r, 'condicionesPago')),
    depositos: opciones(leer(r, 'depositos'), conCodigo),
    sucursales: opciones(leer(r, 'sucursales'), conCodigo),
  };
}

export const OPC_ESTADO_REGISTRO: Opcion[] = [
  { valor: 'activo', etiqueta: 'Activo' },
  { valor: 'inactivo', etiqueta: 'Inactivo' },
];

export const OPC_TIPO_IVA: Opcion[] = [
  { valor: 'iva10', etiqueta: 'IVA 10%' },
  { valor: 'iva5', etiqueta: 'IVA 5%' },
  { valor: 'exenta', etiqueta: 'Exenta' },
];

export const OPC_CONDICION: Opcion[] = [
  { valor: 'contado', etiqueta: 'Contado' },
  { valor: 'credito', etiqueta: 'Crédito' },
];

export const OPC_MEDIO_PAGO: Opcion[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'qr', etiqueta: 'QR' },
];

/** Carga segura de una consulta (devuelve `def` si falla). Resultado `unknown`: normalizar con comoFilas/comoRegistro. */
export async function seguro(fn: () => Promise<unknown>, def: unknown): Promise<unknown> {
  try {
    return await fn();
  } catch (e) {
    console.error('[consulta]', e);
    return def;
  }
}

export function filasSeguras(x: unknown): Fila[] {
  return comoFilas(x);
}
