import { TouchableOpacity, Text, View } from 'react-native';
import type { Categoria } from '../types';

interface CategoriaCardProps {
  categoria: Categoria;
  onPress?: () => void;
}

export function CategoriaCard({ categoria, onPress }: CategoriaCardProps) {
  return (
    <TouchableOpacity 
      className="w-[48%] bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="items-center">
        <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: categoria.color + '20' }}>
          <Text className="text-3xl">{categoria.icono}</Text>
        </View>
        
        <Text className="text-base font-semibold text-gray-900 text-center mb-1">
          {categoria.nombre}
        </Text>
        
        <Text className="text-xs text-gray-500">
          {categoria.cantidadProveedores}+ proveedores
        </Text>
      </View>
    </TouchableOpacity>
  );
}

