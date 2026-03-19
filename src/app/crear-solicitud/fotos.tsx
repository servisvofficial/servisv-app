import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderCreateRequestSteps from '@/features/solicitudes/components/HeaderCreateRequestSteps';
import { useCreateRequest } from '@/features/solicitudes/contexts/CreateRequestContext';
import { useAuth } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { postImageToSupabase } from '@/common/services/post-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/common/providers/ThemeProvider';

const MAX_PHOTOS = 5;

export default function CreateRequestStep5Screen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { requestData, updateRequestData } = useCreateRequest();
  const [photos, setPhotos] = useState<string[]>(requestData.photos || []);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    if (photos.length >= MAX_PHOTOS) {
      alert(`Solo puedes subir hasta ${MAX_PHOTOS} fotos`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Necesitamos acceso a tu galería para subir fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      await uploadImage(imageUri);
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!userId) return;

    setUploading(true);
    try {
      let fileExtension = imageUri.split('.').pop();
      if (
        fileExtension &&
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(
          fileExtension.toLowerCase()
        )
      ) {
        fileExtension = fileExtension.toLowerCase();
      } else {
        fileExtension = 'jpeg';
      }

      const fileName = `request-${userId}-${Date.now()}.${fileExtension}`;
      const storagePath = `requests/${userId}/${fileName}`;

      const imageUrl = await postImageToSupabase(
        imageUri,
        storagePath,
        fileExtension,
        'documents'
      );

      if (imageUrl) {
        setPhotos(prev => [...prev, imageUrl]);
      } else {
        alert('Error al subir la imagen. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen. Por favor, intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    updateRequestData({ photos });
    router.push('/crear-solicitud/proveedores');
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <HeaderCreateRequestSteps currentStep={5} totalSteps={6} title="Crear Solicitud" />
        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>Adjunta algunas fotos</Text>
            <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>Subir fotos (Opcional)</Text>
            <Text className="text-sm mb-6" style={{ color: colors.textSecondary }}>Sube hasta {MAX_PHOTOS} fotos para ayudar a los proveedores a entender mejor tu necesidad.</Text>
            <View className="flex-row flex-wrap gap-3">
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity
                  className="w-[48%] h-32 rounded-xl border-2 border-dashed items-center justify-center"
                  style={{ borderColor: colors.border, backgroundColor: colors.border }}
                  onPress={handlePickImage}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  {uploading ? <ActivityIndicator size="small" color="#6366F1" /> : (
                    <>
                      <MaterialIcons name="add-photo-alternate" size={32} color={colors.textSecondary} />
                      <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>Agregar foto</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Fotos subidas */}
              {photos.map((photo, index) => (
                <View key={index} className="w-[48%] h-32 rounded-xl overflow-hidden relative">
                  <Image
                    source={{ uri: photo }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                    onPress={() => removePhoto(index)}
                  >
                    <MaterialIcons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View className="px-5 pb-6 pt-4" style={{ borderTopColor: colors.border, borderTopWidth: 1 }}>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" onPress={() => router.back()} activeOpacity={0.8}>
              <View style={{ backgroundColor: colors.border, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Anterior</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 rounded-3xl overflow-hidden" onPress={handleNext} activeOpacity={0.8}>
              <LinearGradient colors={['#4F46E5', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="text-white text-base font-semibold">Siguiente</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
