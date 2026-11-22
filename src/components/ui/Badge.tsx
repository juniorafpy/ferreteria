import { etiquetaEstado } from '@/lib/ui/formato';

type Tono = 'gris' | 'azul' | 'verde' | 'ambar' | 'rojo' | 'violeta' | 'cian';

const TONOS: Record<Tono, string> = {
  gris: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600',
  azul: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800',
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
  rojo: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800',
  violeta: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800',
  cian: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:ring-cyan-800',
};

const TONO_ESTADO: Record<string, Tono> = {
  // registros
  activo: 'verde',
  inactivo: 'gris',
  // documentos
  borrador: 'gris',
  confirmado: 'azul',
  anulado: 'rojo',
  facturado_parcial: 'ambar',
  facturado: 'verde',
  vencido: 'rojo',
  ordenado_parcial: 'ambar',
  ordenado: 'verde',
  recibido_parcial: 'ambar',
  recibido: 'verde',
  enviado: 'cian',
  // cuentas
  pendiente: 'ambar',
  parcial: 'cian',
  pagado: 'verde',
  // caja
  abierta: 'verde',
  cerrada: 'gris',
  // descuentos
  automatico: 'violeta',
  manual: 'ambar',
  ninguno: 'gris',
};

/** Estados SIFEN (estado_sifen). */
const TONO_SIFEN: Record<string, Tono> = {
  no_aplica: 'gris',
  pendiente: 'ambar',
  enviado: 'cian',
  aprobado: 'verde',
  aprobado_con_observacion: 'violeta',
  rechazado: 'rojo',
  cancelado: 'rojo',
  inutilizado: 'gris',
};

export function Badge({ tono = 'gris', children, titulo }: { tono?: Tono; children: React.ReactNode; titulo?: string }) {
  return (
    <span
      title={titulo}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}

/** Badge de estado de documento/registro o SIFEN (`sifen`). */
export function BadgeEstado({ estado, sifen = false }: { estado: unknown; sifen?: boolean }) {
  const e = String(estado ?? '');
  if (!e) return null;
  const tono = (sifen ? TONO_SIFEN[e] : TONO_ESTADO[e]) ?? 'gris';
  return (
    <Badge tono={tono} titulo={sifen ? `SIFEN: ${etiquetaEstado(e)}` : undefined}>
      {sifen ? <span className="font-semibold opacity-70">SIFEN</span> : null}
      {etiquetaEstado(e)}
    </Badge>
  );
}
