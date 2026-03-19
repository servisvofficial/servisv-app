import { IconSymbol } from "@/common/components/ui/IconSymbol";
import { getStoredNotifications, useUserData } from "@/common/hooks";
import { useTheme } from "@/common/providers/ThemeProvider";
import { getUserInitials } from "@/common/utils/userHelpers";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  titulo?: string;
  mostrarNotificaciones?: boolean;
  mostrarAvatar?: boolean;
}

export function Header({
  titulo = "ServiSV",
  mostrarNotificaciones = true,
  mostrarAvatar = true,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useUserData();
  const { colors } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = getUserInitials(user?.name, user?.last_name);
  const profilePic = user?.profile_pic;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const notifications = await getStoredNotifications();
        if (!mounted) return;
        setUnreadCount(notifications.filter((item) => !item.read).length);
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <View
      className="flex-row items-center justify-between px-5 py-4 border-b"
      style={{
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
        paddingTop: insets.top + 16,
      }}
    >
      <View className="flex-row items-center gap-1">
        <Image
          source={require("../../../assets/images/splash-icon.png")}
          className="w-14 h-14"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          {titulo}
        </Text>
      </View>

      <View className="flex-row items-center gap-4">
        {mostrarNotificaciones && (
          <TouchableOpacity
            className="relative"
            onPress={() => router.push("/(protected)/notificaciones" as any)}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="bell.fill"
              size={24}
              color={colors.textSecondary}
            />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </TouchableOpacity>
        )}

        {mostrarAvatar && (
          <TouchableOpacity
            onPress={() => {
              // Navegar a la tab de perfil primero, luego abrir configuración como modal
              router.push("/(protected)/(mainTabs)/perfil" as any);
              // Usar un pequeño delay para asegurar que la navegación se complete
              setTimeout(() => {
                router.push(
                  "/(protected)/(mainTabs)/perfil/configuracion" as any
                );
              }, 300);
            }}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                <ActivityIndicator size="small" color="#6B7280" />
              </View>
            ) : profilePic ? (
              <Image
                source={{ uri: profilePic }}
                className="w-10 h-10 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
                <Text className="text-white font-semibold text-base">
                  {initials}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
