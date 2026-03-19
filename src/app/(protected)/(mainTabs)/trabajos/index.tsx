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
import { useUserRole } from "@/common/hooks/useUserRole";
import { useTheme } from "@/common/providers/ThemeProvider";
import { useUserRequests } from "@/features/solicitudes";
import { RequestStatusBadge } from "@/features/solicitudes/components/RequestStatusBadge";
import { MyView } from "@/common/components";
import { getCategoryIcon } from "@/common/utils/categoryIcons";

// Vista para Cliente
function TrabajosCliente() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [filtro, setFiltro] = useState<
    "abiertas" | "en_progreso" | "completadas" | "canceladas"
  >("abiertas");

  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8); // Solo la altura del tab bar, sin extra

  // Obtener solicitudes del cliente usando el hook
  const statusMap = {
    abiertas: "sent",
    en_progreso: "sent",
    completadas: "completed",
    canceladas: "completed",
  } as const;

  const { data: solicitudesData = [], isLoading, refetch } = useUserRequests({
    userRole: "client",
    status: statusMap[filtro],
  });

  // Filtrar solicitudes según el filtro seleccionado
  const solicitudesFiltradas = solicitudesData.filter(s => {
    if (filtro === "abiertas") return s.status === "open" || s.status === "quoted";
    if (filtro === "en_progreso") return s.status === "accepted" || s.status === "in_progress";
    if (filtro === "completadas") return s.status === "completed";
    if (filtro === "canceladas") return s.status === "cancelled";
    return false;
  });

  const tabs = [
    { key: "abiertas", label: "Abiertas" },
    { key: "en_progreso", label: "En progreso" },
    { key: "completadas", label: "Completadas" },
    { key: "canceladas", label: "Canceladas" },
  ];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Fecha no disponible";
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
            paddingTop: insets.top + 16,
          }}
        >
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Mis Solicitudes
          </Text>
          <TouchableOpacity>
            <MaterialIcons
              name="search"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View
          className="flex-row px-5 pt-4 border-b"
          style={{
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
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
                className="text-sm font-semibold"
                style={{
                  color:
                    filtro === tab.key ? colors.primary : colors.textSecondary,
                }}
              >
                {tab.label}
              </Text>
              {filtro === tab.key && (
                <View
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: colors.primary }}
                />
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
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    className="text-sm mt-4"
                    style={{ color: colors.textSecondary }}
                  >
                    Cargando solicitudes...
                  </Text>
                </View>
              ) : solicitudesFiltradas.length === 0 ? (
                <View className="items-center justify-center py-20">
                  <MaterialIcons
                    name="inbox"
                    size={64}
                    color={colors.textSecondary}
                  />
                  <Text
                    className="text-lg font-semibold mt-4"
                    style={{ color: colors.textSecondary }}
                  >
                    Sin solicitudes {filtro}
                  </Text>
                  <Text
                    className="text-sm mt-2 text-center px-8"
                    style={{ color: colors.textSecondary }}
                  >
                    Cuando crees una nueva solicitud, la verás aquí.
                  </Text>
                </View>
              ) : (
                <View>
                  {solicitudesFiltradas.map(solicitud => (
                    <TouchableOpacity
                      key={solicitud.id}
                      className="mb-4 p-4 rounded-2xl border shadow-sm"
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      }}
                      activeOpacity={0.7}
                      onPress={() => {
                        router.push({
                          pathname: "/(protected)/(mainTabs)/trabajos/detalle-solicitud",
                          params: { 
                            requestId: solicitud.id,
                            isAvailable: 'false', // Vista de cliente viendo sus solicitudes
                          },
                        } as any);
                      }}
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1 mr-3">
                          <View className="flex-row items-center mb-1">
                            <MaterialIcons
                              name={getCategoryIcon(solicitud.serviceCategory)}
                              size={16}
                              color={colors.textSecondary}
                            />
                            <Text
                              className="text-xs ml-1"
                              style={{ color: colors.textSecondary }}
                            >
                              {solicitud.serviceCategory}
                            </Text>
                          </View>
                          <Text
                            className="text-base font-bold mt-1"
                            style={{ color: colors.text }}
                          >
                            {solicitud.title}
                          </Text>
                        </View>
                        <RequestStatusBadge status={solicitud.status} />
                      </View>

                      <View className="flex-row items-center mt-2">
                        <MaterialIcons
                          name="location-on"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          className="text-xs ml-1"
                          style={{ color: colors.textSecondary }}
                          numberOfLines={1}
                        >
                          {typeof solicitud.location === 'string' 
                            ? solicitud.location 
                            : solicitud.location.address}
                        </Text>
                      </View>

                      <View className="flex-row items-center mt-2">
                        <MaterialIcons
                          name="calendar-today"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          className="text-xs ml-1"
                          style={{ color: colors.textSecondary }}
                        >
                          Creada el {formatDate(solicitud.createdAt)}
                        </Text>
                      </View>

                      {solicitud.budgetRange && (
                        <View className="flex-row items-center mt-2">
                          <MaterialIcons
                            name="attach-money"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text
                            className="text-xs ml-1"
                            style={{ color: colors.textSecondary }}
                          >
                            ${solicitud.budgetRange.min} - ${solicitud.budgetRange.max}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
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

// Vista para Proveedor - Mis Solicitudes (las que el proveedor creó como cliente)
function TrabajosProveedor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [filtro, setFiltro] = useState<
    "abiertas" | "en_progreso" | "completadas" | "canceladas"
  >("abiertas");

  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8); // Solo la altura del tab bar, sin extra

  // IMPORTANTE: Aunque el usuario es proveedor, aquí mostramos las solicitudes que ÉL creó como cliente
  // Para ver solicitudes donde puede cotizar, debe ir a "Solicitudes Disponibles"
  const statusMap = {
    abiertas: "sent",
    en_progreso: "sent",
    completadas: "completed",
    canceladas: "completed",
  } as const;

  const { data: solicitudesData = [], isLoading, refetch } = useUserRequests({
    userRole: "client", // Mostramos sus solicitudes como cliente
    status: statusMap[filtro],
  });

  // Filtrar solicitudes según el filtro seleccionado
  const solicitudesFiltradas = solicitudesData.filter(s => {
    if (filtro === "abiertas") return s.status === "open" || s.status === "quoted";
    if (filtro === "en_progreso") return s.status === "accepted" || s.status === "in_progress";
    if (filtro === "completadas") return s.status === "completed";
    if (filtro === "canceladas") return s.status === "cancelled";
    return false;
  });

  const tabs = [
    { key: "abiertas", label: "Abiertas" },
    { key: "en_progreso", label: "En progreso" },
    { key: "completadas", label: "Completadas" },
    { key: "canceladas", label: "Canceladas" },
  ];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Fecha no disponible";
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
            paddingTop: insets.top + 16,
          }}
        >
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Mis Solicitudes
          </Text>
          <TouchableOpacity>
            <MaterialIcons
              name="search"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View
          className="flex-row px-5 pt-4 border-b"
          style={{
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
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
                className="text-sm font-semibold"
                style={{
                  color:
                    filtro === tab.key ? colors.primary : colors.textSecondary,
                }}
              >
                {tab.label}
              </Text>
              {filtro === tab.key && (
                <View
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: colors.primary }}
                />
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
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    className="text-sm mt-4"
                    style={{ color: colors.textSecondary }}
                  >
                    Cargando solicitudes...
                  </Text>
                </View>
              ) : solicitudesFiltradas.length === 0 ? (
                <View className="items-center justify-center py-20">
                  <MaterialIcons
                    name="inbox"
                    size={64}
                    color={colors.textSecondary}
                  />
                  <Text
                    className="text-lg font-semibold mt-4"
                    style={{ color: colors.textSecondary }}
                  >
                    Sin solicitudes {filtro}
                  </Text>
                  <Text
                    className="text-sm mt-2 text-center px-8"
                    style={{ color: colors.textSecondary }}
                  >
                    {filtro === "abiertas" 
                      ? "Cuando crees una nueva solicitud, la verás aquí."
                      : "No tienes solicitudes en esta categoría."}
                  </Text>
                </View>
              ) : (
                <View>
                  {solicitudesFiltradas.map(solicitud => (
                    <TouchableOpacity
                      key={solicitud.id}
                      className="mb-4 p-4 rounded-2xl border shadow-sm"
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      }}
                      activeOpacity={0.7}
                      onPress={() => {
                        router.push({
                          pathname: "/(protected)/(mainTabs)/trabajos/detalle-solicitud",
                          params: { 
                            requestId: solicitud.id,
                            isAvailable: 'false', // Proveedor viendo sus propias solicitudes
                          },
                        } as any);
                      }}
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1 mr-3">
                          <View className="flex-row items-center mb-1">
                            <MaterialIcons
                              name={getCategoryIcon(solicitud.serviceCategory)}
                              size={16}
                              color={colors.textSecondary}
                            />
                            <Text
                              className="text-xs ml-1"
                              style={{ color: colors.textSecondary }}
                            >
                              {solicitud.serviceCategory}
                            </Text>
                          </View>
                          <Text
                            className="text-base font-bold mt-1"
                            style={{ color: colors.text }}
                          >
                            {solicitud.title}
                          </Text>
                        </View>
                        <RequestStatusBadge status={solicitud.status} />
                      </View>

                      <View className="flex-row items-center mt-2">
                        <MaterialIcons
                          name="location-on"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          className="text-xs ml-1"
                          style={{ color: colors.textSecondary }}
                          numberOfLines={1}
                        >
                          {typeof solicitud.location === 'string' 
                            ? solicitud.location 
                            : solicitud.location.address}
                        </Text>
                      </View>

                      <View className="flex-row items-center mt-2">
                        <MaterialIcons
                          name="calendar-today"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          className="text-xs ml-1"
                          style={{ color: colors.textSecondary }}
                        >
                          Creada el {formatDate(solicitud.createdAt)}
                        </Text>
                      </View>

                      {solicitud.budgetRange && (
                        <View className="flex-row items-center mt-2">
                          <MaterialIcons
                            name="attach-money"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text
                            className="text-xs ml-1"
                            style={{ color: colors.textSecondary }}
                          >
                            ${solicitud.budgetRange.min} - ${solicitud.budgetRange.max}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
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

export default function TrabajosScreen() {
  const { data: userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <MyView className="bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </MyView>
    );
  }

  if (userRole === "provider") {
    return <TrabajosProveedor />;
  }

  return <TrabajosCliente />;
}
