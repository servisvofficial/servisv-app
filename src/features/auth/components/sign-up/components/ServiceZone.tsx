import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderRegisterSteps from './HeaderRegisterSteps';
import Slider from '@react-native-community/slider';
import { useRegistration } from '@/features/auth/contexts/RegistrationContext';
import ServiceZoneMap from './ServiceZoneMap';
import * as Location from 'expo-location';

const ServiceZone = () => {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  
  const isProvider = registrationData.userType === 'provider';
  const isClient = registrationData.userType === 'client';
  
  const [radioServicio, setRadioServicio] = useState(registrationData.radioServicio || 15);
  const [tipoVivienda, setTipoVivienda] = useState(registrationData.tipoVivienda || 'Casa');
  const [direccion, setDireccion] = useState(registrationData.direccion || '');
  const [latitude, setLatitude] = useState<number | undefined>(registrationData.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(registrationData.longitude);
  const [searchQuery, setSearchQuery] = useState(registrationData.direccion || '');
  const [predictions, setPredictions] = useState<Array<{ place_id: string; description: string }>>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [nombreBanco, setNombreBanco] = useState(registrationData.nombreBanco || '');
  const [tipoCuenta, setTipoCuenta] = useState(
    registrationData.tipoCuenta === 'ahorro' ? 'Cuenta de Ahorro' : 
    registrationData.tipoCuenta === 'corriente' ? 'Cuenta Corriente' : 
    'Cuenta de Ahorro'
  );
  const [numeroCuenta, setNumeroCuenta] = useState(registrationData.numeroCuenta || '');
  const [aceptaPoliticas, setAceptaPoliticas] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Google Places API Key desde variables de entorno
  const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

  // Manejar cambio de ubicación desde el mapa
  const handleLocationChange = async (coords: { latitude: number; longitude: number }) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);

    try {
      const addressResponse = await Location.reverseGeocodeAsync(coords);
      if (addressResponse && addressResponse.length > 0) {
        const ad = addressResponse[0];
        const streetPart = ad.streetNumber
          ? `${ad.street} ${ad.streetNumber}`
          : ad.street;
        const formattedAddress = [streetPart, ad.city, ad.region, ad.country]
          .filter(Boolean)
          .join(', ');
        setDireccion(formattedAddress);
        setSearchQuery(formattedAddress); // Actualizar también el input de búsqueda
      }
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
      const newAddress = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
      setDireccion(newAddress);
      setSearchQuery(newAddress); // Actualizar también el input de búsqueda
    }
  };

  // Buscar lugares usando Google Places API
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3 || !GOOGLE_PLACES_API_KEY) {
      setPredictions([]);
      setShowPredictions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Búsqueda global sin restricciones de país
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_PLACES_API_KEY}&types=geocode&language=es`
      );
      const data = await response.json();

      if (data.predictions) {
        setPredictions(data.predictions);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('Error buscando lugares:', error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setDireccion(text);

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Limpiar sugerencias si el texto está vacío
    if (!text.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Buscar lugares con un delay para evitar demasiadas llamadas
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  };

  // Seleccionar un lugar de las sugerencias
  const selectPlace = async (prediction: { place_id: string; description: string }) => {
    setSearchQuery(prediction.description);
    setDireccion(prediction.description);
    setShowPredictions(false);

    if (!GOOGLE_PLACES_API_KEY) {
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_PLACES_API_KEY}&fields=geometry,formatted_address`
      );
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        handleLocationChange({
          latitude: lat,
          longitude: lng,
        });
        setDireccion(data.result.formatted_address || prediction.description);
      }
    } catch (error) {
      console.error('Error obteniendo detalles del lugar:', error);
    }
  };

  // Usar ubicación actual
  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso de ubicación denegado. Por favor, habilita los permisos de ubicación en la configuración de tu dispositivo.');
        setIsGettingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      await handleLocationChange({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      alert('Error al obtener tu ubicación. Por favor, intenta nuevamente.');
    } finally {
      setIsGettingLocation(false);
    }
  };


  const handleNext = () => {
    // Guardar datos en el contexto
    updateRegistrationData({
      radioServicio: isProvider ? radioServicio : undefined,
      tipoVivienda: isClient ? tipoVivienda : undefined,
      direccion,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      nombreBanco: isProvider ? nombreBanco : undefined,
      tipoCuenta: isProvider ? (tipoCuenta === 'Cuenta de Ahorro' ? 'ahorro' : 'corriente') : undefined,
      numeroCuenta: isProvider ? numeroCuenta : undefined,
    });

    router.push('/(auth)/sign-up/review');
  };

  // Validación según el rol
  const isFormValid = isProvider 
    ? (direccion.trim() !== '' && latitude !== undefined && longitude !== undefined && nombreBanco.trim() !== '' && numeroCuenta.trim() !== '' && aceptaPoliticas && aceptaTerminos)
    : (direccion.trim() !== '' && latitude !== undefined && longitude !== undefined && aceptaPoliticas && aceptaTerminos);

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
                <View className="relative">
                  <View className="relative">
                    <TextInput
                      className="px-12 py-3 bg-white rounded-xl border border-gray-200 text-base text-gray-900"
                      placeholder="Escribe tu dirección o busca un lugar"
                      placeholderTextColor="#9CA3AF"
                      value={searchQuery}
                      onChangeText={handleSearchChange}
                      onFocus={() => {
                        if (predictions.length > 0) {
                          setShowPredictions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay para permitir que se ejecute el onPress de las sugerencias
                        setTimeout(() => setShowPredictions(false), 200);
                      }}
                      style={{
                        height: 56,
                        lineHeight: Platform.OS === "ios" ? 0 : undefined,
                      }}
                    />
                    <View className="absolute left-4 top-3.5 z-10">
                      <MaterialIcons name="location-on" size={20} color="#6b7280" />
                    </View>
                    {isSearching && (
                      <View className="absolute right-4 top-3.5 z-10">
                        <ActivityIndicator size="small" color="#3B82F6" />
                      </View>
                    )}
                  </View>

                  {/* Lista de sugerencias */}
                  {showPredictions && predictions.length > 0 && (
                    <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-hidden">
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {predictions.map((item, index) => (
                          <TouchableOpacity
                            key={`${item.place_id}-${index}`}
                            className={`px-4 py-3 ${index < predictions.length - 1 ? 'border-b border-gray-100' : ''} active:bg-gray-50`}
                            onPress={() => selectPlace(item)}
                          >
                            <View className="flex-row items-center">
                              <MaterialIcons name="place" size={20} color="#9CA3AF" />
                              <Text className="ml-2 text-sm text-gray-900 flex-1">
                                {item.description}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  className="mt-3 px-4 py-3 bg-white rounded-xl border border-gray-200 flex-row items-center justify-center"
                  onPress={handleUseCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <MaterialIcons name="my-location" size={20} color="#3B82F6" />
                  )}
                  <Text className="text-sm text-gray-900 ml-2">
                    {isGettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Mapa */}
              <View className="mb-6 h-64 rounded-2xl overflow-hidden border border-gray-200">
                <ServiceZoneMap
                  latitude={latitude}
                  longitude={longitude}
                  onLocationChange={handleLocationChange}
                />
                <View className="absolute bottom-3 left-0 right-0 items-center">
                  <View className="bg-white/90 px-4 py-2 rounded-full shadow-md border border-gray-200">
                    <Text className="text-xs text-gray-700 font-medium">
                      Toca el mapa o arrastra el marcador para ajustar
                    </Text>
                  </View>
                </View>
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

        {/* Búsqueda de Dirección */}
        <View className="mb-6">
          <Text className="text-sm text-gray-700 mb-2 font-medium">
            Ubicación base *
          </Text>
          <View className="relative">
            <View className="relative">
              <TextInput
                className="px-12 py-3 bg-white rounded-xl border border-gray-200 text-base text-gray-900"
                placeholder="Escribe tu dirección o busca un lugar"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={handleSearchChange}
                style={{
                  height: 56,
                  lineHeight: Platform.OS === "ios" ? 0 : undefined,
                }}
                onFocus={() => {
                  if (predictions.length > 0) {
                    setShowPredictions(true);
                  }
                }}
                onBlur={() => {
                  // Delay para permitir que se ejecute el onPress de las sugerencias
                  setTimeout(() => setShowPredictions(false), 200);
                }}
              />
              <View className="absolute left-4 top-3.5 z-10">
                <MaterialIcons name="location-on" size={20} color="#6b7280" />
              </View>
              {isSearching && (
                <View className="absolute right-4 top-3.5 z-10">
                  <ActivityIndicator size="small" color="#3B82F6" />
                </View>
              )}
            </View>

            {/* Lista de sugerencias */}
            {showPredictions && predictions.length > 0 && (
              <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-hidden">
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {predictions.map((item, index) => (
                    <TouchableOpacity
                      key={`${item.place_id}-${index}`}
                      className={`px-4 py-3 ${index < predictions.length - 1 ? 'border-b border-gray-100' : ''} active:bg-gray-50`}
                      onPress={() => selectPlace(item)}
                    >
                      <View className="flex-row items-center">
                        <MaterialIcons name="place" size={20} color="#9CA3AF" />
                        <Text className="ml-2 text-sm text-gray-900 flex-1">
                          {item.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          <TouchableOpacity 
            className="mt-3 px-4 py-3 bg-white rounded-xl border border-gray-200 flex-row items-center justify-center"
            onPress={handleUseCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <MaterialIcons name="my-location" size={20} color="#3B82F6" />
            )}
            <Text className="text-sm text-gray-900 ml-2">
              {isGettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mapa */}
        <View className="mb-6 h-64 rounded-2xl overflow-hidden border border-gray-200">
          <ServiceZoneMap
            latitude={latitude}
            longitude={longitude}
            serviceRange={radioServicio}
            onLocationChange={handleLocationChange}
          />
          <View className="absolute bottom-3 left-0 right-0 items-center">
            <View className="bg-white/90 px-4 py-2 rounded-full shadow-md border border-gray-200">
              <Text className="text-xs text-gray-700 font-medium">
                Toca el mapa o arrastra el marcador para ajustar
              </Text>
            </View>
          </View>
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
              placeholderTextColor="#9CA3AF"
              value={nombreBanco}
              onChangeText={setNombreBanco}
              style={{
                height: 56,
                lineHeight: Platform.OS === "ios" ? 0 : undefined,
              }}
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
              placeholderTextColor="#9CA3AF"
              value={numeroCuenta}
              onChangeText={setNumeroCuenta}
              keyboardType="numeric"
              style={{
                height: 56,
                lineHeight: Platform.OS === "ios" ? 0 : undefined,
              }}
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

