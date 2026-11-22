'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { login } from '@/server/actions/auth';
import type { ResultadoAccion } from '@/lib/ui/datos';
import { Aviso, Boton, Field, Input } from '@/components/ui/Campos';

export function FormularioLogin({ destino }: { destino: string }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, start] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-lg border border-borde bg-panel p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = (await login({ usuario: usuario.trim().toLowerCase(), password })) as ResultadoAccion;
          if (!r.ok) return setError(r.error);
          router.replace(destino);
          router.refresh();
        });
      }}
    >
      <h2 className="text-[14px] font-semibold">Ingresar</h2>
      {error ? <Aviso>{error}</Aviso> : null}
      <Field etiqueta="Usuario" htmlFor="login-usuario" requerido>
        <Input id="login-usuario" autoComplete="username" autoFocus value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
      </Field>
      <Field etiqueta="Contraseña" htmlFor="login-password" requerido>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <Boton type="submit" variante="primario" disabled={ocupado || !usuario || !password} className="mt-1 h-9">
        {ocupado ? 'Ingresando…' : 'Ingresar'}
      </Boton>
    </form>
  );
}
