import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Header, SearchBar } from '@/common/components';
import { useRequests } from '@/common/hooks';
import { useTheme } from '@/common/providers/ThemeProvider';
import { getCategoryIcon, getCategoryColor } from '@/common/utils/categoryIcons';
import { useProviderCounts } from '@/features/providers';

export default function ServiciosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: categories = [], isLoading } = useRequests();
  const { colors } = useTheme();
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Obtener conteos de proveedores para todas las categorías
  const categoryNames = categories.map((cat) => cat.name);
  const { data: providerCounts = new Map<string, number>(), isLoading: isLoadingCounts } = useProviderCounts(categoryNames);
  
  // Filtrar y agrupar categorías por tipo
  const groupedCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? categories.filter((cat) => cat.name.toLowerCase().includes(query))
      : categories;

    const technical = filtered.filter((c) => c.category_type === 'technical');
    const professional = filtered.filter((c) => c.category_type === 'professional');
    // Cualquier tipo no mapeado cae en "otros"
    const other = filtered.filter(
      (c) => c.category_type !== 'technical' && c.category_type !== 'professional'
    );

    return [
      { key: 'technical', label: 'Servicios Técnicos y Oficios', icon: 'build' as const, items: technical },
      { key: 'professional', label: 'Servicios Profesionales', icon: 'work' as const, items: professional },
      ...(other.length > 0
        ? [{ key: 'other', label: 'Otros Servicios', icon: 'category' as const, items: other }]
        : []),
    ].filter((section) => section.items.length > 0);
  }, [categories, searchQuery]);
  
  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8); // Solo la altura del tab bar, sin extra

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ backgroundColor: "transparent" }}>
      <View 
        className="flex-row items-center justify-between px-5 py-4 border-b"
        style={{ 
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 16 
        }}
      >
        <View className="flex-row items-center">
          <MaterialIcons name="apps" size={24} color={colors.textSecondary} />
          <Text className="text-2xl font-bold ml-2" style={{ color: colors.text }}>Servicios</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSearchBar(!showSearchBar)}>
          <MaterialIcons name="search" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
      >
        <View className="pt-4">
          {/* Barra de búsqueda - Solo se muestra cuando showSearchBar es true */}
          {showSearchBar && (
            <View className="px-5 mb-4">
              <SearchBar 
                placeholder="Buscar servicios..." 
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />
            </View>
          )}
          
          <View className="px-5">
            {isLoading ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-4" style={{ color: colors.textSecondary }}>Cargando categorías...</Text>
              </View>
            ) : groupedCategories.length === 0 ? (
              <View className="py-20 items-center">
                <MaterialIcons name="search-off" size={48} color={colors.textSecondary} />
                <Text className="mt-4 text-center font-semibold" style={{ color: colors.text }}>
                  No se encontraron categorías
                </Text>
                <Text className="mt-2 text-center text-sm" style={{ color: colors.textSecondary }}>
                  Intenta con otros términos de búsqueda
                </Text>
              </View>
            ) : (
              <>
                {groupedCategories.map((section) => (
                  <View key={section.key} className="mb-2">
                    {/* Título de sección */}
                    <View className="flex-row items-center mb-4 mt-2">
                      <View
                        className="w-7 h-7 rounded-lg items-center justify-center mr-2"
                        style={{ backgroundColor: colors.primary + '18' }}
                      >
                        <MaterialIcons name={section.icon} size={16} color={colors.primary} />
                      </View>
                      <Text className="text-base font-bold" style={{ color: colors.text }}>
                        {section.label}
                      </Text>
                    </View>

                    {/* Grid de categorías */}
                    <View className="flex-row flex-wrap justify-between">
                      {section.items.map((categoria) => {
                        const iconName = getCategoryIcon(categoria.name);
                        const categoryColor = getCategoryColor(categoria.name);
                        const count = providerCounts.get(categoria.name);

                        return (
                          <TouchableOpacity
                            key={categoria.id}
                            className="w-[48%] mb-4 p-4 rounded-2xl border shadow-sm"
                            style={{ backgroundColor: colors.card, borderColor: colors.border }}
                            onPress={() => {
                              router.push({
                                pathname: '/(protected)/(mainTabs)/servicios/subcategorias' as any,
                                params: {
                                  categoryId: String(categoria.id),
                                  categoryName: categoria.name,
                                },
                              });
                            }}
                            activeOpacity={0.7}
                          >
                            <View className="items-center">
                              <View
                                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                                style={{ backgroundColor: categoryColor + '20' }}
                              >
                                <MaterialIcons name={iconName} size={32} color={categoryColor} />
                              </View>
                              <Text className="text-sm font-semibold text-center mb-1" style={{ color: colors.text }}>
                                {categoria.name}
                              </Text>
                              {isLoadingCounts ? (
                                <View className="h-3 w-24 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: colors.border + '40' }}>
                                  <View
                                    className="h-full w-full rounded-full"
                                    style={{ backgroundColor: colors.border, opacity: 0.5 }}
                                  />
                                </View>
                              ) : (
                                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                  {count !== undefined && count > 0 ? `${count}+ proveedores` : 'Sin proveedores'}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Separador entre secciones */}
                    <View className="h-px mb-4" style={{ backgroundColor: colors.border }} />
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      </ScrollView>
      </View>
    </LinearGradient>
  );
}
