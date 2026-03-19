import { supabase } from '@/common/lib/supabase/supabaseClient';
import type { Request } from '../types/request';

/**
 * Obtiene todas las categorías de la tabla 'categories'
 * La tabla categories contiene: id (int8), name, icon_url, category_type, created_at
 */
export const getRequests = async (): Promise<Request[]> => {
  try {
    console.log('🔍 Obteniendo categorías de la tabla "categories"...');
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon_url, category_type, extra_requirements, created_at')
      .order('name');

    if (error) {
      console.error('❌ Error de Supabase:', error);
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      throw new Error(`Error al obtener las categorías: ${error.message} (Código: ${error.code})`);
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No se encontraron categorías en la tabla "categories"');
      return [];
    }

    console.log(`✅ Se obtuvieron ${data.length} categorías exitosamente`);
    return data as Request[];
  } catch (err) {
    console.error('❌ Error en getRequests:', err);
    throw err;
  }
};
