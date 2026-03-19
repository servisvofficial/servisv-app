export interface Provider {
  id: string;
  name: string;
  last_name: string;
  email: string;
  cel_phone?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  service_radius?: number; // Radio de servicio en kilómetros
  profile_pic?: string;
  service_categories?: Array<{ category: string; subcategories?: string[] }>;
  is_provider: boolean;
  is_validated: boolean;
  rating?: number;
  total_requests?: number;
  total_quotes?: number;
  updated_at?: string;
}

export interface ProviderWithDistance extends Provider {
  distance?: number; // Distancia en kilómetros desde el usuario
}
