import { useQuery } from '@tanstack/react-query';
import { getRequests } from '../services/get-requests';
import type { Request } from '../types/request';

/**
 * Hook para obtener todas las categorías (requests)
 */
export function useRequests() {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['requests'],
    queryFn: getRequests,
    retry: 2,
    retryDelay: 1000,
  });

  // Log para debugging
  if (error) {
    console.error('❌ Error en useRequests:', error);
  }

  return {
    data: data || [],
    isLoading,
    error,
  };
}
