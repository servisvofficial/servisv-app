import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { QuoteStatus } from "../interfaces/quote.interface";

/**
 * Acepta una cotización: actualiza la quote, rechaza las demás de la misma solicitud
 * y actualiza la solicitud (status accepted, selected_quote_id).
 */
export async function acceptQuote(
  quoteId: string,
  requestId: string
): Promise<void> {
  const { error: acceptError } = await supabase
    .from("quotes")
    .update({ status: "accepted" as QuoteStatus, updated_at: new Date().toISOString() })
    .eq("id", quoteId);

  if (acceptError) {
    console.error("Error al aceptar quote:", acceptError);
    throw acceptError;
  }

  await supabase
    .from("quotes")
    .update({
      status: "rejected" as QuoteStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("request_id", requestId)
    .neq("id", quoteId)
    .neq("status", "rejected");

  const { error: requestError } = await supabase
    .from("requests")
    .update({
      status: "accepted",
      selected_quote_id: quoteId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (requestError) {
    console.error("Error al actualizar solicitud:", requestError);
  }
}

/**
 * Rechaza una cotización.
 */
export async function rejectQuote(quoteId: string): Promise<void> {
  const { error } = await supabase
    .from("quotes")
    .update({ status: "rejected" as QuoteStatus, updated_at: new Date().toISOString() })
    .eq("id", quoteId);

  if (error) {
    console.error("Error al rechazar quote:", error);
    throw error;
  }
}
