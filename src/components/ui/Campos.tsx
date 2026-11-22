'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { formatoMiles, parseDecimal, parseEntero } from '@/lib/ui/formato';
import type { Opcion } from '@/lib/ui/datos';

export const claseInput =
  'h-8 w-full rounded border border-borde bg-panel px-2 text-[13px] text-texto placeholder:text-tenue/70 ' +
  'focus:border-foco focus:outline-none focus:ring-2 focus:ring-foco/30 disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-tenue ' +
  'aria-[invalid=true]:border-peligro';

export function Field({
  etiqueta,
  error,
  ayuda,
  requerido,
  htmlFor,
  className = '',
  children,
}: {
  etiqueta: ReactNode;
  error?: string;
  ayuda?: ReactNode;
  requerido?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={htmlFor} className="text-[11px] font-medium uppercase tracking-wide text-tenue">
        {etiqueta}
        {requerido ? <span className="ml-0.5 text-peligro" aria-hidden>*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-peligro" role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p className="text-[11px] text-tenue">{ayuda}</p>
      ) : null}
    </div>
  );
}

export function Input({ className = '', ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`${claseInput} ${className}`} />;
}

export function Textarea({ className = '', ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={`${claseInput} h-auto min-h-16 py-1.5 ${className}`} />;
}

export function Select({
  opciones,
  placeholder,
  className = '',
  ...p
}: SelectHTMLAttributes<HTMLSelectElement> & { opciones: Opcion[]; placeholder?: string }) {
  return (
    <select {...p} className={`${claseInput} pr-6 ${className}`}>
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.etiqueta}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({
  etiqueta,
  className = '',
  ...p
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: ReactNode }) {
  const id = useId();
  return (
    <label htmlFor={p.id ?? id} className={`inline-flex cursor-pointer items-center gap-2 text-[13px] ${className}`}>
      <input id={p.id ?? id} type="checkbox" {...p} className="size-4 rounded border-borde accent-primario" />
      <span>{etiqueta}</span>
    </label>
  );
}

type MoneyProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | null | undefined;
  onChange: (v: number) => void;
  permitirNegativo?: boolean;
};

/** Monto en Guaraníes: solo enteros, muestra "Gs. 150.000". */
export function MoneyInput({ value, onChange, permitirNegativo, className = '', ...p }: MoneyProps) {
  const mostrado = value === null || value === undefined ? '' : formatoMiles(value);
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-[12px] text-tenue">Gs.</span>
      <input
        {...p}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={mostrado}
        onChange={(e) => {
          let n = parseEntero(e.target.value);
          if (!permitirNegativo && n < 0) n = -n;
          onChange(n);
        }}
        onKeyDown={(e) => {
          if (e.key === '.' || e.key === ',') e.preventDefault();
          p.onKeyDown?.(e);
        }}
        className={`${claseInput} pl-8 text-right tabular-nums`}
      />
    </div>
  );
}

type NumProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | null | undefined;
  onChange: (v: number) => void;
  decimales?: boolean;
};

/** Cantidad numérica (admite coma decimal si `decimales`). */
export function NumberInput({ value, onChange, decimales = true, className = '', ...p }: NumProps) {
  const [borrador, setBorrador] = useState<string | null>(null);
  const mostrado = borrador ?? (value === null || value === undefined ? '' : String(value).replace('.', ','));
  return (
    <input
      {...p}
      type="text"
      inputMode={decimales ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={mostrado}
      onChange={(e) => {
        const s = decimales ? e.target.value.replace(/[^\d,.-]/g, '') : e.target.value.replace(/[^\d-]/g, '');
        setBorrador(s);
        onChange(decimales ? parseDecimal(s) : parseEntero(s));
      }}
      onBlur={(e) => {
        setBorrador(null);
        p.onBlur?.(e);
      }}
      className={`${claseInput} text-right tabular-nums ${className}`}
    />
  );
}

/** Fecha nativa (YYYY-MM-DD). El navegador la muestra en dd/mm/aaaa con lang es-PY. */
export function DateInput({
  value,
  onChange,
  className = '',
  ...p
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <input
      {...p}
      type="date"
      lang="es-PY"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`${claseInput} tabular-nums ${className}`}
    />
  );
}

/** Botón con variantes. */
export function Boton({
  variante = 'secundario',
  tamano = 'md',
  className = '',
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'peligro' | 'fantasma';
  tamano?: 'sm' | 'md';
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-foco';
  const tam = tamano === 'sm' ? 'h-7 px-2 text-[12px]' : 'h-8 px-3 text-[13px]';
  const v = {
    primario: 'bg-primario text-primario-texto hover:bg-primario-hover',
    secundario: 'border border-borde bg-panel text-texto hover:bg-panel-2',
    peligro: 'border border-peligro/40 bg-panel text-peligro hover:bg-peligro/10',
    fantasma: 'text-texto hover:bg-panel-2',
  }[variante];
  return <button type="button" {...p} className={`${base} ${tam} ${v} ${className}`} />;
}

/** Mensaje de error/éxito en línea. */
export function Aviso({ tipo = 'error', children }: { tipo?: 'error' | 'exito' | 'info'; children: ReactNode }) {
  const c = {
    error: 'border-peligro/40 bg-peligro/10 text-peligro',
    exito: 'border-exito/40 bg-exito/10 text-exito',
    info: 'border-borde bg-panel-2 text-tenue',
  }[tipo];
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`rounded border px-3 py-2 text-[13px] ${c}`}>
      {children}
    </div>
  );
}
