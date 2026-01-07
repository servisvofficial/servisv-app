import { View, Text, TouchableOpacity, Image } from 'react-native';
import { IconSymbol } from '@/common/components/ui/IconSymbol';

interface HeaderProps {
  titulo?: string;
  mostrarNotificaciones?: boolean;
  mostrarAvatar?: boolean;
}

export function Header({ titulo = 'ServiSV', mostrarNotificaciones = true, mostrarAvatar = true }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
      <Text className="text-2xl font-bold text-gray-900">{titulo}</Text>
      
      <View className="flex-row items-center gap-4">
        {mostrarNotificaciones && (
          <TouchableOpacity className="relative">
            <IconSymbol name="bell.fill" size={24} color="#6B7280" />
            <View className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </TouchableOpacity>
        )}
        
        {mostrarAvatar && (
          <TouchableOpacity>
            <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
              <Text className="text-white font-semibold text-base">JD</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

