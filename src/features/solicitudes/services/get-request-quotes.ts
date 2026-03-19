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

export interface QuoteWithProviderInfo extends Quote {
  providerProfilePic?: string;
}

/**
 * Obtiene todas las cotizaciones para una solicitud específica
 * Usado por el cliente para ver los presupuestos que recibió
 * Incluye la foto del proveedor
 * @param requestId - ID de la solicitud
 * @returns Array de cotizaciones con información del proveedor
 */
export const getRequestQuotes = async (requestId: string): Promise<QuoteWithProviderInfo[]> => {
  try {
    console.log("📋 Obteniendo cotizaciones para solicitud:", requestId);

    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener cotizaciones:", error);
      throw new Error(error.message);
    }

    console.log(`✅ Cotizaciones encontradas: ${data?.length || 0}`);

    if (!data || data.length === 0) {
      return [];
    }

    // Obtener los IDs únicos de proveedores
    const providerIds = [...new Set(data.map(q => q.provider_id).filter(Boolean))];

    // Obtener información de los proveedores (incluyendo foto)
    let providersMap = new Map<string, any>();
    if (providerIds.length > 0) {
      const { data: providersData, error: providersError } = await supabase
        .from("users")
        .select("id, profile_pic")
        .in("id", providerIds);

      if (providersError) {
        console.error("⚠️ Error al obtener información de proveedores:", providersError);
      } else if (providersData) {
        providersData.forEach(provider => {
          providersMap.set(provider.id, provider);
        });
      }
    }

    // Mapear cotizaciones con información del proveedor
    return data.map((dbQuote: any) => {
      const quote = mapQuoteFromDB(dbQuote);
      const provider = providersMap.get(dbQuote.provider_id);
      
      return {
        ...quote,
        providerProfilePic: provider?.profile_pic,
      };
    });
  } catch (error) {
    console.error("❌ Error inesperado al obtener cotizaciones:", error);
    throw error;
  }
};
