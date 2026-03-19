import { z } from "zod";

export const loginSchema = z.object({
  email: z.string()
    .min(1, "El correo electrónico o DUI es obligatorio")
    .email("El correo electrónico no es válido"),
  password: z.string()
    .min(1, "La contraseña es obligatoria"),
});

export type LoginFields = z.infer<typeof loginSchema>;
