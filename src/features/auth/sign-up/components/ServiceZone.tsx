import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderRegisterSteps from './HeaderRegisterSteps';
import Slider from '@react-native-community/slider';
import { useRegistration } from '@/features/auth/contexts/RegistrationContext';

const ServiceZone = () => {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  
  const isProvider = registrationData.userType === 'provider';
  const isClient = registrationData.userType === 'client';
  
  const [radioServicio, setRadioServicio] = useState(registrationData.radioServicio || 15);
  const [tipoVivienda, setTipoVivienda] = useState(registrationData.tipoVivienda || 'Casa');
  const [direccion, setDireccion] = useState(registrationData.direccion || '');
  const [duiFrontal, setDuiFrontal] = useState<string | null>(registrationData.duiFrontal || null);
  const [duiReverso, setDuiReverso] = useState<string | null>(registrationData.duiReverso || null);
  const [nombreBanco, setNombreBanco] = useState(registrationData.nombreBanco || '');
  const [tipoCuenta, setTipoCuenta] = useState(registrationData.tipoCuenta || 'Cuenta de Ahorro');
  const [numeroCuenta, setNumeroCuenta] = useState(registrationData.numeroCuenta || '');
  const [aceptaPoliticas, setAceptaPoliticas] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const handleUploadFrontal = () => {
    console.log('Subir foto frontal DUI');
    setDuiFrontal('frontal.jpg');
  };

  const handleUploadReverso = () => {
    console.log('Subir foto reverso DUI');
    setDuiReverso('reverso.jpg');
  };

  const handleNext = () => {
    // Guardar datos en el contexto
    updateRegistrationData({
      radioServicio,
      tipoVivienda,
      direccion,
      duiFrontal,
      duiReverso,
      nombreBanco,
      tipoCuenta,
      numeroCuenta,
    });

    router.push('/(auth)/sign-up/review');
  };

  // Validación según el rol
  const isFormValid = isProvider 
    ? (nombreBanco.trim() !== '' && numeroCuenta.trim() !== '' && aceptaPoliticas && aceptaTerminos)
    : (direccion.trim() !== '' && duiFrontal !== null && duiReverso !== null && aceptaPoliticas && aceptaTerminos);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <HeaderRegisterSteps
          currentStep={isProvider ? 4 : 2}
          totalSteps={isProvider ? 4 : 2}
          title={isProvider ? "Regístrate como Proveedor" : "Crear una Cuenta"}
        />

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Para Clientes: Dirección y Documentos */}
          {isClient && (
            <>
              {/* Tipo de Vivienda */}
              <View className="mb-6">
                <Text className="text-sm text-gray-700 mb-2 font-medium">
                  Tipo de vivienda *
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className={`flex-1 px-4 py-3 rounded-xl border-2 ${
                      tipoVivienda === 'Casa'
                        ? 'bg-purple-50 border-purple-500'
                        : 'bg-white border-gray-200'
                    }`}
                    onPress={() => setTipoVivienda('Casa')}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-base text-center font-medium ${
                        tipoVivienda === 'Casa' ? 'text-purple-700' : 'text-gray-900'
                      }`}
                    >
                      Casa
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-1 px-4 py-3 rounded-xl border-2 ${
                      tipoVivienda === 'Apartamento'
                        ? 'bg-purple-50 border-purple-500'
                        : 'bg-white border-gray-200'
                    }`}
                    onPress={() => setTipoVivienda('Apartamento')}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-base text-center font-medium ${
                        tipoVivienda === 'Apartamento'
                          ? 'text-purple-700'
                          : 'text-gray-900'
                      }`}
                    >
                      Apartamento
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dirección */}
              <View className="mb-6">
                <View className="flex-row items-center mb-2">
                  <IconSymbol name="location.fill" size={16} color="#111827" />
                  <Text className="text-sm text-gray-700 ml-1 font-medium">
                    Tu dirección *
                  </Text>
                </View>
                <TouchableOpacity
                  className="px-4 py-3 bg-white rounded-xl border border-gray-200"
                  onPress={() => setDireccion('Ubicación seleccionada')}
                >
                  <Text className={`text-base ${direccion ? 'text-gray-900' : 'text-gray-500'}`}>
                    {direccion || 'Selecciona tu ubicación en el mapa'}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row mt-3 gap-3">
                  <TouchableOpacity
                    className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200"
                    onPress={() => setDireccion('Ubicación desde mapa')}
                  >
                    <Text className="text-sm text-gray-900 text-center">
                      Mostrar mapa
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200"
                    onPress={() => setDireccion('Mi ubicación actual')}
                  >
                    <Text className="text-sm text-gray-900 text-center">
                      Usar mi ubicación
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Foto DUI Frontal */}
              <View className="mb-4">
                <Text className="text-sm text-gray-700 mb-2 font-medium">
                  Foto del DUI - Frente *
                </Text>
                <TouchableOpacity
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 items-center justify-center bg-white"
                  onPress={handleUploadFrontal}
                  activeOpacity={0.7}
                >
                  {duiFrontal ? (
                    <View className="items-center">
                      <IconSymbol name="checkmark.circle.fill" size={40} color="#10B981" />
                      <Text className="text-sm text-green-600 mt-2 font-medium">
                        Imagen cargada
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Frente del DUI (JPG, PNG, PDF)
                      </Text>
                    </View>
                  ) : (
                    <View className="items-center">
                      <IconSymbol name="arrow.up.doc" size={40} color="#9CA3AF" />
                      <Text className="text-sm text-gray-900 mt-2">
                        Haz clic o arrastra
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Frente del DUI (JPG, PNG, PDF)
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Foto DUI Reverso */}
              <View className="mb-6">
                <Text className="text-sm text-gray-700 mb-2 font-medium">
                  Foto del DUI - Dorso *
                </Text>
                <TouchableOpacity
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 items-center justify-center bg-white"
                  onPress={handleUploadReverso}
                  activeOpacity={0.7}
                >
                  {duiReverso ? (
                    <View className="items-center">
                      <IconSymbol name="checkmark.circle.fill" size={40} color="#10B981" />
                      <Text className="text-sm text-green-600 mt-2 font-medium">
                        Imagen cargada
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Dorso del DUI (JPG, PNG, PDF)
                      </Text>
                    </View>
                  ) : (
                    <View className="items-center">
                      <IconSymbol name="arrow.up.doc" size={40} color="#9CA3AF" />
                      <Text className="text-sm text-gray-900 mt-2">
                        Haz clic o arrastra
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Dorso del DUI (JPG, PNG, PDF)
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Para Proveedores: Zona de Servicio */}
          {isProvider && (
            <>
              <Text className="text-xl font-bold text-gray-900 mb-2">
                Configura tu zona de servicio
              </Text>
              
              <Text className="text-sm text-gray-600 mb-6">
                Fija tu ubicación base en el mapa. Los clientes te encontrarán según tu radio de servicio.
              </Text>

        {/* Map Placeholder */}
        <View className="w-full h-64 bg-gray-100 rounded-2xl mb-6 overflow-hidden items-center justify-center">
          <View className="items-center">
            <IconSymbol name="map.fill" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4">Mapa de ubicación</Text>
          </View>
          
          {/* Pin simulado */}
          <View className="absolute">
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center">
              <IconSymbol name="mappin" size={24} color="#FFF" />
            </View>
          </View>
        </View>

        {/* Ubicación */}
        <View className="mb-6">
          <Text className="text-sm text-gray-700 mb-2 font-medium">
            Ubicación base
          </Text>
          <TouchableOpacity 
            className="px-4 py-3 bg-gray-50 rounded-xl flex-row items-center justify-between border border-gray-200"
            activeOpacity={0.7}
          >
            <Text className="text-gray-900">Colonia Escalón, San Salvador</Text>
            <IconSymbol name="location.fill" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Radio de servicio */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-gray-700 font-medium">
              Radio de servicio
            </Text>
            <Text className="text-lg font-bold text-blue-600">
              {radioServicio} km
            </Text>
          </View>

          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={1}
            maximumValue={50}
            value={radioServicio}
            onValueChange={setRadioServicio}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#3B82F6"
            step={1}
          />

          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-gray-500">1 km</Text>
            <Text className="text-xs text-gray-500">50 km</Text>
          </View>
        </View>

        <View className="p-4 bg-blue-50 rounded-xl mb-6">
          <Text className="text-sm text-blue-900">
            💡 Los clientes dentro de tu radio de servicio podrán ver tu perfil y solicitar tus servicios.
          </Text>
        </View>
            </>
          )}

        {/* Información Bancaria - Solo para proveedores */}
        {isProvider && (
        <View className="mb-6 pt-6 border-t border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            Información Bancaria *
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Necesitamos tu información bancaria para poder realizar los pagos de tus servicios.
          </Text>

          {/* Nombre del Banco */}
          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Nombre del banco *
            </Text>
            <TextInput
              className="px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900 border border-gray-200"
              placeholder="Ej: Banco Agrícola, Banco de América Central, etc."
              value={nombreBanco}
              onChangeText={setNombreBanco}
            />
          </View>

          {/* Tipo de Cuenta */}
          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Tipo de cuenta *
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 px-4 py-3 rounded-xl border-2 ${
                  tipoCuenta === 'Cuenta de Ahorro'
                    ? 'bg-purple-50 border-purple-500'
                    : 'bg-white border-gray-200'
                }`}
                onPress={() => setTipoCuenta('Cuenta de Ahorro')}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-base text-center font-medium ${
                    tipoCuenta === 'Cuenta de Ahorro'
                      ? 'text-purple-700'
                      : 'text-gray-900'
                  }`}
                >
                  Cuenta de Ahorro
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 px-4 py-3 rounded-xl border-2 ${
                  tipoCuenta === 'Cuenta Corriente'
                    ? 'bg-purple-50 border-purple-500'
                    : 'bg-white border-gray-200'
                }`}
                onPress={() => setTipoCuenta('Cuenta Corriente')}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-base text-center font-medium ${
                    tipoCuenta === 'Cuenta Corriente'
                      ? 'text-purple-700'
                      : 'text-gray-900'
                  }`}
                >
                  Cuenta Corriente
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Número de Cuenta */}
          <View className="mb-6">
            <Text className="text-sm text-gray-700 mb-2 font-medium">
              Número de cuenta bancaria *
            </Text>
            <TextInput
              className="px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-900 border border-gray-200"
              placeholder="Ej: 1234567890123456"
              value={numeroCuenta}
              onChangeText={setNumeroCuenta}
              keyboardType="numeric"
            />
          </View>
        </View>
        )}

        {/* Políticas y Términos */}
        <View className="mb-6">
          <TouchableOpacity
            className="flex-row items-start mb-4"
            onPress={() => setAceptaPoliticas(!aceptaPoliticas)}
            activeOpacity={0.7}
          >
            <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${aceptaPoliticas ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
              {aceptaPoliticas && <IconSymbol name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text className="flex-1 text-sm text-gray-700">
              Acepto la{' '}
              <Text className="text-purple-600 font-medium">Política de Privacidad</Text>
              {' '}de ServiSV. *
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-start"
            onPress={() => setAceptaTerminos(!aceptaTerminos)}
            activeOpacity={0.7}
          >
            <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${aceptaTerminos ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
              {aceptaTerminos && <IconSymbol name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text className="flex-1 text-sm text-gray-700">
              Acepto los{' '}
              <Text className="text-purple-600 font-medium">Términos y Condiciones</Text>
              {' '}de ServiSV. Al registrarme, confirmo que he leído y acepto todas las políticas. *
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Complete Registration Button */}
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
                Completar Registro
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
                Completar Registro
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="items-center mt-4"
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text className="text-base text-gray-700">
            Ya tienes una cuenta?{' '}
            <Text className="font-bold" style={{ color: '#6366F1' }}>Inicia Sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ServiceZone;

