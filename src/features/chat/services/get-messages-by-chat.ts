import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { Message } from "@/common/types/chat";

/**
 * Obtiene los mensajes de un chat, ordenados por fecha ascendente.
 */
export async function getMessagesByChat(chatId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error al obtener mensajes:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      chat_id: row.chat_id,
      sender_id: row.sender_id,
      type: row.type,
      content: row.content ?? null,
      attachment_url: row.attachment_url ?? null,
      is_read: row.is_read ?? false,
    }));
  } catch (e) {
    console.error("getMessagesByChat:", e);
    return [];
  }
}
