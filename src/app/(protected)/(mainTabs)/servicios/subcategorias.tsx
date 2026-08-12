import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/common/providers/ThemeProvider";
import { useSubcategories } from "@/common/hooks/useSubcategories";
import { getCategoryIcon, getCategoryColor } from "@/common/utils/categoryIcons";

export default function SubcategoriasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();

  const categoryId = params.categoryId ? Number(params.categoryId) : null;
  const categoryName = params.categoryName ?? "";
  const categoryColor = getCategoryColor(categoryName);
  const categoryIcon = getCategoryIcon(categoryName);

  const { data: subcategories = [], isLoading } = useSubcategories(categoryId);

  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8);

  const handleSelectSubcategory = (subcategoryName: string) => {
    router.push({
      pathname: "/(protected)/(mainTabs)/servicios/buscar-proveedores" as any,
      params: {
        category: categoryName,
        subcategory: subcategoryName,
        categoryLabel: subcategoryName,
      },
    });
  };

  const handleVerTodos = () => {
    router.push({
      pathname: "/(protected)/(mainTabs)/servicios/buscar-proveedores" as any,
      params: { category: categoryName, categoryLabel: categoryName },
    });
  };

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
            paddingTop: insets.top + 16,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {categoryName}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
        >
          <View className="pt-5 px-5">
            {/* Descripción */}
            <Text
              className="text-sm mb-5 text-center"
              style={{ color: colors.textSecondary }}
            >
              Selecciona una especialidad o ve todos los proveedores de{" "}
              <Text className="font-semibold" style={{ color: colors.text }}>
                {categoryName}
              </Text>
            </Text>

            {isLoading ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4" style={{ color: colors.textSecondary }}>
                  Cargando especialidades...
                </Text>
              </View>
            ) : (
              <>
                {/* Grid de subcategorías */}
                {subcategories.length > 0 && (
                  <View className="flex-row flex-wrap justify-between mb-4">
                    {subcategories.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        className="w-[48%] mb-4 p-4 rounded-2xl border shadow-sm"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        }}
                        onPress={() => handleSelectSubcategory(sub.name)}
                        activeOpacity={0.7}
                      >
                        <View className="items-center">
                          <View
                            className="w-14 h-14 rounded-full items-center justify-center mb-3"
                            style={{ backgroundColor: categoryColor + "18" }}
                          >
                            <MaterialIcons
                              name={categoryIcon}
                              size={28}
                              color={categoryColor}
                            />
                          </View>
                          <Text
                            className="text-xs font-semibold text-center"
                            style={{ color: colors.text }}
                            numberOfLines={2}
                          >
                            {sub.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Botón "Ver todos" */}
                <TouchableOpacity
                  className="py-4 rounded-2xl border items-center flex-row justify-center"
                  style={{
                    backgroundColor: categoryColor + "12",
                    borderColor: categoryColor + "40",
                  }}
                  onPress={handleVerTodos}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="people" size={20} color={categoryColor} />
                  <Text
                    className="ml-2 font-semibold text-sm"
                    style={{ color: categoryColor }}
                  >
                    Ver todos los proveedores de {categoryName}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}
