export type QuoteStatus = "pending" | "accepted" | "rejected" | "expired";

export interface Quote {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
  clientId?: string;
  price: number;
  description: string;
  status: QuoteStatus;
  isPriority: boolean;
  estimatedDate?: string;
  estimatedDuration?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  // Campos adicionales para compatibilidad
  paymentStatus?: string;
  warranty?: string;
  includesSupplies?: boolean;
  acceptedAt?: string;
  completedAt?: string;
}
