import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { Chat } from "@/common/types/chat";

/**
 * Obtiene todos los chats donde el usuario es cliente o proveedor.
 * Ordenados por updated_at descendente.
 */
export async function getChatsByUser(userId: string): Promise<Chat[]> {
  try {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .or(`client_id.eq.${userId},professional_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error al obtener chats:", error);
      return [];
    }

    return (data ?? []).map(mapRowToChat);
  } catch (e) {
    console.error("getChatsByUser:", e);
    return [];
  }
}

function mapRowToChat(row: any): Chat {
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    client_id: row.client_id,
    professional_id: row.professional_id,
    request_id: row.request_id ?? null,
    quote_status: row.quote_status ?? null,
    status: row.status,
  };
}
