/**
 * Llamadas a las Edge Functions de Supabase para crear pagos Wompi y N1CO
 * (misma lógica que servisv-proyecto-web)
 */
import { envs } from "@/common/config/envs";
import type { FiscalData } from "@/common/types/fiscal";

const getBaseCallbackUrl = (): string => {
  if (envs.EXPO_PUBLIC_PAYMENT_CALLBACK_URL) {
    return envs.EXPO_PUBLIC_PAYMENT_CALLBACK_URL;
  }
  const base = envs.EXPO_PUBLIC_SUPABASE_URL.replace(/\.supabase\.co.*$/, "");
  return `${base.replace("-functions", "")}/payment-callback`;
};

/** URL de callback para cuando el pago se inicia desde la web (redirige a la web). */
const getCallbackUrl = (): string => getBaseCallbackUrl();

/** URL de callback para cuando el pago se inicia desde la app: misma página web pero con ?source=app para mostrar "Volver a la app". */
export const getCallbackUrlForApp = (): string => {
  const base = getBaseCallbackUrl();
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}source=app`;
};

export async function createWompiPayment(params: {
  amountInCents: number;
  customerEmail: string;
  reference: string;
  redirectUrl: string;
  fiscalData: FiscalData;
}): Promise<{ data: { id: string; redirect_url?: string; status?: string } }> {
  const url = `${envs.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-wompi-payment`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${envs.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      amount_in_cents: params.amountInCents,
      currency: "USD",
      customer_email: params.customerEmail,
      payment_method: { type: "CARD" },
      reference: params.reference,
      redirect_url: params.redirectUrl,
      customer_data: {
        email: params.fiscalData.email,
        full_name: params.fiscalData.nombre_completo,
        legal_id:
          params.fiscalData.tipo_persona === "natural"
            ? params.fiscalData.dui?.replace(/-/g, "")
            : params.fiscalData.nit?.replace(/-/g, ""),
        legal_id_type: params.fiscalData.tipo_persona === "natural" ? "CC" : "NIT",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Wompi: ${res.statusText}`);
  }
  return res.json();
}

export async function createN1coPayment(params: {
  amount: number;
  customerEmail: string;
  reference: string;
  description: string;
  redirectUrl: string;
  fiscalData: FiscalData;
  quoteId: string;
}): Promise<{ data: { id: string; redirect_url?: string; checkout_url?: string } }> {
  const url = `${envs.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-n1co-payment`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${envs.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: "USD",
      customer_email: params.customerEmail,
      reference: params.reference,
      description: params.description,
      redirect_url: params.redirectUrl,
      customer_data: {
        email: params.fiscalData.email,
        full_name: params.fiscalData.nombre_completo,
        legal_id:
          params.fiscalData.tipo_persona === "natural"
            ? params.fiscalData.dui?.replace(/-/g, "")
            : params.fiscalData.nit?.replace(/-/g, ""),
        legal_id_type: params.fiscalData.tipo_persona === "natural" ? "DUI" : "NIT",
      },
      customer_name: params.fiscalData.nombre_completo,
      customer_phone: params.fiscalData.telefono || "",
      customer_address: params.fiscalData.direccion || "San Salvador",
      customer_city: params.fiscalData.municipio || "San Salvador",
      customer_state_code: params.fiscalData.departamento || "06",
      customer_zip_code:
        params.fiscalData.departamento && params.fiscalData.municipio
          ? `${params.fiscalData.departamento}${params.fiscalData.municipio}`
          : "01101",
      quote_id: params.quoteId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `N1CO: ${res.statusText}`);
  }
  return res.json();
}

export { getCallbackUrl };
