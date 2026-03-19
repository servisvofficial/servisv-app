import { supabase } from "@/common/lib/supabase/supabaseClient";

interface SelectedCategory {
  categoryId: number;
  categoryName: string;
  selectedSubcategories: string[]; // IDs de subcategorías
}

interface CompleteUserRegistrationData {
  userId: string;
  email: string;
  name: string;
  lastName: string;
  dui: string;
  cel_phone?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  propertyType?: string;
  duiFrontalUrl?: string;
  duiDorsoUrl?: string;
}

interface CompleteProviderRegistrationData {
  userId: string;
  email: string;
  name: string;
  lastName: string;
  dui: string;
  cel_phone?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  serviceRadius?: number;
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountType?: "ahorro" | "corriente";
  duiFrontalUrl?: string;
  duiDorsoUrl?: string;
  professionalCredentialUrl?: string;
  policeClearanceUrl?: string;
  selectedCategories: SelectedCategory[];
}

/**
 * Completa el registro de un usuario cliente en Supabase
 */
export const completeUserRegistration = async (
  data: CompleteUserRegistrationData
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Crear/actualizar el registro del usuario en Supabase
    const { error: insertError } = await supabase.from("users").upsert(
      {
        id: data.userId,
        name: data.name,
        last_name: data.lastName,
        dui: data.dui,
        cel_phone: data.cel_phone ?? null,
        location: data.location,
        coordinates: data.coordinates,
        rol: "user",
        is_provider: false,
        is_validated: false,
        is_banned: false,
        email: data.email,
        dui_frontal_pic: data.duiFrontalUrl,
        dui_dorso_pic: data.duiDorsoUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (insertError) {
      console.error("Error al insertar usuario:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error en completeUserRegistration:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
};

/**
 * Completa el registro de un proveedor en Supabase
 */
export const completeProviderRegistration = async (
  data: CompleteProviderRegistrationData
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Crear/actualizar el registro del proveedor en Supabase
    const { error: insertError } = await supabase.from("users").upsert(
      {
        id: data.userId,
        name: data.name,
        last_name: data.lastName,
        dui: data.dui,
        cel_phone: data.cel_phone ?? null,
        location: data.location,
        coordinates: data.coordinates,
        service_radius: data.serviceRadius,
        bank_account_number: data.bankAccountNumber,
        bank_name: data.bankName,
        bank_account_type: data.bankAccountType,
        rol: "provider",
        is_provider: true,
        is_validated: false,
        is_banned: false,
        email: data.email,
        dui_frontal_pic: data.duiFrontalUrl,
        dui_dorso_pic: data.duiDorsoUrl,
        professional_credential_pic: data.professionalCredentialUrl,
        police_clearance_pic: data.policeClearanceUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (insertError) {
      console.error("Error al insertar proveedor:", insertError);
      return { success: false, error: insertError.message };
    }

    // 2. Insertar categorías en user_professional_services
    const servicesToInsert = [];

    for (const serviceCategory of data.selectedCategories) {
      // Si tiene subcategorías, insertarlas
      if (serviceCategory.selectedSubcategories.length > 0) {
        for (const subcategoryId of serviceCategory.selectedSubcategories) {
          servicesToInsert.push({
            user_id: data.userId,
            category_id: serviceCategory.categoryId,
            subcategory_id: subcategoryId,
          });
        }
      } else {
        // Si no tiene subcategorías, buscar la subcategoría "general"
        const { data: category } = await supabase
          .from("categories")
          .select("name")
          .eq("id", serviceCategory.categoryId)
          .single();

        if (category) {
          const generalSubcatName = `${category.name} general`;
          const { data: subcategory } = await supabase
            .from("subcategories")
            .select("id")
            .eq("name", generalSubcatName)
            .single();

          if (subcategory) {
            servicesToInsert.push({
              user_id: data.userId,
              category_id: serviceCategory.categoryId,
              subcategory_id: subcategory.id,
            });
          }
        }
      }
    }

    if (servicesToInsert.length > 0) {
      const { error: servicesError } = await supabase
        .from("user_professional_services")
        .insert(servicesToInsert);

      if (servicesError) {
        console.error("Error al insertar servicios profesionales:", servicesError);
        // No fallar por esto, pero loguearlo
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error en completeProviderRegistration:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
};
