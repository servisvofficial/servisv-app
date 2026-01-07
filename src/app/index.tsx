import { Redirect } from 'expo-router';

export default function Index() {
  // Aquí podrías verificar si el usuario ya está autenticado
  const isAuthenticated = false; // Reemplazar con lógica real

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/onboarding" />;
}

