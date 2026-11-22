import Link from 'next/link';
import { getSesion } from '@/server/auth/session';
import { ACCIONES_RAPIDAS, MENU } from '@/lib/ui/navegacion';
import { Icono } from '@/components/ui/Icono';

export const metadata = { title: 'Inicio' };

export default async function Inicio() {
  const sesion = await getSesion();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-[18px] font-semibold">Hola{sesion ? `, ${sesion.nombre}` : ''}</h1>
        <p className="text-[12px] text-tenue">
          Accesos rápidos. Use <kbd className="rounded border border-borde px-1">Ctrl</kbd>+<kbd className="rounded border border-borde px-1">K</kbd> para saltar a cualquier formulario.
        </p>
      </div>

      <section aria-labelledby="acc-rap">
        <h2 id="acc-rap" className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-tenue">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ACCIONES_RAPIDAS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-2 rounded border border-borde bg-panel px-3 py-2.5 text-[13px] hover:border-primario hover:bg-acento/40"
            >
              <Icono nombre="mas" className="size-4 text-primario" />
              {a.titulo}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="mods" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <h2 id="mods" className="sr-only">
          Módulos
        </h2>
        {MENU.map((m) => (
          <div key={m.id} className="rounded border border-borde bg-panel">
            <div className="flex items-center gap-2 border-b border-borde px-3 py-2">
              <Icono nombre={m.icono} className="size-4 text-primario" />
              <h3 className="text-[13px] font-semibold">{m.titulo}</h3>
            </div>
            <ul className="grid gap-0.5 p-2">
              {m.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="flex items-center justify-between rounded px-2 py-1 text-[12.5px] hover:bg-panel-2">
                    {i.titulo}
                    <Icono nombre="chevron" className="size-3 text-tenue" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
