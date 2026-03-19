/**
 * Datos fiscales para facturación (misma estructura que servisv-proyecto-web)
 */
export interface FiscalData {
  tipo_persona: "natural" | "juridica";
  tipo_dte?: string;
  tipo_documento?: string;
  dui?: string;
  nit?: string;
  numero_registro_contribuyente?: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  cod_actividad?: string;
  desc_actividad?: string;
  direccion?: string;
  departamento?: string;
  municipio?: string;
}
