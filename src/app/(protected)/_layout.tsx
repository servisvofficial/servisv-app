import { Stack, useRouter } from "expo-router";
import { usePushNotifications } from "@/common/hooks/usePushNotifications";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useUserData } from "@/common/hooks/useUserData";

const ProtectedLayout = () => {
  usePushNotifications();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user, isLoading } = useUserData();
  const didHandleBan = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!(user as any).is_banned) return;
    if (didHandleBan.current) return;
    didHandleBan.current = true;

    Alert.alert(
      "Acceso denegado",
      "Tu cuenta ha sido suspendida. Por favor, contacta al soporte si crees que esto es un error.",
      [
        {
          text: "Entendido",
          onPress: async () => {
            try {
              await signOut();
            } finally {
              router.replace("/(auth)/sign-in");
            }
          },
        },
      ]
    );
  }, [isLoading, user, signOut, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="(mainTabs)" />
      <Stack.Screen
        name="solicitudes-disponibles"
        options={{ 
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="detalle-solicitud-disponible"
        options={{ 
          animation: "slide_from_bottom",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="presupuestos"
        options={{ 
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="notificaciones"
        options={{
          presentation: "fullScreenModal",
        }}
      />
    </Stack>
  );
};

export default ProtectedLayout;
