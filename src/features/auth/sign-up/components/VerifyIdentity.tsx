import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderRegisterSteps from './HeaderRegisterSteps';
import { useRegistration } from '@/features/auth/contexts/RegistrationContext';

const VerifyIdentity = () => {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [solvenciaPolicial, setSolvenciaPolicial] = useState<string | null>(
    registrationData.solvenciaPolicial || null
  );
  const [duiFrontal, setDuiFrontal] = useState<string | null>(
    registrationData.duiFrontal || null
  );
  const [duiReverso, setDuiReverso] = useState<string | null>(
    registrationData.duiReverso || null
  );

  const isProvider = registrationData.userType === 'provider';

  const handleNext = () => {
    // Guardar datos en el contexto
    updateRegistrationData({
      solvenciaPolicial,
      duiFrontal,
      duiReverso,
    });

    // Solo los proveedores pasan por selección de servicios
    router.push('/(auth)/sign-up/select-services');
  };

  const handleUploadSolvencia = () => {
    // Lógica para subir solvencia policial
    console.log('Subir solvencia policial');
    setSolvenciaPolicial('solvencia.pdf');
  };

  const handleUploadFrontal = () => {
    // Lógica para subir foto frontal del DUI
    console.log('Subir foto frontal');
    setDuiFrontal('frontal.jpg');
  };

  const handleUploadReverso = () => {
    // Lógica para subir foto reverso del DUI
    console.log('Subir foto reverso');
    setDuiReverso('reverso.jpg');
  };

  // Para proveedores: necesitan solvencia, DUI frontal y reverso
  // Para clientes: solo DUI frontal y reverso
  const isFormValid = isProvider 
    ? (solvenciaPolicial !== null && duiFrontal !== null && duiReverso !== null)
    : (duiFrontal !== null && duiReverso !== null);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <HeaderRegisterSteps 
        currentStep={2}
        totalSteps={4}
        title="Regístrate como Proveedor"
      />

      <ScrollView className="flex-1 px-5 pt-6">
        {/* Solvencia Policial - Solo para proveedores */}
        {isProvider && (
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <Text className="text-sm text-gray-700 font-medium">
              Solvencia Policial *
            </Text>
            <View className="ml-2 px-2 py-1 bg-red-50 rounded">
              <Text className="text-xs text-red-600 font-medium">Requerido</Text>
            </View>
          </View>
          <Text className="text-xs text-gray-600 mb-3">
            Todos los proveedores deben subir su solvencia policial vigente para garantizar la seguridad de nuestros usuarios.
          </Text>
          <TouchableOpacity
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 items-center justify-center bg-gray-50"
            onPress={handleUploadSolvencia}
            activeOpacity={0.7}
          >
            {solvenciaPolicial ? (
              <View className="items-center">
                <IconSymbol name="checkmark.circle.fill" size={40} color="#10B981" />
                <Text className="text-sm text-green-600 mt-2 font-medium">Archivo cargado</Text>
                <Text className="text-xs text-gray-500 mt-1">PNG, JPG o PDF (MAX. 5MB)</Text>
              </View>
            ) : (
              <View className="items-center">
                <IconSymbol name="arrow.up.doc" size={40} color="#9CA3AF" />
                <Text className="text-sm text-gray-900 mt-2 font-medium">Haz clic para subir o arrastra</Text>
                <Text className="text-xs text-gray-500 mt-1">Foto de tu solvencia policial vigente</Text>
                <Text className="text-xs text-gray-500">PNG, JPG o PDF (MAX. 5MB)</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity className="mt-2">
            <Text className="text-sm text-gray-600">
              ¿No tienes tu solvencia policial? Puedes obtenerla en{' '}
              <Text className="text-purple-600 font-medium">simple.sv</Text>
            </Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Foto DUI Frontal */}
        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2 font-medium">
            DUI - Frente *
          </Text>
          <TouchableOpacity
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 items-center justify-center bg-gray-50"
            onPress={handleUploadFrontal}
            activeOpacity={0.7}
          >
            {duiFrontal ? (
              <View className="items-center">
                <IconSymbol name="checkmark.circle.fill" size={40} color="#10B981" />
                <Text className="text-sm text-green-600 mt-2 font-medium">Imagen cargada</Text>
                <Text className="text-xs text-gray-500 mt-1">Frente del DUI (JPG, PNG, PDF)</Text>
              </View>
            ) : (
              <View className="items-center">
                <IconSymbol name="arrow.up.doc" size={40} color="#9CA3AF" />
                <Text className="text-sm text-gray-900 mt-2">Haz clic o arrastra</Text>
                <Text className="text-xs text-gray-500 mt-1">Frente del DUI (JPG, PNG, PDF)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Foto DUI Reverso */}
        <View className="mb-6">
          <Text className="text-sm text-gray-700 mb-2 font-medium">
            DUI - Dorso *
          </Text>
          <TouchableOpacity
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 items-center justify-center bg-gray-50"
            onPress={handleUploadReverso}
            activeOpacity={0.7}
          >
            {duiReverso ? (
              <View className="items-center">
                <IconSymbol name="checkmark.circle.fill" size={40} color="#10B981" />
                <Text className="text-sm text-green-600 mt-2 font-medium">Imagen cargada</Text>
                <Text className="text-xs text-gray-500 mt-1">Dorso del DUI (JPG, PNG, PDF)</Text>
              </View>
            ) : (
              <View className="items-center">
                <IconSymbol name="arrow.up.doc" size={40} color="#9CA3AF" />
                <Text className="text-sm text-gray-900 mt-2">Haz clic o arrastra</Text>
                <Text className="text-xs text-gray-500 mt-1">Dorso del DUI (JPG, PNG, PDF)</Text>
              </View>
            )}
          </TouchableOpacity>
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

export default VerifyIdentity;

