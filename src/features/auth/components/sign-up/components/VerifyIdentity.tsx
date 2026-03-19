import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderRegisterSteps from './HeaderRegisterSteps';
import { useRegistration } from '@/features/auth/contexts/RegistrationContext';
import useSupabaseStorage from '@/common/hooks/useSupabaseStorage';
import { useAuth } from '@clerk/clerk-expo';

const VerifyIdentity = () => {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const { userId } = useAuth();
  const { handleUploadImage, handleUploadDocument, isLoading: isUploading } = useSupabaseStorage('documents');

  const [solvenciaPolicial, setSolvenciaPolicial] = useState<string | null>(
    registrationData.solvenciaPolicial || null
  );
  const [duiFrontal, setDuiFrontal] = useState<string | null>(
    registrationData.duiFrontal || null
  );
  const [duiReverso, setDuiReverso] = useState<string | null>(
    registrationData.duiReverso || null
  );
  const [professionalCredential, setProfessionalCredential] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const isProvider = registrationData.userType === 'provider';
  const isClient = registrationData.userType === 'client';

  // Usar userId si existe, o generar un ID temporal basado en el email durante el registro
  const getUserIdForUpload = () => {
    if (userId) return userId;
    // Durante el registro, usar el email como identificador temporal
    // El email será único y permitirá subir archivos antes de completar el registro
    if (registrationData.email) {
      // Crear un ID temporal basado en el email (reemplazar caracteres especiales por guiones bajos)
      // Esto asegura que el path sea válido para Supabase Storage
      const sanitizedEmail = registrationData.email
        .toLowerCase()
        .replace(/[@.]/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      return `temp_${sanitizedEmail}`;
    }
    return null;
  };

  // Categorías profesionales que requieren carnet profesional (debe coincidir con la web)
  const professionalCategories = [
    "Abogados y Notarios",
    "Contadores",
    "Traductores",
    "Veterinarios",
    "Médicos Generales",
    "Médicos Especialistas",
    "Enfermería",
  ];

  // Verificar si alguna categoría seleccionada es profesional
  const selectedCategories = registrationData.selectedCategories || [];
  const hasProfessionalCategory = selectedCategories.some((cat: any) =>
    professionalCategories.includes(cat.categoryName)
  );

  const handleUploadSolvencia = async () => {
    const uploadUserId = getUserIdForUpload();
    if (!uploadUserId) {
      Alert.alert('Error', 'No se pudo obtener un identificador para subir el archivo');
      return;
    }

    try {
      setUploading('solvencia');
      const result = await handleUploadDocument(uploadUserId);
      if (result) {
        setSolvenciaPolicial(result.url);
        updateRegistrationData({ solvenciaPolicial: result.url });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la solvencia policial');
    } finally {
      setUploading(null);
    }
  };

  const handleUploadFrontal = async () => {
    const uploadUserId = getUserIdForUpload();
    if (!uploadUserId) {
      Alert.alert('Error', 'No se pudo obtener un identificador para subir el archivo');
      return;
    }

    try {
      setUploading('frontal');
      const url = await handleUploadImage(uploadUserId);
      if (url) {
        setDuiFrontal(url);
        updateRegistrationData({ duiFrontal: url });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la foto frontal del DUI');
    } finally {
      setUploading(null);
    }
  };

  const handleUploadReverso = async () => {
    const uploadUserId = getUserIdForUpload();
    if (!uploadUserId) {
      Alert.alert('Error', 'No se pudo obtener un identificador para subir el archivo');
      return;
    }

    try {
      setUploading('reverso');
      const url = await handleUploadImage(uploadUserId);
      if (url) {
        setDuiReverso(url);
        updateRegistrationData({ duiReverso: url });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la foto del dorso del DUI');
    } finally {
      setUploading(null);
    }
  };

  const handleUploadProfessionalCredential = async () => {
    const uploadUserId = getUserIdForUpload();
    if (!uploadUserId) {
      Alert.alert('Error', 'No se pudo obtener un identificador para subir el archivo');
      return;
    }

    try {
      setUploading('professional');
      const result = await handleUploadDocument(uploadUserId);
      if (result) {
        setProfessionalCredential(result.url);
        updateRegistrationData({ professionalCredential: result.url });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir el carnet profesional');
    } finally {
      setUploading(null);
    }
  };

  const handleNext = () => {
    // Guardar datos en el contexto
    updateRegistrationData({
      solvenciaPolicial: isProvider ? solvenciaPolicial : undefined,
      duiFrontal,
      duiReverso,
      professionalCredential: isProvider ? professionalCredential : undefined,
    });

    // Después de subir documentos: proveedor va a zona de servicio, cliente también
    router.push('/(auth)/sign-up/service-zone');
  };

  // Para proveedores: DUI frontal y reverso obligatorios; solvencia opcional (se pide tras el primer servicio)
  // Si tienen categoría profesional, también necesitan carnet profesional
  // Para clientes: solo necesitan DUI frontal y reverso
  const isFormValid = isProvider
    ? (duiFrontal !== null && duiReverso !== null &&
       (!hasProfessionalCategory || professionalCredential !== null))
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
          currentStep={isProvider ? 3 : 2}
          totalSteps={isProvider ? 4 : 2}
          title={isProvider ? "Regístrate como Proveedor" : "Verifica tu Identidad"}
        />

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Solvencia Policial - Solo para proveedores */}
          {isProvider && (
            <View className="mb-6">
              <View className="flex-row items-center mb-2">
                <Text className="text-sm text-gray-700 font-medium">
                  Solvencia Policial (opcional)
                </Text>
                <View className="ml-2 px-2 py-1 bg-gray-100 rounded">
                  <Text className="text-xs text-gray-600 font-medium">Opcional al registrarse</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-600 mb-3">
                Puedes subirla ahora o después de tu primer servicio. La solicitaremos en la app cuando corresponda.
              </Text>
              <TouchableOpacity
                className={`border-2 border-dashed rounded-xl p-8 items-center justify-center ${
                  solvenciaPolicial ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
                onPress={handleUploadSolvencia}
                activeOpacity={0.7}
                disabled={uploading === 'solvencia' || isUploading}
              >
                {uploading === 'solvencia' || isUploading ? (
                  <ActivityIndicator size="large" color="#4F46E5" />
                ) : solvenciaPolicial ? (
                  <View className="items-center">
                    <MaterialIcons name="check-circle" size={40} color="#10B981" />
                    <Text className="text-sm text-green-600 mt-2 font-medium">Archivo cargado</Text>
                    <Text className="text-xs text-gray-500 mt-1">PNG, JPG o PDF (MAX. 5MB)</Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <MaterialIcons name="cloud-upload" size={40} color="#9CA3AF" />
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

          {/* Carnet Profesional - Solo para categorías profesionales */}
          {isProvider && hasProfessionalCategory && (
            <View className="mb-6">
              <View className="flex-row items-center mb-2">
                <Text className="text-sm text-gray-700 font-medium">
                  Carnet Profesional o Título Universitario *
                </Text>
                <View className="ml-2 px-2 py-1 bg-blue-50 rounded">
                  <Text className="text-xs text-blue-600 font-medium">Profesionales</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-600 mb-3">
                Las categorías profesionales requieren verificación de título o carnet profesional.
              </Text>
              <TouchableOpacity
                className={`border-2 border-dashed rounded-xl p-8 items-center justify-center ${
                  professionalCredential ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
                onPress={handleUploadProfessionalCredential}
                activeOpacity={0.7}
                disabled={uploading === 'professional' || isUploading}
              >
                {uploading === 'professional' || isUploading ? (
                  <ActivityIndicator size="large" color="#4F46E5" />
                ) : professionalCredential ? (
                  <View className="items-center">
                    <MaterialIcons name="check-circle" size={40} color="#10B981" />
                    <Text className="text-sm text-green-600 mt-2 font-medium">Archivo cargado</Text>
                    <Text className="text-xs text-gray-500 mt-1">PNG, JPG o PDF (MAX. 5MB)</Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <MaterialIcons name="cloud-upload" size={40} color="#9CA3AF" />
                    <Text className="text-sm text-gray-900 mt-2 font-medium">Haz clic para subir</Text>
                    <Text className="text-xs text-gray-500 mt-1">Foto de tu carnet profesional o título universitario</Text>
                    <Text className="text-xs text-gray-500">PNG, JPG o PDF (MAX. 5MB)</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Foto DUI Frontal */}
          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              DUI - Frente *
            </Text>
            <TouchableOpacity
              className={`border-2 border-dashed rounded-xl p-8 items-center justify-center ${
                duiFrontal ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
              }`}
              onPress={handleUploadFrontal}
              activeOpacity={0.7}
              disabled={uploading === 'frontal' || isUploading}
            >
              {uploading === 'frontal' || isUploading ? (
                <ActivityIndicator size="large" color="#4F46E5" />
              ) : duiFrontal ? (
                <View className="items-center">
                  {duiFrontal.startsWith('http') ? (
                    <Image source={{ uri: duiFrontal }} className="w-20 h-20 rounded-lg mb-2" />
                  ) : (
                    <MaterialIcons name="check-circle" size={40} color="#10B981" />
                  )}
                  <Text className="text-sm text-green-600 mt-2 font-medium">Imagen cargada</Text>
                  <Text className="text-xs text-gray-500 mt-1">Frente del DUI (JPG, PNG, PDF)</Text>
                </View>
              ) : (
                <View className="items-center">
                  <MaterialIcons name="cloud-upload" size={40} color="#9CA3AF" />
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
              className={`border-2 border-dashed rounded-xl p-8 items-center justify-center ${
                duiReverso ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
              }`}
              onPress={handleUploadReverso}
              activeOpacity={0.7}
              disabled={uploading === 'reverso' || isUploading}
            >
              {uploading === 'reverso' || isUploading ? (
                <ActivityIndicator size="large" color="#4F46E5" />
              ) : duiReverso ? (
                <View className="items-center">
                  {duiReverso.startsWith('http') ? (
                    <Image source={{ uri: duiReverso }} className="w-20 h-20 rounded-lg mb-2" />
                  ) : (
                    <MaterialIcons name="check-circle" size={40} color="#10B981" />
                  )}
                  <Text className="text-sm text-green-600 mt-2 font-medium">Imagen cargada</Text>
                  <Text className="text-xs text-gray-500 mt-1">Dorso del DUI (JPG, PNG, PDF)</Text>
                </View>
              ) : (
                <View className="items-center">
                  <MaterialIcons name="cloud-upload" size={40} color="#9CA3AF" />
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
                  {isProvider && hasProfessionalCategory && !professionalCredential
                    ? 'Debes subir el carnet profesional'
                    : 'Completa todos los documentos requeridos'}
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
