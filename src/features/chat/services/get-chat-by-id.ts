import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { Chat } from "@/common/types/chat";

/**
 * Obtiene un chat por ID.
 */
export async function getChatById(chatId: string): Promise<Chat | null> {
  try {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      client_id: data.client_id,
      professional_id: data.professional_id,
      request_id: data.request_id ?? null,
      quote_status: data.quote_status ?? null,
      status: data.status,
    };
  } catch (e) {
    console.error("getChatById:", e);
    return null;
  }
}
