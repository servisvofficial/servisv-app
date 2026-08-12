import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { Provider } from "../interfaces/provider.interface";

/**
 * Parsea coordenadas desde cualquier formato que Supabase pueda devolver:
 * - Objeto JS:  { lat: number, lng: number }
 * - String JSON simple:  '{"lat":13.8,"lng":-89.4}'
 * - String JSON doble-encoded:  '"{\"lat\":13.8,\"lng\":-89.4}"'
 */
function parseCoordinates(raw: unknown): { lat: number; lng: number } | undefined {
  if (!raw) return undefined;

  // Caso 1: ya es un objeto con lat/lng
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as any;
    if (typeof obj.lat === "number" && typeof obj.lng === "number") {
      return { lat: obj.lat, lng: obj.lng };
    }
  }

  // Caso 2: string (simple o doble-encoded)
  if (typeof raw === "string") {
    let parsed: unknown = raw;
    // Intentar parsear hasta 2 veces para manejar doble encoding
    for (let i = 0; i < 2; i++) {
      if (typeof parsed !== "string") break;
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return undefined;
      }
    }
    if (typeof parsed === "object" && parsed !== null) {
      const obj = parsed as any;
      if (typeof obj.lat === "number" && typeof obj.lng === "number") {
        return { lat: obj.lat, lng: obj.lng };
      }
    }
  }

  return undefined;
}

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

  // Parsear coordenadas — la BD tiene dos formatos:
  // 1. JSONB objeto:  { lat: 13.8, lng: -89.4 }
  // 2. JSONB string:  "{\"lat\":13.8,\"lng\":-89.4}"  (doble encoding)
  const coordinates = parseCoordinates(user.coordinates);

  // Respetar el radio que el proveedor configuró. Si es NULL no tiene área configurada
  // (lo manejamos en el filtro de useProviders)
  const service_radius: number | null = user.service_radius ?? null;

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
    service_radius,
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
      .eq("is_provider", true)
      .eq("is_banned", false);
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
