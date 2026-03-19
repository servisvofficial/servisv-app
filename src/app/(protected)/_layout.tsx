import { Stack } from "expo-router";
import { usePushNotifications } from "@/common/hooks/usePushNotifications";

const ProtectedLayout = () => {
  usePushNotifications();

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
