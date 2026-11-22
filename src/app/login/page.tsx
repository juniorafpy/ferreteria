import { redirect } from 'next/navigation';
import { getSesion } from '@/server/auth/session';
import { FormularioLogin } from './FormularioLogin';

export const metadata = { title: 'Ingresar' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const sesion = await getSesion();
  const { volver } = await searchParams;
  const destino = volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/inicio';
  if (sesion) redirect(destino);
  return (
    <main className="grid min-h-dvh place-items-center bg-fondo p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded bg-primario text-[15px] font-bold text-primario-texto">F</span>
          <div>
            <h1 className="text-[16px] font-semibold leading-tight">Ferre ERP</h1>
            <p className="text-[12px] text-tenue">Gestión ferretera · SIFEN</p>
          </div>
        </div>
        <FormularioLogin destino={destino} />
      </div>
    </main>
  );
}
