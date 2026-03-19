import { z } from "zod";

// Validador para DUI (formato salvadoreño: 00000000-0)
const duiSchema = z.string()
  .min(1, "El DUI es obligatorio")
  .regex(/^\d{8}-\d{1}$/, "El DUI debe tener el formato 00000000-0");

// Validador para email
export const emailSchema = z.string()
  .min(1, "El correo electrónico es obligatorio")
  .email("El correo electrónico no es válido");

// Validador para contraseña
export const passwordSchema = z.string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(32, "La contraseña debe tener como máximo 32 caracteres")
  .regex(/(?=.*[A-Z])/, "La contraseña debe contener al menos una letra mayúscula")
  .regex(/(?=.*\d)/, "La contraseña debe contener al menos un número");

// Schema base para datos personales (sin refine para poder extenderlo)
const personalDataBaseSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  email: emailSchema,
  dui: duiSchema,
  telefono: z.string().optional(),
  password: passwordSchema,
  repeatPassword: z.string().min(1, "Debes confirmar tu contraseña"),
});

// Validador para datos personales (con refine)
export const personalDataSchema = personalDataBaseSchema.refine((data) => data.password === data.repeatPassword, {
  message: "Las contraseñas no coinciden",
  path: ["repeatPassword"],
});

// Validador para datos de cliente
export const clientDataSchema = personalDataBaseSchema.extend({
  tipoVivienda: z.enum(["Casa", "Departamento"], {
    required_error: "Debes seleccionar un tipo de vivienda",
  }),
  direccion: z.string().min(1, "La dirección es obligatoria"),
  latitude: z.number(),
  longitude: z.number(),
  duiFrontal: z.string().min(1, "Debes subir la foto frontal del DUI"),
  duiReverso: z.string().min(1, "Debes subir la foto del dorso del DUI"),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Las contraseñas no coinciden",
  path: ["repeatPassword"],
});

// Validador para datos de proveedor (solvencia opcional al registrarse; se pide tras el primer servicio)
export const providerDataSchema = personalDataBaseSchema.extend({
  solvenciaPolicial: z.string().optional(),
  duiFrontal: z.string().min(1, "Debes subir la foto frontal del DUI"),
  duiReverso: z.string().min(1, "Debes subir la foto del dorso del DUI"),
  professionalCredential: z.string().optional(), // Opcional, solo para ciertas categorías
  direccion: z.string().min(1, "La dirección es obligatoria"),
  latitude: z.number(),
  longitude: z.number(),
  radioServicio: z.number().min(1, "El radio de servicio debe ser al menos 1 km"),
  nombreBanco: z.string().min(1, "El nombre del banco es obligatorio"),
  tipoCuenta: z.enum(["ahorro", "corriente"], {
    required_error: "Debes seleccionar un tipo de cuenta",
  }),
  numeroCuenta: z.string().min(1, "El número de cuenta es obligatorio"),
  selectedCategories: z.array(z.object({
    categoryId: z.number(),
    categoryName: z.string(),
    selectedSubcategories: z.array(z.string()).min(1, "Debes seleccionar al menos una subcategoría"),
  })).min(1, "Debes seleccionar al menos una categoría"),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Las contraseñas no coinciden",
  path: ["repeatPassword"],
});

export type PersonalDataFields = z.infer<typeof personalDataSchema>;
export type ClientDataFields = z.infer<typeof clientDataSchema>;
export type ProviderDataFields = z.infer<typeof providerDataSchema>;
