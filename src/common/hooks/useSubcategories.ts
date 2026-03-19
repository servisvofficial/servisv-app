import { useQuery } from '@tanstack/react-query';
import { getSubcategoriesByCategory, getAllSubcategories } from '../services/get-subcategories';
import type { Subcategory } from '../types/request';

/**
 * Hook para obtener las subcategorías de una categoría específica
 * @param categoryId - ID de la categoría
 */
export function useSubcategories(categoryId: number | null) {
  return useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: () => {
      if (!categoryId) return Promise.resolve([]);
      return getSubcategoriesByCategory(categoryId);
    },
    enabled: !!categoryId,
  });
}

/**
 * Hook para obtener todas las subcategorías
 */
export function useAllSubcategories() {
  return useQuery({
    queryKey: ['all-subcategories'],
    queryFn: getAllSubcategories,
  });
}
