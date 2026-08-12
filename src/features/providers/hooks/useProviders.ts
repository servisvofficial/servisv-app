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
  subcategory?: string; // when set, filters strictly by this subcategory within the parent category
  searchQuery?: string;
  enabled?: boolean;
  customLocation?: { latitude: number; longitude: number } | null;
  ignoreDistance?: boolean; // cuando true, no filtra por radio de servicio
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
  const { category, subcategory, searchQuery, enabled = true, customLocation, ignoreDistance = false } = options;

  const [userLocation, setUserLocation] =
    useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);

  // Si se proporciona una ubicación personalizada, usarla directamente
  // Si no, obtener la ubicación del dispositivo
  useEffect(() => {
    if (customLocation) {
      setUserLocation(prev => {
        if (
          prev?.latitude === customLocation.latitude &&
          prev?.longitude === customLocation.longitude
        ) {
          return prev;
        }
        return customLocation;
      });
      setLocationError(null);
      return;
    }

    if (!enabled) return;

    const requestLocation = async () => {
      try {
        // En iOS, verificar permisos existentes primero para no pedir de nuevo si ya están granted
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          setLocationError("Permiso de ubicación denegado");
          return;
        }

        setLocationPermissionGranted(true);

        // Intentar primero con lastKnownPosition (instantáneo) para mostrar resultados rápido
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setUserLocation({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
        }

        // Luego obtener la posición precisa y actualizar
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
        // Si ya teníamos una ubicación aproximada, no sobreescribir con error
        setUserLocation(prev => {
          if (prev) return prev;
          return null;
        });
        setLocationError("No se pudo obtener tu ubicación exacta");
      }
    };

    void requestLocation();
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

    // 2. Filtrar por categoría / subcategoría
    if (subcategory) {
      // Modo estricto: el proveedor debe tener la categoría padre Y la subcategoría exacta.
      // Esto evita falsos positivos por inclusión parcial de texto
      // (p.ej. "Limpieza" coincidiendo con "Mantenimiento y limpieza").
      const parentNormalized = category ? normalizeText(category.trim()) : null;
      const subNormalized = normalizeText(subcategory.trim());

      filtered = filtered.filter((p) => {
        if (!p.service_categories || p.service_categories.length === 0) return false;

        return p.service_categories.some((cat) => {
          const catNorm = normalizeText(cat.category);

          // Si se conoce la categoría padre, el proveedor debe pertenecer a ella
          if (parentNormalized && catNorm !== parentNormalized) return false;

          // El proveedor debe tener la subcategoría exacta (normalizada)
          return (
            cat.subcategories?.some((s) => normalizeText(s) === subNormalized) ?? false
          );
        });
      });
    } else if (category) {
      // Modo estándar: filtrar por categoría usando coincidencia flexible
      const categoryNormalized = normalizeText(category.trim());

      filtered = filtered.filter((p) => {
        if (!p.service_categories || p.service_categories.length === 0) return false;

        return p.service_categories.some((cat) => {
          const catNameNormalized = normalizeText(cat.category);

          if (catNameNormalized === categoryNormalized) return true;

          if (
            catNameNormalized.includes(categoryNormalized) ||
            categoryNormalized.includes(catNameNormalized)
          ) {
            return true;
          }

          // Buscar en subcategorías solo con coincidencia exacta para evitar
          // falsos positivos por palabras comunes
          return (
            cat.subcategories?.some((sub) => normalizeText(sub) === categoryNormalized) ??
            false
          );
        });
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

    // 4. Si hay ubicación del usuario y no se ignora la distancia, filtrar por radio de servicio
    if (userLocation && !ignoreDistance) {
      // Cap razonable: El Salvador mide ~250km de extremo a extremo
      const MAX_RADIUS_KM = 250;
      // Default para proveedores sin radio configurado (NULL en BD)
      const DEFAULT_RADIUS_KM = 15;

      const nearby: ProviderWithDistance[] = [];
      const withoutCoords: ProviderWithDistance[] = [];

      for (const provider of filtered) {
        const coords = provider.coordinates;

        // Si no tiene coordenadas válidas, incluirlo al final sin distancia
        if (!coords || typeof coords.lat !== "number" || typeof coords.lng !== "number") {
          withoutCoords.push({ ...provider, distance: undefined });
          continue;
        }

        // Usar el radio que el proveedor configuró, con cap sensato
        const rawRadius = provider.service_radius;
        const radius: number =
          rawRadius != null && rawRadius > 0
            ? Math.min(rawRadius, MAX_RADIUS_KM)
            : DEFAULT_RADIUS_KM;

        const distance = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          coords.lat,
          coords.lng
        );

        if (distance > radius) continue;

        nearby.push({ ...provider, distance });
      }

      // Ordenar por distancia (más cercanos primero) y agregar los sin coordenadas al final
      nearby.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

      return [...nearby, ...withoutCoords];
    }

    // 5. Sin ubicación del usuario: mostrar todos sin filtrar por distancia
    return filtered.map((p) => ({ ...p, distance: undefined }));
  }, [allProviders, userId, category, subcategory, searchQuery, userLocation, ignoreDistance]);

  return {
    providers,
    isLoading,
    error: error || null,
    refetch,
    userLocation,
    locationError,
  };
};
