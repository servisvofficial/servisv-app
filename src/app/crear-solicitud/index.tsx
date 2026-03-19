import { View, Text, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderCreateRequestSteps from '@/features/solicitudes/components/HeaderCreateRequestSteps';
import { useCreateRequest } from '@/features/solicitudes/contexts/CreateRequestContext';
import { useTheme } from '@/common/providers/ThemeProvider';

export default function CreateRequestStep1Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { requestData, updateRequestData } = useCreateRequest();
  const [title, setTitle] = useState(requestData.title || '');
  const [description, setDescription] = useState(requestData.description || '');

  const handleNext = () => {
    updateRequestData({ title, description });
    router.push('/crear-solicitud/categoria');
  };

  const canContinue = title.trim().length > 0 && description.trim().length > 0;

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <HeaderCreateRequestSteps
          currentStep={1}
          totalSteps={6}
          title="Crear Solicitud"
        />

        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-sm mb-2 font-medium" style={{ color: colors.textSecondary }}>
              Título de la solicitud *
            </Text>
            <TextInput
              className="px-4 py-3 rounded-xl text-base"
              placeholder="Ej: Fuga de agua en el lavabo"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              style={{ height: 56, backgroundColor: colors.card, color: colors.text, borderColor: colors.border, borderWidth: 1 }}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm mb-2 font-medium" style={{ color: colors.textSecondary }}>
              Descripción detallada *
            </Text>
            <TextInput
              className="px-4 py-3 rounded-xl text-base"
              placeholder="Proporciona todos los detalles relevantes sobre el trabajo que necesitas."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={{
                minHeight: 120,
                paddingTop: 16,
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            />
          </View>
        </ScrollView>

        <View className="px-5 pb-6 pt-4" style={{ borderTopColor: colors.border, borderTopWidth: 1 }}>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" disabled activeOpacity={0.8}>
              <View style={{ backgroundColor: colors.border, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="text-base font-semibold" style={{ color: colors.textSecondary }}>Anterior</Text>
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
