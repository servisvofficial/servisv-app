import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import HeaderRegisterSteps from './HeaderRegisterSteps';
import { useRegistration } from '@/features/auth/contexts/RegistrationContext';
import { personalDataSchema, PersonalDataFields } from '@/features/auth/validators/registration.validator';
import CustomInput from '@/common/components/CustomInput';

const PersonalData = () => {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const isProvider = registrationData.userType === 'provider';

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<PersonalDataFields>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      nombre: registrationData.nombre || '',
      apellido: registrationData.apellido || '',
      email: registrationData.email || '',
      dui: registrationData.dui || '',
      telefono: registrationData.telefono || '',
      password: '',
      repeatPassword: '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: PersonalDataFields) => {
    // Guardar datos en el contexto
    updateRegistrationData({
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      dui: data.dui,
      telefono: data.telefono,
      password: data.password,
    });

    // Proveedor: primero elige categorías, después sube documentos. Cliente: va a verificar identidad (DUI).
    if (isProvider) {
      router.push('/(auth)/sign-up/select-services');
    } else {
      router.push('/(auth)/sign-up/verify-identity');
    }
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <HeaderRegisterSteps
          currentStep={1}
          totalSteps={isProvider ? 4 : 2}
          title={isProvider ? "Regístrate como Proveedor" : "Crear una Cuenta"}
        />

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Nombre y Apellido en fila */}
          <View className="flex-row mb-4 gap-3">
            <View className="flex-1">
              <Text className="text-sm text-gray-700 mb-2 font-medium">
                Nombre *
              </Text>
              <CustomInput
                control={control}
                name="nombre"
                placeholder="Tu nombre"
                inputClassName="h-12"
              />
            </View>

            <View className="flex-1">
              <Text className="text-sm text-gray-700 mb-2 font-medium">
                Apellido *
              </Text>
              <CustomInput
                control={control}
                name="apellido"
                placeholder="Tu apellido"
                inputClassName="h-12"
              />
            </View>
          </View>

          {/* Correo Electrónico */}
          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Correo electrónico *
            </Text>
            <CustomInput
              control={control}
              name="email"
              placeholder="nombre@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              inputClassName="h-12"
            />
          </View>

          {/* Documento de Identidad */}
          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Documento de Identidad (DUI) *
            </Text>
            <CustomInput
              control={control}
              name="dui"
              placeholder="00000000-0"
              keyboardType="default"
              inputClassName="h-12"
            />
          </View>

          {/* Teléfono */}
          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Teléfono
            </Text>
            <CustomInput
              control={control}
              name="telefono"
              placeholder="Ej: 7000-0000 o 0000-0000"
              keyboardType="phone-pad"
              inputClassName="h-12"
            />
          </View>

          {/* Contraseña */}
          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Contraseña *
            </Text>
            <CustomInput
              control={control}
              name="password"
              placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              inputClassName="h-12"
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              }
            />
          </View>

          {/* Repetir Contraseña */}
          <View className="mb-6">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Repetir Contraseña *
            </Text>
            <CustomInput
              control={control}
              name="repeatPassword"
              placeholder="Confirma tu contraseña"
              secureTextEntry={!showRepeatPassword}
              autoCapitalize="none"
              inputClassName="h-12"
              rightIcon={
                <TouchableOpacity onPress={() => setShowRepeatPassword(!showRepeatPassword)}>
                  <MaterialIcons
                    name={showRepeatPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              }
            />
          </View>

          {errors.root && (
            <View className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
              <Text className="text-red-600 text-sm">{errors.root.message}</Text>
            </View>
          )}
        </ScrollView>

        {/* Next Button */}
        <View className="px-5 pb-6 border-t border-gray-100 pt-4">
          <TouchableOpacity
            className="w-full rounded-3xl overflow-hidden"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            {isValid ? (
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
                  Completa todos los campos
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default PersonalData;
