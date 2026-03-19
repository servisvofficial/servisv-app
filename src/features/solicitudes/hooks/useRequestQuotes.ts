import { useQuery } from "@tanstack/react-query";
import { getRequestQuotes, type QuoteWithProviderInfo } from "../services/get-request-quotes";

/**
 * Hook para obtener las cotizaciones de una solicitud específica
 * Usado por clientes para ver los presupuestos que recibieron
 * Incluye la foto de perfil del proveedor
 * @param requestId - ID de la solicitud
 * @returns Query con las cotizaciones
 */
export const useRequestQuotes = (requestId: string | null | undefined) => {
  const quotesQuery = useQuery<QuoteWithProviderInfo[], Error>({
    queryKey: ["request-quotes", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      return await getRequestQuotes(requestId);
    },
    enabled: !!requestId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 * 30, // 30 segundos
  });

  return quotesQuery;
};
