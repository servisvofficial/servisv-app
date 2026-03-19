import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  // Esperar a que Clerk cargue
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Si el usuario ya está autenticado, redirigir a la home
  if (isSignedIn) {
    return <Redirect href="/(protected)/(mainTabs)/home" />;
  }

  // Si no está autenticado, ir al onboarding
  return <Redirect href="/(auth)/onboarding" />;
}

