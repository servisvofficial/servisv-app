import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import HeaderCreateRequestSteps from '@/features/solicitudes/components/HeaderCreateRequestSteps';
import { useCreateRequest } from '@/features/solicitudes/contexts/CreateRequestContext';
import { useProviders } from '@/features/providers/hooks/useProviders';
import { useAuth } from '@clerk/clerk-expo';
import { createRequest } from '@/features/solicitudes/services/create-request';
import { MaterialIcons } from '@expo/vector-icons';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { useTheme } from '@/common/providers/ThemeProvider';

export default function CreateRequestStep6Screen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { requestData, updateRequestData, resetRequestData } = useCreateRequest();
  const [selectedProviders, setSelectedProviders] = useState<string[]>(
    requestData.preferredProviders || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoizar la ubicación para evitar recrear el objeto en cada render
  const requestLocation = useMemo(() => {
    if (requestData.coordinates) {
      return { 
        latitude: requestData.coordinates.lat, 
        longitude: requestData.coordinates.lng 
      };
    }
    return null;
  }, [requestData.coordinates?.lat, requestData.coordinates?.lng]);

  // Memoizar las opciones para evitar recrear el objeto
  const providersOptions = useMemo(() => ({
    category: requestData.serviceCategory,
    enabled: !!requestData.serviceCategory && !!requestLocation,
    customLocation: requestLocation,
  }), [requestData.serviceCategory, requestLocation]);

  const { providers, isLoading, locationError } = useProviders(providersOptions);

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  };

  const handlePublish = async () => {
    if (!userId) {
      router.push({
        pathname: '/crear-solicitud/confirmacion' as any,
        params: { success: 'false', error: 'No se pudo identificar tu usuario' },
      });
      return;
    }

    if (!requestData.title || !requestData.description || !requestData.serviceCategory || !requestData.location) {
      router.push({
        pathname: '/crear-solicitud/confirmacion',
        params: { success: 'false', error: 'Por favor, completa todos los campos obligatorios' },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Actualizar datos con proveedores seleccionados
      const finalData = {
        ...requestData,
        preferredProviders: selectedProviders,
      };

      await createRequest(userId, finalData);
      
      // Invalidar queries para actualizar las estadísticas y listas
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
        queryClient.invalidateQueries({ queryKey: ['user-requests', userId, 'client'] });
        queryClient.invalidateQueries({ queryKey: ['client-requests', userId] });
        // También invalidar solicitudes disponibles para proveedores que puedan ver esta solicitud
        queryClient.invalidateQueries({ queryKey: ['available-requests'] });
      }
      
      // Limpiar el contexto
      resetRequestData();
      
      // Navegar a la pantalla de confirmación con éxito
      router.push({
        pathname: '/crear-solicitud/confirmacion' as any,
        params: { success: 'true' },
      });
    } catch (error: any) {
      console.error('Error al crear solicitud:', error);
      // Navegar a la pantalla de confirmación con error
      router.push({
        pathname: '/crear-solicitud/confirmacion' as any,
        params: { 
          success: 'false', 
          error: error.message || 'Error al crear la solicitud. Por favor, intenta nuevamente.' 
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <HeaderCreateRequestSteps currentStep={6} totalSteps={6} title="Crear Solicitud" />
        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>Seleccionar proveedores</Text>
            <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>Este paso es opcional</Text>
            {isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="mt-2" style={{ color: colors.textSecondary }}>Cargando proveedores...</Text>
              </View>
            ) : providers.length === 0 ? (
              <View className="py-8 items-center">
                <MaterialIcons name="person-off" size={48} color={colors.textSecondary} />
                <Text className="mt-4 text-center font-medium" style={{ color: colors.textSecondary }}>No hay proveedores disponibles</Text>
                <Text className="mt-2 text-center text-sm px-4" style={{ color: colors.textSecondary, opacity: 0.8 }}>
                  {locationError ? 'No se pudo obtener la ubicación. Verifica los permisos de ubicación.' : requestData.serviceCategory ? `No encontramos proveedores de "${requestData.serviceCategory}" cerca de la ubicación seleccionada.` : 'Selecciona una categoría para ver proveedores disponibles.'}
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {providers.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    className="flex-row items-center p-4 rounded-xl"
                    style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
                    onPress={() => toggleProvider(provider.id)}
                    activeOpacity={0.7}
                  >
                    <View className="w-12 h-12 rounded-full overflow-hidden mr-3" style={{ backgroundColor: colors.border }}>
                      {provider.profile_pic ? (
                        <Image source={{ uri: provider.profile_pic }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full items-center justify-center" style={{ backgroundColor: colors.border }}>
                          <MaterialIcons name="person" size={24} color={colors.textSecondary} />
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold" style={{ color: colors.text }}>{provider.name} {provider.last_name || ''}</Text>
                      <View className="flex-row items-center mt-1">
                        <MaterialIcons name="star" size={16} color="#FBBF24" />
                        <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>{provider.rating?.toFixed(1) || 'N/A'} ({provider.total_requests || 0} trabajos)</Text>
                      </View>
                      {provider.distance !== undefined && (
                        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>A {provider.distance.toFixed(1)} km de distancia</Text>
                      )}
                    </View>
                    <Switch
                      value={selectedProviders.includes(provider.id)}
                      onValueChange={() => toggleProvider(provider.id)}
                      trackColor={{ false: colors.border, true: '#A78BFA' }}
                      thumbColor={selectedProviders.includes(provider.id) ? '#6366F1' : colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        <View className="px-5 pb-6 pt-4" style={{ borderTopColor: colors.border, borderTopWidth: 1 }}>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" onPress={() => router.back()} activeOpacity={0.8} disabled={isSubmitting}>
              <View style={{ backgroundColor: colors.border, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, opacity: isSubmitting ? 0.5 : 1 }}>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Anterior</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" onPress={handlePublish} disabled={isSubmitting} activeOpacity={0.8}>
              {isSubmitting ? (
                <View style={{ backgroundColor: colors.border, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color={colors.text} />
                </View>
              ) : (
                <LinearGradient colors={['#4F46E5', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Text className="text-white text-base font-semibold">Publicar Solicitud</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
