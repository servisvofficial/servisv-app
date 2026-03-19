import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { RequestStatus } from "../interfaces/request.interface";

/**
 * Actualiza el estado de una solicitud (p. ej. a "completed" cuando el cliente marca el servicio como completado).
 */
export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus
): Promise<void> {
  const { error } = await supabase
    .from("requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) {
    console.error("Error al actualizar estado de la solicitud:", error);
    throw error;
  }
}
