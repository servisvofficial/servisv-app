import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { Quote } from "../interfaces/quote.interface";

// Función para convertir datos de BD a Quote
const mapQuoteFromDB = (dbQuote: any): Quote => {
  return {
    id: dbQuote.id,
    requestId: dbQuote.request_id,
    providerId: dbQuote.provider_id,
    providerName: dbQuote.provider_name,
    clientId: dbQuote.client_id || undefined,
    price: parseFloat(dbQuote.price),
    description: dbQuote.description,
    status: dbQuote.status as Quote["status"],
    isPriority: dbQuote.is_priority || false,
    estimatedDate: dbQuote.estimated_date || undefined,
    estimatedDuration: dbQuote.estimated_duration || undefined,
    validUntil: dbQuote.valid_until || undefined,
    createdAt: dbQuote.created_at,
    updatedAt: dbQuote.updated_at,
    paymentStatus: dbQuote.payment_status || undefined,
    warranty: dbQuote.warranty || undefined,
    includesSupplies: dbQuote.includes_supplies || undefined,
    acceptedAt: dbQuote.accepted_at || undefined,
    completedAt: dbQuote.completed_at || undefined,
  };
};

export interface QuoteWithRequest extends Quote {
  requestTitle?: string;
  requestDescription?: string;
  clientName?: string;
}

/**
 * Obtiene todos los presupuestos de un proveedor desde Supabase
 * Incluye información de la solicitud asociada
 */
export const getProviderQuotes = async (
  providerId: string
): Promise<QuoteWithRequest[]> => {
  try {
    // Primero obtener los quotes
    const { data: quotesData, error: quotesError } = await supabase
      .from("quotes")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (quotesError) {
      console.error("Error al obtener presupuestos del proveedor:", quotesError);
      return [];
    }

    if (!quotesData || quotesData.length === 0) {
      return [];
    }

    // Obtener los IDs de las solicitudes únicas (filtrar nulls/undefined)
    const requestIds = [...new Set(quotesData
      .map(q => q.request_id)
      .filter((id): id is string => id != null)
    )];

    // Si no hay requestIds válidos, retornar solo los quotes sin información de solicitud
    if (requestIds.length === 0) {
      return quotesData.map((dbQuote: any) => mapQuoteFromDB(dbQuote));
    }

    // Obtener información de las solicitudes
    const { data: requestsData, error: requestsError } = await supabase
      .from("requests")
      .select("id, title, description, client_name")
      .in("id", requestIds);

    if (requestsError) {
      console.error("Error al obtener solicitudes:", requestsError);
    }

    // Crear un mapa de solicitudes por ID para acceso rápido
    const requestsMap = new Map<string, any>();
    if (requestsData) {
      requestsData.forEach((req: any) => {
        requestsMap.set(req.id, req);
      });
    }

    // Mapear los quotes con la información de las solicitudes
    return quotesData.map((dbQuote: any) => {
      const quote = mapQuoteFromDB(dbQuote);
      const request = requestsMap.get(dbQuote.request_id);
      
      return {
        ...quote,
        requestTitle: request?.title,
        requestDescription: request?.description,
        clientName: request?.client_name || dbQuote.client_id,
      };
    });
  } catch (error) {
    console.error(
      "Error inesperado al obtener presupuestos del proveedor:",
      error
    );
    return [];
  }
};
