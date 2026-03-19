import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import { MyView } from "@/common/components";
import { useTheme } from "@/common/providers/ThemeProvider";
import { supabase } from "@/common/lib/supabase/supabaseClient";

export default function ConfiguracionScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { theme, toggleTheme, isDark, colors } = useTheme();
  const [eliminando, setEliminando] = useState(false);

  const handleEliminarCuenta = () => {
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro de que deseas eliminar tu cuenta? Se borrarán todos tus datos (solicitudes, mensajes, perfil) y esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar mi cuenta",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Última confirmación",
              "¿Confirmas que deseas borrar tu cuenta y todos tus datos de forma permanente?",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Sí, eliminar",
                  style: "destructive",
                  onPress: async () => {
                    setEliminando(true);
                    try {
                      const userId = user?.id;
                      if (!userId) throw new Error("No se encontró el usuario");

                      // 1. Borrar datos del usuario en Supabase
                      await supabase
                        .from("users")
                        .delete()
                        .eq("id", userId);

                      // 2. Eliminar la cuenta de Clerk
                      await user?.delete();

                      // 3. Cerrar sesión y redirigir
                      router.replace("/(auth)/sign-in" as any);
                    } catch (err: any) {
                      console.error("Error al eliminar cuenta:", err);
                      Alert.alert(
                        "Error",
                        err?.message || "No se pudo eliminar la cuenta. Intenta de nuevo o contacta a soporte."
                      );
                    } finally {
                      setEliminando(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleCerrarSesion = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/sign-in" as any);
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
            Alert.alert(
              "Error",
              "No se pudo cerrar sesión. Por favor, inténtalo de nuevo."
            );
          }
        },
      },
    ]);
  };

  const secciones = [
    {
      titulo: "General",
      items: [
        {
          id: "0",
          icono: "edit",
          titulo: "Editar Perfil",
          tieneFlecha: true,
          onPress: () =>
            router.push("/(protected)/(mainTabs)/perfil/editar-perfil" as any),
        },
        {
          id: "1",
          icono: "notifications",
          titulo: "Notificaciones",
          tieneFlecha: true,
        },
        {
          id: "3",
          icono: "brightness-2",
          titulo: "Modo oscuro",
          tieneSwitch: true,
          valor: isDark,
          onToggle: toggleTheme,
        },
      ],
    },
    {
      titulo: "Seguridad y Privacidad",
      items: [
        {
          id: "5",
          icono: "description",
          titulo: "Términos y condiciones",
          tieneFlecha: true,
          onPress: () =>
            Linking.openURL("https://servisv.com/terminos-y-condiciones"),
        },
        {
          id: "6",
          icono: "alternate-email",
          titulo: "Políticas de privacidad",
          tieneFlecha: true,
          onPress: () =>
            Linking.openURL("https://servisv.com/politica-de-privacidad"),
        },
      ],
    },
    {
      titulo: "Soporte",
      items: [
        {
          id: "7",
          icono: "info",
          titulo: "Acerca de ServiSV",
          tieneFlecha: true,
          onPress: () => Linking.openURL("https://servisv.com/sobre-nosotros"),
        },
        {
          id: "8",
          icono: "help",
          titulo: "Ayuda y Soporte",
          tieneFlecha: true,
          onPress: () => Linking.openURL("https://servisv.com/ayuda"),
        },
      ],
    },
  ];

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <MyView className="flex-1" style={{ backgroundColor: "transparent" }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-5 py-4 border-b"
          style={{
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            Configuración
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="pt-6 pb-6">
            {secciones.map((seccion, index) => (
              <View key={seccion.titulo} className={index > 0 ? "mt-6" : ""}>
                <Text
                  className="text-xs font-semibold uppercase px-5 mb-3"
                  style={{ color: colors.textSecondary }}
                >
                  {seccion.titulo}
                </Text>

                <View className="px-5">
                  {seccion.items.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      className="flex-row items-center py-4 border-b"
                      style={{ borderBottomColor: colors.border }}
                      activeOpacity={item.tieneSwitch ? 1 : 0.7}
                      onPress={() => {
                        if (!item.tieneSwitch) {
                          if (item.onPress) {
                            item.onPress();
                          } else {
                            console.log("Navegar a:", item.titulo);
                          }
                        }
                      }}
                    >
                      <MaterialIcons
                        name={item.icono as any}
                        size={22}
                        color={colors.textSecondary}
                      />
                      <View className="flex-1 ml-4">
                        <Text
                          className="text-base"
                          style={{ color: colors.text }}
                        >
                          {item.titulo}
                        </Text>
                        {item.subtitulo && (
                          <Text
                            className="text-sm mt-1"
                            style={{ color: colors.textSecondary }}
                          >
                            {item.subtitulo}
                          </Text>
                        )}
                      </View>

                      {item.tieneSwitch ? (
                        <Switch
                          value={item.valor}
                          onValueChange={item.onToggle}
                          trackColor={{ false: colors.border, true: "#10B981" }}
                          thumbColor="#FFFFFF"
                        />
                      ) : item.tieneFlecha ? (
                        <MaterialIcons
                          name="chevron-right"
                          size={24}
                          color={colors.textSecondary}
                        />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Botón Eliminar cuenta */}
            <View className="px-5 mt-8">
              <TouchableOpacity
                className="py-4 rounded-xl border border-red-300 items-center"
                style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" }}
                activeOpacity={0.7}
                onPress={handleEliminarCuenta}
                disabled={eliminando}
              >
                {eliminando ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <MaterialIcons name="delete-forever" size={22} color="#DC2626" />
                    <Text className="text-red-600 font-semibold text-base mt-2">
                      Eliminar cuenta
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Botón Cerrar Sesión */}
            <View className="px-5 mt-4">
              <TouchableOpacity
                className="py-4 rounded-xl border border-red-200 items-center"
                activeOpacity={0.7}
                onPress={handleCerrarSesion}
                disabled={eliminando}
              >
                <MaterialIcons name="logout" size={22} color="#EF4444" />
                <Text className="text-red-600 font-semibold text-base mt-2">
                  Cerrar Sesión
                </Text>
              </TouchableOpacity>
            </View>

            {/* Versión */}
            <View className="px-5 mt-6 items-center">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                ServiSV v1.0.2
              </Text>
            </View>
          </View>
        </ScrollView>
      </MyView>
    </LinearGradient>
  );
}
