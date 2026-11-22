'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { guardarConfiguracionSifen, guardarPuntoExpedicion, guardarTimbrado } from '@/server/actions/ajustes';
import { CamposGrid, valoresIniciales, valoresParaGuardar, type CampoDef, type Valores } from '@/components/forms/CamposGrid';
import { Aviso, Boton, NumberInput, Select } from '@/components/ui/Campos';
import { DataTable } from '@/components/ui/DataTable';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { Seccion } from '@/components/ui/Pagina';
import { comoFilas, erroresPorCampo, leer, num, numONulo, texto, type Fila, type ResultadoAccion } from '@/lib/ui/datos';

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

const CAMPOS_TIMBRADO: CampoDef[] = [
  { clave: 'numero', etiqueta: 'Número (8 dígitos)', requerido: true, maxLength: 8 },
  {
    clave: 'modalidad',
    etiqueta: 'Modalidad',
    tipo: 'select',
    requerido: true,
    defecto: 'electronica',
    opciones: [
      { valor: 'electronica', etiqueta: 'Electrónica (SIFEN)' },
      { valor: 'autoimpresor', etiqueta: 'Autoimpresor' },
      { valor: 'preimpreso', etiqueta: 'Preimpreso' },
    ],
  },
  { clave: 'fechaInicioVigencia', etiqueta: 'Inicio vigencia', tipo: 'fecha', requerido: true },
  { clave: 'fechaFinVigencia', etiqueta: 'Fin vigencia', tipo: 'fecha', ayuda: 'Vacío en electrónicos sin vencimiento' },
  ESTADO,
];

const CAMPOS_PUNTO: CampoDef[] = [
  { clave: 'codigo', etiqueta: 'Código (3 dígitos)', requerido: true, maxLength: 3, placeholder: '001' },
  { clave: 'descripcion', etiqueta: 'Descripción', ancho: 2 },
  ESTADO,
];

const CAMPOS_SIFEN: CampoDef[] = [
  {
    clave: 'ambiente',
    etiqueta: 'Ambiente',
    tipo: 'select',
    requerido: true,
    defecto: 'test',
    opciones: [
      { valor: 'test', etiqueta: 'Test' },
      { valor: 'produccion', etiqueta: 'Producción' },
    ],
  },
  { clave: 'idCsc', etiqueta: 'ID CSC', maxLength: 10 },
  { clave: 'cscRef', etiqueta: 'Referencia CSC', ayuda: 'Nombre de variable de entorno (no el secreto)', ancho: 2 },
  { clave: 'certificadoRuta', etiqueta: 'Ruta del certificado', ancho: 2 },
  { clave: 'certificadoPasswordRef', etiqueta: 'Ref. contraseña certificado', ayuda: 'Variable de entorno', ancho: 2 },
  { clave: 'urlWsRecepcion', etiqueta: 'URL WS recepción', ancho: 2 },
  { clave: 'urlWsConsulta', etiqueta: 'URL WS consulta', ancho: 2 },
  { clave: 'urlQrBase', etiqueta: 'URL base QR', ancho: 2 },
  { clave: 'envioPorLote', etiqueta: 'Envío por lote', tipo: 'check' },
  { clave: 'activo', etiqueta: 'Activo', tipo: 'check', defecto: true },
];

const TIPOS_DOC = [
  { valor: 'factura', etiqueta: 'Factura' },
  { valor: 'autofactura', etiqueta: 'Autofactura' },
  { valor: 'nota_credito', etiqueta: 'Nota de crédito' },
  { valor: 'nota_debito', etiqueta: 'Nota de débito' },
  { valor: 'nota_remision', etiqueta: 'Nota de remisión' },
];

type Numeracion = { timbradoId: string; tipoDocumento: string; numeroDesde: number | null; numeroHasta: number | null };

export function GestionSifenSucursal({
  sucursalId,
  establecimientoId,
  puntos,
  timbrados,
  configSifen,
}: {
  sucursalId: number;
  establecimientoId: number | null;
  puntos: Fila[];
  timbrados: Fila[];
  configSifen: Fila | null;
}) {
  const router = useRouter();
  const [ocupado, start] = useTransition();
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [modal, setModal] = useState<null | { tipo: 'timbrado' | 'punto'; registro: Fila | null }>(null);
  const [valores, setValores] = useState<Valores>({});
  const [numeraciones, setNumeraciones] = useState<Numeracion[]>([]);
  const [sifen, setSifen] = useState<Valores>(() => valoresIniciales(CAMPOS_SIFEN, configSifen));
  const [resSifen, setResSifen] = useState<ResultadoAccion | null>(null);

  const abrir = (tipo: 'timbrado' | 'punto', registro: Fila | null) => {
    setValores(valoresIniciales(tipo === 'timbrado' ? CAMPOS_TIMBRADO : CAMPOS_PUNTO, registro));
    setNumeraciones(
      comoFilas(leer(registro, 'numeraciones')).map((n) => ({
        timbradoId: texto(leer(n, 'timbrado_id')),
        tipoDocumento: texto(leer(n, 'tipo_documento')) || 'factura',
        numeroDesde: numONulo(leer(n, 'numero_desde')),
        numeroHasta: numONulo(leer(n, 'numero_hasta')),
      })),
    );
    setRes(null);
    setModal({ tipo, registro });
  };

  const guardarModal = () =>
    start(async () => {
      if (!modal) return;
      const id = modal.registro ? num(leer(modal.registro, 'id')) : null;
      const r =
        modal.tipo === 'timbrado'
          ? ((await guardarTimbrado({ ...(id ? { id } : {}), ...valoresParaGuardar(CAMPOS_TIMBRADO, valores) } as never)) as ResultadoAccion)
          : ((await guardarPuntoExpedicion({
              ...(id ? { id } : {}),
              sucursalId,
              establecimientoId,
              ...valoresParaGuardar(CAMPOS_PUNTO, valores),
              numeraciones: numeraciones
                .filter((n) => n.timbradoId)
                .map((n) => ({ timbradoId: Number(n.timbradoId), tipoDocumento: n.tipoDocumento, numeroDesde: n.numeroDesde, numeroHasta: n.numeroHasta })),
            } as never)) as ResultadoAccion);
      setRes(r);
      if (r.ok) {
        setModal(null);
        router.refresh();
      }
    });

  const guardarSifen = () =>
    start(async () => {
      const id = configSifen ? num(leer(configSifen, 'id')) : null;
      const r = (await guardarConfiguracionSifen({ ...(id ? { id } : {}), sucursalId, ...valoresParaGuardar(CAMPOS_SIFEN, sifen) } as never)) as ResultadoAccion;
      setResSifen(r);
      if (r.ok) router.refresh();
    });

  const opcTimbrados = timbrados.map((t) => ({ valor: texto(leer(t, 'id')), etiqueta: `${texto(leer(t, 'numero'))} (${texto(leer(t, 'modalidad'))})` }));

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Seccion
          titulo="Puntos de expedición"
          acciones={
            <Boton tamano="sm" onClick={() => abrir('punto', null)} disabled={!establecimientoId} title={!establecimientoId ? 'Guarde primero el establecimiento' : undefined}>
              <Icono nombre="mas" className="size-3.5" /> Nuevo
            </Boton>
          }
        >
          <DataTable
            buscar={false}
            filas={puntos}
            onClicFila={(f) => abrir('punto', f)}
            vacio="Sin puntos de expedición."
            columnas={[
              { clave: 'codigo', titulo: 'Código', tipo: 'mono' },
              { clave: 'descripcion', titulo: 'Descripción' },
              { clave: 'establecimiento', titulo: 'Estab.', alternativas: ['establecimiento.codigo'], tipo: 'mono' },
              { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
            ]}
          />
        </Seccion>
        <Seccion
          titulo="Timbrados"
          acciones={
            <Boton tamano="sm" onClick={() => abrir('timbrado', null)}>
              <Icono nombre="mas" className="size-3.5" /> Nuevo
            </Boton>
          }
        >
          <DataTable
            buscar={false}
            filas={timbrados}
            onClicFila={(f) => abrir('timbrado', f)}
            vacio="Sin timbrados."
            columnas={[
              { clave: 'numero', titulo: 'Número', tipo: 'mono' },
              { clave: 'modalidad', titulo: 'Modalidad' },
              { clave: 'fecha_inicio_vigencia', titulo: 'Desde', tipo: 'fecha' },
              { clave: 'fecha_fin_vigencia', titulo: 'Hasta', tipo: 'fecha' },
              { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
            ]}
          />
        </Seccion>
      </div>

      <Seccion
        titulo="Configuración SIFEN de la sucursal"
        acciones={
          <Boton tamano="sm" variante="primario" onClick={guardarSifen} disabled={ocupado}>
            <Icono nombre="guardar" className="size-3.5" /> Guardar SIFEN
          </Boton>
        }
      >
        {resSifen ? resSifen.ok ? <Aviso tipo="exito">Configuración SIFEN guardada.</Aviso> : <Aviso>{resSifen.error}</Aviso> : null}
        <p className="mb-2 text-[11px] text-tenue">Los secretos (CSC, contraseña del certificado) no se guardan: solo la referencia a la variable de entorno.</p>
        <CamposGrid campos={CAMPOS_SIFEN} valores={sifen} errores={erroresPorCampo(resSifen)} onCambiar={(k, v) => setSifen((x) => ({ ...x, [k]: v }))} />
      </Seccion>

      <Modal
        abierto={modal !== null}
        onCerrar={() => setModal(null)}
        titulo={`${modal?.registro ? 'Editar' : 'Nuevo'} ${modal?.tipo === 'timbrado' ? 'timbrado' : 'punto de expedición'}`}
        ancho="max-w-2xl"
        onEnviar={guardarModal}
        pie={
          <>
            <Boton onClick={() => setModal(null)}>Cancelar</Boton>
            <Boton variante="primario" onClick={guardarModal} disabled={ocupado}>
              Guardar
            </Boton>
          </>
        }
      >
        <div className="grid gap-3">
          {res && !res.ok ? <Aviso>{res.error}</Aviso> : null}
          <CamposGrid
            campos={modal?.tipo === 'timbrado' ? CAMPOS_TIMBRADO : CAMPOS_PUNTO}
            valores={valores}
            errores={erroresPorCampo(res)}
            onCambiar={(k, v) => setValores((x) => ({ ...x, [k]: v }))}
          />
          {modal?.tipo === 'punto' ? (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-tenue">Numeraciones (timbrado + tipo de documento)</h3>
                <Boton tamano="sm" onClick={() => setNumeraciones((n) => [...n, { timbradoId: '', tipoDocumento: 'factura', numeroDesde: 1, numeroHasta: 9999999 }])}>
                  <Icono nombre="mas" className="size-3.5" /> Agregar
                </Boton>
              </div>
              <div className="grid gap-1.5">
                {numeraciones.map((n, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_100px_100px_auto] items-center gap-1.5">
                    <Select
                      value={n.timbradoId}
                      onChange={(e) => setNumeraciones((x) => x.map((y, j) => (j === i ? { ...y, timbradoId: e.target.value } : y)))}
                      opciones={opcTimbrados}
                      placeholder="Timbrado…"
                      aria-label="Timbrado"
                    />
                    <Select
                      value={n.tipoDocumento}
                      onChange={(e) => setNumeraciones((x) => x.map((y, j) => (j === i ? { ...y, tipoDocumento: e.target.value } : y)))}
                      opciones={TIPOS_DOC}
                      aria-label="Tipo de documento"
                    />
                    <NumberInput decimales={false} value={n.numeroDesde} onChange={(v) => setNumeraciones((x) => x.map((y, j) => (j === i ? { ...y, numeroDesde: v } : y)))} aria-label="Desde" />
                    <NumberInput decimales={false} value={n.numeroHasta} onChange={(v) => setNumeraciones((x) => x.map((y, j) => (j === i ? { ...y, numeroHasta: v } : y)))} aria-label="Hasta" />
                    <button type="button" onClick={() => setNumeraciones((x) => x.filter((_, j) => j !== i))} className="rounded p-1 text-tenue hover:text-peligro" aria-label="Quitar numeración">
                      <Icono nombre="basura" className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
