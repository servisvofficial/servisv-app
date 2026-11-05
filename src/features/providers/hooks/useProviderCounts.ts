import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/common/lib/supabase/supabaseClient";

/**
 * Obtiene el conteo de proveedores validados por categoría.
 * Usa paginación para evitar el límite de 1000 filas de PostgREST.
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

      // Query 2: Obtener todos los (user_id, category_id) con paginación
      const fetchServices = async () => {
        const allServices: Array<{ user_id: string; category_id: number }> = [];
        let from = 0;
        const pageSize = 1000;
        while (true) {
          const { data, error } = await supabase
            .from("user_professional_services")
            .select("user_id, category_id")
            .in("category_id", categoryIds)
            .range(from, from + pageSize - 1);

          if (error || !data || data.length === 0) break;
          allServices.push(...data);
          if (data.length < pageSize) break;
          from += pageSize;
        }
        return allServices;
      };

      // Query 3: Obtener proveedores válidos (NO baneados) con paginación defensiva
      const fetchValidatedUsers = async () => {
        const allUsers: Array<{ id: string }> = [];
        let from = 0;
        const pageSize = 1000;
        while (true) {
          const { data, error } = await supabase
            .from("users")
            .select("id")
            .eq("is_provider", true)
            .eq("is_banned", false)
            .range(from, from + pageSize - 1);

          if (error || !data || data.length === 0) break;
          allUsers.push(...data);
          if (data.length < pageSize) break;
          from += pageSize;
        }
        return allUsers;
      };

      const [services, validatedUsers] = await Promise.all([
        fetchServices(),
        fetchValidatedUsers(),
      ]);

      // Set de proveedores válidos para lookup O(1)
      const validatedIds = new Set<string>(
        validatedUsers.map((u: any) => u.id)
      );

      // Contar proveedores únicos válidos por categoría en memoria
      const providerSets = new Map<string, Set<string>>();

      for (const row of services) {
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
