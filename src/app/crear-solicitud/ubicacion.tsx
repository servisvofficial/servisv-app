import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderCreateRequestSteps from '@/features/solicitudes/components/HeaderCreateRequestSteps';
import { useCreateRequest } from '@/features/solicitudes/contexts/CreateRequestContext';
import ServiceZoneMap from '@/features/auth/components/sign-up/components/ServiceZoneMap';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { IconSymbol } from '@/common/components/ui/IconSymbol';
import { useTheme } from '@/common/providers/ThemeProvider';

export default function CreateRequestStep3Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { requestData, updateRequestData } = useCreateRequest();
  const [location, setLocation] = useState(requestData.location || '');
  const [latitude, setLatitude] = useState<number | undefined>(requestData.coordinates?.lat);
  const [longitude, setLongitude] = useState<number | undefined>(requestData.coordinates?.lng);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState(requestData.location || '');
  const [predictions, setPredictions] = useState<Array<{ place_id: string; description: string }>>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Google Places API Key desde variables de entorno
  const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

  useEffect(() => {
    // Si no hay ubicación, intentar obtenerla
    if (!latitude || !longitude) {
      handleUseCurrentLocation();
    }
  }, []);

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
        setLocation(formattedAddress);
        setSearchQuery(formattedAddress);
      }
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
      const newAddress = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
      setLocation(newAddress);
      setSearchQuery(newAddress);
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
    setLocation(text);

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
    setLocation(prediction.description);
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
        setLocation(data.result.formatted_address || prediction.description);
        setSearchQuery(data.result.formatted_address || prediction.description);
      }
    } catch (error) {
      console.error('Error obteniendo detalles del lugar:', error);
    }
  };

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
    if (location && latitude && longitude) {
      updateRequestData({
        location,
        coordinates: { lat: latitude, lng: longitude },
      });
      router.push('/crear-solicitud/fecha-hora');
    }
  };

  const canContinue = location.trim().length > 0 && latitude !== undefined && longitude !== undefined;

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <HeaderCreateRequestSteps currentStep={3} totalSteps={6} title="Crear Solicitud" />
        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          <View className="mb-4">
            <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>Selecciona la ubicación</Text>
            <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>Mueve el mapa para ajustar la ubicación exacta donde necesitas el servicio.</Text>
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <IconSymbol name="location.fill" size={16} color={colors.text} />
                <Text className="text-sm ml-1 font-medium" style={{ color: colors.textSecondary }}>Buscar dirección *</Text>
              </View>
              <View className="relative">
                <View className="relative">
                  <TextInput
                    className="px-12 py-3 rounded-xl text-base"
                    placeholder="Escribe tu dirección o busca un lugar"
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    onFocus={() => { if (predictions.length > 0) setShowPredictions(true); }}
                    onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                    style={{ height: 56, lineHeight: Platform.OS === "ios" ? 0 : undefined, backgroundColor: colors.card, color: colors.text, borderColor: colors.border, borderWidth: 1 }}
                  />
                  <View className="absolute left-4 top-3.5 z-10">
                    <MaterialIcons name="location-on" size={20} color={colors.textSecondary} />
                  </View>
                  {isSearching && (
                    <View className="absolute right-4 top-3.5 z-10">
                      <ActivityIndicator size="small" color="#3B82F6" />
                    </View>
                  )}
                </View>
                {showPredictions && predictions.length > 0 && (
                  <View className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-50 max-h-60 overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {predictions.map((item, index) => (
                        <TouchableOpacity
                          key={`${item.place_id}-${index}`}
                          className="px-4 py-3"
                          style={index < predictions.length - 1 ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : undefined}
                          onPress={() => selectPlace(item)}
                        >
                          <View className="flex-row items-center">
                            <MaterialIcons name="place" size={20} color={colors.textSecondary} />
                            <Text className="ml-2 text-sm flex-1" style={{ color: colors.text }}>{item.description}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View className="mb-6 h-80 rounded-2xl overflow-hidden" style={{ borderColor: colors.border, borderWidth: 1 }}>
            {latitude && longitude ? (
              <ServiceZoneMap latitude={latitude} longitude={longitude} onLocationChange={handleLocationChange} />
            ) : (
              <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.border }}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="mt-2" style={{ color: colors.textSecondary }}>Cargando mapa...</Text>
              </View>
            )}
            <View className="absolute bottom-3 left-0 right-0 items-center">
              <View className="px-4 py-2 rounded-full shadow-md" style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, opacity: 0.95 }}>
                <Text className="text-xs font-medium" style={{ color: colors.text }}>Toca el mapa o arrastra el marcador para ajustar</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            className="mb-6 px-4 py-3 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
            onPress={handleUseCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? <ActivityIndicator size="small" color="#3B82F6" /> : <MaterialIcons name="my-location" size={20} color="#3B82F6" />}
            <Text className="text-sm ml-2" style={{ color: colors.text }}>{isGettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}</Text>
          </TouchableOpacity>
        </ScrollView>
        <View className="px-5 pb-6 pt-4" style={{ borderTopColor: colors.border, borderTopWidth: 1 }}>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" onPress={() => router.back()} activeOpacity={0.8}>
              <View style={{ backgroundColor: colors.border, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Anterior</Text>
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
