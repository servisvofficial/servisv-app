import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, SearchBar, CategoriaCard } from '@/common/components';
import { useRequests, useUserData, useUserStats } from '@/common/hooks';
import { useTheme } from '@/common/providers/ThemeProvider';
import { getCategoryIcon, getCategoryColor } from '@/common/utils/categoryIcons';
import { useAvailableRequests, useProviderQuotes } from '@/features/solicitudes';
import { useProviderCounts } from '@/features/providers';

export function HomeProveedor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: categories = [], isLoading } = useRequests();
  const { user, isLoading: isLoadingUser } = useUserData();
  const { data: stats, isLoading: isLoadingStats } = useUserStats();
  const { data: availableRequests = [], isLoading: isLoadingAvailableRequests } = useAvailableRequests();
  const { totalQuotes, pendingQuotes, isLoading: isLoadingQuotes } = useProviderQuotes();
  const { colors } = useTheme();
  
  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8); // Solo la altura del tab bar, sin extra

  // Mostrar solo las primeras 4 categorías como populares
  const categoriasPopulares = categories.slice(0, 4);
  
  // Obtener conteos de proveedores para las categorías populares
  const categoryNames = categoriasPopulares.map((cat) => cat.name);
  const { data: providerCounts = new Map<string, number>() } = useProviderCounts(categoryNames);

  // Obtener nombre del usuario
  const userName = user?.name || "Usuario";

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ backgroundColor: "transparent" }}>
        <Header />
        
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
        >
        <View className="pt-2">
          {/* Saludo */}
          <View className="px-5 py-4">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              {isLoadingUser ? "Cargando..." : `¡Hola, ${userName}!`}
            </Text>
            <Text className="text-base mt-1" style={{ color: colors.textSecondary }}>
              Bienvenido de nuevo.
            </Text>
          </View>

          {/* Aviso: subir solvencia tras primer servicio */}
          {user && !user.police_clearance_pic && (stats?.completedServicesAsProvider ?? 0) >= 1 && (
            <View className="px-5 mb-4">
              <TouchableOpacity
                className="bg-amber-50 rounded-2xl p-4 border border-amber-200"
                onPress={() => router.push("/(protected)/(mainTabs)/perfil/editar-perfil" as any)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mr-3">
                    <MaterialIcons name="warning-amber" size={24} color="#D97706" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-amber-900">
                      Sube tu solvencia policial
                    </Text>
                    <Text className="text-sm text-amber-800 mt-0.5">
                      Has completado tu primer servicio. Para continuar, sube tu solvencia policial vigente.
                    </Text>
                    <Text className="text-amber-600 font-medium text-sm mt-2">
                      Subir ahora →
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Solicitudes Disponibles Card */}
          <View className="px-5 mb-4">
            <TouchableOpacity
              className="bg-purple-50 rounded-2xl p-4 border border-purple-100"
              onPress={() => router.push('/(protected)/solicitudes-disponibles' as any)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mr-3">
                    <MaterialIcons name="folder-open" size={24} color="#9333EA" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: "#111827" }}>
                      Solicitudes Disponibles
                    </Text>
                    <Text className="text-3xl font-bold mt-1" style={{ color: "#111827" }}>
                      {isLoadingAvailableRequests ? "..." : availableRequests.length}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(protected)/solicitudes-disponibles' as any)}
                  activeOpacity={0.7}
                >
                  <Text className="text-purple-600 font-semibold text-sm">
                    Ver Solicitudes →
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>

          {/* Mis Presupuestos Card */}
          <View className="px-5 mb-4">
            <TouchableOpacity
              className="bg-blue-50 rounded-2xl p-4 border border-blue-100"
              onPress={() => router.push('/(protected)/presupuestos' as any)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <MaterialIcons name="description" size={24} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: "#111827" }}>
                      Mis Presupuestos
                    </Text>
                    <Text className="text-3xl font-bold mt-1" style={{ color: "#111827" }}>
                      {isLoadingQuotes ? "..." : totalQuotes}
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: "#111827" }}>
                      {isLoadingQuotes
                        ? "Cargando..."
                        : `${pendingQuotes} pendientes`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(protected)/presupuestos' as any)}
                  activeOpacity={0.7}
                >
                  <Text className="text-blue-600 font-semibold text-sm">
                    Ver Presupuestos →
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>

          {/* Crear Solicitud Card */}
          <View className="px-5 mb-4">
            <TouchableOpacity
              className="bg-green-50 rounded-2xl p-4 border border-green-100"
              onPress={() => router.push('/crear-solicitud' as any)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-3">
                  <MaterialIcons name="add-circle" size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold" style={{ color: "#111827" }}>
                    Crear Solicitud
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: "#111827" }}>
                    También puedes crear solicitudes como cliente
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="rounded-xl overflow-hidden"
                onPress={() => router.push('/crear-solicitud' as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4F46E5', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text className="text-white font-bold text-base">
                    Nueva Solicitud
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Categorías Populares */}
          <View className="px-5 mt-4">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Categorías Populares
            </Text>
            
            {isLoading ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500">Cargando categorías...</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {categoriasPopulares.map((categoria) => {
                  const iconName = getCategoryIcon(categoria.name);
                  const categoryColor = getCategoryColor(categoria.name);
                  
                  return (
                    <TouchableOpacity
                      key={categoria.id}
                      className="w-[48%] mb-4 p-4 bg-white rounded-2xl border border-gray-200"
                      onPress={() => {
                        router.push({
                          pathname: '/(protected)/(mainTabs)/servicios',
                          params: { categoria: categoria.name }
                        } as any);
                      }}
                      activeOpacity={0.7}
                    >
                      <View className="items-center">
                        <View
                          className="w-14 h-14 rounded-full items-center justify-center mb-3"
                          style={{ backgroundColor: categoryColor + '20' }}
                        >
                          <MaterialIcons
                            name={iconName}
                            size={28}
                            color={categoryColor}
                          />
                        </View>
                        <Text className="text-sm font-semibold text-gray-900 text-center mb-1">
                          {categoria.name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {(() => {
                            const count = providerCounts.get(categoria.name) || 0;
                            return count > 0 ? `${count}+ proveedores` : 'Sin proveedores';
                          })()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}
