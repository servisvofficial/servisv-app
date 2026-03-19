import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useState, useEffect, useMemo } from "react";
import { getProviders } from "../services/get-providers";
import { getDistance } from "../utils/distance";
import { normalizeText } from "../utils/normalizeText";
import type { Provider, ProviderWithDistance } from "../interfaces/provider.interface";

interface UseProvidersOptions {
  category?: string;
  searchQuery?: string;
  enabled?: boolean;
  customLocation?: { latitude: number; longitude: number } | null;
}

interface UseProvidersResult {
  providers: ProviderWithDistance[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  locationError: string | null;
}

export const useProviders = (
  options: UseProvidersOptions = {}
): UseProvidersResult => {
  const { userId } = useAuth();
  const { category, searchQuery, enabled = true, customLocation } = options;

  const [userLocation, setUserLocation] =
    useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);

  // Si se proporciona una ubicación personalizada, usarla directamente
  // Si no, obtener la ubicación del dispositivo
  useEffect(() => {
    if (customLocation) {
      // Solo actualizar si la ubicación realmente cambió
      setUserLocation(prev => {
        if (prev?.latitude === customLocation.latitude && prev?.longitude === customLocation.longitude) {
          return prev; // No cambiar si es la misma ubicación
        }
        return customLocation;
      });
      setLocationError(null);
      return;
    }

    // Solo solicitar ubicación si no hay una personalizada y está habilitado
    if (!enabled) {
      return;
    }

    const requestLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Permiso de ubicación denegado");
          return;
        }

        setLocationPermissionGranted(true);

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setLocationError(null);
      } catch (error) {
        console.error("Error al obtener ubicación:", error);
        setLocationError("Error al obtener ubicación");
      }
    };

    requestLocation();
  }, [enabled, customLocation?.latitude, customLocation?.longitude]);

  // Obtener proveedores desde Supabase - cachear por 10 minutos
  const {
    data: allProviders = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Provider[], Error>({
    queryKey: ["providers"],
    queryFn: getProviders,
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutos - aumentar cache
    cacheTime: 1000 * 60 * 30, // 30 minutos - mantener en cache más tiempo
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    refetchOnMount: false, // No refetch al montar si hay datos en cache
  });

  // Filtrar y procesar proveedores usando useMemo para optimizar
  const providers: ProviderWithDistance[] = useMemo(() => {
    // 1. Filtrar solo proveedores validados y excluir al usuario actual si es proveedor
    let filtered = allProviders.filter((p) => {
      // Solo mostrar proveedores validados
      if (!p.is_validated) {
        return false;
      }
      // Excluir al usuario actual si es proveedor
      if (userId && p.id === userId) {
        return false;
      }
      return true;
    });

    // 2. Filtrar por categoría si se especifica
    if (category) {
      // Normalizar la categoría: convertir guiones a espacios y normalizar texto
      const categoryNormalized = normalizeText(category.trim());
      
      const beforeCategoryFilter = filtered.length;
      
      filtered = filtered.filter((p) => {
        if (!p.service_categories || p.service_categories.length === 0) {
          return false;
        }

        // Buscar en todas las categorías del proveedor
        const matches = p.service_categories.some((cat) => {
          const catNameNormalized = normalizeText(cat.category);

          // Verificar coincidencia exacta primero (más precisa)
          if (catNameNormalized === categoryNormalized) {
            return true;
          }

          // Verificar coincidencia parcial (más flexible)
          if (catNameNormalized.includes(categoryNormalized) || 
              categoryNormalized.includes(catNameNormalized)) {
            return true;
          }

          // Si no coincide la categoría, buscar en subcategorías
          if (cat.subcategories && cat.subcategories.length > 0) {
            return cat.subcategories.some((sub) => {
              const subNormalized = normalizeText(sub);
              // Coincidencia exacta o parcial en subcategorías
              return (
                subNormalized === categoryNormalized ||
                subNormalized.includes(categoryNormalized) ||
                categoryNormalized.includes(subNormalized)
              );
            });
          }

          return false;
        });
        
        return matches;
      });
    }

    // 3. Filtrar por búsqueda si se especifica - SOLO por nombre del proveedor
    if (searchQuery) {
      const queryLower = normalizeText(searchQuery);
      filtered = filtered.filter((p) => {
        // Buscar SOLO en nombre y apellido
        const fullName = `${p.name} ${p.last_name}`;
        return normalizeText(fullName).includes(queryLower);
      });
    }

    // 4. Si hay ubicación del usuario, calcular distancias y mostrar los que están dentro del radio
    if (userLocation) {
      // Separar proveedores con y sin coordenadas
      const providersWithCoords: Provider[] = [];
      const providersWithoutCoords: Provider[] = [];

      filtered.forEach((provider) => {
        if (provider.coordinates && provider.service_radius) {
          providersWithCoords.push(provider);
        } else {
          providersWithoutCoords.push(provider);
        }
      });

      // Calcular distancias para proveedores con coordenadas
      const nearbyProviders: ProviderWithDistance[] = providersWithCoords
        .map((provider) => {
          const distance = getDistance(
            userLocation.latitude,
            userLocation.longitude,
            provider.coordinates!.lat,
            provider.coordinates!.lng
          );

          return {
            ...provider,
            distance,
          };
        })
        .filter((provider) => {
          // SOLO incluir proveedores que estén dentro de su radio de servicio
          const distance = provider.distance ?? Infinity;
          const radius = provider.service_radius ?? 0;
          return distance <= radius;
        })
        .sort((a, b) => {
          // Ordenar por distancia (más cercanos primero)
          const distA = a.distance ?? Infinity;
          const distB = b.distance ?? Infinity;
          return distA - distB;
        });

      // Agregar proveedores sin coordenadas al final (sin distancia)
      const providersWithoutDistance = providersWithoutCoords.map((p) => ({
        ...p,
        distance: undefined,
      }));

      // Retornar primero los cercanos, luego los sin coordenadas
      return [...nearbyProviders, ...providersWithoutDistance];
    }

    // 5. Si no hay ubicación, retornar todos los proveedores filtrados (sin distancia)
    return filtered.map((p) => ({ ...p, distance: undefined }));
  }, [allProviders, userId, category, searchQuery, userLocation]);

  return {
    providers,
    isLoading,
    error: error || null,
    refetch,
    userLocation,
    locationError,
  };
};
