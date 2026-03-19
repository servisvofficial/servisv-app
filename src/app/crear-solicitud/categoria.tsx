import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderCreateRequestSteps from '@/features/solicitudes/components/HeaderCreateRequestSteps';
import { useCreateRequest } from '@/features/solicitudes/contexts/CreateRequestContext';
import { useCategories } from '@/common/hooks/useCategories';
import { getCategoryIcon, getCategoryColor } from '@/common/utils/categoryIcons';
import { useTheme } from '@/common/providers/ThemeProvider';

export default function CreateRequestStep2Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { requestData, updateRequestData } = useCreateRequest();
  const { data: categories, isLoading } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    requestData.serviceCategory || null
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    requestData.subcategory || null
  );

  const handleNext = () => {
    if (!selectedCategory) {
      return;
    }

    // Si la categoría tiene subcategorías, la subcategoría es OBLIGATORIA
    const categoryData = categories?.find(cat => cat.name === selectedCategory);
    if (categoryData && categoryData.subcategories.length > 0) {
      if (!selectedSubcategory) {
        alert('Por favor, selecciona una subcategoría. Este campo es obligatorio.');
        return;
      }
    }

    updateRequestData({ 
      serviceCategory: selectedCategory,
      subcategory: selectedSubcategory || undefined,
    });
    router.push('/crear-solicitud/ubicacion');
  };

  const selectedCategoryData = categories?.find(cat => cat.name === selectedCategory);
  const hasSubcategories = selectedCategoryData && selectedCategoryData.subcategories.length > 0;
  const canContinue = selectedCategory && (!hasSubcategories || selectedSubcategory);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <HeaderCreateRequestSteps currentStep={2} totalSteps={6} title="Crear Solicitud" />
        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-sm mb-2 font-medium" style={{ color: colors.textSecondary }}>Categoría de servicio *</Text>
            {isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
            ) : (
              <>
                <View className="flex-row flex-wrap gap-3">
                  {categories?.map((category) => {
                    const iconName = getCategoryIcon(category.name);
                    const categoryColor = getCategoryColor(category.name);
                    const isSelected = selectedCategory === category.name;
                    return (
                      <View key={category.id} className="w-[48%]">
                        <TouchableOpacity
                          style={{
                            padding: 16,
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: isSelected ? '#8B5CF6' : colors.border,
                            backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : colors.card,
                          }}
                          onPress={() => { setSelectedCategory(category.name); setSelectedSubcategory(null); }}
                          activeOpacity={0.7}
                        >
                          <View className="items-center">
                            <View className="w-14 h-14 rounded-full items-center justify-center mb-2" style={{ backgroundColor: categoryColor + '20' }}>
                              <MaterialIcons name={iconName} size={28} color={categoryColor} />
                            </View>
                            <Text className="text-sm font-semibold text-center" style={{ color: colors.text }}>{category.name}</Text>
                          </View>
                        </TouchableOpacity>
                        {isSelected && category.subcategories.length > 0 && (
                          <View className="mt-3 mb-4">
                            <Text className="text-xs mb-2 font-medium" style={{ color: colors.textSecondary }}>
                              Subcategoría * <Text style={{ color: colors.textSecondary, opacity: 0.8 }}>(Campo obligatorio)</Text>
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                              {category.subcategories.map((subcat) => (
                                <TouchableOpacity
                                  key={subcat.id}
                                  style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    borderWidth: 2,
                                    borderColor: selectedSubcategory === subcat.name ? '#8B5CF6' : colors.border,
                                    backgroundColor: selectedSubcategory === subcat.name ? 'rgba(139, 92, 246, 0.15)' : colors.card,
                                  }}
                                  onPress={() => setSelectedSubcategory(subcat.name)}
                                  activeOpacity={0.7}
                                >
                                  <Text className="text-xs font-semibold" style={{ color: selectedSubcategory === subcat.name ? '#A78BFA' : colors.text }}>{subcat.name}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                            {!selectedSubcategory && <Text className="text-xs text-red-500 mt-2">Debes seleccionar una subcategoría para continuar</Text>}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </ScrollView>
        <View className="px-5 pb-6 pt-4" style={{ borderTopColor: colors.border, borderTopWidth: 1 }}>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" onPress={() => router.back()} activeOpacity={0.8}>
              <View style={{ backgroundColor: colors.border, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Anterior</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" onPress={handleNext} disabled={!canContinue} activeOpacity={0.8}>
              {canContinue ? (
                <LinearGradient colors={['#4F46E5', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Text className="text-white text-base font-semibold">Siguiente</Text>
                </LinearGradient>
              ) : (
                <View style={{ backgroundColor: colors.border, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Text className="text-base font-semibold" style={{ color: colors.textSecondary }}>Siguiente</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
