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
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSignIn } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/common/providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RESET_EMAIL_KEY = 'servisv_reset_email';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { signIn } = useSignIn();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Campo requerido', 'Por favor, ingresa tu correo electrónico.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert('Email inválido', 'Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (!signIn) {
      Alert.alert('Error', 'El servicio de autenticación no está disponible.');
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: trimmed,
      });
      await AsyncStorage.setItem(RESET_EMAIL_KEY, trimmed);
      setEmailSent(true);
      Alert.alert(
        'Email enviado',
        'Si existe una cuenta con ese email, recibirás un código para recuperar tu contraseña. Revisa también la carpeta de spam.'
      );
    } catch (error: any) {
      if (error.errors?.[0]?.code === 'form_identifier_not_found') {
        Alert.alert('Email no encontrado', 'No existe una cuenta con ese correo electrónico.');
      } else if (error.errors?.[0]?.code === 'rate_limit_exceeded') {
        Alert.alert('Demasiados intentos', 'Por favor, espera unos minutos antes de intentar nuevamente.');
      } else {
        setEmailSent(true);
        Alert.alert(
          'Email enviado',
          'Si existe una cuenta con ese email, recibirás un código para recuperar tu contraseña.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
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

          <View className="items-center mb-8">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.card }}
            >
              <MaterialIcons name="mark-email-read" size={32} color={colors.text} />
            </View>
            <Text className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>
              Revisa tu email
            </Text>
            <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
              Enviamos un código de 6 dígitos a{' '}
              <Text className="font-semibold" style={{ color: colors.text }}>{email}</Text>.
              El código expira en 1 hora.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(auth)/reset-password', params: { email } } as any)}
            activeOpacity={0.8}
            className="mb-4"
          >
            <LinearGradient
              colors={['#6366F1', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, borderRadius: 24, alignItems: 'center' }}
            >
              <Text className="text-white font-semibold text-base">Ingresar código</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="py-3 items-center"
          >
            <Text className="text-base font-medium" style={{ color: colors.textSecondary }}>
              Volver al inicio de sesión
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setEmailSent(false);
              setEmail('');
            }}
            className="py-3 items-center mt-2"
          >
            <Text className="text-base font-medium" style={{ color: colors.textSecondary }}>
              Enviar a otro correo
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

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

          <View className="items-center mb-8">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.card }}
            >
              <MaterialIcons name="mail-outline" size={32} color={colors.text} />
            </View>
            <Text className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>
              ¿Olvidaste tu contraseña?
            </Text>
            <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
              Ingresa tu correo y te enviaremos un código para recuperarla.
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
              Correo electrónico
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              className="px-4 py-3 rounded-xl text-base border"
              style={{
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
            className="mb-6"
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
                <Text className="text-white font-semibold text-base">Enviar código</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} className="items-center py-2">
            <Text className="text-base font-medium" style={{ color: colors.textSecondary }}>
              Volver al inicio de sesión
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
