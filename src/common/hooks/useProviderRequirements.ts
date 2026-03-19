import { useQuery } from '@tanstack/react-query';
import { getGeneralProviderRequirements } from '@/common/services/get-app-config';

/**
 * Hook para obtener los requisitos generales de proveedores (diplomas, DUI, carta de recomendación).
 * Se usa en el registro de proveedores.
 */
export function useProviderRequirements() {
  const { data: generalRequirements, isLoading } = useQuery({
    queryKey: ['app_config', 'general_provider_requirements'],
    queryFn: getGeneralProviderRequirements,
    staleTime: 5 * 60 * 1000,
  });

  return {
    generalRequirements: generalRequirements ?? null,
    isLoading,
  };
}
