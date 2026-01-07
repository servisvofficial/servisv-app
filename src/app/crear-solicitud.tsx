import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { Button, CategoriaCard } from '@/common/components';
import { CATEGORIAS_POPULARES } from '@/common/types';

export default function CrearSolicitudScreen() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  const handleCrearSolicitud = () => {
    // Aquí iría la lógica para crear la solicitud
    console.log('Crear solicitud:', { titulo, descripcion, categoriaSeleccionada });
    router.back();
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="xmark" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Nueva Solicitud</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Título */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Título del servicio *
            </Text>
            <TextInput
              className="px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900"
              placeholder="Ej: Reparación de tubería en baño"
              value={titulo}
              onChangeText={setTitulo}
            />
          </View>

          {/* Descripción */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Descripción *
            </Text>
            <TextInput
              className="px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900"
              placeholder="Describe detalladamente lo que necesitas..."
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Categoría */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Categoría *
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {CATEGORIAS_POPULARES.slice(0, 4).map((categoria) => (
                <TouchableOpacity
                  key={categoria.id}
                  className={`w-[48%] mb-3 p-4 rounded-2xl border-2 ${
                    categoriaSeleccionada === categoria.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => setCategoriaSeleccionada(categoria.id)}
                  activeOpacity={0.7}
                >
                  <View className="items-center">
                    <Text className="text-3xl mb-2">{categoria.icono}</Text>
                    <Text className="text-sm font-semibold text-gray-900 text-center">
                      {categoria.nombre}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Presupuesto */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Presupuesto estimado (opcional)
            </Text>
            <View className="flex-row gap-3">
              <TextInput
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900"
                placeholder="Mínimo"
                keyboardType="numeric"
              />
              <TextInput
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900"
                placeholder="Máximo"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Ubicación */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Ubicación *
            </Text>
            <TouchableOpacity className="px-4 py-3 bg-gray-50 rounded-xl flex-row items-center justify-between">
              <Text className="text-gray-400 text-base">Seleccionar ubicación</Text>
              <IconSymbol name="location.fill" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Botón */}
          <View className="mt-4">
            <Button 
              titulo="Publicar Solicitud" 
              onPress={handleCrearSolicitud}
              disabled={!titulo || !descripcion || !categoriaSeleccionada}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

