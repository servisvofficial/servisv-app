import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { AvailableRequest } from "../interfaces/request.interface";

// Función para convertir datos de BD a AvailableRequest
const mapRequestFromDB = (dbRequest: any): AvailableRequest => {
  return {
    id: dbRequest.id,
    clientId: dbRequest.client_id,
    clientName: dbRequest.client_name,
    serviceCategory: dbRequest.service_category,
    subcategory: dbRequest.subcategory || undefined,
    title: dbRequest.title,
    description: dbRequest.description,
    location: dbRequest.location,
    coordinates: dbRequest.coordinates
      ? {
          lat: dbRequest.coordinates.lat,
          lng: dbRequest.coordinates.lng,
        }
      : undefined,
    photos: dbRequest.photos || [],
    images: dbRequest.photos || [], // Para compatibilidad
    scheduledDate: dbRequest.scheduled_date || undefined,
    budgetRange: dbRequest.budget_range
      ? {
          min: dbRequest.budget_range.min,
          max: dbRequest.budget_range.max,
        }
      : undefined,
    preferredProviders: dbRequest.preferred_providers || [],
    status: dbRequest.status as AvailableRequest["status"],
    selectedQuoteId: dbRequest.selected_quote_id || undefined,
    createdAt: dbRequest.created_at,
    updatedAt: dbRequest.updated_at,
    isPriority: false, // Se establecerá después según si el proveedor está en preferred_providers
  };
};

/**
 * Obtiene las solicitudes disponibles para un proveedor
 * Basado en la lógica de getRequestsForProvider de servisv-proyecto-web
 */
export const getAvailableRequests = async (
  providerId: string
): Promise<AvailableRequest[]> => {
  try {
    // 1. Obtener las solicitudes donde el proveedor ya envió un presupuesto
    const { data: existingQuotes, error: quotesError } = await supabase
      .from("quotes")
      .select("request_id")
      .eq("provider_id", providerId);

    if (quotesError) {
      console.error(
        "Error al obtener presupuestos existentes del proveedor:",
        quotesError
      );
    }

    // IDs de solicitudes donde ya envió presupuesto
    const requestsWithQuotes = existingQuotes?.map(q => q.request_id) || [];
    console.log(`🔍 [Available] Proveedor ${providerId} ya tiene presupuestos en ${requestsWithQuotes.length} solicitudes`);

    // 2. Obtener las categorías y subcategorías del proveedor desde user_professional_services
    const { data: providerServices, error: servicesError } = await supabase
      .from("user_professional_services")
      .select(
        `
        category_id,
        subcategory_id,
        categories:category_id (id, name),
        subcategories:subcategory_id (id, name)
      `
      )
      .eq("user_id", providerId);

    if (servicesError) {
      console.error(
        "Error al obtener servicios del proveedor:",
        servicesError
      );
    }

    // Extraer nombres de categorías y subcategorías
    const providerCategories: string[] = [];
    const providerSubcategories: string[] = [];

    if (providerServices) {
      providerServices.forEach((service: any) => {
        if (service.categories?.name) {
          providerCategories.push(service.categories.name);
        }
        if (service.subcategories?.name) {
          providerSubcategories.push(service.subcategories.name);
        }
      });
    }

    // 3. Obtener solicitudes donde el proveedor está en preferred_providers
    // Incluir estados 'open' y 'quoted' (los proveedores pueden ver y cotizar en ambos)
    const { data: preferredData, error: preferredError } = await supabase
      .from("requests")
      .select("*")
      .in("status", ["open", "quoted"])
      .contains("preferred_providers", [providerId])
      .order("created_at", { ascending: false });

    if (preferredError) {
      console.error(
        "Error al obtener solicitudes preferidas:",
        preferredError
      );
    }

    // 4. Obtener solicitudes desde request_providers
    const { data: requestProviders } = await supabase
      .from("request_providers")
      .select("request_id")
      .eq("provider_id", providerId);

    const requestIds = requestProviders?.map((rp) => rp.request_id) || [];

    const { data: rpData, error: rpDataError } =
      requestIds.length > 0
        ? await supabase
            .from("requests")
            .select("*")
            .in("status", ["open", "quoted"])
            .in("id", requestIds)
            .order("created_at", { ascending: false })
        : { data: null, error: null };

    if (rpDataError) {
      console.error(
        "Error al obtener solicitudes desde request_providers:",
        rpDataError
      );
    }

    // 5. Obtener solicitudes por categoría y subcategoría (CUALQUIER proveedor de esa subcategoría puede ver)
    let categoryData: any[] = [];
    if (providerCategories.length > 0) {
      // Buscar solicitudes que coincidan con las categorías del proveedor
      // Incluir estados 'open' y 'quoted' (los proveedores pueden ver y cotizar en ambos)
      const { data: catData, error: catError } = await supabase
        .from("requests")
        .select("*")
        .in("status", ["open", "quoted"])
        .in("service_category", providerCategories)
        .order("created_at", { ascending: false });

      if (catError) {
        console.error(
          "Error al obtener solicitudes por categoría:",
          catError
        );
      } else {
        categoryData = catData || [];

        // Filtrar por subcategoría si existe
        if (providerSubcategories.length > 0 && categoryData.length > 0) {
          categoryData = categoryData.filter((req: any) => {
            // Si la solicitud tiene subcategoría, debe coincidir con alguna del proveedor
            if (req.subcategory) {
              return providerSubcategories.includes(req.subcategory);
            }
            // Si la solicitud no tiene subcategoría, incluirla si coincide la categoría
            return true;
          });
        }
      }
    }

    // 6. Combinar todas las solicitudes y eliminar duplicados
    const allData = [
      ...(preferredData || []),
      ...(rpData || []),
      ...categoryData,
    ];

    // Eliminar duplicados usando Map
    let uniqueData = Array.from(
      new Map(allData.map((item) => [item.id, item])).values()
    );

    // 7. Filtrar solicitudes donde el proveedor ya envió presupuesto
    if (requestsWithQuotes.length > 0) {
      const beforeCount = uniqueData.length;
      uniqueData = uniqueData.filter((request: any) => 
        !requestsWithQuotes.includes(request.id)
      );
      console.log(`✅ [Available] Después de filtrar: ${uniqueData.length} solicitudes disponibles (${beforeCount - uniqueData.length} filtradas)`);
    }

    // 8. Mapear y marcar las prioritarias
    const mappedRequests = uniqueData.map(mapRequestFromDB);
    
    // Marcar solicitudes prioritarias (donde el proveedor está en preferred_providers)
    mappedRequests.forEach((request) => {
      if (request.preferredProviders.includes(providerId)) {
        request.isPriority = true;
      }
    });

    return mappedRequests;
  } catch (error) {
    console.error(
      "Error inesperado al obtener solicitudes para proveedor:",
      error
    );
    return [];
  }
};
