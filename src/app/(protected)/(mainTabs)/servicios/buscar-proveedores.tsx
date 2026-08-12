import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '@/common/components';
import { useTheme } from '@/common/providers/ThemeProvider';
import { useProviders } from '@/features/providers';
import { useUserData } from '@/common/hooks/useUserData';
import { useState, useMemo } from 'react';

export default function BuscarProveedoresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    category?: string;
    subcategory?: string;
    categoryLabel?: string;
  }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [ignoreDistance, setIgnoreDistance] = useState(false);

  // Obtener coordenadas del perfil del usuario actual
  const { user } = useUserData();
  const profileLocation = useMemo(() => {
    if (!user) return null;
    // Supabase puede devolver JSONB como objeto o como string según el cliente
    const raw = user.coordinates as any;
    if (!raw) return null;
    try {
      const coords = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof coords?.lat === 'number' && typeof coords?.lng === 'number') {
        return { latitude: coords.lat, longitude: coords.lng };
      }
    } catch {
      // coordenadas con formato inválido
    }
    return null;
  }, [user]);

  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8);

  const { providers, isLoading, error, refetch, locationError, userLocation } = useProviders({
    category: params.category,
    subcategory: params.subcategory,
    searchQuery: searchQuery.trim() || undefined,
    enabled: true,
    ignoreDistance,
    // Usar la ubicación del perfil del usuario como referencia de distancia
    customLocation: profileLocation,
  });

  // Título: mostrar la subcategoría si viene, si no la categoría
  const screenTitle = params.categoryLabel ?? params.subcategory ?? params.category ?? 'Proveedores';

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
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>{screenTitle}</Text>
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
            tintColor={colors.primary}
          />
        }
      >
        <View className="pt-4">
          {/* Barra de búsqueda */}
          <View className="px-5 mb-4">
            <SearchBar 
              placeholder="Buscar por nombre del proveedor..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
          </View>

          {/* Mensaje de error de ubicación */}
          {locationError && (
            <View className="px-5 mb-4">
              <View className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                <Text className="text-sm text-yellow-800">
                  {locationError}. Los proveedores se mostrarán sin filtrar por distancia.
                </Text>
              </View>
            </View>
          )}

          {/* Aviso cuando se ignora el filtro de distancia */}
          {ignoreDistance && (
            <View className="px-5 mb-4">
              <View className="p-3 rounded-xl flex-row items-center justify-between" style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}>
                <Text className="text-sm flex-1 mr-2" style={{ color: colors.textSecondary }}>
                  Mostrando todos los proveedores sin filtro de distancia
                </Text>
                <TouchableOpacity onPress={() => setIgnoreDistance(false)}>
                  <Text className="text-sm font-semibold" style={{ color: colors.primary }}>Filtrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Lista de proveedores */}
          <View className="px-5">
            {isLoading ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4" style={{ color: colors.textSecondary }}>
                  Cargando proveedores...
                </Text>
              </View>
            ) : error ? (
              <View className="py-20 items-center">
                <MaterialIcons name="error-outline" size={48} color={colors.textSecondary} />
                <Text className="mt-4 text-center" style={{ color: colors.textSecondary }}>
                  Error al cargar proveedores. Intenta nuevamente.
                </Text>
                <TouchableOpacity
                  className="mt-4 px-6 py-3 rounded-xl"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => refetch()}
                >
                  <Text className="text-white font-semibold">Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : providers.length === 0 ? (
              <View className="py-20 items-center px-4">
                <MaterialIcons name="search-off" size={48} color={colors.textSecondary} />
                <Text className="mt-4 text-center font-semibold" style={{ color: colors.text }}>
                  No se encontraron proveedores
                </Text>
                <Text className="mt-2 text-center text-sm" style={{ color: colors.textSecondary }}>
                  {searchQuery
                    ? 'Intenta con otros términos de búsqueda'
                    : 'No hay proveedores disponibles en tu área'}
                </Text>
                {!searchQuery && userLocation && !ignoreDistance && (
                  <TouchableOpacity
                    className="mt-6 px-6 py-3 rounded-xl"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => setIgnoreDistance(true)}
                  >
                    <Text className="text-white font-semibold text-sm">Ver todos los proveedores</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              providers.map((proveedor) => {
                const fullName = `${proveedor.name} ${proveedor.last_name}`;
                const initials = `${proveedor.name.charAt(0)}${proveedor.last_name.charAt(0)}`.toUpperCase();
                const servicesText = proveedor.service_categories
                  ?.map((cat) => cat.category)
                  .join(', ') || 'Proveedor de servicios';
                
                return (
                  <TouchableOpacity
                    key={proveedor.id}
                    className="mb-4 p-4 rounded-2xl border shadow-sm"
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    activeOpacity={0.7}
                    onPress={() => {
                      router.push({
                        pathname: '/(protected)/(mainTabs)/servicios/perfil-proveedor' as any,
                        params: { providerId: proveedor.id },
                      });
                    }}
                  >
                    <View className="flex-row items-start">
                      {/* Avatar */}
                      <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mr-4">
                        {proveedor.profile_pic ? (
                          <Image
                            source={{ uri: proveedor.profile_pic }}
                            className="w-16 h-16 rounded-full"
                          />
                        ) : (
                          <Text className="text-green-700 font-bold text-lg">
                            {initials}
                          </Text>
                        )}
                      </View>

                      {/* Info */}
                      <View className="flex-1">
                        <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                          {fullName}
                        </Text>
                        <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                          {servicesText}
                        </Text>

                        {proveedor.rating && (
                          <View className="flex-row items-center mb-2">
                            <MaterialIcons name="star" size={16} color="#F59E0B" />
                            <Text className="text-sm ml-1 font-semibold" style={{ color: colors.text }}>
                              {proveedor.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}

                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
                            <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                              {proveedor.location || 'Ubicación no disponible'}
                            </Text>
                          </View>
                          {proveedor.distance !== undefined && (
                            <Text className="text-xs ml-2" style={{ color: colors.textSecondary }}>
                              {proveedor.distance.toFixed(1)} km
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Botón Contactar */}
                      <TouchableOpacity
                        className="px-4 py-2 rounded-xl overflow-hidden ml-2"
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push('/crear-solicitud' as any);
                        }}
                      >
                        <LinearGradient
                          colors={['#4F46E5', '#EC4899']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 }}
                        >
                          <Text className="text-white font-semibold text-sm">Contactar</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
      </View>
    </LinearGradient>
  );
}
