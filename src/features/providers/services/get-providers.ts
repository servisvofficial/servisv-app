import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { Provider } from "../interfaces/provider.interface";

/**
 * Convierte un usuario de Supabase a un Provider
 * Nota: No excluimos proveedores sin coordenadas aquí, ya que pueden aparecer
 * cuando no hay ubicación del usuario o cuando se filtra por ubicación general
 */
const supabaseToProvider = async (user: any): Promise<Provider | null> => {
  if (!user.is_provider) return null;

  // Obtener categorías del proveedor desde user_professional_services
  let serviceCategories: Array<{ category: string; subcategories?: string[] }> = [];
  try {
    const { data: services, error: servicesError } = await supabase
      .from("user_professional_services")
      .select(
        `
        category_id,
        subcategory_id,
        categories:category_id (id, name),
        subcategories:subcategory_id (id, name)
      `
      )
      .eq("user_id", user.id);

    if (servicesError) {
      console.error(`[getProviders] Error al obtener servicios para ${user.id}:`, servicesError);
    } else if (services && services.length > 0) {
      const categoriesMap = new Map<
        string,
        { category: string; subcategories: string[] }
      >();

      services.forEach((service: any) => {
        const categoryName = service.categories?.name;
        const subcategoryName = service.subcategories?.name;

        if (!categoryName) {
          return;
        }

        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, {
            category: categoryName,
            subcategories: [],
          });
        }

        if (subcategoryName) {
          const category = categoriesMap.get(categoryName)!;
          if (category && !category.subcategories.includes(subcategoryName)) {
            category.subcategories.push(subcategoryName);
          }
        }
      });

      serviceCategories = Array.from(categoriesMap.values());
    }
  } catch (error) {
    console.error("Error al obtener categorías del proveedor:", error);
  }

  // Parsear coordenadas si existen
  let coordinates: { lat: number; lng: number } | undefined;
  if (user.coordinates) {
    if (typeof user.coordinates === "string") {
      try {
        coordinates = JSON.parse(user.coordinates);
      } catch {
        coordinates = undefined;
      }
    } else if (
      typeof user.coordinates === "object" &&
      user.coordinates.lat &&
      user.coordinates.lng
    ) {
      coordinates = {
        lat: user.coordinates.lat,
        lng: user.coordinates.lng,
      };
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    last_name: user.last_name,
    cel_phone: user.cel_phone,
    is_provider: user.is_provider,
    is_validated: user.is_validated || false,
    service_categories: serviceCategories,
    location: user.location || undefined,
    coordinates,
    service_radius: user.service_radius || 10, // Por defecto 10 km
    profile_pic: user.profile_pic || undefined,
    rating: user.rating || undefined,
    total_requests: user.total_requests || undefined,
    total_quotes: user.total_quotes || undefined,
    updated_at: user.updated_at || undefined,
  };
};

/**
 * Obtiene todos los proveedores desde Supabase
 */
export const getProviders = async (): Promise<Provider[]> => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("is_provider", true);
      // No filtrar por is_validated aquí, se hará después si es necesario

    if (error) {
      console.error("Error al obtener proveedores de Supabase:", error);
      return [];
    }

    if (!users || users.length === 0) {
      return [];
    }

    // Convertir cada usuario a Provider
    const providersPromises = users.map((user) => supabaseToProvider(user));
    const providers = await Promise.all(providersPromises);

    // Filtrar los nulls y retornar solo los proveedores válidos
    return providers.filter((p): p is Provider => p !== null);
  } catch (error) {
    console.error("Error inesperado al obtener proveedores:", error);
    return [];
  }
};
