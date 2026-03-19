import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRegistration } from '@/features/auth/contexts/RegistrationContext';

const RolSelect = () => {
  const router = useRouter();
  const { setUserType } = useRegistration();

  const handleCliente = () => {
    // Establecer tipo de usuario como cliente
    setUserType('client');
    router.push('/(auth)/sign-up/personal-data');
  };

  const handleProveedor = () => {
    // Establecer tipo de usuario como proveedor
    setUserType('provider');
    router.push('/(auth)/sign-up/personal-data');
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          {/* Icon with gradient */}
          <View className="mb-8">
            <LinearGradient
              colors={['#6366F1', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSymbol name="briefcase.fill" size={48} color="#FFF" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text className="text-3xl font-bold text-gray-900 text-center mb-3">
            ¿Cómo quieres usar ServiSV?
          </Text>

          {/* Description */}
          <Text className="text-base text-gray-500 text-center mb-12">
            Elige el tipo de cuenta que se ajuste a tus necesidades.
          </Text>

          {/* Cliente Option */}
          <TouchableOpacity
            className="w-full bg-white rounded-3xl p-6 mb-4 flex-row items-center border border-gray-200 shadow-sm"
            onPress={handleCliente}
            activeOpacity={0.7}
          >
            <View className="w-14 h-14 rounded-full bg-blue-50 items-center justify-center mr-4">
              <IconSymbol name="person.fill" size={28} color="#6366F1" />
            </View>

            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 mb-1">
                Registrarse como Cliente
              </Text>
              <Text className="text-sm text-gray-500">
                Encuentra y contrata a los mejores profesionales.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Proveedor Option with Gradient */}
          <TouchableOpacity
            className="w-full rounded-3xl mb-8 overflow-hidden shadow-lg"
            onPress={handleProveedor}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#6366F1', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                padding: 24,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-4">
                <IconSymbol name="wrench.and.screwdriver.fill" size={28} color="#FFF" />
              </View>

              <View className="flex-1">
                <Text className="text-lg font-bold text-white mb-1">
                  Registrarse como Proveedor
                </Text>
                <Text className="text-sm text-white/90">
                  Ofrece tus servicios y consigue más clientes.
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
            <Text className="text-base text-gray-700">
              ¿Ya tienes una cuenta?{' '}
              <Text className="font-bold" style={{ color: '#6366F1' }}>
                Inicia Sesión
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default RolSelect;
