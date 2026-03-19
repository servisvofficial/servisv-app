import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface ServiceZoneMapProps {
  latitude?: number;
  longitude?: number;
  serviceRange?: number; // Radio en km
  onLocationChange: (coords: { latitude: number; longitude: number }) => void;
}

const ServiceZoneMap: React.FC<ServiceZoneMapProps> = ({
  latitude,
  longitude,
  serviceRange,
  onLocationChange,
}) => {
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Coordenadas por defecto: San Salvador, El Salvador
  const DEFAULT_COORDS = { latitude: 13.6929, longitude: -89.2182 };

  useEffect(() => {
    const initializeLocation = async () => {
      if (latitude && longitude) {
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setIsInitialized(true);
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        let coords;
        
        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado');
          coords = DEFAULT_COORDS;
        } else {
          try {
            const currentLocation = await Location.getCurrentPositionAsync({});
            coords = currentLocation.coords;
          } catch (error) {
            console.error('Error al obtener ubicación:', error);
            setErrorMsg('Error al obtener ubicación');
            coords = DEFAULT_COORDS;
          }
        }
        onLocationChange(coords);
      }
    };

    if (!isInitialized) {
      initializeLocation();
    }
  }, [latitude, longitude, isInitialized, onLocationChange]);

  useEffect(() => {
    if (latitude && longitude) {
      setRegion(prevRegion => ({
        ...(prevRegion || {
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }),
        latitude,
        longitude,
      }));
    }
  }, [latitude, longitude]);

  const handleMapPress = (event: any) => {
    const newCoords = event.nativeEvent.coordinate;
    onLocationChange(newCoords);
  };

  if (errorMsg) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 rounded-2xl">
        <Text className="text-red-600 text-center px-4">{errorMsg}</Text>
      </View>
    );
  }

  if (!latitude || !longitude) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 rounded-2xl">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-2">Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <MapView
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={styles.map}
      region={region}
      onRegionChangeComplete={setRegion}
      onPress={handleMapPress}
      zoomControlEnabled={true}
      initialRegion={{
        latitude: latitude || DEFAULT_COORDS.latitude,
        longitude: longitude || DEFAULT_COORDS.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        draggable
        onDragEnd={handleMapPress}
      />
      {serviceRange && serviceRange > 0 && (
        <Circle
          center={{ latitude, longitude }}
          radius={serviceRange * 1000} // Convertir km a metros
          strokeColor="rgba(59, 130, 246, 0.5)"
          fillColor="rgba(59, 130, 246, 0.2)"
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
});

export default ServiceZoneMap;
