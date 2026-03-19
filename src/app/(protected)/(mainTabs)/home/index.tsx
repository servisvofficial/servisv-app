import { View, ActivityIndicator } from 'react-native';
import { HomeCliente } from '@/features/home/components/HomeCliente';
import { HomeProveedor } from '@/features/home/components/HomeProveedor';
import { useUserRole } from '@/common/hooks/useUserRole';

export default function HomeScreen() {
  const { data: userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Mostrar HomeProveedor si el usuario es proveedor, sino mostrar HomeCliente
  if (userRole === 'provider') {
    return <HomeProveedor />;
  }

  return <HomeCliente />;
}
