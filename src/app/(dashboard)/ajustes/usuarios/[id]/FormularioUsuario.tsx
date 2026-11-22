'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { guardarUsuario } from '@/server/actions/ajustes';
import { CamposGrid, valoresIniciales, valoresParaGuardar, type CampoDef, type Valores } from '@/components/forms/CamposGrid';
import { BadgeEstado } from '@/components/ui/Badge';
import { Aviso, Boton, Select } from '@/components/ui/Campos';
import { Icono } from '@/components/ui/Icono';
import { Seccion } from '@/components/ui/Pagina';
import { ToolbarDocumento } from '@/components/ui/ToolbarDocumento';
import { comoFilas, erroresPorCampo, idDeResultado, leer, leerPrimero, num, texto, type Fila, type Opcion, type ResultadoAccion } from '@/lib/ui/datos';

type Asignacion = { rolId: string; sucursalId: string };

export function FormularioUsuario({ registro, roles, sucursales }: { registro: Fila | null; roles: Fila[]; sucursales: Opcion[] }) {
  const router = useRouter();
  const id = registro ? num(leer(registro, 'id')) || null : null;
  const campos: CampoDef[] = [
    { clave: 'usuario', etiqueta: 'Usuario (login)', requerido: true, maxLength: 60, ayuda: 'Minúsculas, sin espacios' },
    { clave: 'nombre', etiqueta: 'Nombre completo', requerido: true, ancho: 2 },
    { clave: 'email', etiqueta: 'Email', tipo: 'email' },
    { clave: 'password', etiqueta: id ? 'Nueva contraseña' : 'Contraseña', tipo: 'password', requerido: !id, ayuda: id ? 'Vacío = no cambia' : 'Mínimo 8 caracteres' },
    { clave: 'sucursalPredeterminadaId', etiqueta: 'Sucursal predeterminada', tipo: 'select', opciones: sucursales },
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
  ];
  const [valores, setValores] = useState<Valores>(() => ({ ...valoresIniciales(campos, registro), password: '' }));
  const [asig, setAsig] = useState<Asignacion[]>(() =>
    comoFilas(leerPrimero(registro, 'roles', 'usuarioRoles')).map((r) => ({
      rolId: texto(leerPrimero(r, 'rol_id', 'rol.id', 'id')),
      sucursalId: texto(leer(r, 'sucursal_id')),
    })),
  );
  const [res, setRes] = useState<ResultadoAccion | null>(null);
  const [ocupado, start] = useTransition();

  const opcRoles = roles.map((r) => ({ valor: texto(leer(r, 'id')), etiqueta: `${texto(leer(r, 'codigo'))} · ${texto(leer(r, 'nombre'))}` }));

  const guardar = () =>
    start(async () => {
      const datos = valoresParaGuardar(campos, valores);
      if (!datos.password) delete datos.password;
      const r = (await guardarUsuario({
        ...(id ? { id } : {}),
        ...datos,
        roles: asig.filter((a) => a.rolId).map((a) => ({ rolId: Number(a.rolId), sucursalId: a.sucursalId ? Number(a.sucursalId) : null })),
      } as never)) as ResultadoAccion;
      setRes(r);
      if (r.ok) {
        const nid = idDeResultado(r) ?? id;
        if (!id && nid) router.push(`/ajustes/usuarios/${nid}`);
        router.refresh();
      }
    });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        guardar();
      }}
    >
      <ToolbarDocumento
        titulo={id ? `Usuario ${texto(leer(registro, 'usuario'))}` : 'Nuevo usuario'}
        estado={registro ? <BadgeEstado estado={leer(registro, 'estado')} /> : null}
        onNuevo={() => router.push('/ajustes/usuarios/nuevo')}
        onGuardar={guardar}
        onCancelar={() => router.push('/ajustes/usuarios')}
        ocupado={ocupado}
      />
      {res ? res.ok ? <Aviso tipo="exito">Usuario guardado.</Aviso> : <Aviso>{res.error}</Aviso> : null}
      <Seccion titulo="Datos">
        <CamposGrid campos={campos} valores={valores} errores={erroresPorCampo(res)} onCambiar={(k, v) => setValores((x) => ({ ...x, [k]: v }))} />
      </Seccion>
      <Seccion
        titulo="Roles asignados"
        acciones={
          <Boton tamano="sm" onClick={() => setAsig((a) => [...a, { rolId: '', sucursalId: '' }])}>
            <Icono nombre="mas" className="size-3.5" /> Asignar rol
          </Boton>
        }
      >
        <div className="grid gap-1.5">
          {asig.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-1.5">
              <Select value={a.rolId} onChange={(e) => setAsig((x) => x.map((y, j) => (j === i ? { ...y, rolId: e.target.value } : y)))} opciones={opcRoles} placeholder="Rol…" aria-label="Rol" />
              <Select
                value={a.sucursalId}
                onChange={(e) => setAsig((x) => x.map((y, j) => (j === i ? { ...y, sucursalId: e.target.value } : y)))}
                opciones={sucursales}
                placeholder="Todas las sucursales"
                aria-label="Sucursal"
              />
              <button type="button" onClick={() => setAsig((x) => x.filter((_, j) => j !== i))} className="rounded p-1 text-tenue hover:text-peligro" aria-label="Quitar rol">
                <Icono nombre="basura" className="size-3.5" />
              </button>
            </div>
          ))}
          {asig.length === 0 ? <p className="text-[12px] text-tenue">Sin roles asignados.</p> : null}
        </div>
      </Seccion>
      <button type="submit" hidden />
    </form>
  );
}
