import { listarConfiguracionContable, listarPlanCuentas } from '@/server/queries/contabilidad';
import { comoFilas } from '@/lib/ui/datos';
import { seguro } from '../../_lib/catalogos';
import { ConfiguracionContable } from './ConfiguracionContable';

export const metadata = { title: 'Configuración contable' };

export default async function Configuracion() {
  const [config, cuentas] = await Promise.all([seguro(() => listarConfiguracionContable(), []), seguro(() => listarPlanCuentas(), [])]);
  return <ConfiguracionContable filas={comoFilas(config)} cuentas={comoFilas(cuentas)} />;
}
