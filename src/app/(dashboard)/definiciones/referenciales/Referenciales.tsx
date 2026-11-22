'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { guardarReferencial } from '@/server/actions/definiciones';
import { CamposGrid, valoresIniciales, valoresParaGuardar, type CampoDef, type Valores } from '@/components/forms/CamposGrid';
import { Aviso, Boton } from '@/components/ui/Campos';
import { DataTable, type ColumnaDef } from '@/components/ui/DataTable';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { Pestanas } from '@/components/ui/Pestanas';
import { comoFilas, erroresPorCampo, leer, num, type Fila, type Opcion, type ResultadoAccion } from '@/lib/ui/datos';

type Ops = { paises: Opcion[]; departamentos: Opcion[]; marcas: Opcion[]; categorias: Opcion[]; sucursales: Opcion[] };
type Tab = { id: string; titulo: string; columnas: ColumnaDef[]; campos: (o: Ops) => CampoDef[] };

const ESTADO: CampoDef = {
  clave: 'estado',
  etiqueta: 'Estado',
  tipo: 'select',
  defecto: 'activo',
  opciones: [
    { valor: 'activo', etiqueta: 'Activo' },
    { valor: 'inactivo', etiqueta: 'Inactivo' },
  ],
};

/** `id` = clave de listarReferenciales() y nombre de `tabla` para guardarReferencial(tabla, datos). */
const TABS: Tab[] = [
  {
    id: 'tiposPersona',
    titulo: 'Tipos de persona',
    columnas: [
      { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
      { clave: 'nombre', titulo: 'Nombre' },
    ],
    campos: () => [
      { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 2 },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 3 },
    ],
  },
  {
    id: 'tiposDocumento',
    titulo: 'Tipos de documento',
    columnas: [
      { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'codigo_sifen', titulo: 'Cód. SIFEN', tipo: 'numero' },
      { clave: 'requiere_dv', titulo: 'Requiere DV', tipo: 'bool' },
    ],
    campos: () => [
      { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 10 },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
      { clave: 'codigoSifen', etiqueta: 'Código SIFEN (iTipIDRec)', tipo: 'entero' },
      { clave: 'requiereDv', etiqueta: 'Requiere DV', tipo: 'check', ayuda: 'RUC con dígito verificador' },
    ],
  },
  {
    id: 'paises',
    titulo: 'Países',
    columnas: [
      { clave: 'codigo_iso', titulo: 'ISO', tipo: 'mono' },
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'nacionalidad', titulo: 'Nacionalidad' },
    ],
    campos: () => [
      { clave: 'codigoIso', etiqueta: 'Código ISO (3)', requerido: true, maxLength: 3 },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
      { clave: 'nacionalidad', etiqueta: 'Nacionalidad' },
    ],
  },
  {
    id: 'departamentos',
    titulo: 'Departamentos',
    columnas: [
      { clave: 'codigo', titulo: 'Código', tipo: 'numero' },
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'pais', titulo: 'País', alternativas: ['pais.nombre', 'pais_nombre'] },
    ],
    campos: (o) => [
      { clave: 'paisId', etiqueta: 'País', tipo: 'select', opciones: o.paises, requerido: true },
      { clave: 'codigo', etiqueta: 'Código SIFEN', tipo: 'entero', requerido: true },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
    ],
  },
  {
    id: 'ciudades',
    titulo: 'Ciudades',
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'departamento', titulo: 'Departamento', alternativas: ['departamento.nombre', 'departamento_nombre'] },
      { clave: 'codigo_sifen', titulo: 'Cód. SIFEN', tipo: 'numero' },
    ],
    campos: (o) => [
      { clave: 'departamentoId', etiqueta: 'Departamento', tipo: 'select', opciones: o.departamentos, requerido: true },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
      { clave: 'codigoSifen', etiqueta: 'Código SIFEN', tipo: 'entero' },
    ],
  },
  {
    id: 'actividadesEconomicas',
    titulo: 'Actividades económicas',
    columnas: [
      { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
      { clave: 'descripcion', titulo: 'Descripción' },
    ],
    campos: () => [
      { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 10 },
      { clave: 'descripcion', etiqueta: 'Descripción', requerido: true, ancho: 3 },
    ],
  },
  {
    id: 'marcas',
    titulo: 'Marcas',
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
    ],
    campos: () => [{ clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 3 }, ESTADO],
  },
  {
    id: 'modelos',
    titulo: 'Modelos',
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'marca', titulo: 'Marca', alternativas: ['marca.nombre', 'marca_nombre'] },
      { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
    ],
    campos: (o) => [
      { clave: 'marcaId', etiqueta: 'Marca', tipo: 'select', opciones: o.marcas, requerido: true },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
      ESTADO,
    ],
  },
  {
    id: 'categorias',
    titulo: 'Categorías',
    columnas: [
      { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'padre', titulo: 'Categoría padre', alternativas: ['padre.nombre', 'padre_nombre'] },
      { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
    ],
    campos: (o) => [
      { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 20 },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
      ESTADO,
      { clave: 'padreId', etiqueta: 'Categoría padre', tipo: 'select', opciones: o.categorias, placeholder: '(raíz)', ancho: 2 },
    ],
  },
  {
    id: 'unidadesMedida',
    titulo: 'Unidades',
    columnas: [
      { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'codigo_sifen', titulo: 'Cód. SIFEN', tipo: 'numero' },
      { clave: 'permite_decimales', titulo: 'Decimales', tipo: 'bool' },
    ],
    campos: () => [
      { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 10 },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
      { clave: 'codigoSifen', etiqueta: 'Código SIFEN (cUniMed)', tipo: 'entero' },
      { clave: 'permiteDecimales', etiqueta: 'Permite decimales', tipo: 'check' },
    ],
  },
  {
    id: 'condicionesPago',
    titulo: 'Condiciones de pago',
    columnas: [
      { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'condicion', titulo: 'Condición' },
      { clave: 'dias_plazo', titulo: 'Días plazo', tipo: 'numero' },
      { clave: 'cantidad_cuotas', titulo: 'Cuotas', tipo: 'numero' },
      { clave: 'dias_entre_cuotas', titulo: 'Días entre cuotas', tipo: 'numero' },
      { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
    ],
    campos: () => [
      { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 20 },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
      {
        clave: 'condicion',
        etiqueta: 'Condición',
        tipo: 'select',
        requerido: true,
        defecto: 'contado',
        opciones: [
          { valor: 'contado', etiqueta: 'Contado' },
          { valor: 'credito', etiqueta: 'Crédito' },
        ],
      },
      { clave: 'diasPlazo', etiqueta: 'Días de plazo', tipo: 'entero', defecto: 0 },
      { clave: 'cantidadCuotas', etiqueta: 'Cantidad de cuotas', tipo: 'entero', defecto: 1 },
      { clave: 'diasEntreCuotas', etiqueta: 'Días entre cuotas', tipo: 'entero', defecto: 30 },
      ESTADO,
    ],
  },
  {
    id: 'depositos',
    titulo: 'Depósitos',
    columnas: [
      { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'sucursal', titulo: 'Sucursal', alternativas: ['sucursal.nombre', 'sucursal_nombre'] },
      { clave: 'es_principal', titulo: 'Principal', tipo: 'bool' },
      { clave: 'permite_venta', titulo: 'Permite venta', tipo: 'bool' },
      { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
    ],
    campos: (o) => [
      { clave: 'sucursalId', etiqueta: 'Sucursal', tipo: 'select', opciones: o.sucursales, requerido: true },
      { clave: 'codigo', etiqueta: 'Código', requerido: true, maxLength: 20 },
      { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 2 },
      { clave: 'esPrincipal', etiqueta: 'Principal', tipo: 'check', ayuda: 'Depósito principal de la sucursal' },
      { clave: 'permiteVenta', etiqueta: 'Permite venta', tipo: 'check', defecto: true },
      ESTADO,
    ],
  },
];

export function Referenciales({ datos, opciones }: { datos: Fila; opciones: Ops }) {
  const router = useRouter();
  const [tab, setTab] = useState(TABS[0].id);
  const [edicion, setEdicion] = useState<{ registro: Fila | null } | null>(null);
  const [valores, setValores] = useState<Valores>({});
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();
  const actual = TABS.find((t) => t.id === tab)!;
  const campos = actual.campos(opciones);
  const filas = comoFilas(leer(datos, tab));

  const abrir = (registro: Fila | null) => {
    setValores(valoresIniciales(campos, registro));
    setRes(null);
    setEdicion({ registro });
  };

  const guardar = () =>
    start(async () => {
      const id = edicion?.registro ? num(leer(edicion.registro, 'id')) : null;
      const r = (await guardarReferencial(tab as never, { ...(id ? { id } : {}), ...valoresParaGuardar(campos, valores) } as never)) as ResultadoAccion;
      setRes(r);
      if (r.ok) {
        setEdicion(null);
        router.refresh();
      }
    });

  return (
    <>
      <EncabezadoPagina titulo="Referenciales" descripcion="Catálogos generales y por empresa. Haga clic en una fila para editarla." />
      <Pestanas pestanas={TABS.map((t) => ({ id: t.id, titulo: t.titulo }))} activa={tab} onCambiar={setTab}>
        <DataTable
          key={tab}
          columnas={actual.columnas}
          filas={filas}
          exportar={tab}
          onClicFila={abrir}
          acciones={
            <Boton tamano="sm" variante="primario" onClick={() => abrir(null)}>
              <Icono nombre="mas" className="size-3.5" /> Nuevo
            </Boton>
          }
        />
      </Pestanas>

      <Modal
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={`${edicion?.registro ? 'Editar' : 'Nuevo'}: ${actual.titulo}`}
        ancho="max-w-2xl"
        onEnviar={guardar}
        pie={
          <>
            <Boton onClick={() => setEdicion(null)}>Cancelar</Boton>
            <Boton variante="primario" onClick={guardar} disabled={ocupado}>
              {ocupado ? 'Guardando…' : 'Guardar'}
            </Boton>
          </>
        }
      >
        <div className="grid gap-3">
          {res && !res.ok ? <Aviso>{res.error}</Aviso> : null}
          <CamposGrid campos={campos} valores={valores} errores={erroresPorCampo(res)} onCambiar={(k, v) => setValores((x) => ({ ...x, [k]: v }))} />
        </div>
      </Modal>
    </>
  );
}
