import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useCreateRequest } from '@/features/solicitudes/contexts/CreateRequestContext';
import { useTheme } from '@/common/providers/ThemeProvider';

export default function ConfirmacionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { resetRequestData } = useCreateRequest();

  const success = params.success === 'true';
  const error = params.error as string | undefined;

  const handleGoHome = () => {
    resetRequestData();
    router.replace('/(protected)/(mainTabs)/home');
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="px-5 py-4" style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}>
          <Text className="text-lg font-bold text-center" style={{ color: colors.text }}>Crear Solicitud</Text>
        </View>
        <View className="flex-1 items-center justify-center px-5">
          {success ? (
            <>
              <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                <MaterialIcons name="check-circle" size={64} color="#10B981" />
              </View>
              <Text className="text-2xl font-bold mb-3 text-center" style={{ color: colors.text }}>¡Solicitud Publicada!</Text>
              <Text className="text-base mb-8 text-center px-4" style={{ color: colors.textSecondary }}>Tu solicitud ha sido publicada exitosamente. Los proveedores cercanos podrán verla y enviarte presupuestos.</Text>
            </>
          ) : (
            <>
              <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                <MaterialIcons name="error" size={64} color="#EF4444" />
              </View>
              <Text className="text-2xl font-bold mb-3 text-center" style={{ color: colors.text }}>Error al Publicar</Text>
              <Text className="text-base mb-2 text-center px-4" style={{ color: colors.textSecondary }}>{error || 'Ocurrió un error al publicar tu solicitud. Por favor, intenta nuevamente.'}</Text>
            </>
          )}
          <TouchableOpacity className="w-full rounded-3xl overflow-hidden mt-8" onPress={handleGoHome} activeOpacity={0.8}>
            <LinearGradient colors={['#4F46E5', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              <Text className="text-white text-base font-semibold">{success ? 'Ir a Inicio' : 'Intentar Nuevamente'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          {success && (
            <TouchableOpacity
              className="w-full rounded-3xl overflow-hidden mt-4"
              onPress={() => { resetRequestData(); router.replace('/(protected)/(mainTabs)/trabajos'); }}
              activeOpacity={0.8}
            >
              <View style={{ backgroundColor: colors.border, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Ver Mis Solicitudes</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
