import { z } from 'zod';
import { id } from './comunes';

export const loginInput = z.object({
  usuario: z.string().trim().min(1, 'Ingrese el usuario').max(60),
  password: z.string().min(1, 'Ingrese la contraseña').max(200),
});
export type LoginInput = z.infer<typeof loginInput>;

export const cambiarContextoInput = z.object({ empresaId: id, sucursalId: id });
export type CambiarContextoInput = z.infer<typeof cambiarContextoInput>;
