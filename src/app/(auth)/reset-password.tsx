import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSignIn } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/common/providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RESET_EMAIL_KEY = 'servisv_reset_email';

type Step = 'code' | 'password' | 'success';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('code');

  useEffect(() => {
    const loadEmail = async () => {
      const fromParams = params.email;
      if (fromParams) {
        setEmail(fromParams);
        return;
      }
      const stored = await AsyncStorage.getItem(RESET_EMAIL_KEY);
      if (stored) setEmail(stored);
    };
    loadEmail();
  }, [params.email]);

  const handleVerifyCode = async () => {
    const trimmed = code.replace(/\D/g, '').slice(0, 6);
    if (trimmed.length !== 6) {
      Alert.alert('Código inválido', 'El código debe tener 6 dígitos.');
      return;
    }
    if (!signIn) {
      Alert.alert('Error', 'Solicita un código de recuperación primero.');
      router.replace('/(auth)/forgot-password');
      return;
    }

    setIsLoading(true);
    try {
      if (!signIn.supportedFirstFactors?.length && email) {
        await signIn.create({
          strategy: 'reset_password_email_code',
          identifier: email,
        });
      }

      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: trimmed,
      });

      if (result.status === 'needs_new_password') {
        await AsyncStorage.removeItem(RESET_EMAIL_KEY);
        setStep('password');
      } else if (result.status === 'complete' && result.createdSessionId && setActive) {
        await AsyncStorage.removeItem(RESET_EMAIL_KEY);
        await setActive({ session: result.createdSessionId });
        router.replace('/(protected)/(mainTabs)/home');
      }
    } catch (error: any) {
      const codeErr = error.errors?.[0]?.code;
      if (codeErr === 'form_code_incorrect') {
        Alert.alert('Código incorrecto', 'El código no es válido. Verifica e intenta de nuevo.');
      } else if (codeErr === 'form_code_expired') {
        Alert.alert('Código expirado', 'Solicita un nuevo código.');
        router.replace('/(auth)/forgot-password');
      } else if (codeErr === 'form_identifier_not_found') {
        Alert.alert('Error', 'No hay una solicitud activa. Solicita un nuevo código.');
        router.replace('/(auth)/forgot-password');
      } else {
        Alert.alert('Error', error.errors?.[0]?.message || 'Código inválido o expirado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Campos requeridos', 'Completa la nueva contraseña y la confirmación.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Deben ser iguales.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Contraseña corta', 'Mínimo 8 caracteres.');
      return;
    }
    if (!signIn) return;

    setIsLoading(true);
    try {
      const result = await signIn.resetPassword({
        password: newPassword,
        signOutOfOtherSessions: false,
      });

      if (result.status === 'complete' && result.createdSessionId && setActive) {
        await setActive({ session: result.createdSessionId });
        setStep('success');
        setTimeout(() => {
          router.replace('/(protected)/(mainTabs)/home');
        }, 1500);
      }
    } catch (error: any) {
      Alert.alert('Error', error.errors?.[0]?.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
        justifyContent: 'center',
      }}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()} className="mb-6" hitSlop={12}>
        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      {step === 'code' && (
        <>
          <View className="items-center mb-8">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.card }}
            >
              <MaterialIcons name="vpn-key" size={32} color={colors.text} />
            </View>
            <Text className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>
              Código de verificación
            </Text>
            <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
              {email
                ? `Ingresa el código enviado a ${email}`
                : 'Ingresa el código de 6 dígitos que recibiste por email'}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
              Código
            </Text>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
              className="px-4 py-3 rounded-xl text-2xl text-center tracking-widest border"
              style={{
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleVerifyCode}
            disabled={isLoading || code.length !== 6}
            activeOpacity={0.8}
            className="mb-4"
          >
            {isLoading ? (
              <View
                className="py-4 rounded-2xl items-center justify-center"
                style={{ backgroundColor: colors.border }}
              >
                <ActivityIndicator color={colors.text} />
              </View>
            ) : (
              <LinearGradient
                colors={['#6366F1', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, borderRadius: 24, alignItems: 'center' }}
              >
                <Text className="text-white font-semibold text-base">Verificar código</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/forgot-password')}
            className="py-3 items-center"
          >
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              ¿No recibiste el código? Solicitar nuevo código
            </Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'password' && (
        <>
          <View className="items-center mb-8">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.card }}
            >
              <MaterialIcons name="lock" size={32} color={colors.text} />
            </View>
            <Text className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>
              Nueva contraseña
            </Text>
            <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
              Mínimo 8 caracteres
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
              Nueva contraseña
            </Text>
            <View className="relative">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
                className="px-4 py-3 pr-12 rounded-xl text-base border"
                style={{
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-0 bottom-0 justify-center"
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
              Confirmar contraseña
            </Text>
            <View className="relative">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
                className="px-4 py-3 pr-12 rounded-xl text-base border"
                style={{
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-0 bottom-0 justify-center"
              >
                <MaterialIcons
                  name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={
              isLoading ||
              newPassword.length < 8 ||
              newPassword !== confirmPassword
            }
            activeOpacity={0.8}
            className="mb-4"
          >
            {isLoading ? (
              <View
                className="py-4 rounded-2xl items-center justify-center"
                style={{ backgroundColor: colors.border }}
              >
                <ActivityIndicator color={colors.text} />
              </View>
            ) : (
              <LinearGradient
                colors={['#6366F1', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, borderRadius: 24, alignItems: 'center' }}
              >
                <Text className="text-white font-semibold text-base">Actualizar contraseña</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setStep('code');
              setCode('');
              setNewPassword('');
              setConfirmPassword('');
            }}
            className="py-3 items-center"
          >
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Volver a verificar código
            </Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'success' && (
        <View className="items-center">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.card }}
          >
            <MaterialIcons name="check-circle" size={32} color={colors.text} />
          </View>
          <Text className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>
            Contraseña actualizada
          </Text>
          <Text className="text-base text-center mb-6" style={{ color: colors.textSecondary }}>
            Serás redirigido al inicio.
          </Text>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      )}
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {content}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
