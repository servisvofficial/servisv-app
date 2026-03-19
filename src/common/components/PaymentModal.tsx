import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/common/providers/ThemeProvider";
import { FiscalFormModal } from "./FiscalFormModal";
import {
  calculatePaymentBreakdown,
  formatCurrency,
  WOMPI_MAX_AMOUNT,
  type PaymentBreakdown,
} from "@/common/services/paymentCalculations";
import { createWompiPayment, createN1coPayment, getCallbackUrlForApp } from "@/common/services/paymentGateway";
import { supabase } from "@/common/lib/supabase/supabaseClient";
import type { FiscalData } from "@/common/types/fiscal";

const PENDING_PAYMENT_KEY = "pending_payment";

export interface PaymentModalPayload {
  quoteId: string;
  requestId: string;
  serviceAmount: number;
  concept: string;
  buyerId: string;
  sellerId: string;
}

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  payload: PaymentModalPayload | null;
  userEmail?: string;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  visible,
  onClose,
  payload,
  userEmail = "",
  onPaymentSuccess,
}: PaymentModalProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<"fiscal" | "payment" | "processing">("fiscal");
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [showManualClose, setShowManualClose] = useState(false);

  const quoteId = payload?.quoteId ?? "";
  const requestId = payload?.requestId ?? "";
  const serviceAmount = payload?.serviceAmount ?? 0;
  const concept = payload?.concept ?? "";
  const buyerId = payload?.buyerId ?? "";
  const sellerId = payload?.sellerId ?? "";
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const manualCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && payload) {
      setStep("fiscal");
      setFiscalData(null);
      setMessage("");
      setShowManualClose(false);
      setBreakdown(calculatePaymentBreakdown(serviceAmount));
    }
  }, [visible, payload?.quoteId, serviceAmount]);

  // Limpiar polling y timer al cerrar el modal o al desmontar
  useEffect(() => {
    if (!visible) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (manualCloseTimerRef.current) {
        clearTimeout(manualCloseTimerRef.current);
        manualCloseTimerRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (manualCloseTimerRef.current) {
        clearTimeout(manualCloseTimerRef.current);
        manualCloseTimerRef.current = null;
      }
    };
  }, [visible]);

  const handleFiscalSubmit = (data: FiscalData) => {
    setFiscalData(data);
    const newBreakdown = calculatePaymentBreakdown(
      serviceAmount,
      undefined,
      data.tipo_dte
    );
    setBreakdown(newBreakdown);
    setStep("payment");
  };

  const handlePayment = async () => {
    if (!fiscalData || !breakdown) return;

    setIsProcessing(true);
    setStep("processing");
    setMessage("Preparando pago...");

    try {
      const useN1co = breakdown.totalAmount >= WOMPI_MAX_AMOUNT;
      const paymentGateway = useN1co ? "n1co" : "wompi";
      const redirectUrl = getCallbackUrlForApp();
      const customerEmail = fiscalData.email || userEmail;
      const reference = `QUOTE-${quoteId}-${Date.now()}`;

      let transactionId: string;
      let redirectToUrl: string | undefined;

      if (useN1co) {
        const res = await createN1coPayment({
          amount: breakdown.totalAmount,
          customerEmail,
          reference,
          description: concept || "Servicio",
          redirectUrl,
          fiscalData,
          quoteId,
        });
        transactionId = res.data?.id ?? "";
        redirectToUrl = res.data?.redirect_url ?? res.data?.checkout_url;
      } else {
        const res = await createWompiPayment({
          amountInCents: Math.round(breakdown.totalAmount * 100),
          customerEmail,
          reference,
          redirectUrl,
          fiscalData,
        });
        transactionId = res.data?.id ?? "";
        redirectToUrl = res.data?.redirect_url;
      }

      if (!transactionId) {
        throw new Error(`No se recibió ID de transacción de ${paymentGateway}`);
      }

      const pendingPaymentData = {
        quoteId,
        requestId,
        transactionId,
        paymentGateway,
        fiscalData,
      };
      await AsyncStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pendingPaymentData));

      const { error: saveError } = await supabase.from("pending_fiscal_data").upsert(
        {
          transaction_id: transactionId,
          quote_id: quoteId,
          fiscal_data: fiscalData,
          payment_gateway: paymentGateway,
          created_at: new Date().toISOString(),
        },
        { onConflict: "transaction_id" }
      );

      if (saveError) {
        throw new Error(`Error al guardar datos fiscales: ${saveError.message}`);
      }

      setMessage(
        `Redirigiendo a ${useN1co ? "n1co" : "Wompi"} para completar el pago...`
      );

      if (redirectToUrl) {
        const canOpen = await Linking.canOpenURL(redirectToUrl);
        if (canOpen) {
          setTimeout(() => {
            Linking.openURL(redirectToUrl!);
          }, 800);
        } else {
          Alert.alert(
            "Abrir en navegador",
            "Se abrirá el enlace de pago en tu navegador.",
            [{ text: "OK", onPress: () => Linking.openURL(redirectToUrl!) }]
          );
        }
      } else {
        throw new Error("No se recibió URL de redirección del gateway");
      }

      // Polling: cerrar el modal cuando exista billing o la request pase a in_progress
      const POLL_INTERVAL_MS = 3000;
      const MANUAL_CLOSE_AFTER_MS = 90000; // 90 s para mostrar botón "Cerrar"
      manualCloseTimerRef.current = setTimeout(() => setShowManualClose(true), MANUAL_CLOSE_AFTER_MS);

      pollingRef.current = setInterval(async () => {
        try {
          const { data: billingRow } = await supabase
            .from("billing")
            .select("id")
            .eq("quote_id", quoteId)
            .maybeSingle();
          if (billingRow?.id) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            if (manualCloseTimerRef.current) {
              clearTimeout(manualCloseTimerRef.current);
              manualCloseTimerRef.current = null;
            }
            onPaymentSuccess?.();
            onClose();
            return;
          }
          const { data: requestRow } = await supabase
            .from("requests")
            .select("status")
            .eq("id", requestId)
            .maybeSingle();
          if (requestRow?.status === "in_progress") {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            if (manualCloseTimerRef.current) {
              clearTimeout(manualCloseTimerRef.current);
              manualCloseTimerRef.current = null;
            }
            onPaymentSuccess?.();
            onClose();
          }
        } catch (_) {
          // ignorar errores de polling
        }
      }, POLL_INTERVAL_MS);
    } catch (error: any) {
      console.error("Error al procesar pago:", error);
      Alert.alert(
        "Error al procesar pago",
        error.message || "Ocurrió un error. Por favor, intenta de nuevo."
      );
      setStep("payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const showPaymentContent = step === "payment" && fiscalData && breakdown;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        {step === "fiscal" && (
          <FiscalFormModal
            embedded
            visible
            onClose={onClose}
            onSubmit={handleFiscalSubmit}
            initialData={fiscalData ?? undefined}
            defaultEmail={userEmail}
            isLoading={false}
          />
        )}

        {showPaymentContent && (
          <View
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden",
              maxHeight: "90%",
              backgroundColor: "#FFFFFF",
            }}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>ServiSV</Text>
                  <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: "flex-end" }}>
                    <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: colors.text }}>
                  Resumen del pago
                </Text>

                {breakdown.totalAmount >= WOMPI_MAX_AMOUNT && (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      marginBottom: 16,
                      backgroundColor: "rgba(59, 130, 246, 0.15)",
                      borderWidth: 1,
                      borderColor: "rgba(59, 130, 246, 0.4)",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.text }}>
                      💳 <Text style={{ fontWeight: "600" }}>Pago mayor a ${WOMPI_MAX_AMOUNT}:</Text> Tu pago será procesado mediante n1co.
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 16,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontWeight: "600", fontSize: 18, marginBottom: 12, color: colors.text }}>Resumen del Pago</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                    <Text style={{ color: colors.textSecondary }}>Servicio:</Text>
                    <Text style={{ fontWeight: "600", color: colors.text }}>{formatCurrency(breakdown.serviceAmount)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                    <Text style={{ color: colors.textSecondary }}>Costo de Servicio:</Text>
                    <Text style={{ color: colors.text }}>
                      {formatCurrency(breakdown.platformCommissionBuyer + breakdown.paymentGatewayCommission)}
                    </Text>
                  </View>
                  {breakdown.ivaAmount > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                      <Text style={{ color: colors.textSecondary }}>IVA (13% sobre comisiones):</Text>
                      <Text style={{ color: colors.text }}>{formatCurrency(breakdown.ivaAmount)}</Text>
                    </View>
                  )}
                  {fiscalData?.tipo_dte === "14" && (
                    <View style={{ paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, fontStyle: "italic", color: colors.textSecondary }}>
                        Nota: Factura de Sujeto Excluido (sin IVA)
                      </Text>
                    </View>
                  )}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontWeight: "700", fontSize: 18, color: colors.text }}>Total a Pagar:</Text>
                    <Text style={{ fontWeight: "700", fontSize: 18, color: colors.text }}>{formatCurrency(breakdown.totalAmount)}</Text>
                  </View>
                </View>

                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 24,
                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(59, 130, 246, 0.2)",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 10, color: colors.text }}>Datos Fiscales</Text>
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 14, color: colors.text }}>
                      <Text style={{ fontWeight: "600" }}>Tipo:</Text>{" "}
                      {fiscalData?.tipo_persona === "natural" ? "Persona Natural" : "Persona Jurídica"}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.text }}>
                      <Text style={{ fontWeight: "600" }}>Nombre:</Text> {fiscalData?.nombre_completo}
                    </Text>
                    {fiscalData?.tipo_persona === "natural" ? (
                      fiscalData?.dui ? (
                        <Text style={{ fontSize: 14, color: colors.text }}>
                          <Text style={{ fontWeight: "600" }}>DUI:</Text> {fiscalData.dui}
                        </Text>
                      ) : null
                    ) : (
                      <>
                        {fiscalData?.nit ? (
                          <Text style={{ fontSize: 14, color: colors.text }}>
                            <Text style={{ fontWeight: "600" }}>NIT:</Text> {fiscalData.nit}
                          </Text>
                        ) : null}
                        {fiscalData?.numero_registro_contribuyente ? (
                          <Text style={{ fontSize: 14, color: colors.text }}>
                            <Text style={{ fontWeight: "600" }}>Número de Registro:</Text> {fiscalData.numero_registro_contribuyente}
                          </Text>
                        ) : null}
                      </>
                    )}
                    <Text style={{ fontSize: 14, color: colors.text }}>
                      <Text style={{ fontWeight: "600" }}>Email:</Text> {fiscalData?.email}
                    </Text>
                    <Text style={{ fontSize: 12, marginTop: 4, color: colors.textSecondary }}>
                      Tipo de factura:{" "}
                      {fiscalData?.tipo_persona === "natural" ? "Consumidor Final" : "Comprobante de Crédito Fiscal"}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center" }}
                    onPress={() => setStep("fiscal")}
                    disabled={isProcessing}
                  >
                    <Text style={{ fontWeight: "600", color: colors.text }}>Volver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={handlePayment}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#4F46E5", "#EC4899"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, borderRadius: 12 }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <MaterialIcons name="credit-card" size={20} color="#FFF" />
                          <Text style={{ color: "#FFF", fontWeight: "700" }}>Pagar {formatCurrency(breakdown.totalAmount)}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {step === "processing" && (
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
            <View style={{ borderRadius: 16, padding: 32, alignItems: "center", maxWidth: 400, backgroundColor: colors.card }}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 16, color: colors.text }}>
                {message || "Procesando tu pago..."}
              </Text>
              <Text style={{ fontSize: 14, marginTop: 8, textAlign: "center", color: colors.textSecondary }}>
                Serás redirigido a la pasarela de pago en breve.
              </Text>
              <Text style={{ fontSize: 12, marginTop: 12, textAlign: "center", color: colors.textSecondary }}>
                El modal se cerrará solo cuando el pago se confirme.
              </Text>
              {showManualClose && (
                <TouchableOpacity
                  onPress={() => {
                    if (pollingRef.current) {
                      clearInterval(pollingRef.current);
                      pollingRef.current = null;
                    }
                    onClose();
                  }}
                  style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ fontWeight: "600", color: colors.text }}>Cerrar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
