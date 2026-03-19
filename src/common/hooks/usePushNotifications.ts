import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { supabase } from "@/common/lib/supabase/supabaseClient";

// Comportamiento al recibir notificación (en primer plano también)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function handleRegistrationError(errorMessage: string) {
  console.warn("[PushNotifications]", errorMessage);
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    handleRegistrationError("Las notificaciones push requieren un dispositivo físico.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    handleRegistrationError("Sin permiso para notificaciones push.");
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    handleRegistrationError("No se encontró el EAS projectId en la configuración.");
    return null;
  }

  try {
    const pushToken = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    return pushToken;
  } catch (e) {
    handleRegistrationError(String(e));
    return null;
  }
}

/**
 * Guarda el token de Expo Push en la tabla users (por id = Clerk userId).
 * Así el backend (send-email) puede enviar push cuando envía un email al mismo usuario.
 */
export async function saveExpoPushTokenToBackend(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ expo_push_token: token })
    .eq("id", userId);

  if (error) {
    console.warn("[PushNotifications] No se pudo guardar el token en el backend:", error.message);
  }
}

export type NotificationPayload = Notifications.Notification;

/**
 * Hook: registra push, guarda el token en Supabase y expone listeners para cuando llega una notificación.
 * Usar dentro de (protected) cuando el usuario esté logueado.
 */
export function usePushNotifications() {
  const { userId, isSignedIn } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<NotificationPayload | undefined>(
    undefined
  );
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isSignedIn || !userId) return;

    let isMounted = true;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!isMounted) return;
      if (token) {
        setExpoPushToken(token);
        await saveExpoPushTokenToBackend(userId, token);
      }
    })();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setLastNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Opcional: navegar según response.notification.request.content.data (ej. requestId, chatId)
      console.log("[PushNotifications] Respuesta a notificación:", response.notification.request.content.data);
    });

    return () => {
      isMounted = false;
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [isSignedIn, userId]);

  return {
    expoPushToken,
    lastNotification,
  };
}
