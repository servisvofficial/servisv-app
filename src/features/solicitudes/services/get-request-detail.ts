import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { RequestItem } from "../interfaces/request.interface";

/**
 * Obtiene el detalle completo de una solicitud específica
 * Incluye información del cliente y proveedores si aplica
 * @param requestId - ID de la solicitud
 * @returns Detalle completo de la solicitud
 */
export const getRequestDetail = async (
  requestId: string
): Promise<RequestItem | null> => {
  try {
    const { data, error } = await supabase
      .from("requests")
      .select(`
        id,
        title,
        description,
        service_category,
        subcategory,
        location,
        coordinates,
        photos,
        scheduled_date,
        budget_range,
        preferred_providers,
        status,
        selected_quote_id,
        created_at,
        updated_at,
        client_id,
        client_name
      `)
      .eq("id", requestId)
      .single();

    if (error) {
      console.error("Error al obtener detalle de solicitud:", error);
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    // Formatear los datos según la interfaz RequestItem
    const formattedRequest: RequestItem = {
      id: data.id,
      title: data.title,
      description: data.description,
      serviceCategory: data.service_category,
      subcategory: data.subcategory || undefined,
      location: typeof data.location === 'string' 
        ? { address: data.location } 
        : data.location,
      coordinates: data.coordinates || undefined,
      photos: data.photos || [],
      images: data.photos || [], // Alias para compatibilidad
      scheduledDate: data.scheduled_date || undefined,
      budgetRange: data.budget_range || undefined,
      preferredProviders: data.preferred_providers || [],
      status: data.status,
      selectedQuoteId: data.selected_quote_id || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userRole: "client", // Se puede ajustar según el contexto
      client: {
        id: data.client_id,
        name: data.client_name,
      },
    };

    return formattedRequest;
  } catch (error) {
    console.error("Error inesperado al obtener detalle de solicitud:", error);
    throw error;
  }
};
