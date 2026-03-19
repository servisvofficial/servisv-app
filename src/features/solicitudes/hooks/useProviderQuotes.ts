import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { getProviderQuotes, type QuoteWithRequest } from "../services/get-provider-quotes";

export const useProviderQuotes = () => {
  const { userId } = useAuth();

  const quotesQuery = useQuery<QuoteWithRequest[], Error>({
    queryKey: ["provider-quotes", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("No user ID");
      }

      return await getProviderQuotes(userId);
    },
    enabled: !!userId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Calcular estadísticas
  const totalQuotes = quotesQuery.data?.length || 0;
  const pendingQuotes = quotesQuery.data?.filter(q => q.status === "pending").length || 0;
  const acceptedQuotes = quotesQuery.data?.filter(q => q.status === "accepted").length || 0;
  const rejectedQuotes = quotesQuery.data?.filter(q => q.status === "rejected").length || 0;

  return {
    ...quotesQuery,
    totalQuotes,
    pendingQuotes,
    acceptedQuotes,
    rejectedQuotes,
  };
};
