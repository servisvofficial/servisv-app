import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { Message } from "@/common/types/chat";

/**
 * Envía un mensaje en un chat.
 * @param chatId - ID del chat
 * @param senderId - ID del usuario que envía (Clerk user id)
 * @param content - Contenido del mensaje
 * @param type - Tipo de mensaje (default 'text')
 * @param attachmentUrl - URL de adjunto si aplica
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  type: Message["type"] = "text",
  attachmentUrl: string | null = null
): Promise<Message | null> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        type,
        content: content || null,
        attachment_url: attachmentUrl,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error al enviar mensaje:", error);
      return null;
    }

    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    return {
      id: data.id,
      created_at: data.created_at,
      chat_id: data.chat_id,
      sender_id: data.sender_id,
      type: data.type,
      content: data.content ?? null,
      attachment_url: data.attachment_url ?? null,
      is_read: data.is_read ?? false,
    };
  } catch (e) {
    console.error("sendMessage:", e);
    return null;
  }
}
