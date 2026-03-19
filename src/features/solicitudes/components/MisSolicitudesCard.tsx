import { View, Text, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

interface MisSolicitudesCardProps {
  totalSolicitudes: number;
  abiertas: number;
  completadas: number;
}

export function MisSolicitudesCard({ totalSolicitudes, abiertas, completadas }: MisSolicitudesCardProps) {
  const router = useRouter();

  return (
    <View className="mx-5 my-3 p-5 bg-purple-50 rounded-2xl border border-purple-100">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
          <IconSymbol name="doc.text.fill" size={20} color="#9333EA" />
        </View>
        <Text className="text-base font-medium text-purple-900">Mis Solicitudes</Text>
      </View>
      
      <Text className="text-3xl font-bold text-purple-900 mb-2">{totalSolicitudes}</Text>
      
      <Text className="text-sm text-purple-700 mb-4">
        {abiertas} abiertas, {completadas} completadas
      </Text>
      
      <TouchableOpacity 
        className="flex-row items-center justify-between"
        onPress={() => router.push('/(protected)/(mainTabs)/trabajos')}
      >
        <Text className="text-base font-semibold text-purple-600">Ver Solicitudes</Text>
        <IconSymbol name="arrow.right" size={20} color="#9333EA" />
      </TouchableOpacity>
    </View>
  );
}

