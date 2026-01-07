import { View, Text, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export function ExplorarServiciosCard() {
  const router = useRouter();

  return (
    <View className="mx-5 my-3 p-5 bg-green-50 rounded-2xl border border-green-100">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
          <IconSymbol name="magnifyingglass" size={20} color="#10B981" />
        </View>
        <Text className="text-base font-semibold text-green-900">Explorar Servicios</Text>
      </View>
      
      <Text className="text-sm text-green-700 mb-4">
        Encuentra profesionales cerca de ti
      </Text>
      
      <TouchableOpacity 
        className="w-full py-3 bg-white rounded-xl items-center justify-center border border-green-200"
        onPress={() => router.push('/(tabs)/servicios')}
        activeOpacity={0.8}
      >
        <Text className="text-base font-semibold text-green-600">Ver Servicios →</Text>
      </TouchableOpacity>
    </View>
  );
}

