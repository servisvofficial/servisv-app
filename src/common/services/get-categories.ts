import { supabase } from '@/common/lib/supabase/supabaseClient';
import type { Subcategory } from '../types/request';

export interface CategoryWithSubcategories {
  id: number;
  name: string;
  icon_url?: string;
  category_type?: string;
  created_at?: string;
  subcategories: Subcategory[];
}

/**
 * Obtiene todas las categorías con sus subcategorías desde Supabase
 * Hace JOIN entre las 3 tablas: categories, category_subcategories, subcategories
 */
export const getCategories = async (): Promise<CategoryWithSubcategories[]> => {
  try {
    // Paso 1: Obtener todas las categorías
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (categoriesError) {
      throw new Error('Error al obtener las categorías: ' + categoriesError.message);
    }

    if (!categories || categories.length === 0) {
      return [];
    }

    // Paso 2: Obtener todas las relaciones y subcategorías
    const { data: relations, error: relationsError } = await supabase
      .from('category_subcategories')
      .select(`
        category_id,
        subcategories (
          id,
          name,
          created_at
        )
      `);

    if (relationsError) {
      throw new Error('Error al obtener las subcategorías: ' + relationsError.message);
    }

    // Paso 3: Agrupar subcategorías por categoría
    const categoriesWithSubs: CategoryWithSubcategories[] = categories.map(category => {
      // Filtrar las subcategorías de esta categoría
      const categoryRelations = relations?.filter(r => r.category_id === category.id) || [];
      
      const subcategories: Subcategory[] = categoryRelations
        .map(r => r.subcategories as unknown as Subcategory)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...category,
        subcategories
      };
    });

    return categoriesWithSubs;
  } catch (error) {
    console.error('Error en getCategories:', error);
    throw error;
  }
};
