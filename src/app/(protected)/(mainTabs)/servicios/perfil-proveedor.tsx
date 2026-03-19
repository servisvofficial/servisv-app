import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useProviderData } from '@/common/hooks';
import { useTheme } from '@/common/providers/ThemeProvider';
import { getUserInitials, getFullName } from '@/common/utils/userHelpers';
import { ProfileMap } from '@/features/perfil/components/ProfileMap';
import { ReportModal } from '@/common/components/ReportModal';
import { supabase } from '@/common/lib/supabase/supabaseClient';

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
};

export default function PerfilProveedorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ providerId?: string }>();
  const [tabActivo, setTabActivo] = useState<'informacion' | 'reseñas'>('informacion');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const paramId = params.providerId ?? (params as Record<string, unknown>).providerid;
  const resolvedId = Array.isArray(paramId) ? paramId[0] : paramId;
  const { userId } = useAuth();
  const { provider, isLoading } = useProviderData(typeof resolvedId === 'string' ? resolvedId : undefined);
  const { colors } = useTheme();
  const providerId = (typeof resolvedId === 'string' ? resolvedId : null) ?? provider?.id ?? null;
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const isOwnProfile = !!providerId && !!userId && providerId === userId;

  // Cargar reseñas visibles (solo cuando ambas partes han calificado)
  useEffect(() => {
    const id = providerId ?? provider?.id;
    if (!id || typeof id !== 'string') return;
    const loadReviews = async () => {
      setReviewsLoading(true);
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id')
        .eq('reviewed_id', id)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });
      if (error) {
        setReviews([]);
      } else if (reviewsData?.length) {
        const reviewerIds = [...new Set(reviewsData.map((r: any) => r.reviewer_id).filter(Boolean))];
        let namesMap: Record<string, string> = {};
        if (reviewerIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name, last_name')
            .in('id', reviewerIds);
          users?.forEach((u: any) => {
            namesMap[u.id] = [u.name, u.last_name].filter(Boolean).join(' ') || 'Usuario';
          });
        }
        setReviews(
          reviewsData.map((r: any) => ({
            id: String(r.id),
            rating: typeof r.rating === 'number' ? r.rating : parseFloat(r.rating) || 0,
            comment: r.comment || null,
            created_at: r.created_at,
            reviewer_name: namesMap[r.reviewer_id] || 'Usuario',
          }))
        );
      } else {
        setReviews([]);
      }
      setReviewsLoading(false);
    };
    loadReviews();
  }, [providerId, provider?.id, tabActivo]);

  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8);

  const tabs = [
    { key: 'informacion', label: 'Información' },
    { key: 'reseñas', label: 'Reseñas' },
  ];

  const initials = getUserInitials(provider?.name, provider?.last_name);
  const fullName = getFullName(provider?.name, provider?.last_name);
  const profilePic = provider?.profile_pic;
  const rating = provider?.rating || 0;
  const description = provider?.description;
  const location = provider?.location;
  const serviceRadius = provider?.service_radius;
  const serviceCategories = provider?.service_categories || [];

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ backgroundColor: "transparent" }}>
        {/* Header */}
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
          <TouchableOpacity
            onPress={() => router.replace("/(protected)/(mainTabs)/servicios" as any)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>Perfil del Proveedor</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
        >
          <View className="pt-6">
            {/* Info del proveedor */}
            <View className="items-center mb-6 px-5">
              {isLoading ? (
                <View className="items-center">
                  <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-3">
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                  <Text className="text-xl font-bold" style={{ color: colors.text }}>Cargando...</Text>
                </View>
              ) : (
                <>
                  {profilePic ? (
                    <Image
                      source={{ uri: profilePic }}
                      className="w-24 h-24 rounded-full mb-3"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-blue-500 items-center justify-center mb-3">
                      <Text className="text-white font-bold text-3xl">{initials}</Text>
                    </View>
                  )}
                  <Text className="text-xl font-bold" style={{ color: colors.text }}>{fullName}</Text>
                  {rating > 0 && (
                    <View className="flex-row items-center mt-2">
                      <MaterialIcons name="star" size={20} color="#F59E0B" />
                      <Text className="text-base font-semibold ml-1" style={{ color: colors.text }}>
                        {rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Botón Contratar Servicio */}
            <View className="px-5 mb-4">
              <TouchableOpacity
                className="rounded-xl overflow-hidden"
                activeOpacity={0.8}
                onPress={() => {
                  router.push('/(protected)/(mainTabs)/chats' as any);
                }}
              >
                <LinearGradient
                  colors={['#4F46E5', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 12 }}
                >
                  <Text className="text-white font-bold text-base">Contratar Servicio</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Reportar usuario: no mostrar en propio perfil */}
            {!isOwnProfile && providerId && userId && (
              <View className="px-5 mb-6">
                <TouchableOpacity
                  className="flex-row items-center justify-center py-3 rounded-xl border"
                  style={{ borderColor: '#DC2626' }}
                  onPress={() => setIsReportModalVisible(true)}
                >
                  <MaterialIcons name="flag" size={20} color="#DC2626" />
                  <Text className="ml-2 font-semibold" style={{ color: '#DC2626' }}>Reportar usuario</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tabs */}
            <View 
              className="flex-row px-5 border-b mb-6"
              style={{ borderBottomColor: colors.border }}
            >
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  className="flex-1 pb-3 items-center"
                  onPress={() => setTabActivo(tab.key as any)}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ 
                      color: tabActivo === tab.key ? colors.primary : colors.textSecondary 
                    }}
                  >
                    {tab.label}
                  </Text>
                  {tabActivo === tab.key && (
                    <View className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colors.primary }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Contenido según tab */}
            {tabActivo === 'informacion' && (
              <View className="px-5">
                {/* Categorías y Subcategorías */}
                {serviceCategories.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>Categorías</Text>
                    <View className="flex-col gap-3">
                      {serviceCategories.map((cat, index) => (
                        <View 
                          key={index} 
                          className="p-4 rounded-xl border"
                          style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        >
                          <Text className="text-base font-bold mb-2" style={{ color: colors.text }}>{cat.category}</Text>
                          {cat.subcategories && cat.subcategories.length > 0 ? (
                            <View className="flex-row flex-wrap gap-2">
                              {cat.subcategories.map((subcat, subIndex) => (
                                <View
                                  key={subIndex}
                                  className="px-3 py-1.5 rounded-full bg-purple-100"
                                >
                                  <Text className="text-xs text-purple-700 font-medium">{subcat}</Text>
                                </View>
                              ))}
                            </View>
                          ) : (
                            <Text className="text-sm italic" style={{ color: colors.textSecondary }}>Sin subcategorías</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Sobre mí */}
                <View className="mb-6">
                  <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>Sobre mí</Text>
                  {description ? (
                    <Text className="text-sm leading-6 mb-4" style={{ color: colors.text }}>{description}</Text>
                  ) : (
                    <Text className="text-sm italic mb-4" style={{ color: colors.textSecondary }}>
                      No hay descripción disponible
                    </Text>
                  )}
                  <View className="space-y-2">
                    {serviceRadius && (
                      <View className="flex-row items-center">
                        <MaterialIcons name="location-on" size={18} color={colors.textSecondary} />
                        <Text className="text-sm ml-2" style={{ color: colors.text }}>
                          Radio de servicio: {serviceRadius} km
                        </Text>
                      </View>
                    )}
                    {location && (
                      <View className="flex-row items-center">
                        <MaterialIcons name="place" size={18} color={colors.textSecondary} />
                        <Text className="text-sm ml-2" style={{ color: colors.text }}>{location}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Ubicación */}
                {provider?.coordinates?.lat && provider?.coordinates?.lng && (
                  <View className="mb-6">
                    <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>Ubicación</Text>
                    <ProfileMap
                      latitude={provider.coordinates.lat}
                      longitude={provider.coordinates.lng}
                      coverageRadius={serviceRadius}
                    />
                  </View>
                )}
              </View>
            )}

            {tabActivo === 'reseñas' && (
              <View className="px-5 pb-6">
                <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>
                  Reseñas {reviews.length > 0 ? `(${reviews.length})` : ''}
                </Text>
                {reviewsLoading ? (
                  <View className="items-center justify-center py-12">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>Cargando reseñas...</Text>
                  </View>
                ) : reviews.length === 0 ? (
                  <View className="items-center justify-center py-20">
                    <MaterialIcons name="star-outline" size={64} color={colors.textSecondary} />
                    <Text className="text-lg mt-4" style={{ color: colors.textSecondary }}>No hay reseñas aún</Text>
                    <Text className="text-sm mt-2 text-center px-6" style={{ color: colors.textSecondary }}>
                      Las reseñas se muestran cuando cliente y proveedor han calificado el servicio.
                    </Text>
                  </View>
                ) : (
                  <View className="gap-4">
                    {reviews.map((rev) => (
                      <View
                        key={rev.id}
                        className="p-4 rounded-xl border"
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-sm font-semibold" style={{ color: colors.text }}>{rev.reviewer_name}</Text>
                          <View className="flex-row items-center">
                            <MaterialIcons name="star" size={16} color="#F59E0B" />
                            <Text className="text-sm font-semibold ml-1" style={{ color: colors.text }}>{rev.rating.toFixed(1)}</Text>
                          </View>
                        </View>
                        {rev.comment ? (
                          <Text className="text-sm leading-5" style={{ color: colors.text }}>{rev.comment}</Text>
                        ) : null}
                        <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                          {new Date(rev.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {providerId && userId && (
          <ReportModal
            visible={isReportModalVisible}
            onClose={() => setIsReportModalVisible(false)}
            reportType="user"
            targetId={providerId}
            targetName={fullName || 'Usuario'}
            reportedUserId={providerId}
            reporterId={userId}
          />
        )}
      </View>
    </LinearGradient>
  );
}
