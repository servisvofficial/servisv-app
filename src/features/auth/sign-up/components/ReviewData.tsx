import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/common/components/ui/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useRegistration } from "@/features/auth/contexts/RegistrationContext";

const ReviewData = () => {
  const router = useRouter();
  const { registrationData } = useRegistration();

  const isProvider = registrationData.userType === "provider";
  const isClient = registrationData.userType === "client";

  const handleCrearCuenta = () => {
    // Lógica para crear la cuenta
    console.log(
      `Crear cuenta de ${isProvider ? "proveedor" : "cliente"}`,
      registrationData
    );
    router.replace("/(tabs)");
  };

  const handleEdit = (section: string) => {
    console.log("Editar sección:", section);
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FCE7F3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-100 px-5 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <IconSymbol name="chevron.left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">
            Revisa tus datos
          </Text>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Datos Personales */}
          <View className="bg-white rounded-2xl p-5 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-900">
                DATOS PERSONALES
              </Text>
              <TouchableOpacity onPress={() => handleEdit("personal")}>
                <Text className="text-sm font-semibold text-blue-600">
                  ✏️ Editar
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-gray-500">Nombre</Text>
              <Text className="text-base text-gray-900 font-medium">
                {registrationData.nombre || "Juan"}
              </Text>
            </View>

            <View className="mb-3 pt-3 border-t border-gray-100">
              <Text className="text-sm text-gray-500">Apellido</Text>
              <Text className="text-base text-gray-900 font-medium">
                {registrationData.apellido || "Pérez"}
              </Text>
            </View>

            <View className="mb-3 pt-3 border-t border-gray-100">
              <Text className="text-sm text-gray-500">Correo electrónico</Text>
              <Text className="text-base text-gray-900 font-medium">
                {registrationData.email || "juan.perez@email.com"}
              </Text>
            </View>

            <View className="pt-3 border-t border-gray-100">
              <Text className="text-sm text-gray-500">Número de DUI</Text>
              <Text className="text-base text-gray-900 font-medium">
                {registrationData.dui || "12345678-9"}
              </Text>
            </View>
          </View>

          {/* Verificación de Identidad - Solo mostrar solvencia para proveedores */}
          <View className="bg-white rounded-2xl p-5 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-900">
                VERIFICACIÓN DE IDENTIDAD
              </Text>
              <TouchableOpacity onPress={() => handleEdit("identidad")}>
                <Text className="text-sm font-semibold text-blue-600">
                  ✏️ Editar
                </Text>
              </TouchableOpacity>
            </View>

            {isProvider && (
              <View className="mb-3">
                <Text className="text-sm text-gray-500">
                  Solvencia policial
                </Text>
                <View className="flex-row items-center mt-1">
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={16}
                    color="#10B981"
                  />
                  <Text className="text-base text-gray-900 font-medium ml-2">
                    Verificada
                  </Text>
                </View>
              </View>
            )}

            <View
              className={`${isProvider ? "mb-3 pt-3 border-t border-gray-100" : "mb-3"}`}
            >
              <Text className="text-sm text-gray-500">DUI - Frente</Text>
              <View className="flex-row items-center mt-1">
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={16}
                  color="#10B981"
                />
                <Text className="text-base text-gray-900 font-medium ml-2">
                  Cargado
                </Text>
              </View>
            </View>

            <View className="pt-3 border-t border-gray-100">
              <Text className="text-sm text-gray-500">DUI - Dorso</Text>
              <View className="flex-row items-center mt-1">
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={16}
                  color="#10B981"
                />
                <Text className="text-base text-gray-900 font-medium ml-2">
                  Cargado
                </Text>
              </View>
            </View>
          </View>

          {/* Dirección - Solo para clientes */}
          {isClient && (
            <View className="bg-white rounded-2xl p-5 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-gray-900">
                  DIRECCIÓN
                </Text>
                <TouchableOpacity onPress={() => handleEdit("direccion")}>
                  <Text className="text-sm font-semibold text-blue-600">
                    ✏️ Editar
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-gray-500">Tipo de vivienda</Text>
                <Text className="text-base text-gray-900 font-medium">
                  {registrationData.tipoVivienda || "Casa"}
                </Text>
              </View>

              <View className="pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-500">Dirección</Text>
                <Text className="text-base text-gray-900 font-medium">
                  {registrationData.direccion ||
                    "Colonia Escalón, San Salvador"}
                </Text>
              </View>
            </View>
          )}

          {/* Servicios - Solo para proveedores */}
          {isProvider && (
            <View className="bg-white rounded-2xl p-5 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-gray-900">
                  SERVICIOS
                </Text>
                <TouchableOpacity onPress={() => handleEdit("servicios")}>
                  <Text className="text-sm font-semibold text-blue-600">
                    ✏️ Editar
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mb-3">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Fontanería
                </Text>
                <Text className="text-sm text-gray-600">
                  • Reparación de fugas
                </Text>
                <Text className="text-sm text-gray-600">
                  • Instalación de grifos
                </Text>
              </View>

              <View className="pt-3 border-t border-gray-100">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Electricidad
                </Text>
                <Text className="text-sm text-gray-600">
                  • Instalaciones eléctricas
                </Text>
              </View>
            </View>
          )}

          {/* Zona de Servicio - Solo para proveedores */}
          {isProvider && (
            <View className="bg-white rounded-2xl p-5 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-gray-900">
                  ZONA DE SERVICIO
                </Text>
                <TouchableOpacity onPress={() => handleEdit("zona")}>
                  <Text className="text-sm font-semibold text-blue-600">
                    ✏️ Editar
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-gray-500">Ubicación base</Text>
                <Text className="text-base text-gray-900 font-medium">
                  Colonia Escalón, San Salvador
                </Text>
              </View>

              <View className="pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-500">Radio de servicio</Text>
                <Text className="text-base text-gray-900 font-medium">
                  15 km
                </Text>
              </View>
            </View>
          )}

          {/* Información Bancaria - Solo para proveedores */}
          {isProvider && (
            <View className="bg-white rounded-2xl p-5 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-gray-900">
                  INFORMACIÓN BANCARIA
                </Text>
                <TouchableOpacity onPress={() => handleEdit("bancaria")}>
                  <Text className="text-sm font-semibold text-blue-600">
                    ✏️ Editar
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-gray-500">Nombre del banco</Text>
                <Text className="text-base text-gray-900 font-medium">
                  Banco Agrícola
                </Text>
              </View>

              <View className="mb-3 pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-500">Tipo de cuenta</Text>
                <Text className="text-base text-gray-900 font-medium">
                  Cuenta de Ahorro
                </Text>
              </View>

              <View className="pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-500">Número de cuenta</Text>
                <Text className="text-base text-gray-900 font-medium">
                  •••• •••• •••• 3456
                </Text>
              </View>
            </View>
          )}

          {/* Info adicional */}
          <View className="bg-blue-50 rounded-2xl p-4 mb-6">
            <Text className="text-sm text-blue-900">
              {isProvider
                ? "✨ Al crear tu cuenta, podrás empezar a recibir solicitudes de clientes en tu zona de servicio."
                : "✨ Al crear tu cuenta, podrás empezar a buscar y contratar proveedores de servicios cerca de ti."}
            </Text>
          </View>
        </ScrollView>

        {/* Buttons */}
        <View className="px-5 pb-6 bg-white border-t border-gray-100 pt-4">
          <TouchableOpacity
            className="w-full rounded-3xl overflow-hidden mb-3"
            onPress={handleCrearCuenta}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#4F46E5", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-white text-base font-semibold">
                Crear Cuenta
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/(auth)/sign-in")}
          >
            <Text className="text-base text-gray-700">
              ¿Ya tienes una cuenta?{" "}
              <Text className="font-bold" style={{ color: "#6366F1" }}>
                Inicia sesión
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ReviewData;
