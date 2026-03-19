import { supabase } from '@/common/lib/supabase/supabaseClient';

const KEY_GENERAL_PROVIDER_REQUIREMENTS = 'general_provider_requirements';

/**
 * Obtiene el texto de requisitos generales para proveedores (app_config).
 * Se muestra en el registro de proveedores junto con requisitos por categoría.
 */
export async function getGeneralProviderRequirements(): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', KEY_GENERAL_PROVIDER_REQUIREMENTS)
    .maybeSingle();

  if (error) {
    console.warn('getGeneralProviderRequirements:', error.message);
    return null;
  }
  return data?.value ?? null;
}
