import { supabase } from "@/common/lib/supabase/supabaseClient";

export type ReportReason =
  | "spam"
  | "contenido_inapropiado"
  | "discurso_de_odio"
  | "acoso"
  | "informacion_falsa"
  | "violacion_terminos"
  | "otro";

export type ReportedContentType =
  | "user_profile"
  | "request"
  | "quote"
  | "review"
  | "chat_message";

export interface CreateReportData {
  reporter_id: string;
  reported_user_id: string;
  reason_category: ReportReason;
  details?: string;
  reported_content_type: ReportedContentType;
  reported_content_id?: string;
}

const REASON_MAPPING: Record<string, ReportReason> = {
  "Contenido inapropiado": "contenido_inapropiado",
  "Información falsa o engañosa": "informacion_falsa",
  "Solicitud duplicada": "spam",
  "Spam o publicidad no deseada": "spam",
  "Lenguaje ofensivo": "discurso_de_odio",
  "Otro": "otro",
  "Comportamiento inapropiado": "contenido_inapropiado",
  "Estafa o fraude": "violacion_terminos",
  "Suplantación de identidad": "violacion_terminos",
  "Acoso": "acoso",
};

export const mapReasonToEnum = (reason: string): ReportReason => {
  return REASON_MAPPING[reason] ?? "otro";
};

export const createReport = async (
  reportData: CreateReportData
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reportData.reporter_id,
    reported_user_id: reportData.reported_user_id,
    reason_category: reportData.reason_category,
    details: reportData.details || null,
    reported_content_type: reportData.reported_content_type,
    reported_content_id: reportData.reported_content_id || null,
    status: "submitted",
  });

  if (error) {
    return { success: false, error: error.message ?? "Error al crear el reporte" };
  }
  return { success: true };
};
