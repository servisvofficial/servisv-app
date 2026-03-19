import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { Chat } from "@/common/types/chat";

/**
 * Crea un chat o devuelve el existente (client_id, professional_id, request_id).
 * Un chat por solicitud entre ese cliente y ese proveedor.
 */
export async function getOrCreateChat(
  clientId: string,
  professionalId: string,
  requestId: string | null
): Promise<Chat | null> {
  try {
    let query = supabase
      .from("chats")
      .select("*")
      .eq("client_id", clientId)
      .eq("professional_id", professionalId);

    if (requestId) {
      query = query.eq("request_id", requestId);
    } else {
      query = query.is("request_id", null);
    }

    const { data: existing, error: searchError } = await query.maybeSingle();

    if (searchError) {
      console.error("Error al buscar chat:", searchError);
      return null;
    }

    if (existing) {
      return mapRowToChat(existing);
    }

    const { data: inserted, error: insertError } = await supabase
      .from("chats")
      .insert({
        client_id: clientId,
        professional_id: professionalId,
        request_id: requestId,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: retry } = await query.maybeSingle();
        return retry ? mapRowToChat(retry) : null;
      }
      console.error("Error al crear chat:", insertError);
      return null;
    }

    return mapRowToChat(inserted);
  } catch (e) {
    console.error("getOrCreateChat:", e);
    return null;
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
