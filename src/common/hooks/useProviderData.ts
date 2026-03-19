import { useQuery } from "@tanstack/react-query";
import { getUserDataInSupabaseById } from "../services/get-user-supabase";

/**
 * Hook para obtener los datos de un proveedor por su ID
 */
export const useProviderData = (providerId: string | undefined) => {
  const {
    data: provider,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["providerData", providerId],
    queryFn: () => {
      if (!providerId) return null;
      return getUserDataInSupabaseById(providerId);
    },
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return { provider, isLoading, error };
};
