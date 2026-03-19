import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useTheme } from "@/common/providers/ThemeProvider";

interface QuoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    price: number;
    description: string;
    estimatedDate?: string;
    estimatedDuration?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function QuoteModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: QuoteModalProps) {
  const { colors } = useTheme();
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");

  const handleSubmit = async () => {
    if (!price.trim() || !description.trim()) {
      Alert.alert("Error", "Por favor, completa el precio y la descripción.");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Error", "El precio debe ser un número válido mayor a 0.");
      return;
    }

    try {
      await onSubmit({
        price: priceNum,
        description: description.trim(),
        estimatedDate: estimatedDate.trim() || undefined,
        estimatedDuration: estimatedDuration.trim() || undefined,
      });

      // Limpiar formulario
      setPrice("");
      setDescription("");
      setEstimatedDate("");
      setEstimatedDuration("");
    } catch (error) {
      // El error ya se maneja en el componente padre
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPrice("");
      setDescription("");
      setEstimatedDate("");
      setEstimatedDuration("");
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            maxHeight: "90%",
            flex: 1,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          <View style={{ backgroundColor: "transparent", flex: 1 }}>
            {/* Header */}
            <View
              className="flex-row items-center justify-between px-5 py-4 border-b bg-white/50"
              style={{ borderBottomColor: colors.border }}
            >
              <Text
                className="text-xl font-bold"
                style={{ color: colors.text }}
              >
                Enviar Presupuesto
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View className="px-5 py-6 space-y-4">
                {/* Precio */}
                <View>
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Precio (USD) *
                  </Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    className="px-4 py-3 border rounded-xl text-base"
                    style={{
                      height: 56,
                      lineHeight: Platform.OS === "ios" ? 0 : undefined,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  />
                </View>

                {/* Descripción */}
                <View>
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Descripción del trabajo *
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe qué incluye tu servicio y cómo lo realizarás..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    className="px-4 py-3 border rounded-xl text-base"
                    style={{
                      minHeight: 120,
                      paddingTop: 12,
                      paddingBottom: 12,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  />
                </View>

                {/* Fecha estimada */}
                <View>
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Fecha estimada de inicio
                  </Text>
                  <TextInput
                    value={estimatedDate}
                    onChangeText={setEstimatedDate}
                    placeholder="YYYY-MM-DD (ej: 2024-12-25)"
                    placeholderTextColor={colors.textSecondary}
                    className="px-4 py-3 border rounded-xl text-base"
                    style={{
                      height: 56,
                      lineHeight: Platform.OS === "ios" ? 0 : undefined,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  />
                  <Text
                    className="text-xs mt-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Formato: Año-Mes-Día
                  </Text>
                </View>

                {/* Duración estimada */}
                <View>
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Duración estimada
                  </Text>
                  <TextInput
                    value={estimatedDuration}
                    onChangeText={setEstimatedDuration}
                    placeholder="Ej: 2 días, 1 semana, etc."
                    placeholderTextColor={colors.textSecondary}
                    className="px-4 py-3 border rounded-xl text-base"
                    style={{
                      height: 56,
                      lineHeight: Platform.OS === "ios" ? 0 : undefined,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Footer con botones */}
            <View
              className="px-5 py-4 border-t flex-row gap-3"
              style={{ borderTopColor: colors.border }}
            >
              <TouchableOpacity
                className="flex-1 px-4 py-3 border rounded-xl items-center"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
                onPress={handleClose}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text
                  className="font-semibold text-base"
                  style={{ color: colors.text }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl overflow-hidden"
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#4F46E5", "#EC4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      Enviar Presupuesto
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}
