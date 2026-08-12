import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/common/lib/supabase/supabaseClient";

/**
 * Obtiene el conteo de proveedores validados por categoría.
 * Usa 3 queries planas en paralelo en lugar de N queries en serie,
 * evitando el problema de relaciones FK no registradas en el schema cache.
 */
export const useProviderCounts = (categoryNames: string[]) => {
  return useQuery<Map<string, number>, Error>({
    queryKey: ["providerCounts", categoryNames.slice().sort().join(",")],
    queryFn: async () => {
      const countsMap = new Map<string, number>();
      if (categoryNames.length === 0) return countsMap;
      categoryNames.forEach((name) => countsMap.set(name, 0));

      // Query 1: IDs de las categorías que nos interesan
      const { data: categoriesData, error: catError } = await supabase
        .from("categories")
        .select("id, name")
        .in("name", categoryNames);

      if (catError || !categoriesData || categoriesData.length === 0) {
        return countsMap;
      }

      const categoryIdToName = new Map<number, string>(
        categoriesData.map((c: any) => [c.id, c.name])
      );
      const categoryIds = categoriesData.map((c: any) => c.id);

      // Query 2 + Query 3 en paralelo
      const [servicesResult, validatedResult] = await Promise.all([
        // Todos los (user_id, category_id) para estas categorías
        supabase
          .from("user_professional_services")
          .select("user_id, category_id")
          .in("category_id", categoryIds),

        // Todos los user_ids de proveedores validados
        supabase
          .from("users")
          .select("id")
          .eq("is_provider", true)
          .eq("is_validated", true)
          .eq("is_banned", false),
      ]);

      if (servicesResult.error || !servicesResult.data) return countsMap;
      if (validatedResult.error || !validatedResult.data) return countsMap;

      // Set de proveedores validados para lookup O(1)
      const validatedIds = new Set<string>(
        validatedResult.data.map((u: any) => u.id)
      );

      // Contar proveedores únicos validados por categoría en memoria
      const providerSets = new Map<string, Set<string>>();

      for (const row of servicesResult.data as any[]) {
        if (!validatedIds.has(row.user_id)) continue;
        const catName = categoryIdToName.get(row.category_id);
        if (!catName) continue;

        if (!providerSets.has(catName)) {
          providerSets.set(catName, new Set());
        }
        providerSets.get(catName)!.add(row.user_id);
      }

      providerSets.forEach((set, name) => countsMap.set(name, set.size));

      return countsMap;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
