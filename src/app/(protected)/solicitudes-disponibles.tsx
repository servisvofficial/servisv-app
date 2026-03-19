import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '@/common/components';
import { useTheme } from '@/common/providers/ThemeProvider';
import { useAvailableRequests } from '@/features/solicitudes';

export default function SolicitudesDisponiblesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: solicitudes = [], isLoading, refetch } = useAvailableRequests();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8);

  // Filtrar solicitudes por búsqueda
  const filteredSolicitudes = solicitudes.filter((solicitud) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      solicitud.title.toLowerCase().includes(query) ||
      solicitud.description.toLowerCase().includes(query) ||
      solicitud.location.toLowerCase().includes(query) ||
      solicitud.clientName.toLowerCase().includes(query)
    );
  });

  // Separar solicitudes prioritarias
  const priorityRequests = filteredSolicitudes.filter((req) => req.isPriority);
  const otherRequests = filteredSolicitudes.filter((req) => !req.isPriority);

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'hace un momento';
      if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
      if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return 'Fecha no disponible';
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ backgroundColor: "transparent" }}>
        {/* Header */}
        <View 
          className="flex-row items-center justify-between px-5 py-4 border-b"
          style={{ 
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 16 
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>Solicitudes Disponibles</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.text}
            />
          }
        >
          <View className="pt-4">
            {/* Barra de búsqueda */}
            <View className="px-5 mb-4">
              <SearchBar 
                placeholder="Buscar por palabra clave" 
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Filtros */}
            <View className="px-5 mb-4 flex-row gap-3">
              <TouchableOpacity
                className="rounded-xl overflow-hidden flex-row items-center"
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#4F46E5', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ 
                    paddingHorizontal: 16, 
                    paddingVertical: 12, 
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 12
                  }}
                >
                  <MaterialIcons name="category" size={18} color="#FFFFFF" />
                  <Text className="text-white font-medium text-sm ml-2">Categoría</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                className="rounded-xl overflow-hidden flex-row items-center"
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#4F46E5', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ 
                    paddingHorizontal: 16, 
                    paddingVertical: 12, 
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 12
                  }}
                >
                  <MaterialIcons name="location-on" size={18} color="#FFFFFF" />
                  <Text className="text-white font-medium text-sm ml-2">Ubicación</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                className="rounded-xl overflow-hidden"
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#4F46E5', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ 
                    width: 48,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12
                  }}
                >
                  <MaterialIcons name="attach-money" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

          {/* Estado de carga */}
          {isLoading && (
            <View className="px-5 py-10 items-center">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
                Cargando solicitudes...
              </Text>
            </View>
          )}

          {/* Estado vacío */}
          {!isLoading && filteredSolicitudes.length === 0 && (
            <View className="px-5 py-10 items-center">
              <MaterialIcons name="inbox" size={64} color={colors.textSecondary} />
              <Text className="text-lg font-bold mt-4" style={{ color: colors.text }}>
                {searchQuery ? 'No se encontraron resultados' : 'No hay solicitudes disponibles'}
              </Text>
              <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
                {searchQuery 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'No hay solicitudes abiertas en este momento. Vuelve más tarde.'}
              </Text>
            </View>
          )}

          {/* Solicitudes prioritarias */}
          {!isLoading && priorityRequests.length > 0 && (
            <View className="px-5 mb-4">
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="star" size={20} color="#F59E0B" />
                <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                  Solicitudes Prioritarias
                </Text>
                <View 
                  className="ml-2 px-2 py-1 rounded-full bg-blue-100"
                >
                  <Text className="text-xs font-semibold text-blue-600">
                    {priorityRequests.length}
                  </Text>
                </View>
              </View>
              {priorityRequests.map((solicitud) => (
                <RequestCard
                  key={solicitud.id}
                  solicitud={solicitud}
                  router={router}
                  colors={colors}
                  formatDate={formatDate}
                />
              ))}
            </View>
          )}

          {/* Otras solicitudes */}
          {!isLoading && otherRequests.length > 0 && (
            <View className="px-5">
              {priorityRequests.length > 0 && (
                <View className="flex-row items-center mb-3">
                  <MaterialIcons name="list" size={20} color={colors.textSecondary} />
                  <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                    Otras Solicitudes Disponibles
                  </Text>
                  <View 
                    className="ml-2 px-2 py-1 rounded-full"
                    style={{ backgroundColor: colors.border }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {otherRequests.length}
                    </Text>
                  </View>
                </View>
              )}
              {otherRequests.map((solicitud) => (
                <RequestCard
                  key={solicitud.id}
                  solicitud={solicitud}
                  router={router}
                  colors={colors}
                  formatDate={formatDate}
                />
              ))}
            </View>
          )}
        </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

// Componente para la card de solicitud
interface RequestCardProps {
  solicitud: any;
  router: any;
  colors: any;
  formatDate: (date: string) => string;
}

function RequestCard({ solicitud, router, colors, formatDate }: RequestCardProps) {
  return (
    <View
      className="mb-4 p-4 rounded-2xl border shadow-sm"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-base font-bold flex-1 mr-2" style={{ color: colors.text }}>
          {solicitud.title}
        </Text>
        {solicitud.isPriority && (
          <TouchableOpacity className="rounded-full overflow-hidden">
            <LinearGradient
              colors={['#4F46E5', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 20
              }}
            >
              <MaterialIcons name="star" size={12} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold ml-1">PRIORIDAD</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-sm mb-3 leading-5" style={{ color: colors.text }}>
        {solicitud.description}
      </Text>

      <View className="flex-row items-center mb-2">
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          Por: <Text className="text-blue-600 font-medium">{solicitud.clientName}</Text>
        </Text>
      </View>

      <View className="flex-row items-center mb-2">
        <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
        <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
          {solicitud.location}
        </Text>
      </View>

      <View className="flex-row items-center justify-between mb-3">
        {solicitud.budgetRange && (
          <View className="flex-row items-center">
            <MaterialIcons name="attach-money" size={14} color={colors.textSecondary} />
            <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
              ${solicitud.budgetRange.min} - ${solicitud.budgetRange.max}
            </Text>
          </View>
        )}
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          {formatDate(solicitud.createdAt)}
        </Text>
      </View>

      <TouchableOpacity
        className="rounded-xl overflow-hidden"
        activeOpacity={0.8}
        onPress={() => {
          router.push({
            pathname: '/(protected)/detalle-solicitud-disponible',
            params: { 
              requestId: solicitud.id,
            },
          } as any);
        }}
      >
        <LinearGradient
          colors={['#4F46E5', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ 
            paddingVertical: 12, 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 12,
            width: '100%'
          }}
        >
          <Text className="text-white font-bold text-sm">
            Ver Detalles y Enviar Presupuesto
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
