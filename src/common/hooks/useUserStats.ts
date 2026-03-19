import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase/supabaseClient";

export interface UserStats {
  // Para clientes
  totalRequests?: number;
  openRequests?: number;
  completedRequests?: number;
  // Para proveedores
  availableRequests?: number;
  totalQuotes?: number;
  pendingQuotes?: number;
  /** Cantidad de servicios completados por el proveedor (request completed con su quote aceptada) */
  completedServicesAsProvider?: number;
}

export const useUserStats = () => {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ["userStats", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Obtener el rol del usuario
      const { data: userData } = await supabase
        .from("users")
        .select("rol, is_provider")
        .eq("id", userId)
        .single();

      if (!userData) return null;

      const isProvider = userData.is_provider || userData.rol === "provider";

      if (isProvider) {
        // Estadísticas para proveedores
        // Obtener solicitudes disponibles (en categorías del proveedor)
        const { data: userCategories } = await supabase
          .from("users")
          .select("service_category, service_categories")
          .eq("id", userId)
          .single();

        let availableRequestsQuery = supabase
          .from("requests")
          .select("id", { count: "exact" })
          .eq("status", "open");

        // Si el usuario tiene categorías, filtrar por ellas
        if (userCategories?.service_categories) {
          const categories = userCategories.service_categories as Array<{
            category: string;
          }>;
          const categoryNames = categories.map((c) => c.category);
          if (categoryNames.length > 0) {
            availableRequestsQuery = availableRequestsQuery.in(
              "service_category",
              categoryNames
            );
          }
        } else if (userCategories?.service_category) {
          availableRequestsQuery = availableRequestsQuery.eq(
            "service_category",
            userCategories.service_category
          );
        }

        const { count: availableRequests } = await availableRequestsQuery;

        // Obtener presupuestos del proveedor
        const { count: totalQuotes } = await supabase
          .from("quotes")
          .select("id", { count: "exact" })
          .eq("provider_id", userId);

        // Obtener presupuestos pendientes
        const { count: pendingQuotes } = await supabase
          .from("quotes")
          .select("id", { count: "exact" })
          .eq("provider_id", userId)
          .eq("status", "pending");

        // Servicios completados por este proveedor (request completed con su quote aceptada)
        const { data: acceptedQuoteIds } = await supabase
          .from("quotes")
          .select("id")
          .eq("provider_id", userId)
          .eq("status", "accepted");
        const ids = (acceptedQuoteIds ?? []).map((q: { id: string }) => q.id);
        let completedServicesAsProvider = 0;
        if (ids.length > 0) {
          const { count } = await supabase
            .from("requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "completed")
            .in("selected_quote_id", ids);
          completedServicesAsProvider = count ?? 0;
        }

        return {
          availableRequests: availableRequests || 0,
          totalQuotes: totalQuotes || 0,
          pendingQuotes: pendingQuotes || 0,
          completedServicesAsProvider,
        } as UserStats;
      } else {
        // Estadísticas para clientes
        const { count: totalRequests } = await supabase
          .from("requests")
          .select("id", { count: "exact" })
          .eq("client_id", userId);

        const { count: openRequests } = await supabase
          .from("requests")
          .select("id", { count: "exact" })
          .eq("client_id", userId)
          .eq("status", "open");

        const { count: completedRequests } = await supabase
          .from("requests")
          .select("id", { count: "exact" })
          .eq("client_id", userId)
          .eq("status", "completed");

        return {
          totalRequests: totalRequests || 0,
          openRequests: openRequests || 0,
          completedRequests: completedRequests || 0,
        } as UserStats;
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};
