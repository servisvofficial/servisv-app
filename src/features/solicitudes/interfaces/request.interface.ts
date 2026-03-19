export type RequestStatus = 
  | "open" 
  | "quoted" 
  | "accepted" 
  | "in_progress" 
  | "completed" 
  | "cancelled";

export interface RequestLocation {
  address: string;
  city?: string;
  province?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface RequestClient {
  id: string;
  name: string;
  last_name?: string;
  profile_pic?: string;
}

export interface RequestProvider {
  id: string;
  name: string;
  last_name?: string;
  profile_pic?: string;
}

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  serviceCategory: string;
  subcategory?: string;
  location: RequestLocation;
  coordinates?: { lat: number; lng: number };
  photos?: string[];
  images?: string[]; // Alias para compatibilidad
  scheduledDate?: string;
  budgetRange?: { min: number; max: number };
  preferredProviders: string[];
  status: RequestStatus;
  selectedQuoteId?: string;
  createdAt: string;
  updatedAt: string;
  userRole: "client" | "provider";
  client: RequestClient;
  providers?: RequestProvider[];
  reviewed?: boolean; // Indica si el usuario actual ya calificó esta solicitud
  isPriority?: boolean; // Para proveedores: indica si el usuario está en preferred_providers
}

// Interface para crear una nueva solicitud
export interface CreateRequestData {
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  serviceCategory: string;
  subcategory?: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  photos?: string[];
  scheduledDate?: string;
  budgetRange?: { min: number; max: number };
  preferredProviders?: string[];
}

// Interface para AvailableRequest (solicitudes disponibles para proveedores)
export interface AvailableRequest extends RequestItem {
  // Hereda todas las propiedades de RequestItem
  // Se puede usar directamente RequestItem
}
