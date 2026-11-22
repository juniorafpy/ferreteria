import { listarPlanCuentas } from '@/server/queries/contabilidad';
import { comoFilas } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import { ArbolCuentas } from './ArbolCuentas';

export const metadata = { title: 'Plan de cuentas' };

export default async function PlanCuentas() {
  const cuentas = comoFilas(await seguro(() => listarPlanCuentas(), []));
  return <ArbolCuentas cuentas={cuentas} />;
}
