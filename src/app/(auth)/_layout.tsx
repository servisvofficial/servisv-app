import { Stack } from "expo-router";
import { RegistrationProvider } from "@/features/auth/contexts/RegistrationContext";

export default function AuthLayout() {
  return (
    <RegistrationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
      </Stack>
    </RegistrationProvider>
  );
}
