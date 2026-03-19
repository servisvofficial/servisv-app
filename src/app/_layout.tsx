import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import 'react-native-reanimated';
import '../../global.css';

import { useColorScheme } from '@/common/hooks/useColorScheme';
import { QueryProvider } from '@/common/providers/QueryProvider';
import { ClerkSupabaseProvider } from '@/common/providers/ClerkSupabaseProvider';
import { ThemeProvider as AppThemeProvider } from '@/common/providers/ThemeProvider';
import { ChatProvider } from '@/features/chat';
import { envs } from '@/common/config/envs';

/** Redirige desde la ruta inicial según auth. Debe estar dentro de ClerkProvider. */
function InitialRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;
    const isInitialRoute = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');
    if (!isInitialRoute) return;
    if (isSignedIn) {
      router.replace('/(protected)/(mainTabs)/home');
    } else {
      router.replace('/(auth)/onboarding');
    }
  }, [isLoaded, isSignedIn, router, segments]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const clerkKey = envs.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  if (!clerkKey) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center' }}>
          Configura EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY en tu archivo .env
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={clerkKey}>
      <ChatProvider>
        <ClerkSupabaseProvider>
          <InitialRedirect />
          <SafeAreaProvider>
            <QueryProvider>
              <AppThemeProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                    <Stack.Screen name="crear-solicitud" options={{ presentation: 'modal', title: 'Nueva Solicitud' }} />
                    <Stack.Screen name="payment-callback" options={{ headerShown: false }} />
                  </Stack>
                  <StatusBar style="auto" />
                </ThemeProvider>
              </AppThemeProvider>
            </QueryProvider>
          </SafeAreaProvider>
        </ClerkSupabaseProvider>
      </ChatProvider>
    </ClerkProvider>
  );
}
