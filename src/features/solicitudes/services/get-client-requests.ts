import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { RequestItem } from "../interfaces/request.interface";

/**
 * Obtiene las solicitudes creadas por un cliente específico
 * @param clientId - ID del cliente
 * @param status - Array de estados de solicitudes a filtrar
 * @returns Array de solicitudes del cliente
 */
export const getClientRequests = async (
  clientId: string,
  status: string[]
): Promise<RequestItem[]> => {
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
      .eq("client_id", clientId)
      .in("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener solicitudes del cliente:", error);
      throw new Error(error.message);
    }

    if (!data) {
      return [];
    }

    // Formatear los datos según la interfaz RequestItem
    const formattedData: RequestItem[] = data.map((request: any) => ({
      id: request.id,
      title: request.title,
      description: request.description,
      serviceCategory: request.service_category,
      subcategory: request.subcategory || undefined,
      location: typeof request.location === 'string' 
        ? { address: request.location } 
        : request.location,
      coordinates: request.coordinates || undefined,
      photos: request.photos || [],
      images: request.photos || [], // Alias para compatibilidad
      scheduledDate: request.scheduled_date || undefined,
      budgetRange: request.budget_range || undefined,
      preferredProviders: request.preferred_providers || [],
      status: request.status,
      selectedQuoteId: request.selected_quote_id || undefined,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      userRole: "client",
      client: {
        id: request.client_id,
        name: request.client_name,
      },
    }));

    return formattedData;
  } catch (error) {
    console.error("Error inesperado al obtener solicitudes del cliente:", error);
    throw error;
  }
};
