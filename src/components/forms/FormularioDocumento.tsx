'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition, type ReactNode } from 'react';
import {
  obtenerOrdenCompraUI,
  obtenerPedidoCompraUI,
  ordenesPendientesUI,
  pedidosPendientesUI,
} from '@/app/(dashboard)/_acciones/busqueda';
import { comoFilas, comoRegistro, erroresPorCampo, idDeResultado, leer, leerPrimero, num, texto, type AccionUI, type Fila, type ResultadoAccion } from '@/lib/ui/datos';
import { BadgeEstado } from '@/components/ui/Badge';
import { Aviso, Boton } from '@/components/ui/Campos';
import { DataTable, type ColumnaDef } from '@/components/ui/DataTable';
import { detallesParaGuardar, GrillaDetalle, lineasDesde, lineaVacia, totalesDe, type LineaDetalle } from '@/components/ui/GrillaDetalle';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { PanelTotalesIva } from '@/components/ui/PanelTotalesIva';
import { ToolbarDocumento } from '@/components/ui/ToolbarDocumento';
import { CamposGrid, valoresIniciales, valoresParaGuardar, type CampoDef, type Valores } from './CamposGrid';

export type ConfigImportar = {
  etiqueta: string;
  fuente: 'pedidos' | 'ordenes';
  /** Clave del payload donde se envían los ids importados. */
  campo: 'pedidoIds' | 'ordenCompraId';
  multiple: boolean;
  /** Copiar estos campos de cabecera desde el documento importado. */
  copiarCabecera?: string[];
};

const FUENTES = {
  pedidos: { listar: pedidosPendientesUI, obtener: obtenerPedidoCompraUI },
  ordenes: { listar: ordenesPendientesUI, obtener: obtenerOrdenCompraUI },
};

const COLS_IMPORTAR: ColumnaDef[] = [
  { clave: 'numero', titulo: 'Número' },
  { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
  { clave: 'proveedor_nombre', titulo: 'Proveedor', alternativas: ['proveedor.persona.razon_social', 'proveedor.razon_social', 'razon_social'] },
  { clave: 'total_gs', titulo: 'Total', tipo: 'gs' },
  { clave: 'estado', titulo: 'Estado', tipo: 'estado' },
];

export function FormularioDocumento({
  titulo,
  listaHref,
  registro,
  camposCabecera,
  modo = 'comercial',
  precio = 'venta',
  conDescuento = false,
  ivaEditable = false,
  mostrarPendiente = false,
  mostrarStock = false,
  claveFecha = 'fecha',
  guardar,
  confirmar,
  anular,
  importar,
  extras,
  lateral,
  datosFijos,
  numeroVisible,
  etiquetaConfirmar,
}: {
  titulo: string;
  listaHref: string;
  registro: Fila | null;
  camposCabecera: CampoDef[];
  modo?: 'comercial' | 'cantidad';
  precio?: 'venta' | 'costo';
  conDescuento?: boolean;
  ivaEditable?: boolean;
  mostrarPendiente?: boolean;
  mostrarStock?: boolean;
  claveFecha?: string;
  guardar: AccionUI;
  confirmar?: AccionUI;
  anular?: AccionUI;
  importar?: ConfigImportar;
  extras?: ReactNode;
  lateral?: ReactNode;
  datosFijos?: Record<string, unknown>;
  numeroVisible?: string;
  etiquetaConfirmar?: string;
}) {
  const router = useRouter();
  const id = registro ? num(leer(registro, 'id')) || null : null;
  const estado = texto(leer(registro, 'estado')) || 'borrador';
  const editable = !id || estado === 'borrador';

  const [cab, setCab] = useState<Valores>(() => valoresIniciales(camposCabecera, registro));
  const [lineas, setLineas] = useState<LineaDetalle[]>(() => {
    const l = lineasDesde(leerPrimero(registro, 'detalles', 'lineas', 'items'));
    return l.length ? l : [lineaVacia()];
  });
  const [importados, setImportados] = useState<number[]>(() => {
    if (!importar) return [];
    const v = leer(registro, importar.campo);
    return Array.isArray(v) ? v.map(Number) : v ? [Number(v)] : [];
  });
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();
  const [modalImp, setModalImp] = useState(false);
  const [pendientes, setPendientes] = useState<Fila[]>([]);
  const [selImp, setSelImp] = useState<string[]>([]);

  const totales = useMemo(() => totalesDe(lineas), [lineas]);

  const payload = () => ({
    ...(id ? { id } : {}),
    ...datosFijos,
    ...valoresParaGuardar(camposCabecera, cab),
    ...(importar ? { [importar.campo]: importar.multiple ? importados : (importados[0] ?? null) } : {}),
    detalles: detallesParaGuardar(lineas, modo),
  });

  const ejecutar = (fn: () => Promise<ResultadoAccion>, irANuevo = false) =>
    start(async () => {
      const r = await fn();
      setRes(r);
      if (r.ok) {
        const nid = idDeResultado(r) ?? id;
        if ((irANuevo || !id) && nid) router.push(`${listaHref}/${nid}`);
        router.refresh();
      }
    });

  const onGuardar = () => ejecutar(async () => (await guardar(payload())) as ResultadoAccion);

  async function abrirImportar() {
    if (!importar) return;
    const prov = cab.proveedorId ? num(cab.proveedorId) : undefined;
    const r = comoFilas(await FUENTES[importar.fuente].listar(prov));
    setPendientes(r);
    setSelImp([]);
    setModalImp(true);
  }

  async function confirmarImportacion() {
    if (!importar) return;
    const ids = selImp.map(Number).filter(Boolean);
    const nuevas: LineaDetalle[] = [];
    let cabeceraOrigen: Fila | null = null;
    for (const pid of ids) {
      const enLista = pendientes.find((p) => num(leer(p, 'id')) === pid);
      let dets = leerPrimero(enLista, 'detalles', 'lineas');
      if (!dets || !comoFilas(dets).length) {
        const doc = comoRegistro(await FUENTES[importar.fuente].obtener(pid));
        cabeceraOrigen = cabeceraOrigen ?? doc;
        dets = leerPrimero(doc, 'detalles', 'lineas');
      } else {
        cabeceraOrigen = cabeceraOrigen ?? enLista ?? null;
      }
      nuevas.push(...lineasDesde(dets, { pendienteComoCantidad: true }));
    }
    if (cabeceraOrigen && importar.copiarCabecera) {
      const extra: Valores = {};
      for (const k of importar.copiarCabecera) {
        const v = leer(cabeceraOrigen, k);
        if (v !== undefined && v !== null) extra[k] = v;
      }
      const prov = leerPrimero(cabeceraOrigen, 'proveedor_nombre', 'proveedor.persona.razon_social', 'proveedor.razon_social');
      if (prov) extra['proveedorId__etiqueta'] = prov;
      setCab((c) => ({ ...c, ...extra }));
    }
    setImportados((prev) => (importar.multiple ? Array.from(new Set([...prev, ...ids])) : ids.slice(0, 1)));
    setLineas((prev) => {
      const base = importar.multiple ? prev.filter((l) => l.articuloId) : [];
      const r = [...base, ...nuevas];
      return r.length ? r : [lineaVacia()];
    });
    setModalImp(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (editable) onGuardar();
      }}
      className="flex flex-col gap-3"
    >
      <ToolbarDocumento
        titulo={id ? `${titulo} ${numeroVisible ?? texto(leer(registro, 'numero'))}` : `Nuevo: ${titulo}`}
        subtitulo={editable ? 'Ctrl+S / F10 guardar · Alt+N nuevo · Esc volver · F2 buscar artículo' : 'Documento no editable'}
        estado={<BadgeEstado estado={estado} />}
        onNuevo={() => router.push(`${listaHref}/nuevo`)}
        onGuardar={editable ? onGuardar : undefined}
        onConfirmar={confirmar && id && estado === 'borrador' ? () => ejecutar(async () => (await confirmar(id)) as ResultadoAccion) : undefined}
        etiquetaConfirmar={etiquetaConfirmar}
        onAnular={anular && id && estado !== 'anulado' ? (motivo) => ejecutar(async () => (await anular(id, motivo)) as ResultadoAccion) : undefined}
        onCancelar={() => router.push(listaHref)}
        ocupado={ocupado}
        extras={
          <>
            {importar && editable ? (
              <Boton tamano="sm" onClick={abrirImportar}>
                <Icono nombre="importar" className="size-3.5" /> {importar.etiqueta}
              </Boton>
            ) : null}
            {extras}
          </>
        }
      />
      {res ? res.ok ? <Aviso tipo="exito">Operación realizada correctamente.</Aviso> : <Aviso>{res.error}</Aviso> : null}

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="rounded border border-borde bg-panel p-4">
            <CamposGrid
              campos={camposCabecera}
              valores={cab}
              soloLectura={!editable}
              errores={erroresPorCampo(res)}
              onCambiar={(k, v, extra) => setCab((x) => ({ ...x, ...extra, [k]: v }))}
            />
            {importar && importados.length ? (
              <p className="mt-2 text-[11px] text-tenue">
                Importado de {importar.fuente === 'pedidos' ? 'pedido(s)' : 'orden(es)'}: {importados.map((i) => `#${i}`).join(', ')}
              </p>
            ) : null}
          </div>
          <GrillaDetalle
            lineas={lineas}
            onCambiar={setLineas}
            modo={modo}
            precio={precio}
            conDescuento={conDescuento}
            ivaEditable={ivaEditable}
            mostrarPendiente={mostrarPendiente}
            mostrarStock={mostrarStock}
            soloLectura={!editable}
            fecha={texto(cab[claveFecha]) || undefined}
          />
        </div>
        <aside className="flex flex-col gap-3">
          {modo === 'comercial' ? <PanelTotalesIva totales={totales} /> : null}
          {lateral}
        </aside>
      </div>

      <Modal
        abierto={modalImp}
        onCerrar={() => setModalImp(false)}
        titulo={importar?.etiqueta ?? 'Importar'}
        ancho="max-w-3xl"
        pie={
          <>
            <Boton onClick={() => setModalImp(false)}>Cancelar</Boton>
            <Boton variante="primario" disabled={selImp.length === 0} onClick={confirmarImportacion}>
              Importar {selImp.length ? `(${selImp.length})` : ''}
            </Boton>
          </>
        }
      >
        <DataTable
          columnas={COLS_IMPORTAR}
          filas={pendientes}
          seleccion={selImp}
          onSeleccion={(s) => setSelImp(importar?.multiple ? s : s.slice(-1))}
          vacio="No hay documentos pendientes para importar."
        />
      </Modal>
      <button type="submit" hidden />
    </form>
  );
}
