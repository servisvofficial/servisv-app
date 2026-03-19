import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { getAvailableRequests } from "../services/get-available-requests";
import type { AvailableRequest } from "../interfaces/request.interface";

export const useAvailableRequests = () => {
  const { userId } = useAuth();

  const requestQuery = useQuery<AvailableRequest[], Error>({
    queryKey: ["available-requests", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("No user ID");
      }

      return await getAvailableRequests(userId);
    },
    enabled: !!userId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return requestQuery;
};
