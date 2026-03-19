import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/common/providers/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_PAYMENT_KEY = "pending_payment";

/**
 * Pantalla que recibe el deep link tras el pago (servisvapp://payment-callback).
 * Cuando el usuario vuelve desde la web tras confirmar/rechazar el pago, abre la app
 * y redirige al detalle de la solicitud.
 */
export default function PaymentCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string; requestId?: string }>();
  const { colors } = useTheme();
  const status = params.status ?? "success";
  const requestIdFromUrl = params.requestId;

  useEffect(() => {
    let mounted = true;

    const goToRequest = async (requestId: string) => {
      if (!mounted) return;
      try {
        await AsyncStorage.removeItem(PENDING_PAYMENT_KEY);
      } catch (_) {}
      router.replace({
        pathname: "/(protected)/(mainTabs)/trabajos/detalle-solicitud",
        params: { requestId },
      });
    };

    if (requestIdFromUrl) {
      goToRequest(requestIdFromUrl);
      return;
    }

    // Si no vino requestId en la URL, intentar leerlo de pending_payment (por si el deep link no lo pasó)
    AsyncStorage.getItem(PENDING_PAYMENT_KEY)
      .then((raw) => {
        if (!mounted) return;
        try {
          const data = raw ? JSON.parse(raw) : null;
          const requestId = data?.requestId;
          if (requestId) {
            goToRequest(requestId);
          } else {
            router.replace("/(protected)/(mainTabs)/trabajos");
          }
        } catch {
          router.replace("/(protected)/(mainTabs)/trabajos");
        }
      })
      .catch(() => {
        if (mounted) router.replace("/(protected)/(mainTabs)/trabajos");
      });

    return () => {
      mounted = false;
    };
  }, [requestIdFromUrl, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={{ marginTop: 16, color: colors.text }}>Abriendo tu solicitud...</Text>
    </View>
  );
}
