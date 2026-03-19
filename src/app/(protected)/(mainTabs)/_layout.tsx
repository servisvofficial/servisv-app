import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { HapticTab } from "@/common/components";
import { useTheme } from "@/common/providers/ThemeProvider";
import { useChat } from "@/features/chat";

const ACTIVE_COLOR = "#9333EA"; // Púrpura vibrante
const INACTIVE_COLOR = "#6B7280"; // Gris oscuro

export default function MainTabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { totalUnreadCount, fetchChatsWithDetails, userId } = useChat();

  // Mismo color que el header de la home (colors.card): en modo oscuro gris oscuro
  const tabBarBaseStyle = {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  };

  // Cargar chats al montar el tab bar (Home, Servicios, etc.) para que el puntito aparezca en todas las pestañas
  useEffect(() => {
    if (userId) {
      fetchChatsWithDetails();
    }
  }, [userId, fetchChatsWithDetails]);

  return (
    <Tabs
      screenOptions={({ route }) => {
        let iconName: keyof typeof MaterialIcons.glyphMap = "home";

        if (route.name === "home") {
          iconName = "home";
        } else if (route.name === "servicios") {
          iconName = "handyman";
        } else if (route.name === "chats") {
          iconName = "chat-bubble-outline";
        } else if (route.name === "perfil") {
          iconName = "person-outline";
        } else if (route.name === "trabajos") {
          iconName = "work-outline";
        }

        const isChats = route.name === "chats";
        const showUnreadDot = isChats && totalUnreadCount > 0;

        // En el detalle del chat no se muestran las tabs: el usuario tiene que ir atrás para moverse
        const focusedRoute = getFocusedRouteNameFromRoute(route) ?? "index";
        const isChatDetail = route.name === "chats" && focusedRoute === "[chatId]";
        const tabBarStyle = isChatDetail
          ? { ...tabBarBaseStyle, display: "none" as const }
          : {
              ...tabBarBaseStyle,
              paddingBottom: Math.max(insets.bottom, 8),
              height: 70 + Math.max(insets.bottom - 8, 0),
            };

        return {
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarIcon: ({ focused, color }) => {
            return (
              <View style={{ position: "relative" }}>
                <MaterialIcons
                  name={iconName}
                  size={24}
                  color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
                {showUnreadDot && (
                  <View
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -6,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#EF4444",
                    }}
                  />
                )}
              </View>
            );
          },
        };
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: "Servicios",
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          // Badge de no leídos abajo (visible en Home, Servicios, Perfil, Trabajos)
          tabBarBadge: totalUnreadCount > 0 ? (totalUnreadCount > 99 ? "99+" : totalUnreadCount) : undefined,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
        }}
      />
      <Tabs.Screen
        name="trabajos"
        options={{
          title: "Trabajos",
        }}
      />
    </Tabs>
  );
}
