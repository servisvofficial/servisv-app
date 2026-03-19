import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/common/lib/supabase/supabaseClient";

interface CategoryCount {
  categoryName: string;
  count: number;
}

/**
 * Hook para obtener el conteo de proveedores para múltiples categorías
 */
export const useProviderCounts = (categoryNames: string[]) => {
  return useQuery<Map<string, number>, Error>({
    queryKey: ["providerCounts", categoryNames.sort().join(",")],
    queryFn: async () => {
      const countsMap = new Map<string, number>();
      
      // Si no hay categorías, retornar mapa vacío
      if (categoryNames.length === 0) {
        return countsMap;
      }

      // Primero obtener todos los IDs de categorías
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .in("name", categoryNames);

      if (categoriesError || !categories) {
        console.error("Error al obtener categorías:", categoriesError);
        // Retornar mapa vacío con 0 para todas las categorías
        categoryNames.forEach((name) => countsMap.set(name, 0));
        return countsMap;
      }

      // Crear un mapa de nombre de categoría a ID
      const categoryIdMap = new Map<string, number>();
      categories.forEach((cat) => {
        categoryIdMap.set(cat.name, cat.id);
      });

      // Para cada categoría, obtener el conteo
      for (const categoryName of categoryNames) {
        const categoryId = categoryIdMap.get(categoryName);

        if (!categoryId) {
          countsMap.set(categoryName, 0);
          continue;
        }

        // Obtener todos los user_ids que tienen esta categoría
        const { data: services, error: servicesError } = await supabase
          .from("user_professional_services")
          .select("user_id")
          .eq("category_id", categoryId);

        if (servicesError || !services || services.length === 0) {
          countsMap.set(categoryName, 0);
          continue;
        }

        // Obtener IDs únicos de proveedores
        const uniqueProviderIds = [...new Set(services.map((s) => s.user_id))];

        // Contar cuántos de estos son proveedores validados
        const { count, error: countError } = await supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .in("id", uniqueProviderIds)
          .eq("is_provider", true)
          .eq("is_validated", true);

        if (countError) {
          console.error(`Error al contar proveedores para ${categoryName}:`, countError);
          countsMap.set(categoryName, 0);
        } else {
          countsMap.set(categoryName, count || 0);
        }
      }

      return countsMap;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 10, // 10 minutos
  });
};
