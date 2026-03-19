import { supabase } from "@/common/lib/supabase/supabaseClient";

/**
 * Marca como leídos los mensajes de un chat que no fueron enviados por el usuario dado.
 */
export async function markMessagesAsRead(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("chat_id", chatId)
      .neq("sender_id", userId)
      .eq("is_read", false);
  } catch (e) {
    console.error("markMessagesAsRead:", e);
  }
}
