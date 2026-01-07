import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderRegisterSteps from './HeaderRegisterSteps';
import { useRegistration } from '@/features/auth/contexts/RegistrationContext';

const PersonalData = () => {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [nombre, setNombre] = useState(registrationData.nombre);
  const [apellido, setApellido] = useState(registrationData.apellido);
  const [email, setEmail] = useState(registrationData.email);
  const [dui, setDui] = useState(registrationData.dui);
  const [password, setPassword] = useState(registrationData.password);
  const [showPassword, setShowPassword] = useState(false);

  const isProvider = registrationData.userType === 'provider';
  const isClient = registrationData.userType === 'client';

  const handleNext = () => {
    // Guardar datos en el contexto
    updateRegistrationData({
      nombre,
      apellido,
      email,
      dui,
      password,
    });

    // Navegar según el tipo de usuario
    if (isProvider) {
      router.push('/(auth)/sign-up/verify-identity');
    } else {
      // Para clientes, ir directo a zona de servicio (que será la dirección)
      router.push('/(auth)/sign-up/service-zone');
    }
  };

  const isFormValid = nombre.trim() !== '' && apellido.trim() !== '' && email.trim() !== '' && dui.trim() !== '' && password.length >= 6;

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <HeaderRegisterSteps
          currentStep={1}
          totalSteps={isProvider ? 4 : 2}
          title={isProvider ? "Regístrate como Proveedor" : "Crear una Cuenta"}
        />

      <ScrollView className="flex-1 px-5 pt-6">
        {/* Nombre y Apellido en fila */}
        <View className="flex-row mb-4 gap-3">
          <View className="flex-1">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Nombre *
            </Text>
            <TextInput
              className="px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900 border border-gray-200"
              placeholder="Tu nombre"
              value={nombre}
              onChangeText={setNombre}
            />
          </View>

          <View className="flex-1">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Apellido *
            </Text>
            <TextInput
              className="px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900 border border-gray-200"
              placeholder="Tu apellido"
              value={apellido}
              onChangeText={setApellido}
            />
          </View>
        </View>

        {/* Correo Electrónico */}
        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2 font-medium">
            Correo electrónico
          </Text>
          <TextInput
            className="px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900 border border-gray-200"
            placeholder="nombre@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Documento de Identidad */}
        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2 font-medium">
            Documento de Identidad (DUI)
          </Text>
          <TextInput
            className="px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900 border border-gray-200"
            placeholder="00000000-0"
            value={dui}
            onChangeText={setDui}
            keyboardType="numeric"
          />
        </View>

        {/* Contraseña */}
        <View className="mb-6">
          <Text className="text-sm text-gray-700 mb-2 font-medium">
            Contraseña
          </Text>
          <View className="flex-row items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
            <TextInput
              className="flex-1 text-base text-gray-900"
              placeholder="Mínimo 6 caracteres"
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
      </ScrollView>

      {/* Next Button */}
      <View className="px-5 pb-6 border-t border-gray-100 pt-4">
        <TouchableOpacity
          className="w-full rounded-3xl overflow-hidden"
          onPress={handleNext}
          disabled={!isFormValid}
          activeOpacity={0.8}
        >
          {isFormValid ? (
            <LinearGradient
              colors={['#4F46E5', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-white text-base font-semibold">
                Siguiente
              </Text>
            </LinearGradient>
          ) : (
            <View 
              style={{ 
                backgroundColor: '#D1D5DB',
                paddingVertical: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-white text-base font-semibold">
                Siguiente
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default PersonalData;

