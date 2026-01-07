import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Header } from '@/common/components';
import { IconSymbol } from '@/common/components/ui/IconSymbol';

export default function ChatsScreen() {
  // Datos de ejemplo
  const chats = [
    {
      id: '1',
      nombre: 'Carlos Martínez',
      ultimoMensaje: 'Perfecto, llego a las 3pm',
      fecha: '10:30 AM',
      noLeidos: 2,
    },
    {
      id: '2',
      nombre: 'Ana López',
      ultimoMensaje: '¿Podemos agendar para mañana?',
      fecha: 'Ayer',
      noLeidos: 0,
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <Header titulo="Chats" mostrarAvatar={false} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {chats.length === 0 ? (
          <View className="items-center justify-center py-20">
            <IconSymbol name="message" size={64} color="#D1D5DB" />
            <Text className="text-lg text-gray-500 mt-4">No tienes conversaciones</Text>
            <Text className="text-sm text-gray-400 mt-2">
              Inicia una conversación con un proveedor
            </Text>
          </View>
        ) : (
          <View className="py-2">
            {chats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                className="px-5 py-4 flex-row items-center border-b border-gray-100"
                activeOpacity={0.7}
              >
                <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mr-3">
                  <Text className="text-white font-semibold text-lg">
                    {chat.nombre.charAt(0)}
                  </Text>
                </View>
                
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {chat.nombre}
                    </Text>
                    <Text className="text-xs text-gray-500">{chat.fecha}</Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
                      {chat.ultimoMensaje}
                    </Text>
                    {chat.noLeidos > 0 && (
                      <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center ml-2">
                        <Text className="text-white text-xs font-bold">
                          {chat.noLeidos}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

