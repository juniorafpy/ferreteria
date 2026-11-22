'use client';

import type { Fila, Opcion } from '@/lib/ui/datos';
import { leer, leerPrimero, num, numONulo, texto } from '@/lib/ui/datos';
import { BuscadorEntidad, type TipoEntidad } from '@/components/ui/BuscadorEntidad';
import { Checkbox, DateInput, Field, Input, MoneyInput, NumberInput, Select, Textarea } from '@/components/ui/Campos';

export type TipoCampo =
  | 'texto'
  | 'email'
  | 'password'
  | 'numero'
  | 'entero'
  | 'gs'
  | 'pct'
  | 'fecha'
  | 'select'
  | 'check'
  | 'area'
  | 'entidad'
  | 'separador';

/** Definición serializable de un campo de formulario. `clave` es el nombre camelCase del input. */
export type CampoDef = {
  clave: string;
  etiqueta: string;
  tipo?: TipoCampo;
  opciones?: Opcion[];
  requerido?: boolean;
  /** Columnas que ocupa en una grilla de 4 (1-4). */
  ancho?: 1 | 2 | 3 | 4;
  ayuda?: string;
  maxLength?: number;
  soloLectura?: boolean;
  placeholder?: string;
  /** Para tipo `entidad`. */
  entidad?: TipoEntidad;
  /** Ruta para leer la etiqueta inicial de la entidad desde el registro. */
  claveEtiqueta?: string;
  /** Mostrar solo si otro campo tiene un valor dado: [clave, valor]. */
  siCampo?: [string, string | boolean];
  /** Valor por defecto si el registro no lo trae. */
  defecto?: string | number | boolean | null;
};

export type Valores = Record<string, unknown>;

/** Valores iniciales desde un registro del backend (snake o camel). */
export function valoresIniciales(campos: CampoDef[], registro: Fila | null): Valores {
  const v: Valores = {};
  for (const c of campos) {
    if (c.tipo === 'separador') continue;
    const r = registro ? leer(registro, c.clave) : undefined;
    let val: unknown = r === undefined || r === null ? (c.defecto ?? null) : r;
    if (c.tipo === 'check') val = Boolean(val);
    if (c.tipo === 'entidad') {
      v[`${c.clave}__etiqueta`] = registro ? texto(leerPrimero(registro, c.claveEtiqueta ?? '', `${c.clave.replace(/Id$/, '')}.razon_social`, `${c.clave.replace(/Id$/, '')}.descripcion`)) : '';
    }
    v[c.clave] = val;
  }
  return v;
}

/** Normaliza valores para enviar a la acción (strings vacíos → null, numéricos → number). */
export function valoresParaGuardar(campos: CampoDef[], v: Valores): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const c of campos) {
    if (c.tipo === 'separador') continue;
    const x = v[c.clave];
    switch (c.tipo) {
      case 'numero':
      case 'pct':
        out[c.clave] = numONulo(x);
        break;
      case 'entero':
      case 'gs':
        out[c.clave] = x === null || x === undefined || x === '' ? null : Math.round(num(x));
        break;
      case 'select':
      case 'entidad': {
        const s = texto(x);
        out[c.clave] = s === '' ? null : /^\d+$/.test(s) && /Id$/.test(c.clave) ? Number(s) : s;
        break;
      }
      case 'check':
        out[c.clave] = Boolean(x);
        break;
      default: {
        const s = texto(x);
        out[c.clave] = s === '' ? null : s;
      }
    }
    // Numéricos vacíos se omiten (los esquemas Zod los declaran .optional(), no .nullable()).
    if (out[c.clave] === null && (c.tipo === 'numero' || c.tipo === 'pct' || c.tipo === 'entero' || c.tipo === 'gs')) {
      delete out[c.clave];
    }
  }
  return out;
}

const ANCHO: Record<number, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
};

export function CamposGrid({
  campos,
  valores,
  onCambiar,
  errores = {},
  soloLectura = false,
}: {
  campos: CampoDef[];
  valores: Valores;
  onCambiar: (clave: string, valor: unknown, extra?: Valores) => void;
  errores?: Record<string, string>;
  soloLectura?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-4">
      {campos.map((c, i) => {
        if (c.siCampo) {
          const [k, val] = c.siCampo;
          if (valores[k] !== val && texto(valores[k]) !== texto(val)) return null;
        }
        if (c.tipo === 'separador') {
          return (
            <h3 key={`sep-${i}`} className="mt-2 border-b border-borde pb-1 text-[11px] font-semibold uppercase tracking-wide text-tenue sm:col-span-4">
              {c.etiqueta}
            </h3>
          );
        }
        const id = `campo-${c.clave}`;
        const ro = soloLectura || c.soloLectura;
        const val = valores[c.clave];
        const comun = { id, disabled: ro, 'aria-invalid': errores[c.clave] ? true : undefined, required: c.requerido };
        let control: React.ReactNode;
        switch (c.tipo) {
          case 'gs':
            control = <MoneyInput {...comun} value={numONulo(val)} onChange={(n) => onCambiar(c.clave, n)} />;
            break;
          case 'numero':
          case 'pct':
          case 'entero':
            control = (
              <NumberInput {...comun} decimales={c.tipo !== 'entero'} value={numONulo(val)} onChange={(n) => onCambiar(c.clave, n)} />
            );
            break;
          case 'fecha':
            control = <DateInput {...comun} value={texto(val).slice(0, 10)} onChange={(s) => onCambiar(c.clave, s)} />;
            break;
          case 'select':
            control = (
              <Select {...comun} value={texto(val)} onChange={(e) => onCambiar(c.clave, e.target.value)} opciones={c.opciones ?? []} placeholder={c.placeholder ?? 'Seleccione…'} />
            );
            break;
          case 'check':
            control = (
              <div className="flex h-8 items-center">
                <Checkbox id={id} disabled={ro} checked={Boolean(val)} onChange={(e) => onCambiar(c.clave, e.target.checked)} etiqueta={c.ayuda ?? 'Sí'} />
              </div>
            );
            break;
          case 'area':
            control = <Textarea {...comun} value={texto(val)} onChange={(e) => onCambiar(c.clave, e.target.value)} rows={2} maxLength={c.maxLength} />;
            break;
          case 'entidad':
            control = (
              <BuscadorEntidad
                id={id}
                tipo={c.entidad ?? 'persona'}
                deshabilitado={ro}
                invalido={Boolean(errores[c.clave])}
                valor={val ? { id: num(val), etiqueta: texto(valores[`${c.clave}__etiqueta`]) || `#${texto(val)}` } : null}
                onCambiar={(item) =>
                  onCambiar(c.clave, item ? leer(item, 'id') : null, {
                    [`${c.clave}__etiqueta`]: item ? texto(leerPrimero(item, 'razon_social', 'persona.razon_social', 'descripcion', 'nombre')) : '',
                  })
                }
              />
            );
            break;
          default:
            control = (
              <Input
                {...comun}
                type={c.tipo === 'email' ? 'email' : c.tipo === 'password' ? 'password' : 'text'}
                autoComplete={c.tipo === 'password' ? 'new-password' : undefined}
                value={texto(val)}
                maxLength={c.maxLength}
                placeholder={c.placeholder}
                onChange={(e) => onCambiar(c.clave, e.target.value)}
              />
            );
        }
        return (
          <Field
            key={c.clave}
            etiqueta={c.etiqueta}
            htmlFor={id}
            requerido={c.requerido}
            error={errores[c.clave]}
            ayuda={c.tipo === 'check' ? undefined : c.ayuda}
            className={ANCHO[c.ancho ?? 1]}
          >
            {control}
          </Field>
        );
      })}
    </div>
  );
}
