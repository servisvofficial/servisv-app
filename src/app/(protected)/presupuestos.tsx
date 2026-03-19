import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/common/providers/ThemeProvider";
import { useProviderQuotes } from "@/features/solicitudes";

export default function PresupuestosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [filtro, setFiltro] = useState<
    "pendientes" | "aceptados" | "rechazados"
  >("pendientes");
  const { data: quotes = [], isLoading, refetch } = useProviderQuotes();
  
  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8);

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

  const tabs = [
    { key: "pendientes", label: "Pendientes", status: "pending" as const },
    { key: "aceptados", label: "Aceptados", status: "accepted" as const },
    { key: "rechazados", label: "Rechazados", status: "rejected" as const },
  ];

  // Filtrar presupuestos según el estado seleccionado
  const presupuestosFiltrados = quotes.filter(quote => {
    const statusMap: Record<string, string> = {
      "pendientes": "pending",
      "aceptados": "accepted",
      "rechazados": "rejected",
    };
    return quote.status === statusMap[filtro];
  });

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
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Mis Presupuestos
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tabs */}
        <View 
          className="flex-row px-5 pt-4 border-b"
          style={{ 
            backgroundColor: colors.card,
            borderBottomColor: colors.border 
          }}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 mx-3 pb-3 items-center"
              onPress={() => setFiltro(tab.key as any)}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm font-semibold ${
                  filtro === tab.key ? "text-purple-600" : "text-gray-500"
                }`}
              >
                {tab.label}
              </Text>
              {filtro === tab.key && (
                <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </TouchableOpacity>
          ))}
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
            <View className="px-5">
              {isLoading ? (
                <View className="items-center justify-center py-20">
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
                    Cargando presupuestos...
                  </Text>
                </View>
              ) : presupuestosFiltrados.length === 0 ? (
                <View className="items-center justify-center py-20">
                  <MaterialIcons name="description" size={64} color={colors.textSecondary} />
                  <Text className="text-lg mt-4" style={{ color: colors.textSecondary }}>
                    No hay presupuestos {filtro}
                  </Text>
                </View>
              ) : (
                <View>
                  {presupuestosFiltrados.map(presupuesto => (
                    <View
                      key={presupuesto.id}
                      className="mb-4 p-4 rounded-2xl border"
                      style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    >
                      <Text className="text-base font-bold mb-2" style={{ color: colors.text }}>
                        {presupuesto.requestTitle || "Solicitud"}
                      </Text>
                      {presupuesto.clientName && (
                        <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                          Cliente: {presupuesto.clientName}
                        </Text>
                      )}
                      <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                        Tu Oferta: ${presupuesto.price.toFixed(2)} |{" "}
                        {filtro === "aceptados"
                          ? "Aceptado"
                          : filtro === "rechazados"
                            ? "Rechazado"
                            : "Enviado"}
                        : {formatDate(presupuesto.createdAt)}
                      </Text>
                      {presupuesto.description && (
                        <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                          {presupuesto.description.length > 100 
                            ? presupuesto.description.substring(0, 100) + "..."
                            : presupuesto.description}
                        </Text>
                      )}
                      <View className="flex-row items-center justify-between mt-2">
                        <TouchableOpacity
                          onPress={() => router.push({
                            pathname: "/(protected)/(mainTabs)/trabajos/detalle-solicitud" as any,
                            params: { requestId: presupuesto.requestId, isAvailable: "false" }
                          })}
                          className="flex-row items-center px-4 py-2 rounded-full"
                          style={{ backgroundColor: "#6366F1" }}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="visibility" size={16} color="#FFF" />
                          <Text className="text-xs font-semibold text-white ml-2">
                            Ver Detalles
                          </Text>
                        </TouchableOpacity>
                        <View
                          className={`px-4 py-2 rounded-full`}
                          style={{
                            backgroundColor:
                              filtro === "pendientes"
                                ? "#3B82F6"
                                : filtro === "aceptados"
                                  ? "#EC4899"
                                  : "#EF4444",
                          }}
                        >
                          <Text className="text-xs font-semibold text-white">
                            {filtro === "pendientes"
                              ? "Pendiente"
                              : filtro === "aceptados"
                                ? "Aceptado"
                                : "Rechazado"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}
