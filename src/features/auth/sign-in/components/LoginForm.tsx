import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/common/components/ui/IconSymbol";

const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // Lógica de login
    console.log("Login:", { email, password });
    router.replace("/(tabs)");
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
          {/* Icon with Gradient */}
          <View className="items-center mb-10">
            <LinearGradient
              colors={["#6366F1", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol name="house.fill" size={48} color="#FFF" />
            </LinearGradient>
          </View>

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
            <View className="flex-row items-center px-4 py-4 bg-white rounded-2xl border border-gray-200">
              <IconSymbol name="person.fill" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="tu.correo@ejemplo.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-2">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Contraseña
            </Text>
            <View className="flex-row items-center px-4 py-4 bg-white rounded-2xl border border-gray-200">
              <IconSymbol name="lock.fill" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <IconSymbol
                  name={showPassword ? "eye.slash.fill" : "eye.fill"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity className="self-end mb-6">
            <Text className="text-sm text-gray-600 font-medium">
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          {/* Login Button with Gradient */}
          <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
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
