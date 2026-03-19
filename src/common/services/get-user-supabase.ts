import { supabase } from "../lib/supabase/supabaseClient";

export interface User {
  id: string;
  name: string;
  last_name: string;
  email: string;
  cel_phone?: string;
  dui?: string;
  rol: "provider" | "user";
  location?: string;
  coordinates?: { lat: number; lng: number };
  service_radius?: number;
  profile_pic?: string;
  service_category?: string;
  service_categories?: Array<{ category: string; subcategories?: string[] }>;
  is_provider: boolean;
  is_validated: boolean;
  police_clearance_pic?: string | null;
  rating?: number;
  total_requests?: number;
  total_quotes?: number;
  created_at?: string;
  updated_at?: string;
}

export const getUserDataInSupabaseById = async (
  userId: string
): Promise<User | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error("Failed to fetch user data: " + error.message);
  }

  if (!data) {
    return null;
  }

  // Si es proveedor, obtener sus categorías desde user_professional_services
  let serviceCategories: Array<{ category: string; subcategories?: string[] }> = [];
  if (data.is_provider) {
    try {
      const { data: services, error: servicesError } = await supabase
        .from("user_professional_services")
        .select(
          `
          category_id,
          categories:category_id (id, name),
          subcategories:subcategory_id (id, name)
        `
        )
        .eq("user_id", userId);

      if (servicesError) {
        console.error("Error al obtener servicios profesionales:", servicesError);
      } else if (services && services.length > 0) {
        // Agrupar por categoría
        const categoriesMap = new Map<
          string,
          { category: string; subcategories: string[] }
        >();

        services.forEach((service: any) => {
          const categoryName = service.categories?.name;
          const subcategoryName = service.subcategories?.name;

          if (!categoryName) return;

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
  }

  return {
    ...data,
    service_categories: serviceCategories,
  } as User;
};
