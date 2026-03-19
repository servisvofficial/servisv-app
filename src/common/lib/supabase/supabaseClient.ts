import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { envs } from "@/common/config/envs";

const { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } = envs;

if (!EXPO_PUBLIC_SUPABASE_URL || !EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    "Faltan las credenciales de Supabase en las variables de entorno"
  );
}

// Crear el cliente de Supabase (configuración simple como en servisv-proyecto-web)
export const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY
);

export type SupabaseClientType = typeof supabase;
