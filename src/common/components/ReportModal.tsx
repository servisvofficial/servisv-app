import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createReport, mapReasonToEnum } from "@/common/services/reports";
import { useTheme } from "@/common/providers/ThemeProvider";

const REPORT_REASONS = {
  request: [
    "Contenido inapropiado",
    "Información falsa o engañosa",
    "Solicitud duplicada",
    "Spam o publicidad no deseada",
    "Lenguaje ofensivo",
    "Otro",
  ],
  user: [
    "Comportamiento inapropiado",
    "Estafa o fraude",
    "Suplantación de identidad",
    "Acoso",
    "Spam o publicidad no deseada",
    "Otro",
  ],
};

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportType: "request" | "user";
  targetId: string;
  targetName: string;
  reportedUserId: string;
  reporterId: string;
}

export function ReportModal({
  visible,
  onClose,
  reportType,
  targetId,
  targetName,
  reportedUserId,
  reporterId,
}: ReportModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = REPORT_REASONS[reportType];
  const typeLabel = reportType === "request" ? "solicitud" : "usuario";

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Selecciona un motivo", "Por favor, indica el motivo de tu reporte.");
      return;
    }
    if (!reporterId) {
      Alert.alert("Error", "Debes iniciar sesión para reportar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reasonCategory = mapReasonToEnum(selectedReason);
      const reportedContentType = reportType === "request" ? "request" : "user_profile";
      const result = await createReport({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason_category: reasonCategory,
        details: additionalComments.trim() || undefined,
        reported_content_type: reportedContentType,
        reported_content_id: reportType === "request" ? targetId : undefined,
      });

      if (!result.success) {
        throw new Error(result.error ?? "Error al crear el reporte");
      }

      Alert.alert(
        "Reporte enviado",
        `Gracias por tu reporte. Revisaremos ${reportType === "request" ? "esta solicitud" : "este usuario"} y tomaremos las medidas necesarias.`,
        [{ text: "Entendido", onPress: () => { resetAndClose(); } }]
      );
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "No se pudo enviar el reporte. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedReason("");
    setAdditionalComments("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => !isSubmitting && resetAndClose()}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 24,
                paddingBottom: Math.max(insets.bottom, 12) + 20,
                maxHeight: "85%",
              }}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <MaterialIcons name="flag" size={24} color="#DC2626" />
                  <Text className="text-lg font-bold" style={{ color: colors.text }}>
                    Reportar {typeLabel}
                  </Text>
                </View>
                <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                  Estás reportando {reportType === "request" ? "la solicitud" : "al usuario"}{" "}
                  <Text style={{ fontWeight: "600", color: colors.text }}>{targetName}</Text>.
                  Esta información será revisada por nuestro equipo.
                </Text>

                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                  ¿Cuál es el problema? *
                </Text>
                <ScrollView
                  style={{ maxHeight: 220 }}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled
                  className="mb-6"
                >
                  {reasons.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => setSelectedReason(reason)}
                      activeOpacity={0.7}
                      className="p-3 rounded-xl border mb-2"
                      style={{
                        borderColor: selectedReason === reason ? "#DC2626" : colors.border,
                        backgroundColor: selectedReason === reason ? "#FEF2F2" : "transparent",
                      }}
                    >
                      <Text className="text-sm" style={{ color: colors.text }}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                  Comentarios adicionales (opcional)
                </Text>
                <TextInput
                  value={additionalComments}
                  onChangeText={(t) => setAdditionalComments(t.slice(0, 500))}
                  placeholder="Proporciona más detalles si es necesario..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Enter" || nativeEvent.key === "\n") {
                      Keyboard.dismiss();
                    }
                  }}
                  className="rounded-xl border p-3 text-sm"
                  style={{
                    borderColor: colors.border,
                    color: colors.text,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                />
                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {additionalComments.length}/500 caracteres
                </Text>

                <View
                  className="rounded-xl p-3 mt-4 mb-6"
                  style={{ backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FCD34D" }}
                >
                  <Text className="text-xs" style={{ color: "#92400E" }}>
                    <Text style={{ fontWeight: "700" }}>Importante:</Text> Los reportes falsos o
                    malintencionados pueden resultar en la suspensión de tu cuenta.
                  </Text>
                </View>
              </ScrollView>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={resetAndClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl border items-center"
                  style={{ borderColor: colors.border }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting || !selectedReason}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{
                    backgroundColor: isSubmitting || !selectedReason ? "#9CA3AF" : "#DC2626",
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold">Enviar reporte</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
