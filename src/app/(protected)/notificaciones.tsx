import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getStoredNotifications,
  markAllNotificationsAsRead,
  clearStoredNotifications,
  type StoredNotification,
} from "@/common/hooks";
import { useTheme } from "@/common/providers/ThemeProvider";

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
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const items = await getStoredNotifications();
    setNotifications(items);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
      void markAllNotificationsAsRead();
    }, [loadNotifications])
  );

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
          {!notifications.length && !loading ? (
            <View className="items-center justify-center py-20">
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
