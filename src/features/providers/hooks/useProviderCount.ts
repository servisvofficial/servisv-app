import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/common/lib/supabase/supabaseClient";

/**
 * Hook para obtener el conteo de proveedores por categoría
 */
export const useProviderCount = (categoryName?: string) => {
  return useQuery<number, Error>({
    queryKey: ["providerCount", categoryName],
    queryFn: async () => {
      if (!categoryName) {
        // Si no hay categoría, contar todos los proveedores validados
        const { count, error } = await supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("is_provider", true)
          .eq("is_validated", true);

        if (error) {
          console.error("Error al contar proveedores:", error);
          return 0;
        }

        return count || 0;
      }

      // Contar proveedores que tienen esta categoría en user_professional_services
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("name", categoryName)
        .single();

      if (categoryError || !categoryData) {
        console.error("Error al obtener categoría:", categoryError);
        return 0;
      }

      // Obtener todos los user_ids que tienen esta categoría
      const { data: services, error: servicesError } = await supabase
        .from("user_professional_services")
        .select("user_id")
        .eq("category_id", categoryData.id);

      if (servicesError) {
        console.error("Error al obtener servicios profesionales:", servicesError);
        return 0;
      }

      if (!services || services.length === 0) {
        return 0;
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
        console.error("Error al contar proveedores por categoría:", countError);
        return 0;
      }

      return count || 0;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 10, // 10 minutos
  });
};
