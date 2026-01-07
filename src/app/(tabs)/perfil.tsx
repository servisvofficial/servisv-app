import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Header } from '@/common/components';
import { IconSymbol } from '@/common/components/ui/IconSymbol';

export default function PerfilScreen() {
  const opciones = [
    { id: '1', titulo: 'Información personal', icono: 'person.fill', color: '#3B82F6' },
    { id: '2', titulo: 'Mis reseñas', icono: 'star.fill', color: '#F59E0B' },
    { id: '3', titulo: 'Métodos de pago', icono: 'creditcard.fill', color: '#10B981' },
    { id: '4', titulo: 'Notificaciones', icono: 'bell.fill', color: '#8B5CF6' },
    { id: '5', titulo: 'Ayuda y soporte', icono: 'questionmark.circle.fill', color: '#6B7280' },
    { id: '6', titulo: 'Configuración', icono: 'gearshape.fill', color: '#64748B' },
  ];

  return (
    <View className="flex-1 bg-white">
      <Header titulo="Perfil" mostrarNotificaciones={false} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-6 pb-8">
          {/* Info del usuario */}
          <View className="items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-blue-500 items-center justify-center mb-3">
              <Text className="text-white font-bold text-3xl">JD</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">Juan Díaz</Text>
            <Text className="text-sm text-gray-600 mt-1">juan.diaz@email.com</Text>
            
            <View className="flex-row items-center mt-3">
              <IconSymbol name="star.fill" size={16} color="#F59E0B" />
              <Text className="text-sm font-semibold text-gray-700 ml-1">4.8</Text>
              <Text className="text-sm text-gray-500 ml-1">(12 reseñas)</Text>
            </View>
          </View>

          {/* Opciones del menú */}
          <View className="px-5">
            {opciones.map((opcion) => (
              <TouchableOpacity
                key={opcion.id}
                className="flex-row items-center py-4 border-b border-gray-100"
                activeOpacity={0.7}
              >
                <View 
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: opcion.color + '20' }}
                >
                  <IconSymbol name={opcion.icono as any} size={20} color={opcion.color} />
                </View>
                
                <Text className="flex-1 text-base text-gray-900">{opcion.titulo}</Text>
                
                <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Botón cerrar sesión */}
          <View className="px-5 mt-6">
            <TouchableOpacity 
              className="py-4 border border-red-200 rounded-xl items-center"
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold text-red-600">Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

