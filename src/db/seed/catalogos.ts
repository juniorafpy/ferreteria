import { eq } from 'drizzle-orm';
import type { DbLike } from '../index';
import {
  actividadesEconomicas,
  ciudades,
  departamentos,
  paises,
  tiposDocumento,
  tiposPersona,
  unidadesMedida,
} from '../schema';

/* Catálogos globales (sin empresa). */

export const TIPOS_PERSONA = [
  { codigo: 'F', nombre: 'Persona física' },
  { codigo: 'J', nombre: 'Persona jurídica' },
];

/** codigo_sifen = iTipIDRec del receptor (RUC va aparte en dRucRec). */
export const TIPOS_DOCUMENTO = [
  { codigo: 'RUC', nombre: 'Registro Único del Contribuyente', codigo_sifen: null, requiere_dv: true },
  { codigo: 'CI', nombre: 'Cédula de identidad paraguaya', codigo_sifen: 1, requiere_dv: false },
  { codigo: 'PAS', nombre: 'Pasaporte', codigo_sifen: 2, requiere_dv: false },
  { codigo: 'CIE', nombre: 'Cédula de identidad extranjera', codigo_sifen: 3, requiere_dv: false },
  { codigo: 'INN', nombre: 'Innominado (sin nombre)', codigo_sifen: 5, requiere_dv: false },
];

export const PAISES = [
  { codigo_iso: 'PRY', nombre: 'Paraguay', nacionalidad: 'Paraguaya' },
  { codigo_iso: 'ARG', nombre: 'Argentina', nacionalidad: 'Argentina' },
  { codigo_iso: 'BRA', nombre: 'Brasil', nacionalidad: 'Brasileña' },
  { codigo_iso: 'BOL', nombre: 'Bolivia', nacionalidad: 'Boliviana' },
  { codigo_iso: 'URY', nombre: 'Uruguay', nacionalidad: 'Uruguaya' },
  { codigo_iso: 'CHL', nombre: 'Chile', nacionalidad: 'Chilena' },
];

/**
 * Capital + 17 departamentos con sus ciudades principales.
 * `codigo` = código de departamento SIFEN (verificar contra la tabla oficial de la SET).
 */
export const DEPARTAMENTOS: { codigo: number; nombre: string; ciudades: string[] }[] = [
  { codigo: 1, nombre: 'Capital', ciudades: ['Asunción'] },
  { codigo: 2, nombre: 'Concepción', ciudades: ['Concepción', 'Horqueta'] },
  { codigo: 3, nombre: 'San Pedro', ciudades: ['San Pedro de Ycuamandiyú', 'San Estanislao'] },
  { codigo: 4, nombre: 'Cordillera', ciudades: ['Caacupé', 'Tobatí'] },
  { codigo: 5, nombre: 'Guairá', ciudades: ['Villarrica'] },
  { codigo: 6, nombre: 'Caaguazú', ciudades: ['Coronel Oviedo', 'Caaguazú'] },
  { codigo: 7, nombre: 'Caazapá', ciudades: ['Caazapá'] },
  { codigo: 8, nombre: 'Itapúa', ciudades: ['Encarnación', 'Hohenau'] },
  { codigo: 9, nombre: 'Misiones', ciudades: ['San Juan Bautista', 'San Ignacio'] },
  { codigo: 10, nombre: 'Paraguarí', ciudades: ['Paraguarí', 'Carapeguá'] },
  {
    codigo: 11,
    nombre: 'Alto Paraná',
    ciudades: ['Ciudad del Este', 'Presidente Franco', 'Hernandarias', 'Minga Guazú'],
  },
  {
    codigo: 12,
    nombre: 'Central',
    ciudades: [
      'San Lorenzo',
      'Luque',
      'Capiatá',
      'Lambaré',
      'Fernando de la Mora',
      'Limpio',
      'Ñemby',
      'Mariano Roque Alonso',
      'Villa Elisa',
      'Itauguá',
      'Areguá',
    ],
  },
  { codigo: 13, nombre: 'Ñeembucú', ciudades: ['Pilar'] },
  { codigo: 14, nombre: 'Amambay', ciudades: ['Pedro Juan Caballero'] },
  { codigo: 15, nombre: 'Canindeyú', ciudades: ['Salto del Guairá', 'Curuguaty'] },
  { codigo: 16, nombre: 'Presidente Hayes', ciudades: ['Villa Hayes'] },
  { codigo: 17, nombre: 'Alto Paraguay', ciudades: ['Fuerte Olimpo'] },
  { codigo: 18, nombre: 'Boquerón', ciudades: ['Filadelfia', 'Loma Plata'] },
];

/** Ejemplos (verificar códigos con el clasificador vigente de la SET). */
export const ACTIVIDADES_ECONOMICAS = [
  { codigo: '47521', descripcion: 'Comercio al por menor de artículos de ferretería' },
  { codigo: '47522', descripcion: 'Comercio al por menor de pinturas, barnices y lacas' },
  { codigo: '46631', descripcion: 'Comercio al por mayor de materiales de construcción y artículos de ferretería' },
];

/** codigo_sifen: completar con la tabla cUniMed oficial (77 = Unidad). */
export const UNIDADES_MEDIDA = [
  { codigo: 'UNI', nombre: 'Unidad', codigo_sifen: 77, permite_decimales: false },
  { codigo: 'MTR', nombre: 'Metro', codigo_sifen: null, permite_decimales: true },
  { codigo: 'M2', nombre: 'Metro cuadrado', codigo_sifen: null, permite_decimales: true },
  { codigo: 'M3', nombre: 'Metro cúbico', codigo_sifen: null, permite_decimales: true },
  { codigo: 'KG', nombre: 'Kilogramo', codigo_sifen: null, permite_decimales: true },
  { codigo: 'LT', nombre: 'Litro', codigo_sifen: null, permite_decimales: true },
  { codigo: 'GL', nombre: 'Galón', codigo_sifen: null, permite_decimales: false },
  { codigo: 'CJ', nombre: 'Caja', codigo_sifen: null, permite_decimales: false },
  { codigo: 'BLS', nombre: 'Bolsa', codigo_sifen: null, permite_decimales: false },
  { codigo: 'ROL', nombre: 'Rollo', codigo_sifen: null, permite_decimales: false },
  { codigo: 'PAR', nombre: 'Par', codigo_sifen: null, permite_decimales: false },
  { codigo: 'PQT', nombre: 'Paquete', codigo_sifen: null, permite_decimales: false },
];

export async function seedCatalogos(db: DbLike) {
  await db.insert(tiposPersona).values(TIPOS_PERSONA).onConflictDoNothing();
  await db.insert(tiposDocumento).values(TIPOS_DOCUMENTO).onConflictDoNothing();
  await db.insert(paises).values(PAISES).onConflictDoNothing();
  await db.insert(actividadesEconomicas).values(ACTIVIDADES_ECONOMICAS).onConflictDoNothing();
  await db.insert(unidadesMedida).values(UNIDADES_MEDIDA).onConflictDoNothing();

  const [py] = await db.select({ id: paises.id }).from(paises).where(eq(paises.codigo_iso, 'PRY'));

  await db
    .insert(departamentos)
    .values(DEPARTAMENTOS.map((d) => ({ pais_id: py.id, codigo: d.codigo, nombre: d.nombre })))
    .onConflictDoNothing();

  const deps = await db
    .select({ id: departamentos.id, codigo: departamentos.codigo })
    .from(departamentos)
    .where(eq(departamentos.pais_id, py.id));
  const depPorCodigo = new Map(deps.map((d) => [d.codigo, d.id]));

  const filasCiudades = DEPARTAMENTOS.flatMap((d) =>
    d.ciudades.map((nombre) => ({
      departamento_id: depPorCodigo.get(d.codigo)!,
      nombre,
      codigo_sifen: nombre === 'Asunción' ? 1 : null,
    })),
  );
  await db.insert(ciudades).values(filasCiudades).onConflictDoNothing();
}
