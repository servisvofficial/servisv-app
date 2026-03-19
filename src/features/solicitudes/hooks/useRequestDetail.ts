import { useQuery } from "@tanstack/react-query";
import { getRequestDetail } from "../services/get-request-detail";
import type { RequestItem } from "../interfaces/request.interface";

/**
 * Hook para obtener el detalle de una solicitud específica
 * @param requestId - ID de la solicitud
 * @returns Query con el detalle de la solicitud
 */
export const useRequestDetail = (requestId: string | null | undefined) => {
  const requestQuery = useQuery<RequestItem | null, Error>({
    queryKey: ["request-detail", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      return await getRequestDetail(requestId);
    },
    enabled: !!requestId,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return requestQuery;
};
