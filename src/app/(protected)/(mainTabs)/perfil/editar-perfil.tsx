import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MyView } from '@/common/components';
import { useUserData, useUserRole, useCategories } from '@/common/hooks';
import { useTheme } from '@/common/providers/ThemeProvider';
import { supabase } from '@/common/lib/supabase/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { getUserInitials } from '@/common/utils/userHelpers';
import { getCategoryIcon, getCategoryColor } from '@/common/utils/categoryIcons';
import ServiceZoneMap from '@/features/auth/components/sign-up/components/ServiceZoneMap';
import * as Location from 'expo-location';
import { postImageToSupabase } from '@/common/services/post-image';
import useSupabaseStorage from '@/common/hooks/useSupabaseStorage';
import { useAuth } from '@clerk/clerk-expo';

export default function EditarPerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { user, isLoading: isLoadingUser } = useUserData();
  const { data: userRole } = useUserRole();
  const { userId } = useAuth();
  const isProvider = userRole === 'provider';
  const { handleUploadDocument, isLoading: isUploadingDoc } = useSupabaseStorage('documents');

  const [policeClearanceUrl, setPoliceClearanceUrl] = useState<string | null>(null);
  const [uploadingSolvencia, setUploadingSolvencia] = useState(false);
  
  // Calcular padding bottom para que el contenido llegue hasta el borde de las tabs
  const scrollViewPaddingBottom = 70 + Math.max(insets.bottom, 8);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [celPhone, setCelPhone] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<Array<{ place_id: string; description: string }>>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountType, setBankAccountType] = useState<'ahorro' | 'corriente'>('ahorro');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para categorías (solo proveedores)
  interface ServiceCategory {
    category: string;
    subcategories?: string[];
  }
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  
  // Obtener categorías disponibles
  const { data: categoriesData, isLoading: loadingCategoriesData } = useCategories();

  // Google Places API Key desde variables de entorno
  const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLastName(user.last_name || '');
      setCelPhone(user.cel_phone || '');
      setPoliceClearanceUrl((user as any).police_clearance_pic ?? null);
      setLocation(user.location || '');
      setSearchQuery(user.location || '');
      
      // Cargar coordenadas si existen
      if ((user as any).coordinates) {
        try {
          const coords = typeof (user as any).coordinates === 'string' 
            ? JSON.parse((user as any).coordinates) 
            : (user as any).coordinates;
          if (coords && coords.lat && coords.lng) {
            setLatitude(coords.lat);
            setLongitude(coords.lng);
          }
        } catch (error) {
          console.error('Error al parsear coordenadas:', error);
        }
      }
      
      setBankName((user as any).bank_name || '');
      setBankAccountNumber((user as any).bank_account_number || '');
      setBankAccountType(((user as any).bank_account_type as 'ahorro' | 'corriente') || 'ahorro');
      setProfileImage(user.profile_pic || null);
    }
  }, [user]);

  // Cargar categorías del proveedor
  useEffect(() => {
    if (isProvider && user?.id) {
      loadProviderCategories();
    }
  }, [isProvider, user?.id]);

  const loadProviderCategories = async () => {
    if (!user?.id) return;

    setLoadingCategories(true);
    try {
      const { data: services, error } = await supabase
        .from("user_professional_services")
        .select(
          `
          category_id,
          categories:category_id (id, name),
          subcategories:subcategory_id (id, name)
        `
        )
        .eq("user_id", user.id);

      if (error) {
        console.error("Error al cargar categorías:", error);
        return;
      }

      if (services && services.length > 0) {
        const categoriesMap = new Map<string, ServiceCategory>();

        services.forEach((service: any) => {
          const categoryName = service.categories?.name;
          const subcategoryName = service.subcategories?.name;

          if (!categoryName) return;

          if (!categoriesMap.has(categoryName)) {
            categoriesMap.set(categoryName, {
              category: categoryName,
              subcategories: [],
            });
          }

          if (subcategoryName) {
            const category = categoriesMap.get(categoryName)!;
            if (category && category.subcategories && !category.subcategories.includes(subcategoryName)) {
              category.subcategories.push(subcategoryName);
            }
          }
        });

        setServiceCategories(Array.from(categoriesMap.values()));
      }
    } catch (error) {
      console.error("Error al cargar categorías del proveedor:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = () => {
    if (serviceCategories.length >= 3) {
      Alert.alert('Límite alcanzado', 'Puedes seleccionar hasta 3 categorías.');
      return;
    }
    setServiceCategories([...serviceCategories, { category: '' }]);
  };

  const handleRemoveCategory = (index: number) => {
    if (serviceCategories.length <= 1) {
      Alert.alert('Mínimo requerido', 'Debes tener al menos 1 categoría.');
      return;
    }
    const newCategories = serviceCategories.filter((_, i) => i !== index);
    setServiceCategories(newCategories);
  };

  const handleCategoryChange = (index: number, categoryName: string) => {
    const newCategories = [...serviceCategories];
    const selectedCategory = categoriesData?.find(cat => cat.name === categoryName);
    const hasSubcats = selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0;

    if (hasSubcats) {
      newCategories[index] = { category: categoryName, subcategories: [] };
    } else {
      newCategories[index] = { category: categoryName };
    }

    setServiceCategories(newCategories);
  };

  const handleSubcategoryToggle = (index: number, subcategoryName: string) => {
    const newCategories = [...serviceCategories];
    const currentSubcategories = newCategories[index].subcategories || [];

    if (currentSubcategories.includes(subcategoryName)) {
      newCategories[index] = {
        ...newCategories[index],
        subcategories: currentSubcategories.filter(sub => sub !== subcategoryName),
      };
    } else {
      newCategories[index] = {
        ...newCategories[index],
        subcategories: [...currentSubcategories, subcategoryName],
      };
    }

    setServiceCategories(newCategories);
  };

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

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

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
        Alert.alert('Permiso denegado', 'Por favor, habilita los permisos de ubicación en la configuración de tu dispositivo.');
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
      Alert.alert('Error', 'Error al obtener tu ubicación. Por favor, intenta nuevamente.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Necesitamos acceso a tus fotos para cambiar tu imagen de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Error', 'El apellido es requerido');
      return;
    }

    if (isProvider) {
      if (!bankName.trim()) {
        Alert.alert('Error', 'El nombre del banco es requerido');
        return;
      }
      if (!bankAccountNumber.trim()) {
        Alert.alert('Error', 'El número de cuenta bancaria es requerido');
        return;
      }
      
      // Validar categorías
      if (serviceCategories.length === 0) {
        Alert.alert('Error', 'Debes seleccionar al menos una categoría de servicio.');
        return;
      }

      for (let i = 0; i < serviceCategories.length; i++) {
        const sc = serviceCategories[i];
        if (!sc.category) {
          Alert.alert('Error', `Por favor, completa la categoría ${i + 1}.`);
          return;
        }

        const categoryData = categoriesData?.find(cat => cat.name === sc.category);
        const hasSubcats = categoryData && categoryData.subcategories && categoryData.subcategories.length > 0;

        if (hasSubcats && (!sc.subcategories || sc.subcategories.length === 0)) {
          Alert.alert('Error', `La categoría "${sc.category}" requiere al menos una subcategoría seleccionada.`);
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      let profilePicUrl = user.profile_pic;

      // Subir foto de perfil si se seleccionó una nueva
      if (profileImage && profileImage !== user.profile_pic && profileImage.startsWith('file://')) {
        // Obtener extensión del archivo
        let fileExtension = profileImage.split('.').pop()?.toLowerCase() || 'jpg';
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(fileExtension)) {
          fileExtension = 'jpeg';
        }

        const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
        const storagePath = `profile-pics/${fileName}`;

        // Usar el servicio postImageToSupabase que maneja correctamente la conversión
        const uploadedUrl = await postImageToSupabase(
          profileImage,
          storagePath,
          fileExtension,
          'documents'
        );

        if (!uploadedUrl) {
          throw new Error('No se pudo subir la imagen de perfil');
        }

        profilePicUrl = uploadedUrl;
      }

      const updateData: any = {
        name: name.trim(),
        last_name: lastName.trim(),
        cel_phone: celPhone.trim() || null,
        location: location.trim() || null,
        coordinates: latitude && longitude ? JSON.stringify({ lat: latitude, lng: longitude }) : null,
        profile_pic: profilePicUrl,
        updated_at: new Date().toISOString(),
      };

      // Agregar información bancaria y solvencia solo si es proveedor
      if (isProvider) {
        updateData.bank_account_number = bankAccountNumber.trim();
        updateData.bank_name = bankName.trim();
        updateData.bank_account_type = bankAccountType;
        if (policeClearanceUrl) {
          updateData.police_clearance_pic = policeClearanceUrl;
        }
      }

      // Actualizar datos en Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Si es proveedor, actualizar categorías
      if (isProvider && serviceCategories.length > 0) {
        // 1. Eliminar todas las categorías actuales
        const { error: deleteError } = await supabase
          .from("user_professional_services")
          .delete()
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Error al eliminar categorías:", deleteError);
          throw deleteError;
        }

        // 2. Insertar las nuevas categorías
        const servicesToInsert = [];

        for (const serviceCategory of serviceCategories) {
          // Obtener el ID de la categoría
          const { data: category, error: catError } = await supabase
            .from("categories")
            .select("id")
            .eq("name", serviceCategory.category)
            .single();

          if (catError || !category) {
            console.error("Error al obtener categoría:", serviceCategory.category, catError);
            continue;
          }

          // Si tiene subcategorías, insertarlas
          if (serviceCategory.subcategories && serviceCategory.subcategories.length > 0) {
            for (const subcatName of serviceCategory.subcategories) {
              // Obtener el ID de la subcategoría
              const { data: subcategory, error: subError } = await supabase
                .from("subcategories")
                .select("id")
                .eq("name", subcatName)
                .single();

              if (subError || !subcategory) {
                console.error("Error al obtener subcategoría:", subcatName, subError);
                continue;
              }

              servicesToInsert.push({
                user_id: user.id,
                category_id: category.id,
                subcategory_id: subcategory.id,
              });
            }
          } else {
            // Si no tiene subcategorías, buscar la subcategoría "general"
            const generalSubcatName = `${serviceCategory.category} general`;
            const { data: subcategory, error: subError } = await supabase
              .from("subcategories")
              .select("id")
              .eq("name", generalSubcatName)
              .single();

            if (subError || !subcategory) {
              console.error("Error al obtener subcategoría general:", generalSubcatName, subError);
              continue;
            }

            servicesToInsert.push({
              user_id: user.id,
              category_id: category.id,
              subcategory_id: subcategory.id,
            });
          }
        }

        // Insertar todas las nuevas relaciones
        if (servicesToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from("user_professional_services")
            .insert(servicesToInsert);

          if (insertError) {
            console.error("Error al insertar categorías:", insertError);
            throw insertError;
          }
        }
      }

      // Invalidar cache para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['userData', user.id] });
      queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });

      Alert.alert('Éxito', 'Tu perfil ha sido actualizado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = getUserInitials(name, lastName);

  if (isLoadingUser) {
    return (
      <View className="items-center justify-center flex-1" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
        {/* Header */}
        <View 
          className="flex-row items-center justify-between px-5 py-4 border-b"
          style={{ 
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 16 
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>Editar Perfil</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => {
            // Cerrar sugerencias al hacer scroll
            setShowPredictions(false);
          }}
        >
          <View className="pt-6">
            {/* Foto de perfil */}
            <View className="items-center mb-6 px-5">
              <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    className="w-32 h-32 rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-32 h-32 rounded-full bg-blue-500 items-center justify-center">
                    <Text className="text-white font-bold text-4xl">{initials}</Text>
                  </View>
                )}
                <View className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-purple-600 items-center justify-center border-4 border-white">
                  <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
                Toca la foto para cambiarla
              </Text>
            </View>

            <View className="px-5 space-y-4">
              {/* Nombre */}
              <View>
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                  Nombre *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre"
                  placeholderTextColor={colors.textSecondary}
                  className="px-4 py-3 border rounded-xl text-base"
                  style={{
                    height: 56,
                    lineHeight: Platform.OS === "ios" ? 0 : undefined,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Apellido */}
              <View>
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                  Apellido *
                </Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Tu apellido"
                  placeholderTextColor={colors.textSecondary}
                  className="px-4 py-3 border rounded-xl text-base"
                  style={{
                    height: 56,
                    lineHeight: Platform.OS === "ios" ? 0 : undefined,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Teléfono */}
              <View>
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                  Teléfono
                </Text>
                <TextInput
                  value={celPhone}
                  onChangeText={setCelPhone}
                  placeholder="Ej: 7000-0000 o 0000-0000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  className="px-4 py-3 border rounded-xl text-base"
                  style={{
                    height: 56,
                    lineHeight: Platform.OS === "ios" ? 0 : undefined,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Email (solo lectura) */}
              <View>
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                  Email
                </Text>
                <TextInput
                  value={user?.email || ''}
                  editable={false}
                  className="px-4 py-3 border rounded-xl text-base"
                  style={{
                    height: 56,
                    lineHeight: Platform.OS === "ios" ? 0 : undefined,
                    backgroundColor: colors.border,
                    borderColor: colors.border,
                    color: colors.textSecondary,
                  }}
                />
                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  El email no se puede modificar
                </Text>
              </View>

              {/* Solvencia policial (solo proveedores) */}
              {isProvider && (
                <View>
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                    Solvencia policial
                  </Text>
                  <TouchableOpacity
                    onPress={async () => {
                      if (!userId) return;
                      setUploadingSolvencia(true);
                      try {
                        const result = await handleUploadDocument(userId);
                        if (result?.url) {
                          setPoliceClearanceUrl(result.url);
                          Alert.alert('Listo', 'Solvencia policial cargada. Guarda los cambios para actualizar tu perfil.');
                        }
                      } finally {
                        setUploadingSolvencia(false);
                      }
                    }}
                    disabled={uploadingSolvencia || isUploadingDoc}
                    className="border-2 border-dashed rounded-xl p-6 items-center justify-center"
                    style={{ borderColor: colors.border, backgroundColor: colors.card }}
                  >
                    {uploadingSolvencia || isUploadingDoc ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : policeClearanceUrl ? (
                      <View className="items-center">
                        <MaterialIcons name="check-circle" size={32} color="#10B981" />
                        <Text className="text-sm font-medium mt-2" style={{ color: colors.text }}>Solvencia cargada</Text>
                        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>Toca de nuevo para reemplazar</Text>
                      </View>
                    ) : (
                      <View className="items-center">
                        <MaterialIcons name="cloud-upload" size={32} style={{ color: colors.textSecondary }} />
                        <Text className="text-sm font-medium mt-2" style={{ color: colors.text }}>Subir solvencia policial</Text>
                        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>PDF, JPG o PNG (máx. 5MB)</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Ubicación */}
              <View>
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                  Ubicación
                </Text>
                
                {/* Input de búsqueda con autocomplete */}
                <View className="relative mb-2">
                  <TextInput
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    placeholder="Buscar dirección..."
                    placeholderTextColor={colors.textSecondary}
                    className="px-4 py-3 border rounded-xl text-base pr-10"
                    style={{
                      height: 56,
                      lineHeight: Platform.OS === "ios" ? 0 : undefined,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  />
                  {isSearching && (
                    <View className="absolute right-3 top-0 bottom-0 justify-center">
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  )}
                  
                  {/* Sugerencias de autocomplete */}
                  {showPredictions && predictions.length > 0 && (
                    <View
                      className="absolute top-full left-0 right-0 mt-1 border rounded-xl z-10 max-h-48"
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      }}
                    >
                      <ScrollView keyboardShouldPersistTaps="handled">
                        {predictions.map((prediction, idx) => (
                          <TouchableOpacity
                            key={prediction.place_id}
                            onPress={() => selectPlace(prediction)}
                            className="px-4 py-3 border-b"
                            style={{
                              borderBottomColor: colors.border,
                            }}
                          >
                            <Text style={{ color: colors.text }}>{prediction.description}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Botón usar ubicación actual */}
                <TouchableOpacity
                  onPress={handleUseCurrentLocation}
                  disabled={isGettingLocation}
                  className="flex-row items-center justify-center px-4 py-2 rounded-xl mb-4"
                  style={{
                    backgroundColor: colors.primaryBackground,
                  }}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialIcons name="my-location" size={20} color={colors.primary} />
                  )}
                  <Text className="ml-2 text-sm font-semibold" style={{ color: colors.primary }}>
                    {isGettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
                  </Text>
                </TouchableOpacity>

                {/* Mapa */}
                <View className="h-64 rounded-xl overflow-hidden border mb-4" style={{ borderColor: colors.border }}>
                  <ServiceZoneMap
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={handleLocationChange}
                  />
                  <View className="absolute bottom-3 left-0 right-0 items-center">
                    <View
                      className="px-4 py-2 rounded-full"
                      style={{
                        backgroundColor: colors.card + 'E6',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.text }}>
                        Toca el mapa o arrastra el marcador para ajustar
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Información bancaria - Solo para proveedores */}
              {isProvider && (
                <View className="mt-4 pt-4 border-t" style={{ borderTopColor: colors.border }}>
                  <Text className="text-base font-bold mb-4" style={{ color: colors.text }}>
                    Información Bancaria *
                  </Text>
                  <Text className="text-xs mb-4" style={{ color: colors.textSecondary }}>
                    Necesitamos tu información bancaria para poder realizar los pagos de tus servicios.
                  </Text>

                  {/* Nombre del banco */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                      Nombre del banco *
                    </Text>
                    <TextInput
                      value={bankName}
                      onChangeText={setBankName}
                      placeholder="Ej: Banco Agrícola, Banco de América Central"
                      placeholderTextColor={colors.textSecondary}
                      className="px-4 py-3 border rounded-xl text-base"
                      style={{
                        height: 56,
                        lineHeight: Platform.OS === "ios" ? 0 : undefined,
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                  </View>

                  {/* Tipo de cuenta */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                      Tipo de cuenta *
                    </Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        className="flex-1 px-4 py-3 border rounded-xl items-center"
                        style={{
                          backgroundColor: bankAccountType === 'ahorro' ? colors.primaryBackground : colors.card,
                          borderColor: bankAccountType === 'ahorro' ? colors.primary : colors.border,
                        }}
                        onPress={() => setBankAccountType('ahorro')}
                        activeOpacity={0.7}
                      >
                        <Text
                          className="font-medium"
                          style={{
                            color: bankAccountType === 'ahorro' ? colors.primary : colors.textSecondary,
                          }}
                        >
                          Ahorro
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 px-4 py-3 border rounded-xl items-center"
                        style={{
                          backgroundColor: bankAccountType === 'corriente' ? colors.primaryBackground : colors.card,
                          borderColor: bankAccountType === 'corriente' ? colors.primary : colors.border,
                        }}
                        onPress={() => setBankAccountType('corriente')}
                        activeOpacity={0.7}
                      >
                        <Text
                          className="font-medium"
                          style={{
                            color: bankAccountType === 'corriente' ? colors.primary : colors.textSecondary,
                          }}
                        >
                          Corriente
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Número de cuenta */}
                  <View>
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                      Número de cuenta bancaria *
                    </Text>
                    <TextInput
                      value={bankAccountNumber}
                      onChangeText={setBankAccountNumber}
                      placeholder="Ej: 1234567890123456"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      className="px-4 py-3 border rounded-xl text-base"
                      style={{
                        height: 56,
                        lineHeight: Platform.OS === "ios" ? 0 : undefined,
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                  </View>
                </View>
              )}

              {/* Sección de categorías de servicio (solo para proveedores) */}
              {isProvider && (
                <View className="mt-4 pt-4 border-t" style={{ borderTopColor: colors.border }}>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-base font-bold" style={{ color: colors.text }}>
                      Categorías de Servicio {serviceCategories.length > 0 && `(${serviceCategories.length}/3)`}
                    </Text>
                    {serviceCategories.length < 3 && (
                      <TouchableOpacity
                        onPress={handleAddCategory}
                        disabled={isSaving || loadingCategories}
                        className="px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        }}
                      >
                        <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                          + Agregar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text className="text-xs mb-4" style={{ color: colors.textSecondary }}>
                    Puedes seleccionar hasta 3 categorías de servicio. Si una categoría tiene subcategorías, deberás seleccionar una. Mínimo 1 categoría requerida.
                  </Text>

                  {loadingCategories ? (
                    <View className="items-center py-8">
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                        Cargando categorías...
                      </Text>
                    </View>
                  ) : serviceCategories.length === 0 ? (
                    <View className="items-center py-8">
                      <Text className="text-sm" style={{ color: colors.textSecondary }}>
                        No has agregado ninguna categoría aún.
                      </Text>
                      <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        Haz clic en "Agregar" para comenzar.
                      </Text>
                    </View>
                  ) : (
                    <View className="space-y-4">
                      {serviceCategories.map((sc, index) => {
                        const selectedCategory = categoriesData?.find(cat => cat.name === sc.category);
                        const subcategories = selectedCategory?.subcategories || [];
                        const hasSubcats = subcategories.length > 0;

                        return (
                          <View
                            key={`category-${index}-${sc.category || "empty"}`}
                            className="p-4 rounded-xl border"
                            style={{ backgroundColor: colors.card, borderColor: colors.border }}
                          >
                            <View className="flex-row justify-between items-start mb-3">
                              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                                Categoría {index + 1}
                              </Text>
                              <TouchableOpacity
                                onPress={() => handleRemoveCategory(index)}
                                disabled={isSaving || loadingCategories || serviceCategories.length <= 1}
                                className="p-1"
                              >
                                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                              </TouchableOpacity>
                            </View>

                            {/* Selector de categoría */}
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedCategoryIndex(index);
                                setShowCategoryModal(true);
                              }}
                              className="px-4 py-3 border rounded-xl mb-3"
                              style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                              }}
                            >
                              <Text style={{ color: sc.category ? colors.text : colors.textSecondary }}>
                                {sc.category || 'Selecciona una categoría *'}
                              </Text>
                            </TouchableOpacity>

                            {/* Subcategorías (si aplica) */}
                            {hasSubcats && (
                              <View>
                                <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>
                                  Subcategorías * (selecciona una o más)
                                </Text>
                                <ScrollView
                                  className="max-h-48 border rounded-lg p-2"
                                  style={{
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                  }}
                                >
                                  {subcategories.map(subcat => {
                                    const isSelected = (sc.subcategories || []).includes(subcat.name);
                                    return (
                                      <TouchableOpacity
                                        key={`subcat-${subcat.id}`}
                                        onPress={() => handleSubcategoryToggle(index, subcat.name)}
                                        disabled={!sc.category || isSaving || loadingCategories}
                                        className="flex-row items-center p-2 rounded mb-1"
                                        style={{
                                          backgroundColor: isSelected ? colors.primaryBackground : 'transparent',
                                        }}
                                      >
                                        <MaterialIcons
                                          name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                                          size={20}
                                          color={isSelected ? colors.primary : colors.textSecondary}
                                        />
                                        <Text className="text-sm ml-2" style={{ color: colors.text }}>
                                          {subcat.name}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </ScrollView>
                                {(sc.subcategories || []).length > 0 && (
                                  <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                                    {sc.subcategories?.length} subcategoría(s) seleccionada(s)
                                  </Text>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* Botón Guardar */}
              <TouchableOpacity
                className="rounded-xl overflow-hidden mt-6"
                activeOpacity={0.8}
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={['#4F46E5', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      Guardar Cambios
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Modal para seleccionar categoría */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="bg-white rounded-t-3xl p-5 max-h-[80%]"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                Seleccionar Categoría
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingCategoriesData ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <View className="space-y-2">
                  {categoriesData?.map(category => {
                    const iconName = getCategoryIcon(category.name);
                    const categoryColor = getCategoryColor(category.name);
                    return (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => {
                          if (selectedCategoryIndex !== null) {
                            handleCategoryChange(selectedCategoryIndex, category.name);
                            setShowCategoryModal(false);
                            setSelectedCategoryIndex(null);
                          }
                        }}
                        className="flex-row items-center p-4 rounded-xl border mb-2"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        }}
                      >
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: categoryColor + '20' }}
                        >
                          <MaterialIcons name={iconName} size={20} color={categoryColor} />
                        </View>
                        <Text className="flex-1 text-base" style={{ color: colors.text }}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
