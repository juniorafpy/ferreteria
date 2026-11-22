'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { guardarCuenta } from '@/server/actions/contabilidad';
import { CamposGrid, valoresIniciales, valoresParaGuardar, type CampoDef, type Valores } from '@/components/forms/CamposGrid';
import { Badge, BadgeEstado } from '@/components/ui/Badge';
import { Aviso, Boton } from '@/components/ui/Campos';
import { descargarCsv } from '@/components/ui/DataTable';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { EncabezadoPagina } from '@/components/ui/Pagina';
import { erroresPorCampo, leer, num, texto, type Fila, type ResultadoAccion } from '@/lib/ui/datos';
import { normalizar } from '@/lib/ui/navegacion';

type Nodo = { cuenta: Fila; hijos: Nodo[] };

const TIPOS = ['activo', 'pasivo', 'patrimonio', 'ingreso', 'costo', 'gasto'];

function construirArbol(cuentas: Fila[]): Nodo[] {
  const orden = [...cuentas].sort((a, b) => texto(leer(a, 'codigo')).localeCompare(texto(leer(b, 'codigo')), 'es', { numeric: true }));
  const porId = new Map<string, Nodo>();
  const porCodigo = new Map<string, Nodo>();
  for (const c of orden) {
    const n = { cuenta: c, hijos: [] };
    porId.set(texto(leer(c, 'id')), n);
    porCodigo.set(texto(leer(c, 'codigo')), n);
  }
  const raices: Nodo[] = [];
  for (const c of orden) {
    const n = porId.get(texto(leer(c, 'id')))!;
    const padreId = texto(leer(c, 'padre_id'));
    const cod = texto(leer(c, 'codigo'));
    const padre = (padreId && porId.get(padreId)) || porCodigo.get(cod.split('.').slice(0, -1).join('.'));
    if (padre && padre !== n) padre.hijos.push(n);
    else raices.push(n);
  }
  return raices;
}

export function ArbolCuentas({ cuentas }: { cuentas: Fila[] }) {
  const router = useRouter();
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set(cuentas.filter((c) => num(leer(c, 'nivel')) <= 1).map((c) => texto(leer(c, 'id')))));
  const [filtro, setFiltro] = useState('');
  const [edicion, setEdicion] = useState<Fila | null | undefined>(undefined);
  const [valores, setValores] = useState<Valores>({});
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();
  const arbol = useMemo(() => construirArbol(cuentas), [cuentas]);

  const campos: CampoDef[] = [
    { clave: 'codigo', etiqueta: 'Código', requerido: true, placeholder: '1.1.01' },
    { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 3 },
    {
      clave: 'padreId',
      etiqueta: 'Cuenta padre',
      tipo: 'select',
      ancho: 2,
      placeholder: '(raíz)',
      opciones: cuentas
        .filter((c) => !leer(c, 'imputable'))
        .map((c) => ({ valor: texto(leer(c, 'id')), etiqueta: `${texto(leer(c, 'codigo'))} ${texto(leer(c, 'nombre'))}` })),
    },
    { clave: 'tipo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: TIPOS.map((t) => ({ valor: t, etiqueta: t })) },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      tipo: 'select',
      defecto: 'activo',
      opciones: [
        { valor: 'activo', etiqueta: 'Activo' },
        { valor: 'inactivo', etiqueta: 'Inactivo' },
      ],
    },
    { clave: 'imputable', etiqueta: 'Imputable', tipo: 'check', ayuda: 'Recibe movimientos' },
  ];

  const abrir = (c: Fila | null, padre?: Fila) => {
    const v = valoresIniciales(campos, c);
    if (!c && padre) {
      v.padreId = texto(leer(padre, 'id'));
      v.tipo = texto(leer(padre, 'tipo'));
      v.codigo = `${texto(leer(padre, 'codigo'))}.`;
    }
    setValores(v);
    setRes(null);
    setEdicion(c);
  };

  const guardar = () =>
    start(async () => {
      const id = edicion ? num(leer(edicion, 'id')) : null;
      const r = (await guardarCuenta({ ...(id ? { id } : {}), ...valoresParaGuardar(campos, valores), imputable: Boolean(valores.imputable) } as never)) as ResultadoAccion;
      setRes(r);
      if (r.ok) {
        setEdicion(undefined);
        router.refresh();
      }
    });

  const nf = normalizar(filtro.trim());
  const coincide = (n: Nodo): boolean =>
    !nf || normalizar(`${texto(leer(n.cuenta, 'codigo'))} ${texto(leer(n.cuenta, 'nombre'))}`).includes(nf) || n.hijos.some(coincide);

  const render = (nodos: Nodo[], nivel: number): React.ReactNode =>
    nodos.filter(coincide).map((n) => {
      const id = texto(leer(n.cuenta, 'id'));
      const abierto = abiertos.has(id) || !!nf;
      const imputable = Boolean(leer(n.cuenta, 'imputable'));
      return (
        <li key={id} role="treeitem" aria-expanded={n.hijos.length ? abierto : undefined} aria-selected={false}>
          <div className="group flex items-center gap-1 rounded px-1 py-0.5 hover:bg-panel-2" style={{ paddingLeft: nivel * 18 }}>
            {n.hijos.length ? (
              <button
                type="button"
                onClick={() =>
                  setAbiertos((s) => {
                    const x = new Set(s);
                    if (x.has(id)) x.delete(id);
                    else x.add(id);
                    return x;
                  })
                }
                className="rounded p-0.5 text-tenue hover:text-texto"
                aria-label={abierto ? 'Contraer' : 'Expandir'}
              >
                <Icono nombre="chevron" className={`size-3 transition-transform ${abierto ? 'rotate-90' : ''}`} />
              </button>
            ) : (
              <span className="inline-block w-4" />
            )}
            <button type="button" onClick={() => abrir(n.cuenta)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <span className="font-mono text-[12px] text-tenue">{texto(leer(n.cuenta, 'codigo'))}</span>
              <span className={`truncate ${imputable ? '' : 'font-semibold'}`}>{texto(leer(n.cuenta, 'nombre'))}</span>
              {imputable ? <Badge tono="azul">imputable</Badge> : null}
              {texto(leer(n.cuenta, 'estado')) === 'inactivo' ? <BadgeEstado estado="inactivo" /> : null}
            </button>
            <span className="hidden text-[11px] text-tenue sm:inline">{texto(leer(n.cuenta, 'tipo'))}</span>
            {!imputable ? (
              <button
                type="button"
                onClick={() => abrir(null, n.cuenta)}
                className="invisible rounded p-0.5 text-primario group-hover:visible focus:visible"
                aria-label={`Agregar subcuenta de ${texto(leer(n.cuenta, 'nombre'))}`}
                title="Agregar subcuenta"
              >
                <Icono nombre="mas" className="size-3.5" />
              </button>
            ) : null}
          </div>
          {n.hijos.length && abierto ? (
            <ul role="group">{render(n.hijos, nivel + 1)}</ul>
          ) : null}
        </li>
      );
    });

  return (
    <>
      <EncabezadoPagina
        titulo="Plan de cuentas"
        descripcion="Árbol de cuentas contables. Haga clic en una cuenta para editarla."
        acciones={
          <>
            <Boton
              tamano="sm"
              onClick={() =>
                descargarCsv(
                  'plan-cuentas',
                  [
                    { clave: 'codigo', titulo: 'Código' },
                    { clave: 'nombre', titulo: 'Nombre' },
                    { clave: 'tipo', titulo: 'Tipo' },
                    { clave: 'imputable', titulo: 'Imputable', tipo: 'bool' },
                    { clave: 'estado', titulo: 'Estado' },
                  ],
                  cuentas,
                )
              }
            >
              <Icono nombre="descargar" className="size-3.5" /> CSV
            </Boton>
            <Boton tamano="sm" variante="primario" onClick={() => abrir(null)}>
              <Icono nombre="mas" className="size-3.5" /> Nueva cuenta
            </Boton>
          </>
        }
      />
      <div className="rounded border border-borde bg-panel p-2">
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por código o nombre…"
          aria-label="Filtrar cuentas"
          className="mb-2 h-7 w-full max-w-xs rounded border border-borde bg-panel px-2 text-[12px] focus:border-foco focus:outline-none"
        />
        {cuentas.length === 0 ? <p className="p-4 text-center text-tenue">Sin cuentas.</p> : null}
        <ul role="tree" aria-label="Plan de cuentas" className="text-[12.5px]">
          {render(arbol, 0)}
        </ul>
      </div>

      <Modal
        abierto={edicion !== undefined}
        onCerrar={() => setEdicion(undefined)}
        titulo={edicion ? 'Editar cuenta' : 'Nueva cuenta'}
        ancho="max-w-2xl"
        onEnviar={guardar}
        pie={
          <>
            <Boton onClick={() => setEdicion(undefined)}>Cancelar</Boton>
            <Boton variante="primario" onClick={guardar} disabled={ocupado}>
              Guardar
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
