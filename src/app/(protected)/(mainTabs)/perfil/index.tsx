import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MyView } from '@/common/components';
import { useUserData } from '@/common/hooks';
import { useTheme } from '@/common/providers/ThemeProvider';
import { getUserInitials, getFullName } from '@/common/utils/userHelpers';
import { ProfileMap } from '@/features/perfil/components/ProfileMap';
import { supabase } from '@/common/lib/supabase/supabaseClient';

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
};

export default function PerfilScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const [tabActivo, setTabActivo] = useState<'informacion' | 'reseñas'>('informacion');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { user, isLoading: isLoadingUser } = useUserData();

  // Cargar reseñas sobre el usuario actual (reviewed_id = userId)
  useEffect(() => {
    const id = userId ?? user?.id;
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
  }, [userId, user?.id, tabActivo]);

  // Verificar si es el propio perfil del usuario
  const isOwnProfile = user?.id === userId;
  
  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  // Tab bar height según _layout: 70 + Math.max(insets.bottom - 8, 0)
  // Pero también tiene paddingTop: 8 y paddingBottom: Math.max(insets.bottom, 8)
  // Altura total aproximada: 70 + insets.bottom
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8); // Solo la altura del tab bar, sin extra

  const tabs = [
    { key: 'informacion', label: 'Información' },
    { key: 'reseñas', label: 'Reseñas' },
  ];

  const initials = getUserInitials(user?.name, user?.last_name);
  const fullName = getFullName(user?.name, user?.last_name);
  const profilePic = user?.profile_pic;
  const rating = user?.rating || 0;
  const description = user?.description;
  const location = user?.location;
  const serviceRadius = user?.service_radius;
  const serviceCategories = user?.service_categories || [];
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ backgroundColor: "transparent" }}>
        {/* Header con foto pequeña */}
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
            paddingTop: insets.top + 16, // Safe area top
          }}
        >
          <Text className="text-lg font-bold" style={{ color: colors.text }}>Perfil</Text>
          <TouchableOpacity
            onPress={() => router.push('/(protected)/(mainTabs)/perfil/configuracion' as any)}
            activeOpacity={0.7}
          >
            {isLoadingUser ? (
              <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                <ActivityIndicator size="small" color="#6B7280" />
              </View>
            ) : profilePic ? (
              <Image
                source={{ uri: profilePic }}
                className="w-10 h-10 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
                <Text className="text-white font-bold text-sm">{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
        >
          <View className="pt-6">
            {/* Info del usuario */}
            <View className="items-center mb-6 px-5">
              {isLoadingUser ? (
                <View className="items-center">
                  <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-3">
                    <ActivityIndicator size="large" color="#6B7280" />
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

            {/* Botón Contratar Servicio - Solo si NO es el propio perfil y es proveedor */}
            {!isOwnProfile && user?.is_provider && (
              <View className="px-5 mb-6">
                <TouchableOpacity
                  className="rounded-xl overflow-hidden"
                  activeOpacity={0.8}
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
                      color: tabActivo === tab.key ? '#3B82F6' : colors.textSecondary 
                    }}
                  >
                    {tab.label}
                  </Text>
                  {tabActivo === tab.key && (
                    <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Contenido según tab */}
            {tabActivo === 'informacion' && (
              <View className="px-5">
                {/* Categorías y Subcategorías - Solo para proveedores */}
                {user?.is_provider && serviceCategories.length > 0 && (
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
                            <Text className="text-sm text-gray-500 italic">Sin subcategorías</Text>
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
                    {user?.is_provider && serviceRadius && (
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

                {/* Ubicación - Solo para proveedores */}
                {user?.is_provider && user?.coordinates?.lat && user?.coordinates?.lng && (
                  <View className="mb-6">
                    <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>Ubicación</Text>
                    <ProfileMap
                      latitude={user.coordinates.lat}
                      longitude={user.coordinates.lng}
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
      </View>
    </LinearGradient>
  );
}
