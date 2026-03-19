import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRequests, useSubcategories } from '@/common/hooks';
import { getCategoryIcon, getCategoryColor } from '@/common/utils/categoryIcons';
import HeaderRegisterSteps from './HeaderRegisterSteps';
import type { Request } from '@/common/types/request';
import type { Subcategory } from '@/common/types/request';

interface SelectedCategory {
  categoryId: number;
  categoryName: string;
  selectedSubcategories: string[]; // IDs de subcategorías seleccionadas
}

const SelectServices = () => {
  const router = useRouter();
  const { data: categories, isLoading, error } = useRequests();
  
  // Estado para categorías seleccionadas (máximo 3)
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>([]);
  const MAX_CATEGORIES = 3;

  const handleNext = () => {
    // TODO: Guardar las categorías y subcategorías seleccionadas en el store de registro
    console.log('Categorías seleccionadas:', selectedCategories);
    router.push('/(auth)/sign-up/service-zone');
  };

  // Agregar o remover una categoría
  const handleCategoryToggle = (category: Request) => {
    const isSelected = selectedCategories.some(sc => sc.categoryId === category.id);
    
    if (isSelected) {
      // Remover categoría
      setSelectedCategories(prev => prev.filter(sc => sc.categoryId !== category.id));
    } else {
      // Agregar categoría (si no se ha alcanzado el máximo)
      if (selectedCategories.length >= MAX_CATEGORIES) {
        return; // No permitir agregar más
      }
      setSelectedCategories(prev => [...prev, {
        categoryId: category.id,
        categoryName: category.name,
        selectedSubcategories: []
      }]);
    }
  };

  // Toggle de subcategoría
  const handleSubcategoryToggle = (categoryId: number, subcategoryId: string) => {
    setSelectedCategories(prev => prev.map(sc => {
      if (sc.categoryId === categoryId) {
        const isSelected = sc.selectedSubcategories.includes(subcategoryId);
        return {
          ...sc,
          selectedSubcategories: isSelected
            ? sc.selectedSubcategories.filter(id => id !== subcategoryId)
            : [...sc.selectedSubcategories, subcategoryId]
        };
    }
      return sc;
    }));
  };

  // Validar que todas las categorías tengan al menos una subcategoría seleccionada
  const isFormValid = selectedCategories.length > 0 && 
    selectedCategories.every(sc => sc.selectedSubcategories.length > 0);

  // Obtener categorías no seleccionadas para mostrar en el selector
  const availableCategories = categories.filter(cat => 
    !selectedCategories.some(sc => sc.categoryId === cat.id)
  );

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <HeaderRegisterSteps 
        currentStep={3}
        totalSteps={4}
        title="Regístrate como Proveedor"
      />

      <ScrollView className="flex-1 px-5 pt-6">
        <Text className="text-xl font-bold text-gray-900 mb-2">
          Selecciona los servicios que ofreces
        </Text>
        
          <Text className="text-sm text-gray-600 mb-4">
            Puedes agregar hasta {MAX_CATEGORIES} categorías. Selecciona las subcategorías para cada una.
        </Text>

          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-600 mt-4">Cargando categorías...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-20 px-4">
              <MaterialIcons name="error-outline" size={48} color="#EF4444" />
              <Text className="text-red-600 mt-4 text-center font-semibold">
                Error al cargar las categorías
              </Text>
              <Text className="text-gray-500 mt-2 text-center text-sm">
                {error instanceof Error ? error.message : 'Por favor, verifica tu conexión'}
              </Text>
            </View>
          ) : (
            <>
              {/* Categorías Seleccionadas con sus Subcategorías */}
              {selectedCategories.map((selectedCat) => {
                const category = categories.find(c => c.id === selectedCat.categoryId);
                if (!category) return null;

                return (
                  <CategoryWithSubcategories
                    key={selectedCat.categoryId}
                    category={category}
                    selectedCategory={selectedCat}
                    onRemove={() => handleCategoryToggle(category)}
                    onSubcategoryToggle={(subcategoryId) => 
                      handleSubcategoryToggle(selectedCat.categoryId, subcategoryId)
                    }
                  />
                );
              })}

              {/* Selector de Categorías Disponibles */}
              {selectedCategories.length < MAX_CATEGORIES && (
                <View className="mb-6">
                  <Text className="text-base font-semibold text-gray-700 mb-3">
                    Agregar categoría ({selectedCategories.length}/{MAX_CATEGORIES})
                  </Text>
        <View className="flex-row flex-wrap justify-between">
                    {availableCategories.map((category) => {
                      const iconName = getCategoryIcon(category.name);
                      const categoryColor = getCategoryColor(category.name);
            
            return (
              <TouchableOpacity
                          key={category.id}
                          className="w-[48%] mb-3 p-3 rounded-xl border-2 border-gray-200 bg-white"
                          onPress={() => handleCategoryToggle(category)}
                activeOpacity={0.7}
              >
                <View className="items-center">
                  <View 
                              className="w-10 h-10 rounded-full items-center justify-center mb-2"
                              style={{ backgroundColor: categoryColor + '20' }}
                  >
                              <MaterialIcons 
                                name={iconName} 
                                size={20} 
                                color={categoryColor} 
                              />
                  </View>
                            <Text className="text-xs font-semibold text-gray-900 text-center">
                              {category.name}
                            </Text>
                            <View className="mt-1 px-2 py-1 bg-blue-50 rounded-full">
                              <Text className="text-xs text-blue-600 font-medium">
                                Agregar
                  </Text>
                    </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
                </View>
              )}

              {/* Mensaje cuando se alcanza el máximo */}
              {selectedCategories.length >= MAX_CATEGORIES && (
                <View className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <Text className="text-sm text-blue-800 text-center">
                    Has alcanzado el máximo de {MAX_CATEGORIES} categorías
            </Text>
          </View>
              )}

              {/* Resumen */}
              {selectedCategories.length > 0 && (
                <View className="mt-4 p-4 bg-blue-50 rounded-xl mb-4">
                  <Text className="text-sm font-medium text-blue-900 mb-2">
                    Resumen de selección:
                  </Text>
                  {selectedCategories.map((sc) => (
                    <Text key={sc.categoryId} className="text-xs text-blue-800 mb-1">
                      • {sc.categoryName}: {sc.selectedSubcategories.length} subcategoría{sc.selectedSubcategories.length !== 1 ? 's' : ''}
                    </Text>
                  ))}
                </View>
              )}
            </>
        )}
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
                  {selectedCategories.length === 0 
                    ? 'Selecciona al menos una categoría' 
                    : 'Selecciona al menos una subcategoría en cada categoría'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Componente para mostrar una categoría seleccionada con sus subcategorías
interface CategoryWithSubcategoriesProps {
  category: Request;
  selectedCategory: SelectedCategory;
  onRemove: () => void;
  onSubcategoryToggle: (subcategoryId: string) => void;
}

const CategoryWithSubcategories = ({
  category,
  selectedCategory,
  onRemove,
  onSubcategoryToggle,
}: CategoryWithSubcategoriesProps) => {
  const { data: subcategories, isLoading } = useSubcategories(category.id);
  const iconName = getCategoryIcon(category.name);
  const categoryColor = getCategoryColor(category.name);

  return (
    <View className="mb-4 p-4 bg-white rounded-2xl border-2 border-blue-500 shadow-sm">
      {/* Header de la categoría */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: categoryColor }}
          >
            <MaterialIcons 
              name={iconName} 
              size={20} 
              color="#FFFFFF" 
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900">
              {category.name}
            </Text>
            <Text className="text-xs text-gray-500">
              {selectedCategory.selectedSubcategories.length} subcategoría{selectedCategory.selectedSubcategories.length !== 1 ? 's' : ''} seleccionada{selectedCategory.selectedSubcategories.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onRemove}
          className="p-2 rounded-full bg-red-50"
        >
          <MaterialIcons name="close" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Lista de subcategorías */}
      {isLoading ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      ) : subcategories && subcategories.length > 0 ? (
        <View className="mt-2">
          {subcategories.map((subcategory: Subcategory) => {
            const isSelected = selectedCategory.selectedSubcategories.includes(subcategory.id);
            
            return (
              <TouchableOpacity
                key={subcategory.id}
                onPress={() => onSubcategoryToggle(subcategory.id)}
                className={`flex-row items-center p-3 mb-2 rounded-xl border ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <View
                  className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && (
                    <MaterialIcons name="check" size={14} color="#FFFFFF" />
                  )}
                </View>
                <Text
                  className={`flex-1 text-sm ${
                    isSelected
                      ? 'text-blue-900 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {subcategory.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View className="py-3">
          <Text className="text-sm text-gray-400 text-center">
            No hay subcategorías disponibles
          </Text>
        </View>
      )}
    </View>
  );
};

export default SelectServices;
