import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { getClientRequests } from "../services/get-client-requests";
import { getProviderRequests } from "../services/get-provider-requests";
import type { RequestItem } from "../interfaces/request.interface";

interface UseUserRequestsOptions {
  userRole: "client" | "provider";
  status: "received" | "sent" | "completed";
}

/**
 * Hook para obtener las solicitudes del usuario según su rol
 * Inspirado en mannwork-app pero adaptado a la estructura de servisv-app
 * @param userRole - Rol del usuario: "client" o "provider"
 * @param status - Estado de las solicitudes: "received", "sent" o "completed"
 * @returns Query con las solicitudes del usuario
 */
export const useUserRequests = ({ userRole, status }: UseUserRequestsOptions) => {
  const { userId } = useAuth();

  const getStatusArray = () => {
    if (status === "sent" || status === "received") {
      // Solicitudes activas: abiertas, cotizadas, aceptadas o en progreso
      return ["open", "quoted", "accepted", "in_progress"];
    } else {
      // Solicitudes completadas o canceladas
      return ["completed", "cancelled"];
    }
  };

  const requestQuery = useQuery<RequestItem[], Error>({
    queryKey: ["user-requests", userId, userRole, status],
    queryFn: async () => {
      if (!userId) {
        console.log("❌ No user ID available");
        throw new Error("No user ID");
      }

      const statusArray = getStatusArray();
      
      console.log("📋 Fetching requests:", {
        userId,
        userRole,
        status,
        statusArray,
      });

      try {
        let result;
        if (userRole === "client") {
          // Cliente: obtener solicitudes que él creó
          result = await getClientRequests(userId, statusArray);
          console.log(`✅ Client requests fetched: ${result.length} items`);
        } else {
          // Proveedor: obtener solicitudes disponibles para él
          result = await getProviderRequests(userId, statusArray);
          console.log(`✅ Provider requests fetched: ${result.length} items`);
        }
        return result;
      } catch (error) {
        console.error("❌ Error fetching requests:", error);
        throw error;
      }
    },
    enabled: !!userId && !!status,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return requestQuery;
};
