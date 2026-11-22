'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { cambiarContexto, logout } from '@/server/actions/auth';
import { MENU, normalizar, todosLosDestinos } from '@/lib/ui/navegacion';
import { aplicarTema, leerTema } from '@/lib/ui/tema';
import { useAtajos } from '@/lib/ui/teclado';
import type { Opcion, ResultadoAccion } from '@/lib/ui/datos';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { Boton, Field, Select } from '@/components/ui/Campos';
import { SesionProvider, type SesionUI } from './SesionContexto';

const CLAVE_MENU = 'ferre.menu.colapsado';

export type ContextoUI = {
  empresa: string;
  sucursal: string;
  empresas: Opcion[];
  /** Sucursales con su empresa para filtrar en el selector. */
  sucursales: (Opcion & { empresaId: string })[];
};

export function Shell({ sesion, contexto, children }: { sesion: SesionUI; contexto: ContextoUI; children: ReactNode }) {
  const [colapsado, setColapsado] = useState(false);
  const [movilAbierto, setMovilAbierto] = useState(false);
  const [paleta, setPaleta] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      setColapsado(localStorage.getItem(CLAVE_MENU) === '1');
    } catch {
      /* sin almacenamiento */
    }
  }, []);
  useEffect(() => setMovilAbierto(false), [pathname]);

  const alternar = () => {
    setColapsado((c) => {
      try {
        localStorage.setItem(CLAVE_MENU, c ? '0' : '1');
      } catch {
        /* sin almacenamiento */
      }
      return !c;
    });
  };

  useAtajos({ 'ctrl+k': () => setPaleta(true) });

  return (
    <SesionProvider sesion={sesion}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-panel focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <div className="flex h-dvh overflow-hidden">
        {/* Fondo móvil */}
        {movilAbierto ? (
          <button
            aria-label="Cerrar menú"
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMovilAbierto(false)}
          />
        ) : null}
        <MenuLateral colapsado={colapsado} movilAbierto={movilAbierto} onAlternar={alternar} />
        <div className="flex min-w-0 flex-1 flex-col">
          <BarraSuperior
            sesion={sesion}
            contexto={contexto}
            onMenuMovil={() => setMovilAbierto(true)}
            onPaleta={() => setPaleta(true)}
          />
          <main id="contenido" className="min-h-0 flex-1 overflow-auto px-4 pb-8 pt-0">
            <div className="pt-3">{children}</div>
          </main>
        </div>
      </div>
      <PaletaComandos abierta={paleta} onCerrar={() => setPaleta(false)} />
    </SesionProvider>
  );
}

function MenuLateral({ colapsado, movilAbierto, onAlternar }: { colapsado: boolean; movilAbierto: boolean; onAlternar: () => void }) {
  const pathname = usePathname();
  const moduloActual = MENU.find((m) => m.items.some((i) => pathname.startsWith(i.href)))?.id;
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});
  const estaAbierto = (id: string) => abiertos[id] ?? id === moduloActual;

  return (
    <nav
      aria-label="Menú principal"
      className={`no-imprimir fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-borde bg-panel transition-transform md:static md:translate-x-0 ${
        movilAbierto ? 'translate-x-0' : '-translate-x-full'
      } ${colapsado ? 'md:w-14' : 'md:w-60'}`}
    >
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-borde px-3">
        <span className="grid size-7 shrink-0 place-items-center rounded bg-primario text-[12px] font-bold text-primario-texto">F</span>
        <span className={`truncate text-[14px] font-semibold ${colapsado ? 'md:hidden' : ''}`}>Ferre ERP</span>
        <button
          type="button"
          onClick={onAlternar}
          className="ml-auto hidden rounded p-1 text-tenue hover:bg-panel-2 hover:text-texto md:block"
          aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
          title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
        >
          <Icono nombre="menu" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        <Link
          href="/inicio"
          className={`mx-2 mb-1 flex items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-panel-2 ${pathname === '/inicio' ? 'bg-acento font-semibold text-primario' : ''}`}
          title="Inicio"
        >
          <Icono nombre="inicio" className="size-4 shrink-0" />
          <span className={colapsado ? 'md:sr-only' : ''}>Inicio</span>
        </Link>
        {MENU.map((m) => {
          const abierto = estaAbierto(m.id);
          return (
            <div key={m.id} className="mx-2">
              <button
                type="button"
                onClick={() => setAbiertos((a) => ({ ...a, [m.id]: !abierto }))}
                aria-expanded={abierto}
                title={m.titulo}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] hover:bg-panel-2 ${m.id === moduloActual ? 'font-semibold' : ''}`}
              >
                <Icono nombre={m.icono} className="size-4 shrink-0" />
                <span className={`flex-1 ${colapsado ? 'md:sr-only' : ''}`}>{m.titulo}</span>
                <Icono
                  nombre="chevron"
                  className={`size-3 shrink-0 text-tenue transition-transform ${abierto ? 'rotate-90' : ''} ${colapsado ? 'md:hidden' : ''}`}
                />
              </button>
              {abierto ? (
                <ul className={`mb-1 ml-4 border-l border-borde pl-2 ${colapsado ? 'md:hidden' : ''}`}>
                  {m.items.map((i) => {
                    const activo = pathname === i.href || pathname.startsWith(`${i.href}/`);
                    return (
                      <li key={i.href}>
                        <Link
                          href={i.href}
                          aria-current={activo ? 'page' : undefined}
                          className={`block rounded px-2 py-1 text-[12.5px] hover:bg-panel-2 ${activo ? 'bg-acento font-medium text-primario' : 'text-tenue hover:text-texto'}`}
                        >
                          {i.titulo}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className={`border-t border-borde px-3 py-2 text-[11px] text-tenue ${colapsado ? 'md:hidden' : ''}`}>
        <kbd className="rounded border border-borde px-1">Ctrl</kbd>+<kbd className="rounded border border-borde px-1">K</kbd> ir a…
      </div>
    </nav>
  );
}

function BarraSuperior({
  sesion,
  contexto,
  onMenuMovil,
  onPaleta,
}: {
  sesion: SesionUI;
  contexto: ContextoUI;
  onMenuMovil: () => void;
  onPaleta: () => void;
}) {
  const [selector, setSelector] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();

  return (
    <header className="no-imprimir flex h-11 shrink-0 items-center gap-2 border-b border-borde bg-panel px-3">
      <button type="button" onClick={onMenuMovil} className="rounded p-1 text-tenue hover:bg-panel-2 md:hidden" aria-label="Abrir menú">
        <Icono nombre="menu" />
      </button>
      <button
        type="button"
        onClick={() => setSelector(true)}
        className="flex min-w-0 items-center gap-2 rounded border border-borde px-2 py-1 text-left hover:bg-panel-2"
        title="Cambiar empresa / sucursal"
      >
        <Icono nombre="edificio" className="size-4 shrink-0 text-tenue" />
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-semibold leading-tight">{contexto.empresa}</span>
          <span className="block truncate text-[11px] leading-tight text-tenue">{contexto.sucursal}</span>
        </span>
        <Icono nombre="chevronAbajo" className="size-3 shrink-0 text-tenue" />
      </button>

      <button
        type="button"
        onClick={onPaleta}
        className="ml-auto hidden h-8 w-64 items-center gap-2 rounded border border-borde bg-panel-2 px-2 text-[12px] text-tenue hover:text-texto sm:flex"
      >
        <Icono nombre="buscar" className="size-3.5" />
        Ir a formulario…
        <kbd className="ml-auto rounded border border-borde px-1 text-[10px]">Ctrl K</kbd>
      </button>
      <button type="button" onClick={onPaleta} className="ml-auto rounded p-1.5 text-tenue hover:bg-panel-2 sm:hidden" aria-label="Buscar formulario">
        <Icono nombre="buscar" />
      </button>

      <ConmutadorTema />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuUsuario((v) => !v)}
          aria-expanded={menuUsuario}
          aria-haspopup="menu"
          className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-panel-2"
        >
          <span className="grid size-6 place-items-center rounded-full bg-acento text-[11px] font-semibold text-primario">
            {sesion.nombre.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden max-w-32 truncate text-[12px] sm:inline">{sesion.nombre}</span>
        </button>
        {menuUsuario ? (
          <div role="menu" className="absolute right-0 z-40 mt-1 w-52 rounded border border-borde bg-panel py-1 shadow-xl" onMouseLeave={() => setMenuUsuario(false)}>
            <div className="border-b border-borde px-3 py-2 text-[12px]">
              <div className="font-semibold">{sesion.nombre}</div>
              <div className="text-tenue">@{sesion.login}</div>
            </div>
            <button
              role="menuitem"
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] hover:bg-panel-2"
              onClick={() =>
                start(async () => {
                  await logout();
                  router.push('/login');
                  router.refresh();
                })
              }
            >
              <Icono nombre="salir" className="size-3.5" /> Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>

      <SelectorContexto abierto={selector} onCerrar={() => setSelector(false)} sesion={sesion} contexto={contexto} />
    </header>
  );
}

function ConmutadorTema() {
  const [tema, setTema] = useState<'claro' | 'oscuro'>('claro');
  useEffect(() => setTema(leerTema()), []);
  const siguiente = tema === 'oscuro' ? 'claro' : 'oscuro';
  return (
    <button
      type="button"
      onClick={() => {
        aplicarTema(siguiente);
        setTema(siguiente);
      }}
      className="rounded p-1.5 text-tenue hover:bg-panel-2 hover:text-texto"
      aria-label={`Cambiar a modo ${siguiente}`}
      title={`Modo ${siguiente}`}
    >
      <Icono nombre={tema === 'oscuro' ? 'sol' : 'luna'} />
    </button>
  );
}

function SelectorContexto({
  abierto,
  onCerrar,
  sesion,
  contexto,
}: {
  abierto: boolean;
  onCerrar: () => void;
  sesion: SesionUI;
  contexto: ContextoUI;
}) {
  const router = useRouter();
  const [empresaId, setEmpresaId] = useState(String(sesion.empresaId));
  const [sucursalId, setSucursalId] = useState(String(sesion.sucursalId));
  const [error, setError] = useState<string | null>(null);
  const [ocupado, start] = useTransition();
  const sucursales = contexto.sucursales.filter((s) => !s.empresaId || s.empresaId === empresaId);

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Empresa y sucursal de trabajo"
      pie={
        <>
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton
            variante="primario"
            disabled={ocupado || !empresaId || !sucursalId}
            onClick={() =>
              start(async () => {
                const r = (await cambiarContexto({ empresaId: Number(empresaId), sucursalId: Number(sucursalId) })) as ResultadoAccion;
                if (!r.ok) return setError(r.error);
                onCerrar();
                router.refresh();
              })
            }
          >
            Cambiar
          </Boton>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="text-[12px] text-peligro">{error}</p> : null}
        <Field etiqueta="Empresa" htmlFor="ctx-empresa">
          <Select
            id="ctx-empresa"
            value={empresaId}
            onChange={(e) => {
              setEmpresaId(e.target.value);
              setSucursalId('');
            }}
            opciones={contexto.empresas.length ? contexto.empresas : [{ valor: String(sesion.empresaId), etiqueta: contexto.empresa }]}
          />
        </Field>
        <Field etiqueta="Sucursal" htmlFor="ctx-sucursal">
          <Select
            id="ctx-sucursal"
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
            opciones={sucursales.length ? sucursales : [{ valor: String(sesion.sucursalId), etiqueta: contexto.sucursal }]}
            placeholder="Seleccione…"
          />
        </Field>
      </div>
    </Modal>
  );
}

function PaletaComandos({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [activo, setActivo] = useState(0);
  const lista = useRef<HTMLUListElement>(null);
  const destinos = useMemo(() => todosLosDestinos(), []);
  const resultados = useMemo(() => {
    const nq = normalizar(q.trim());
    if (!nq) return destinos;
    const terminos = nq.split(/\s+/);
    return destinos.filter((d) => {
      const h = normalizar(`${d.titulo} ${d.modulo} ${d.palabras ?? ''} ${d.href}`);
      return terminos.every((t) => h.includes(t));
    });
  }, [q, destinos]);

  useEffect(() => {
    if (abierta) {
      setQ('');
      setActivo(0);
    }
  }, [abierta]);
  useEffect(() => {
    lista.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activo]);

  const ir = (href: string) => {
    onCerrar();
    router.push(href);
  };

  return (
    <Modal abierto={abierta} onCerrar={onCerrar} titulo="Ir a formulario" ancho="max-w-xl">
      <input
        autoFocus
        role="combobox"
        aria-expanded
        aria-controls="paleta-lista"
        aria-activedescendant={resultados[activo] ? `paleta-${activo}` : undefined}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActivo(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActivo((a) => Math.min(a + 1, resultados.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActivo((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter' && resultados[activo]) {
            e.preventDefault();
            ir(resultados[activo].href);
          }
        }}
        placeholder="Escriba: factura, stock, kardex, nuevo cobro…"
        className="mb-2 h-9 w-full rounded border border-borde bg-panel px-3 text-[13px] focus:border-foco focus:outline-none"
      />
      <ul id="paleta-lista" ref={lista} role="listbox" className="max-h-80 overflow-auto">
        {resultados.map((d, i) => (
          <li
            key={d.href + d.modulo}
            id={`paleta-${i}`}
            role="option"
            aria-selected={i === activo}
            onMouseEnter={() => setActivo(i)}
            onClick={() => ir(d.href)}
            className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-[13px] ${i === activo ? 'bg-acento' : ''}`}
          >
            <span>{d.titulo}</span>
            <span className="text-[11px] text-tenue">{d.modulo}</span>
          </li>
        ))}
        {resultados.length === 0 ? <li className="px-2 py-3 text-[12px] text-tenue">Sin coincidencias.</li> : null}
      </ul>
    </Modal>
  );
}
