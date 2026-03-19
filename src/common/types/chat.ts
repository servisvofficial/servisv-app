/**
 * Tipos de chat alineados con servisv-proyecto-web (tablas chats y messages).
 * Los chats están asociados a una solicitud (request_id).
 */

export type ChatStatus = "active" | "pending" | "completed" | "archived";

export type MessageType =
  | "text"
  | "image"
  | "file"
  | "quote"
  | "quote_request"
  | "system";

export interface Chat {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  professional_id: string;
  request_id: string | null;
  quote_status: string | null;
  status: ChatStatus;
}

export interface Message {
  id: number;
  created_at: string;
  chat_id: string;
  sender_id: string;
  type: MessageType;
  content: string | null;
  attachment_url: string | null;
  is_read: boolean;
}

/** Estado de la solicitud para filtrar por tab (aceptadas / pendientes / completadas) */
export type RequestStatusForChat = "open" | "quoted" | "accepted" | "in_progress" | "completed" | "cancelled";

/** Chat con datos extra para la lista (título de solicitud, estado, nombre del otro participante) */
export interface ChatWithDetails extends Chat {
  request_title?: string | null;
  /** Estado de la solicitud asociada (requests.status); null si el chat no tiene request_id */
  request_status?: RequestStatusForChat | null;
  other_participant_id: string;
  other_participant_name: string;
  /** URL de la foto de perfil del otro participante */
  other_participant_profile_pic?: string | null;
  /** Categoría del servicio (ej. "Plomería • Emergencias") */
  request_category?: string | null;
  last_message_content?: string | null;
  last_message_at?: string | null;
  unread_count: number;
}
