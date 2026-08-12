import { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Switch,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";

import {
  getStoredNotifications,
  markAllNotificationsAsRead,
  clearStoredNotifications,
  registerForPushNotificationsAsync,
  saveExpoPushTokenToBackend,
  type StoredNotification,
} from "@/common/hooks";
import { useTheme } from "@/common/providers/ThemeProvider";
import { supabase } from "@/common/lib/supabase/supabaseClient";

const PUSH_ENABLED_KEY = "servisv_push_enabled_v1";

function formatRelativeDate(dateIso: string): string {
  const date = new Date(dateIso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Hace unos segundos";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHour < 24) return `Hace ${diffHour} h`;
  if (diffDay < 7) return `Hace ${diffDay} d`;
  return date.toLocaleDateString("es-SV");
}

export default function NotificacionesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [togglingPush, setTogglingPush] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const items = await getStoredNotifications();
    setNotifications(items);
    setLoading(false);
  }, []);

  const loadPushPreference = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
      if (stored !== null) {
        setPushEnabled(stored === "true");
        return;
      }
      // Si no hay preferencia guardada, verificar el estado real del sistema
      const { status } = await Notifications.getPermissionsAsync();
      setPushEnabled(status === "granted");
    } catch {
      setPushEnabled(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
      void markAllNotificationsAsRead();
      void loadPushPreference();
    }, [loadNotifications, loadPushPreference])
  );

  const handleTogglePush = async (value: boolean) => {
    if (togglingPush) return;
    setTogglingPush(true);

    try {
      if (value) {
        // Activar: solicitar permiso y registrar token
        const { status } = await Notifications.getPermissionsAsync();

        if (status === "denied") {
          // El usuario denegó explícitamente → llevarlo a configuración del sistema
          Alert.alert(
            "Notificaciones desactivadas",
            "Para activar las notificaciones ve a Configuración > ServiSV y activa los permisos.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Abrir Configuración",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          setTogglingPush(false);
          return;
        }

        const token = await registerForPushNotificationsAsync();
        if (token && userId) {
          await saveExpoPushTokenToBackend(userId, token);
        }

        await AsyncStorage.setItem(PUSH_ENABLED_KEY, "true");
        setPushEnabled(true);
      } else {
        // Desactivar: quitar el token del backend
        if (userId) {
          await supabase
            .from("users")
            .update({ expo_push_token: null })
            .eq("id", userId);
        }
        await AsyncStorage.setItem(PUSH_ENABLED_KEY, "false");
        setPushEnabled(false);
      }
    } catch (err) {
      console.warn("[NotificacionesScreen] Error al cambiar push:", err);
      Alert.alert("Error", "No se pudo cambiar la configuración. Intenta de nuevo.");
    } finally {
      setTogglingPush(false);
    }
  };

  const handleClear = async () => {
    await clearStoredNotifications();
    setNotifications([]);
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1">
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-5 py-4 border-b"
          style={{
            paddingTop: insets.top + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="mr-3"
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Notificaciones
            </Text>
          </View>

          <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Limpiar
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom + 20, 24),
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadNotifications}
              tintColor={colors.text}
            />
          }
        >
          {/* Sección: configuración push */}
          <View
            className="rounded-2xl border p-4 mb-5"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text
              className="text-xs font-semibold uppercase mb-3"
              style={{ color: colors.textSecondary, letterSpacing: 0.8 }}
            >
              Configuración
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.primary + "18" }}
                >
                  <MaterialIcons
                    name="notifications-active"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    Notificaciones push
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                    {pushEnabled
                      ? "Recibirás alertas de mensajes, cotizaciones y más"
                      : "Activa para recibir alertas en tiempo real"}
                  </Text>
                </View>
              </View>

              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                disabled={togglingPush}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={pushEnabled ? colors.primary : "#9CA3AF"}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>

          {/* Sección: historial */}
          <Text
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: colors.textSecondary, letterSpacing: 0.8 }}
          >
            Historial
          </Text>

          {!notifications.length && !loading ? (
            <View className="items-center justify-center py-16">
              <MaterialIcons
                name="notifications-none"
                size={54}
                color={colors.textSecondary}
              />
              <Text
                className="text-base font-semibold mt-3"
                style={{ color: colors.text }}
              >
                No tienes notificaciones
              </Text>
              <Text
                className="text-sm mt-1 text-center"
                style={{ color: colors.textSecondary }}
              >
                Cuando recibas nuevas alertas, aparecerán aquí.
              </Text>
            </View>
          ) : (
            notifications.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border p-4 mb-3"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-start justify-between">
                  <Text
                    className="text-base font-semibold flex-1 mr-3"
                    style={{ color: colors.text }}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>
                    {formatRelativeDate(item.receivedAt)}
                  </Text>
                </View>
                {!!item.body && (
                  <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                    {item.body}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}
