import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../services/get-categories';
import type { CategoryWithSubcategories } from '../services/get-categories';

/**
 * Hook para obtener todas las categorías con sus subcategorías
 */
export function useCategories() {
  return useQuery<CategoryWithSubcategories[], Error>({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
}
