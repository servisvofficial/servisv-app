import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { RequestItem } from "../interfaces/request.interface";

/**
 * Obtiene las solicitudes relevantes para un proveedor
 * Basado en la lógica de getRequestsForProvider de servisv-proyecto-web
 * @param providerId - ID del proveedor
 * @param status - Array de estados de solicitudes a filtrar
 * @returns Array de solicitudes disponibles para el proveedor
 */
export const getProviderRequests = async (
  providerId: string,
  status: string[]
): Promise<RequestItem[]> => {
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
    console.log(`🔍 Proveedor ${providerId} ya tiene presupuestos en ${requestsWithQuotes.length} solicitudes`);

    // 2. Obtener las categorías y subcategorías del proveedor desde user_professional_services
    const { data: providerServices, error: servicesError } = await supabase
      .from("user_professional_services")
      .select(`
        category_id,
        subcategory_id,
        categories:category_id (id, name),
        subcategories:subcategory_id (id, name)
      `)
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
    const { data: preferredData, error: preferredError } = await supabase
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
      .in("status", status)
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
            .in("status", status)
            .in("id", requestIds)
            .order("created_at", { ascending: false })
        : { data: null, error: null };

    if (rpDataError) {
      console.error(
        "Error al obtener solicitudes desde request_providers:",
        rpDataError
      );
    }

    // 5. Obtener solicitudes por categoría y subcategoría
    let categoryData: any[] = [];
    if (providerCategories.length > 0) {
      const { data: catData, error: catError } = await supabase
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
        .in("status", status)
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
      uniqueData = uniqueData.filter((request: any) => 
        !requestsWithQuotes.includes(request.id)
      );
      console.log(`✅ Después de filtrar: ${uniqueData.length} solicitudes disponibles`);
    }

    // 8. Formatear los datos según la interfaz RequestItem
    const formattedData: RequestItem[] = uniqueData.map((request: any) => ({
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
      userRole: "provider",
      client: {
        id: request.client_id,
        name: request.client_name,
      },
      // Marcar como prioritaria si el proveedor está en preferred_providers
      isPriority: request.preferred_providers?.includes(providerId) || false,
    }));

    return formattedData;
  } catch (error) {
    console.error(
      "Error inesperado al obtener solicitudes para proveedor:",
      error
    );
    throw error;
  }
};
