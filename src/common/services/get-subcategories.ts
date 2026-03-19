import { supabase } from '@/common/lib/supabase/supabaseClient';
import type { Subcategory } from '../types/request';

/**
 * Obtiene las subcategorías asociadas a una categoría específica
 * @param categoryId - ID de la categoría (int8 de la tabla categories)
 */
export async function getSubcategoriesByCategory(
  categoryId: number
): Promise<Subcategory[]> {
  try {
    console.log(`🔍 Obteniendo subcategorías para la categoría ID: ${categoryId}`);
    
    // La tabla intermedia category_subcategories tiene: category_id (int8), subcategory_id (uuid)
    const { data, error } = await supabase
      .from('category_subcategories') // Tabla intermedia
      .select('subcategories(id, name, created_at)')
      .eq('category_id', categoryId);

    if (error) {
      console.error('❌ Error al obtener subcategorías:', error);
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log(`⚠️ No se encontraron subcategorías para la categoría ${categoryId}`);
      return [];
    }

    // Extraer los datos de subcategorías del resultado anidado
    const subcategories: Subcategory[] = data
      .map((item: any) => item.subcategories)
      .filter(Boolean);

    console.log(`✅ Se obtuvieron ${subcategories.length} subcategorías`);
    return subcategories;
  } catch (err) {
    console.error('❌ Error en getSubcategoriesByCategory:', err);
    throw err;
  }
}

/**
 * Obtiene todas las subcategorías
 */
export async function getAllSubcategories(): Promise<Subcategory[]> {
  const { data, error } = await supabase
    .from('subcategories')
    .select('id, name, created_at')
    .order('name');

  if (error) {
    console.error('Error fetching all subcategories:', error);
    throw error;
  }

  return data as Subcategory[];
}
