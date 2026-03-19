import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRegistration } from "@/features/auth/contexts/RegistrationContext";
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { useMutation } from "@tanstack/react-query";
import { completeUserRegistration, completeProviderRegistration } from "@/features/auth/services/completeRegistration";
import { useSubcategories } from "@/common/hooks";

const ReviewData = () => {
  const router = useRouter();
  const { registrationData, resetRegistrationData } = useRegistration();
  const { signUp, isLoaded } = useSignUp();
  const { isSignedIn, signOut } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const isProvider = registrationData.userType === "provider";
  const isClient = registrationData.userType === "client";

  // Obtener nombres de subcategorías para mostrar en el resumen
  const selectedCategories = registrationData.selectedCategories || [];

  const { mutate: completeRegistration, isPending } = useMutation({
    mutationFn: async (userId: string) => {
      if (isProvider) {
        return completeProviderRegistration({
          userId,
          email: registrationData.email,
          name: registrationData.nombre,
          lastName: registrationData.apellido,
          dui: registrationData.dui,
          cel_phone: registrationData.telefono?.trim() || undefined,
          location: registrationData.direccion,
          coordinates: registrationData.latitude && registrationData.longitude
            ? { lat: registrationData.latitude, lng: registrationData.longitude }
            : undefined,
          serviceRadius: registrationData.radioServicio,
          bankAccountNumber: registrationData.numeroCuenta,
          bankName: registrationData.nombreBanco,
          bankAccountType: (registrationData.tipoCuenta as "ahorro" | "corriente") || "ahorro",
          duiFrontalUrl: registrationData.duiFrontal || undefined,
          duiDorsoUrl: registrationData.duiReverso || undefined,
          professionalCredentialUrl: registrationData.professionalCredential || undefined,
          policeClearanceUrl: registrationData.solvenciaPolicial || undefined,
          selectedCategories: selectedCategories.map(cat => ({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            selectedSubcategories: cat.selectedSubcategories,
          })),
        });
      } else {
        return completeUserRegistration({
          userId,
          email: registrationData.email,
          name: registrationData.nombre,
          lastName: registrationData.apellido,
          dui: registrationData.dui,
          cel_phone: registrationData.telefono?.trim() || undefined,
          location: registrationData.direccion,
          coordinates: registrationData.latitude && registrationData.longitude
            ? { lat: registrationData.latitude, lng: registrationData.longitude }
            : undefined,
          propertyType: registrationData.tipoVivienda,
          duiFrontalUrl: registrationData.duiFrontal || undefined,
          duiDorsoUrl: registrationData.duiReverso || undefined,
        });
      }
    },
    onSuccess: async () => {
      resetRegistrationData();
      
      // Asegurarse de cerrar cualquier sesión activa de forma agresiva
      for (let i = 0; i < 5; i++) {
        try {
          await signOut();
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (signOutError: any) {
          // Si el error es que no hay sesión, está bien
          if (signOutError?.message?.includes('not signed in') || 
              signOutError?.message?.includes('no session') ||
              signOutError?.message?.includes('No active session')) {
            break;
          }
          console.error(`Error cerrando sesión en onSuccess (intento ${i + 1}):`, signOutError);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Esperar un momento adicional para asegurar que todo se procesó
      await new Promise(resolve => setTimeout(resolve, 300));

      Alert.alert(
        "¡Registro exitoso!",
        isProvider
          ? "Tu cuenta de proveedor ha sido creada y está pendiente de aprobación. Revisaremos tu documentación y te notificaremos por email cuando tu cuenta sea validada."
          : "Tu cuenta ha sido creada y está pendiente de aprobación. Te notificaremos por email cuando tu cuenta sea validada.",
        [
          {
            text: "OK",
            onPress: async () => {
              // Cerrar sesión nuevamente antes de redirigir
              for (let i = 0; i < 3; i++) {
                try {
                  await signOut();
                  await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error: any) {
                  if (error?.message?.includes('not signed in') || 
                      error?.message?.includes('no session')) {
                    break;
                  }
                  console.error(`Error final cerrando sesión (intento ${i + 1}):`, error);
                }
              }
              router.replace("/(auth)/sign-in");
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      console.error("Error completando registro:", error);
      Alert.alert(
        "Error",
        error.message || "Hubo un error al completar tu registro. Por favor, intenta nuevamente."
      );
      setIsCreating(false);
    },
  });

  const handleCrearCuenta = async () => {
    if (!isLoaded) {
      Alert.alert("Error", "El sistema de autenticación no está listo. Por favor, espera un momento.");
      return;
    }

    try {
      setIsCreating(true);

      // Cerrar sesión si hay una activa ANTES de crear la cuenta
      if (isSignedIn) {
        try {
          await signOut();
          // Esperar un momento para asegurar que la sesión se cerró
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (signOutError) {
          console.error("Error cerrando sesión:", signOutError);
          // Continuar de todas formas
        }
      }

      // Crear cuenta en Clerk (sin activar sesión automáticamente)
      const result = await signUp.create({
        emailAddress: registrationData.email,
        password: registrationData.password,
        firstName: registrationData.nombre,
        lastName: registrationData.apellido,
      });

      if (result.createdUserId) {
        // NO activar la sesión - las cuentas deben ser aprobadas primero
        // Cerrar CUALQUIER sesión que Clerk haya creado automáticamente INMEDIATAMENTE
        // Hacer múltiples intentos agresivos para cerrar la sesión
        let sessionClosed = false;
        for (let i = 0; i < 10; i++) {
          try {
            // Intentar cerrar sesión sin verificar isSignedIn primero
            await signOut();
            // Esperar un momento para asegurar que la sesión se cerró
            await new Promise(resolve => setTimeout(resolve, 200));
            sessionClosed = true;
          } catch (signOutError: any) {
            // Si el error es que no hay sesión, está bien - salir del loop
            if (signOutError?.message?.includes('not signed in') || 
                signOutError?.message?.includes('no session') ||
                signOutError?.message?.includes('No active session')) {
              sessionClosed = true;
              break;
            }
            console.error(`Error cerrando sesión (intento ${i + 1}):`, signOutError);
            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Esperar un poco más para asegurar que el estado se actualice
        await new Promise(resolve => setTimeout(resolve, 500));

        // Completar registro en Supabase
        completeRegistration(result.createdUserId);
      } else {
        throw new Error("No se pudo crear el usuario en Clerk");
      }
    } catch (error: any) {
      console.error("Error creando cuenta:", error);
      Alert.alert(
        "Error",
        error.errors?.[0]?.message || "Hubo un error al crear tu cuenta. Por favor, intenta nuevamente."
      );
      setIsCreating(false);
    }
  };

  const handleEdit = (section: string) => {
    // Navegar a la sección correspondiente para editar
    if (section === "personal") {
      router.push("/(auth)/sign-up/personal-data");
    } else if (section === "identidad") {
      router.push("/(auth)/sign-up/verify-identity");
    } else if (section === "servicios") {
      router.push("/(auth)/sign-up/select-services");
    } else if (section === "zona") {
      router.push("/(auth)/sign-up/service-zone");
    } else if (section === "direccion") {
      router.push("/(auth)/sign-up/service-zone");
    } else if (section === "bancaria") {
      router.push("/(auth)/sign-up/service-zone");
    }
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
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">
            Revisa tus datos
          </Text>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Datos Personales */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
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
                {registrationData.nombre || "No especificado"}
              </Text>
            </View>

            <View className="mb-3 pt-3 border-t border-gray-100">
              <Text className="text-sm text-gray-500">Apellido</Text>
              <Text className="text-base text-gray-900 font-medium">
                {registrationData.apellido || "No especificado"}
              </Text>
            </View>

            <View className="mb-3 pt-3 border-t border-gray-100">
              <Text className="text-sm text-gray-500">Correo electrónico</Text>
              <Text className="text-base text-gray-900 font-medium">
                {registrationData.email || "No especificado"}
              </Text>
            </View>

            <View className="pt-3 border-t border-gray-100">
              <Text className="text-sm text-gray-500">Número de DUI</Text>
              <Text className="text-base text-gray-900 font-medium">
                {registrationData.dui || "No especificado"}
              </Text>
            </View>
          </View>

          {/* Verificación de Identidad */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
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
                <Text className="text-sm text-gray-500">Solvencia policial</Text>
                <View className="flex-row items-center mt-1">
                  <MaterialIcons
                    name={registrationData.solvenciaPolicial ? "check-circle" : "error"}
                    size={16}
                    color={registrationData.solvenciaPolicial ? "#10B981" : "#EF4444"}
                  />
                  <Text className="text-base text-gray-900 font-medium ml-2">
                    {registrationData.solvenciaPolicial ? "Cargada" : "Pendiente"}
                  </Text>
                </View>
              </View>
            )}

            {isProvider && registrationData.professionalCredential && (
              <View className={`mb-3 ${isProvider ? "pt-3 border-t border-gray-100" : ""}`}>
                <Text className="text-sm text-gray-500">Carnet profesional</Text>
                <View className="flex-row items-center mt-1">
                  <MaterialIcons name="check-circle" size={16} color="#10B981" />
                  <Text className="text-base text-gray-900 font-medium ml-2">
                    Cargado
                  </Text>
                </View>
              </View>
            )}

            <View className={`${isProvider ? "mb-3 pt-3 border-t border-gray-100" : "mb-3"}`}>
              <Text className="text-sm text-gray-500">DUI - Frente</Text>
              <View className="flex-row items-center mt-1">
                <MaterialIcons
                  name={registrationData.duiFrontal ? "check-circle" : "error"}
                  size={16}
                  color={registrationData.duiFrontal ? "#10B981" : "#EF4444"}
                />
                <Text className="text-base text-gray-900 font-medium ml-2">
                  {registrationData.duiFrontal ? "Cargado" : "Pendiente"}
                </Text>
              </View>
            </View>

            <View className="pt-3 border-t border-gray-100">
              <Text className="text-sm text-gray-500">DUI - Dorso</Text>
              <View className="flex-row items-center mt-1">
                <MaterialIcons
                  name={registrationData.duiReverso ? "check-circle" : "error"}
                  size={16}
                  color={registrationData.duiReverso ? "#10B981" : "#EF4444"}
                />
                <Text className="text-base text-gray-900 font-medium ml-2">
                  {registrationData.duiReverso ? "Cargado" : "Pendiente"}
                </Text>
              </View>
            </View>
          </View>

          {/* Dirección - Solo para clientes */}
          {isClient && (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
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
                  {registrationData.tipoVivienda || "No especificado"}
                </Text>
              </View>

              <View className="pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-500">Dirección</Text>
                <Text className="text-base text-gray-900 font-medium">
                  {registrationData.direccion || "No especificada"}
                </Text>
              </View>
            </View>
          )}

          {/* Servicios - Solo para proveedores */}
          {isProvider && selectedCategories.length > 0 && (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
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

              {selectedCategories.map((cat, index) => (
                <View key={cat.categoryId} className={index > 0 ? "pt-3 border-t border-gray-100" : ""}>
                  <Text className="text-base font-semibold text-gray-900 mb-2">
                    {cat.categoryName}
                  </Text>
                  {cat.selectedSubcategories.length > 0 ? (
                    <Text className="text-sm text-gray-600">
                      {cat.selectedSubcategories.length} subcategoría{cat.selectedSubcategories.length !== 1 ? 's' : ''} seleccionada{cat.selectedSubcategories.length !== 1 ? 's' : ''}
                    </Text>
                  ) : (
                    <Text className="text-sm text-gray-600">• General</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Zona de Servicio - Solo para proveedores */}
          {isProvider && (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
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
                  {registrationData.direccion || "No especificada"}
                </Text>
              </View>

              <View className="pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-500">Radio de servicio</Text>
                <Text className="text-base text-gray-900 font-medium">
                  {registrationData.radioServicio ? `${registrationData.radioServicio} km` : "No especificado"}
                </Text>
              </View>
            </View>
          )}

          {/* Información Bancaria - Solo para proveedores */}
          {isProvider && (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
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
                  {registrationData.nombreBanco || "No especificado"}
                </Text>
              </View>

              <View className="mb-3 pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-500">Tipo de cuenta</Text>
                <Text className="text-base text-gray-900 font-medium">
                  {registrationData.tipoCuenta === "ahorro" ? "Cuenta de Ahorro" : registrationData.tipoCuenta === "corriente" ? "Cuenta Corriente" : "No especificado"}
                </Text>
              </View>

              <View className="pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-500">Número de cuenta</Text>
                <Text className="text-base text-gray-900 font-medium">
                  {registrationData.numeroCuenta ? `•••• •••• •••• ${registrationData.numeroCuenta.slice(-4)}` : "No especificado"}
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
            disabled={isCreating || isPending || !isLoaded}
            activeOpacity={0.8}
          >
            {isCreating || isPending ? (
              <View
                style={{
                  backgroundColor: '#D1D5DB',
                  paddingVertical: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
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
            )}
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
