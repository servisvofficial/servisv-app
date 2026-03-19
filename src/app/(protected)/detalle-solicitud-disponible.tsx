import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuoteModal, ImageGallery } from '@/common/components';
import { useUserData } from '@/common/hooks';
import { useTheme } from '@/common/providers/ThemeProvider';
import { createQuote } from '@/common/services/create-quote';
import { useQueryClient } from '@tanstack/react-query';
import { useRequestDetail } from '@/features/solicitudes';
import { RequestStatusBadge } from '@/features/solicitudes/components/RequestStatusBadge';
import { getCategoryIcon } from '@/common/utils/categoryIcons';

/**
 * Modal a pantalla completa para que los proveedores vean el detalle de solicitudes disponibles
 * y puedan enviar presupuestos
 */
export default function DetalleSolicitudDisponibleModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUserData();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [isQuoteModalVisible, setIsQuoteModalVisible] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  // Obtener el ID de la solicitud desde los parámetros
  const requestId = params.requestId as string;

  // Obtener detalle de la solicitud
  const { data: solicitud, isLoading: isLoadingRequest, error } = useRequestDetail(requestId);
  
  // Calcular padding bottom para que el contenido llegue hasta el borde
  const scrollViewPaddingBottom = Math.max(insets.bottom, 8) + 20;

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

  if (isLoadingRequest) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
              Cargando solicitud...
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error || !solicitud) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <View className="flex-1 items-center justify-center px-8">
            <MaterialIcons name="error-outline" size={64} color={colors.textSecondary} />
            <Text className="text-lg font-semibold mt-4 text-center" style={{ color: colors.text }}>
              Solicitud no encontrada
            </Text>
            <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
              {error?.message || "No se pudo cargar la información de la solicitud"}
            </Text>
            <TouchableOpacity
              className="mt-6 px-6 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.back()}
            >
              <Text className="text-white font-semibold">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.gradientStart }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Header con botón de cerrar */}
        <View 
          className="flex-row items-center justify-between px-5 py-4 border-b"
          style={{
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            paddingTop: insets.top + 16,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-lg font-bold flex-1" style={{ color: colors.text }}>
            Solicitud Disponible
          </Text>
          <RequestStatusBadge status={solicitud.status} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
        >
          <View className="pt-6">
            <View className="px-5">
              {/* Badge de prioridad si aplica */}
              {solicitud.isPriority && (
                <View className="mb-4">
                  <View className="rounded-xl overflow-hidden inline-flex self-start">
                    <LinearGradient
                      colors={['#F59E0B', '#EF4444']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ 
                        paddingHorizontal: 16, 
                        paddingVertical: 10, 
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <MaterialIcons name="star" size={20} color="#FFFFFF" />
                      <Text className="text-white text-sm font-bold ml-2">
                        SOLICITUD PRIORITARIA PARA TI
                      </Text>
                    </LinearGradient>
                  </View>
                </View>
              )}

              {/* Categoría */}
              <View className="flex-row items-center mb-2">
                <MaterialIcons 
                  name={getCategoryIcon(solicitud.serviceCategory)} 
                  size={18} 
                  color={colors.textSecondary} 
                />
                <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>
                  {solicitud.serviceCategory}
                  {solicitud.subcategory && ` • ${solicitud.subcategory}`}
                </Text>
              </View>

              {/* Título */}
              <Text className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
                {solicitud.title}
              </Text>

              {/* Descripción */}
              <Text className="text-base mb-6 leading-6" style={{ color: colors.text }}>
                {solicitud.description}
              </Text>

              {/* Info del cliente y detalles */}
              <View 
                className="mb-6 p-4 rounded-2xl border"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
                  Información de la Solicitud
                </Text>

                <View className="flex-row items-center mb-3">
                  <MaterialIcons name="person" size={18} color={colors.textSecondary} />
                  <Text className="text-sm ml-2" style={{ color: colors.text }}>
                    Cliente: <Text className="font-semibold">{solicitud.client.name}</Text>
                  </Text>
                </View>

                <View className="flex-row items-center mb-3">
                  <MaterialIcons name="location-on" size={18} color={colors.textSecondary} />
                  <Text className="text-sm ml-2 flex-1" style={{ color: colors.text }}>
                    {typeof solicitud.location === 'string' 
                      ? solicitud.location 
                      : solicitud.location.address}
                  </Text>
                </View>

                <View className="flex-row items-center mb-3">
                  <MaterialIcons name="calendar-today" size={18} color={colors.textSecondary} />
                  <Text className="text-sm ml-2" style={{ color: colors.text }}>
                    {solicitud.scheduledDate 
                      ? `Programado: ${formatDate(solicitud.scheduledDate)}`
                      : `Publicado: ${formatDate(solicitud.createdAt)}`}
                  </Text>
                </View>

                {solicitud.budgetRange && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="attach-money" size={18} color={colors.textSecondary} />
                    <Text className="text-sm ml-2" style={{ color: colors.text }}>
                      Presupuesto del cliente: <Text className="font-semibold">${solicitud.budgetRange.min} - ${solicitud.budgetRange.max}</Text>
                    </Text>
                  </View>
                )}
              </View>

              {/* Fotos */}
              {solicitud.photos && solicitud.photos.length > 0 && (
                <View className="mb-6">
                  <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
                    Fotos Adjuntas ({solicitud.photos.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-3">
                      {solicitud.photos.map((photo, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setSelectedImageIndex(i)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: photo }}
                            className="w-32 h-32 rounded-xl"
                            style={{ backgroundColor: colors.border }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Visor de imágenes */}
              <ImageGallery
                images={solicitud.photos || []}
                visible={selectedImageIndex !== null}
                onClose={() => setSelectedImageIndex(null)}
                initialIndex={selectedImageIndex || 0}
              />

              {/* Botón para enviar presupuesto */}
              <View className="mb-6">
                <TouchableOpacity
                  className="rounded-xl overflow-hidden"
                  activeOpacity={0.8}
                  onPress={() => {
                    // Validar información bancaria
                    if (!user?.bank_account_number || !user?.bank_name || !(user as any).bank_account_type) {
                      Alert.alert(
                        'Información bancaria requerida',
                        'Debes configurar tu información bancaria completa (banco, tipo de cuenta y número de cuenta) en tu perfil antes de poder enviar presupuestos. Ve a "Editar Perfil" para agregarlo.',
                        [
                          {
                            text: 'Cancelar',
                            style: 'cancel',
                          },
                          {
                            text: 'Ir a Editar Perfil',
                            onPress: () => {
                              router.back();
                              router.push('/(protected)/(mainTabs)/perfil/editar-perfil' as any);
                            },
                          },
                        ]
                      );
                      return;
                    }
                    setIsQuoteModalVisible(true);
                  }}
                >
                  <LinearGradient
                    colors={['#4F46E5', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                    }}
                  >
                    <View className="flex-row items-center">
                      <MaterialIcons name="send" size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold text-base ml-2">
                        Enviar Mi Presupuesto
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Nota informativa */}
              <View 
                className="p-4 rounded-xl border"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row items-start">
                  <MaterialIcons name="info-outline" size={20} color={colors.primary} />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
                      Consejos para tu presupuesto
                    </Text>
                    <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>
                      • Sé claro y detallado en tu propuesta{'\n'}
                      • Incluye qué materiales o servicios están incluidos{'\n'}
                      • Indica el tiempo estimado de realización{'\n'}
                      • Responde rápido para destacar sobre otros proveedores
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Modal para enviar presupuesto */}
        <QuoteModal
          visible={isQuoteModalVisible}
          onClose={() => setIsQuoteModalVisible(false)}
          onSubmit={async (quoteData) => {
            if (!user || !requestId || !solicitud) {
              Alert.alert('Error', 'No se pudo obtener la información necesaria.');
              return;
            }

            setIsSubmittingQuote(true);
            try {
              const fullProviderName = `${user.name}${user.last_name ? ` ${user.last_name}` : ''}`;
              
              await createQuote({
                requestId: requestId,
                providerId: user.id,
                providerName: fullProviderName,
                clientId: solicitud.client.id,
                price: quoteData.price,
                description: quoteData.description,
                estimatedDate: quoteData.estimatedDate,
                estimatedDuration: quoteData.estimatedDuration,
              });

              // Invalidar cache para refrescar datos
              queryClient.invalidateQueries({ queryKey: ['userStats', user.id] });
              queryClient.invalidateQueries({ queryKey: ['provider-quotes', user.id] });
              queryClient.invalidateQueries({ queryKey: ['request-quotes', requestId] });
              queryClient.invalidateQueries({ queryKey: ['request-detail', requestId] });
              // Invalidar AMBAS listas de solicitudes disponibles del proveedor
              queryClient.invalidateQueries({ queryKey: ['available-requests', user.id] });
              queryClient.invalidateQueries({ queryKey: ['user-requests', user.id, 'provider'] });

              Alert.alert(
                '¡Presupuesto enviado!',
                'Tu presupuesto ha sido enviado al cliente exitosamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setIsQuoteModalVisible(false);
                      router.back();
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('Error al crear presupuesto:', error);
              Alert.alert(
                'Error al enviar presupuesto',
                error.message || 'Ocurrió un error al enviar tu presupuesto. Por favor, intenta de nuevo.'
              );
            } finally {
              setIsSubmittingQuote(false);
            }
          }}
          isLoading={isSubmittingQuote}
        />
      </LinearGradient>
    </View>
  );
}
