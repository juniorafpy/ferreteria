import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icono } from './Icono';

/** Encabezado de página de listado con botón "Nuevo". */
export function EncabezadoPagina({
  titulo,
  descripcion,
  nuevoHref,
  nuevoTexto = 'Nuevo',
  acciones,
}: {
  titulo: string;
  descripcion?: ReactNode;
  nuevoHref?: string;
  nuevoTexto?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="mr-auto min-w-0">
        <h1 className="text-[17px] font-semibold">{titulo}</h1>
        {descripcion ? <p className="text-[12px] text-tenue">{descripcion}</p> : null}
      </div>
      {acciones}
      {nuevoHref ? (
        <Link
          href={nuevoHref}
          className="inline-flex h-8 items-center gap-1.5 rounded bg-primario px-3 text-[13px] font-medium text-primario-texto hover:bg-primario-hover"
          title="Nuevo (Alt+N en la ficha)"
        >
          <Icono nombre="mas" className="size-3.5" /> {nuevoTexto}
        </Link>
      ) : null}
    </div>
  );
}

/** Búsqueda en servidor por ?q= (formulario GET, funciona sin JS). */
export function BusquedaServidor({ q, placeholder = 'Buscar…' }: { q?: string; placeholder?: string }) {
  return (
    <form method="get" role="search" className="mb-2 flex max-w-md gap-1.5">
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 w-full rounded border border-borde bg-panel px-2 text-[13px] focus:border-foco focus:outline-none"
      />
      <button type="submit" className="inline-flex h-8 items-center gap-1 rounded border border-borde bg-panel px-3 text-[12px] hover:bg-panel-2">
        <Icono nombre="buscar" className="size-3.5" /> Buscar
      </button>
    </form>
  );
}

/** Tarjeta/sección con título. */
export function Seccion({ titulo, children, acciones, className = '' }: { titulo?: ReactNode; children: ReactNode; acciones?: ReactNode; className?: string }) {
  return (
    <section className={`rounded border border-borde bg-panel ${className}`}>
      {titulo ? (
        <div className="flex items-center justify-between gap-2 border-b border-borde px-3 py-2">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-tenue">{titulo}</h2>
          {acciones}
        </div>
      ) : null}
      <div className="p-3">{children}</div>
    </section>
  );
}

/** Mensaje cuando el backend no devolvió el registro. */
export function NoEncontrado({ volverHref, texto = 'Registro no encontrado.' }: { volverHref: string; texto?: string }) {
  return (
    <div className="rounded border border-borde bg-panel p-6 text-center">
      <p className="mb-3 text-tenue">{texto}</p>
      <Link href={volverHref} className="text-primario hover:underline">
        Volver al listado
      </Link>
    </div>
  );
}
