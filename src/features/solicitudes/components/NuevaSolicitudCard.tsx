import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { Button } from '@/common/components';

interface NuevaSolicitudCardProps {
  onPress?: () => void;
}

export function NuevaSolicitudCard({ onPress }: NuevaSolicitudCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/crear-solicitud');
    }
  };

  return (
    <View className="mx-5 my-3 p-5 bg-blue-50 rounded-2xl border border-blue-100">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
          <IconSymbol name="plus.circle.fill" size={24} color="#3B82F6" />
        </View>
        <Text className="text-base font-semibold text-blue-900">Nueva Solicitud</Text>
      </View>
      
      <Text className="text-sm text-blue-700 mb-4">
        Publica una nueva solicitud de servicio
      </Text>
      
      <Button titulo="Crear Solicitud" onPress={handlePress} />
    </View>
  );
}

