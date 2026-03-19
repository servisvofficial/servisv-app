import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '@/common/lib/supabase/supabaseClient';

export type UserRole = 'client' | 'provider' | null;

export const useUserRole = () => {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      // Obtener el rol del usuario desde la tabla de usuarios usando el ID de Clerk
      const { data, error } = await supabase
        .from('users')
        .select('rol')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error obteniendo rol del usuario:', error);
        return null;
      }

      // Mapear los valores de rol según la base de datos
      // La base de datos usa 'user' y 'provider', pero internamente usamos 'client' y 'provider'
      if (data?.rol === 'user') return 'client';
      if (data?.rol === 'provider') return 'provider';
      // Compatibilidad con valores antiguos si existen
      if (data?.rol === 'cliente') return 'client';
      if (data?.rol === 'proveedor') return 'provider';
      if (data?.rol === 'client') return 'client';
      
      return data?.rol as UserRole;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
