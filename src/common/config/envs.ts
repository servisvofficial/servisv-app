import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional().default(""),
  EXPO_PUBLIC_GOOGLE_PLACES_API_KEY: z.string().optional(),
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  /** URL de callback tras el pago (ej. https://tudominio.com/payment-callback). Si no se define, se usa la misma base que Supabase. */
  EXPO_PUBLIC_PAYMENT_CALLBACK_URL: z.string().url().optional(),
});

export const envs = envSchema.parse({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  EXPO_PUBLIC_GOOGLE_PLACES_API_KEY:
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_PAYMENT_CALLBACK_URL:
    process.env.EXPO_PUBLIC_PAYMENT_CALLBACK_URL,
});
