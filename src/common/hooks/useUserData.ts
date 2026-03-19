import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { getUserDataInSupabaseById } from "../services/get-user-supabase";

export const useUserData = () => {
  const { userId } = useAuth();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userData", userId],
    queryFn: () => {
      if (!userId) return null;
      return getUserDataInSupabaseById(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return { user, isLoading, error };
};
