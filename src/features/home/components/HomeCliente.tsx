import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header, CategoriaCard } from "@/common/components";
import { useRequests, useUserData, useUserStats } from "@/common/hooks";
import { useTheme } from "@/common/providers/ThemeProvider";
import {
  getCategoryIcon,
  getCategoryColor,
} from "@/common/utils/categoryIcons";
import { useProviderCounts } from "@/features/providers";

export function HomeCliente() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: categories = [], isLoading } = useRequests();
  const { user, isLoading: isLoadingUser } = useUserData();
  const { data: stats, isLoading: isLoadingStats } = useUserStats();
  
  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8); // Solo la altura del tab bar, sin extra

  // Mostrar solo las primeras 6 categorías como populares
  const categoriasPopulares = categories.slice(0, 6);
  
  // Obtener conteos de proveedores para las categorías populares
  const categoryNames = categoriasPopulares.map((cat) => cat.name);
  const { data: providerCounts = new Map<string, number>() } = useProviderCounts(categoryNames);

  // Obtener nombre del usuario
  const userName = user?.name || "Usuario";
  const userLastName = user?.last_name || "";
  const displayName = userLastName ? `${userName} ${userLastName}` : userName;

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
                {isLoadingUser ? (
                  "Cargando..."
                ) : (
                  `¡Hola, ${userName}!`
                )}
              </Text>
              <Text className="text-base mt-1" style={{ color: colors.textSecondary }}>
                Encontremos el servicio perfecto para ti.
              </Text>
            </View>

            {/* Mis Solicitudes Card */}
            <View className="px-5 mb-4">
              <TouchableOpacity
                className="bg-purple-50 rounded-2xl p-4 border border-purple-100"
                onPress={() =>
                  router.push("/(protected)/(mainTabs)/trabajos" as any)
                }
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mr-3">
                      <MaterialIcons
                        name="description"
                        size={24}
                        color="#9333EA"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold" style={{ color: "#111827" }}>
                        Mis Solicitudes
                      </Text>
                      <Text className="text-3xl font-bold mt-1" style={{ color: "#111827" }}>
                        {isLoadingStats ? "..." : stats?.totalRequests || 0}
                      </Text>
                      <Text className="text-sm mt-1" style={{ color: "#111827" }}>
                        {isLoadingStats
                          ? "Cargando..."
                          : `${stats?.openRequests || 0} abiertas, ${stats?.completedRequests || 0} completadas`}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#9333EA"
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Nueva Solicitud Card */}
            <View className="px-5 mb-4">
              <TouchableOpacity
                className="bg-blue-50 rounded-2xl p-4 border border-blue-100"
                onPress={() => router.push("/crear-solicitud" as any)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <MaterialIcons
                      name="add-circle"
                      size={24}
                      color="#3B82F6"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: "#111827" }}>
                      Nueva Solicitud
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: "#111827" }}>
                      Publica una nueva solicitud de servicio
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="mt-4 rounded-xl overflow-hidden"
                  onPress={() => router.push("/crear-solicitud" as any)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#4F46E5", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 12, alignItems: "center" }}
                  >
                    <Text className="text-white font-bold text-base">
                      Crear Solicitud
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Explorar Servicios Card */}
            <View className="px-5 mb-4">
              <View className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-3">
                    <MaterialIcons
                      name="location-on"
                      size={24}
                      color="#10B981"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: "#111827" }}>
                      Explorar Servicios
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: "#111827" }}>
                      Encuentra profesionales cerca de ti
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="rounded-xl overflow-hidden"
                  onPress={() =>
                    router.push("/(protected)/(mainTabs)/servicios" as any)
                  }
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#4F46E5", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 12,
                      alignItems: "center",
                      borderRadius: 12,
                    }}
                  >
                    <Text className="text-white font-bold text-base">
                      Ver Servicios
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Categorías Populares */}
            <View className="px-5 mt-4">
              <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
                Categorías populares
              </Text>

              {isLoading ? (
                <View className="py-8 items-center">
                  <Text className="text-gray-500">Cargando categorías...</Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between">
                  {categoriasPopulares.map(categoria => {
                    const iconName = getCategoryIcon(categoria.name);
                    const categoryColor = getCategoryColor(categoria.name);

                    return (
                      <TouchableOpacity
                        key={categoria.id}
                        className="w-[48%] mb-4 p-4 rounded-2xl border"
                        style={{ 
                          backgroundColor: colors.card, 
                          borderColor: colors.border 
                        }}
                        onPress={() => {
                          router.push({
                            pathname: "/(protected)/(mainTabs)/servicios",
                            params: { categoria: categoria.name },
                          } as any);
                        }}
                        activeOpacity={0.7}
                      >
                        <View className="items-center">
                          <View
                            className="w-14 h-14 rounded-full items-center justify-center mb-3"
                            style={{ backgroundColor: categoryColor + "20" }}
                          >
                            <MaterialIcons
                              name={iconName}
                              size={28}
                              color={categoryColor}
                            />
                          </View>
                          <Text className="text-sm font-semibold text-center mb-1" style={{ color: colors.text }}>
                            {categoria.name}
                          </Text>
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
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
