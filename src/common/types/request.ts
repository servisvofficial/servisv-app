// Tipos para las categorías (tabla requests)
// El id es int8 (number) según la estructura de la tabla
export interface Request {
  id: number; // int8 en la base de datos
  name: string;
  icon_url: string | null;
  category_type: string; // 'technical' | 'professional'
  /** Requisitos adicionales para esta categoría (ej. registro JVPE para Enfermería) */
  extra_requirements: string | null;
  created_at: string;
}

// Tipos para las subcategorías
export interface Subcategory {
  id: string; // UUID
  name: string;
  created_at: string;
}

// Tipo para la relación categoría-subcategoría (tabla category_subcategories)
export interface CategorySubcategory {
  category_id: number; // int8 - referencia a categories.id
  subcategory_id: string; // UUID - referencia a subcategories.id
  id?: string;
  created_at: string;
}

// Tipo para categoría con sus subcategorías
export interface CategoryWithSubcategories extends Request {
  subcategories: Subcategory[];
}
