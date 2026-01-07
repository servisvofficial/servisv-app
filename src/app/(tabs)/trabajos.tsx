import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Header } from '@/common/components';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { useState } from 'react';

type EstadoFiltro = 'todas' | 'abierta' | 'en_progreso' | 'completada';

export default function TrabajosScreen() {
  const [filtro, setFiltro] = useState<EstadoFiltro>('todas');

  const solicitudes = [
    {
      id: '1',
      titulo: 'Reparación de tubería en baño',
      categoria: 'Fontanería',
      estado: 'abierta',
      fecha: 'Hace 2 días',
      presupuesto: '$50-$100',
    },
    {
      id: '2',
      titulo: 'Instalación de ventilador de techo',
      categoria: 'Electricidad',
      estado: 'en_progreso',
      fecha: 'Hace 5 días',
      presupuesto: '$80',
    },
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierta': return 'bg-blue-100 text-blue-700';
      case 'en_progreso': return 'bg-yellow-100 text-yellow-700';
      case 'completada': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'abierta': return 'Abierta';
      case 'en_progreso': return 'En progreso';
      case 'completada': return 'Completada';
      default: return estado;
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Header titulo="Trabajos" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-4 pb-6">
          {/* Filtros */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="px-5 mb-4"
          >
            <View className="flex-row gap-2">
              {(['todas', 'abierta', 'en_progreso', 'completada'] as EstadoFiltro[]).map((estado) => (
                <TouchableOpacity
                  key={estado}
                  className={`px-4 py-2 rounded-full ${
                    filtro === estado ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                  onPress={() => setFiltro(estado)}
                  activeOpacity={0.7}
                >
                  <Text className={`text-sm font-semibold ${
                    filtro === estado ? 'text-white' : 'text-gray-700'
                  }`}>
                    {estado === 'todas' ? 'Todas' : getEstadoTexto(estado)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Lista de solicitudes */}
          <View className="px-5">
            {solicitudes.length === 0 ? (
              <View className="items-center justify-center py-20">
                <IconSymbol name="briefcase" size={64} color="#D1D5DB" />
                <Text className="text-lg text-gray-500 mt-4">No tienes solicitudes</Text>
                <Text className="text-sm text-gray-400 mt-2">
                  Crea tu primera solicitud de servicio
                </Text>
              </View>
            ) : (
              <View>
                {solicitudes.map((solicitud) => (
                  <TouchableOpacity
                    key={solicitud.id}
                    className="mb-4 p-4 bg-white rounded-2xl border border-gray-200"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="text-base font-semibold text-gray-900 flex-1">
                        {solicitud.titulo}
                      </Text>
                      <View className={`px-3 py-1 rounded-full ${getEstadoColor(solicitud.estado)}`}>
                        <Text className="text-xs font-semibold">
                          {getEstadoTexto(solicitud.estado)}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center mb-2">
                      <IconSymbol name="tag.fill" size={14} color="#9CA3AF" />
                      <Text className="text-sm text-gray-600 ml-1">
                        {solicitud.categoria}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <IconSymbol name="calendar" size={14} color="#9CA3AF" />
                        <Text className="text-sm text-gray-500 ml-1">
                          {solicitud.fecha}
                        </Text>
                      </View>
                      
                      <Text className="text-sm font-semibold text-blue-600">
                        {solicitud.presupuesto}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

