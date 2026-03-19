import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isClerkAPIResponseError, useSignIn, useAuth } from "@clerk/clerk-expo";
import {
  loginSchema,
  LoginFields,
} from "@/features/auth/validators/login.validator";
import { clerkErrorValidator } from "@/features/auth/utils/clerkErrorValidator";
import CustomInput from "@/common/components/CustomInput";
import { favicon as faviconImage } from "@/common/assets/images";
import { supabase } from "@/common/lib/supabase/supabaseClient";

const LoginForm = () => {
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Si el usuario ya está logueado, redirigir a la home
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/(protected)/(mainTabs)/home");
    }
  }, [isLoaded, isSignedIn, router]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSignIn = async (data: LoginFields) => {
    if (!isLoaded) {
      Alert.alert(
        "Error",
        "El sistema de autenticación no está listo. Por favor, espera un momento."
      );
      return;
    }

    try {
      setLoading(true);

      // Verificar primero si el usuario está validado y no está baneado
      // Buscar el usuario en Supabase por email antes de autenticar con Clerk
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, is_provider, is_validated, is_banned")
        .eq("email", data.email)
        .single();

      // Si el usuario existe en Supabase, verificar validación y estado de baneo
      if (!userError && userData) {
        // Si está baneado, no permitir login
        if (userData.is_banned) {
          Alert.alert(
            "Acceso denegado",
            "Tu cuenta ha sido suspendida. Por favor, contacta al soporte si crees que esto es un error."
          );
          setLoading(false);
          return;
        }

        // Si no está validado, no permitir login (tanto proveedores como clientes)
        if (!userData.is_validated) {
          const userType = userData.is_provider ? "proveedor" : "cliente";
          Alert.alert(
            "Acceso no autorizado",
            `Tu cuenta de ${userType} está pendiente de aprobación. Por favor, espera a que un administrador valide tu registro. Te notificaremos cuando tu cuenta sea aprobada.`
          );
          setLoading(false);
          return;
        }
      }
      // Si hay error al buscar el usuario (no existe en Supabase), continuar con el login normal
      // Esto puede pasar si el usuario se registró directamente en Clerk sin pasar por nuestro flujo

      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        // Navegar a la pantalla principal
        router.replace("/(protected)/(mainTabs)/home");
      } else {
        setError("root", {
          message: "Algo salió mal, intentalo de nuevo más tarde",
        });
      }
    } catch (error: any) {
      // Si el error es "You're already signed in", redirigir a la home
      if (
        error?.errors?.[0]?.message?.includes("already signed in") ||
        error?.message?.includes("already signed in")
      ) {
        router.replace("/(protected)/(mainTabs)/home");
        return;
      }

      if (isClerkAPIResponseError(error)) {
        error.errors.forEach(err => {
          const { errorField, displayMessage } = clerkErrorValidator(err);
          setError(errorField as "email" | "password" | "root", {
            message: displayMessage,
          });
        });
      } else {
        setError("root", {
          message: "Algo salió mal, intentalo de nuevo más tarde",
        });
      }
    } finally {
      setLoading(false);
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
        <View className="flex-1 px-6 justify-center">
          {/* Logo */}

          <Image
            source={faviconImage}
            style={{ width: 250, height: 250, alignSelf: "center" }}
            resizeMode="stretch"
          />

          {/* Title */}
          <Text className="text-3xl font-bold text-center text-gray-900 mb-2">
            Bienvenido de nuevo
          </Text>
          <Text className="text-base text-gray-600 text-center mb-8">
            Inicia sesión para continuar en ServiSV.
          </Text>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Correo Electrónico o DUI
            </Text>
            <CustomInput
              control={control}
              name="email"
              placeholder="tu.correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              inputClassName="h-12"
            />
          </View>

          {/* Password Input */}
          <View className="mb-2">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Contraseña
            </Text>
            <CustomInput
              control={control}
              name="password"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              inputClassName="h-12"
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              }
            />
          </View>

          {/* Error Messages */}
          {errors.root && (
            <View className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
              <Text className="text-red-600 text-sm">
                {errors.root.message}
              </Text>
            </View>
          )}

          {/* Forgot Password */}
          <TouchableOpacity
            className="self-end mb-6"
            onPress={() => router.push("/(auth)/forgot-password" as any)}
          >
            <Text className="text-sm text-gray-600 font-medium">
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          {/* Login Button with Gradient */}
          <TouchableOpacity
            onPress={handleSubmit(onSignIn)}
            disabled={loading || !isLoaded}
            activeOpacity={0.8}
          >
            {loading ? (
              <View
                style={{
                  backgroundColor: "#D1D5DB",
                  paddingVertical: 16,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <LinearGradient
                colors={["#6366F1", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Text className="text-white text-base font-semibold">
                  Iniciar Sesión
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/(auth)/sign-up")}
          >
            <Text className="text-base text-gray-700">
              ¿Aún no tienes cuenta?{" "}
              <Text className="font-bold" style={{ color: "#6366F1" }}>
                Regístrate
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LoginForm;
