/**
 * Cálculo de comisiones e impuestos para pagos (igual lógica que servisv-proyecto-web)
 */

export interface PaymentBreakdown {
  serviceAmount: number;
  platformCommissionBuyer: number;
  platformCommissionSeller: number;
  paymentGatewayCommission: number;
  totalCommissions: number;
  ivaAmount: number;
  ivaCommissionSeller: number;
  totalAmount: number;
  sellerAmount: number;
  paymentGateway?: "wompi" | "n1co";
}

const COMMISSION_RATES = {
  PLATFORM_BUYER: 0.1,
  PLATFORM_SELLER: 0.05,
  PAYMENT_GATEWAY_WOMPI: 0.035,
  PAYMENT_GATEWAY_N1CO_DEFAULT: 0.0311,
  PAYMENT_GATEWAY_N1CO_FIXED_FEE: 0.17,
  IVA: 0.13,
};

export const WOMPI_MAX_AMOUNT = 1000;

const round = (n: number) => Math.round(n * 100) / 100;

export function calculatePaymentBreakdown(
  serviceAmount: number,
  paymentGateway?: "wompi" | "n1co",
  tipoDte?: string
): PaymentBreakdown {
  const platformCommissionBuyer = serviceAmount * COMMISSION_RATES.PLATFORM_BUYER;
  const platformCommissionSeller = serviceAmount * COMMISSION_RATES.PLATFORM_SELLER;
  const baseForGateway = serviceAmount + platformCommissionBuyer;

  let selectedGateway = paymentGateway;
  if (!selectedGateway) {
    const estimatedTotal =
      baseForGateway * (1 + COMMISSION_RATES.PAYMENT_GATEWAY_WOMPI + COMMISSION_RATES.IVA);
    selectedGateway = estimatedTotal >= WOMPI_MAX_AMOUNT ? "n1co" : "wompi";
  }

  const gatewayRate =
    selectedGateway === "n1co"
      ? COMMISSION_RATES.PAYMENT_GATEWAY_N1CO_DEFAULT
      : COMMISSION_RATES.PAYMENT_GATEWAY_WOMPI;
  const fixedFee = selectedGateway === "n1co" ? COMMISSION_RATES.PAYMENT_GATEWAY_N1CO_FIXED_FEE : 0;
  const paymentGatewayCommission = baseForGateway * gatewayRate + fixedFee;

  const comisionesComprador = platformCommissionBuyer + paymentGatewayCommission;
  const ivaOnBuyerCommissions = tipoDte === "14" ? 0 : comisionesComprador * COMMISSION_RATES.IVA;
  const ivaCommissionSeller =
    tipoDte === "14" ? 0 : platformCommissionSeller * COMMISSION_RATES.IVA;
  const ivaAmount = ivaOnBuyerCommissions + ivaCommissionSeller;

  const totalAmount =
    serviceAmount + platformCommissionBuyer + paymentGatewayCommission + ivaOnBuyerCommissions;
  const sellerAmount = serviceAmount - platformCommissionSeller - ivaCommissionSeller;

  return {
    serviceAmount: round(serviceAmount),
    platformCommissionBuyer: round(platformCommissionBuyer),
    platformCommissionSeller: round(platformCommissionSeller),
    paymentGatewayCommission: round(paymentGatewayCommission),
    totalCommissions: round(
      platformCommissionBuyer + platformCommissionSeller + paymentGatewayCommission
    ),
    ivaAmount: round(ivaAmount),
    ivaCommissionSeller: round(ivaCommissionSeller),
    totalAmount: round(totalAmount),
    sellerAmount: round(sellerAmount),
    paymentGateway: selectedGateway,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function validateDUI(dui: string): boolean {
  return /^\d{8}-\d{1}$/.test(dui);
}

export function validateNIT(nit: string): boolean {
  return /^\d{4}-\d{6}-\d{3}-\d{1}$/.test(nit);
}
