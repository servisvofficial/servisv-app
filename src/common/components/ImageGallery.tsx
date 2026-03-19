import { View, Text, Modal, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';

interface ImageGalleryProps {
  images: string[];
  visible: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ImageGallery({ images, visible, onClose, initialIndex = 0 }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && scrollViewRef.current) {
      // Scroll a la imagen inicial cuando se abre el modal
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * SCREEN_WIDTH,
          animated: false,
        });
      }, 100);
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Header con contador y botón cerrar */}
        <View className="absolute top-12 left-0 right-0 z-10 flex-row items-center justify-between px-5">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <MaterialIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View className="px-4 py-2 rounded-full bg-black/50">
            <Text className="text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
          
          <View className="w-10" />
        </View>

        {/* Imagen principal */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(index);
          }}
        >
          {images.map((image, index) => (
            <View key={index} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
              <Image
                source={{ uri: image }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {/* Botones de navegación */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                className="absolute left-5 top-1/2 w-12 h-12 rounded-full bg-black/50 items-center justify-center"
                onPress={handlePrevious}
                style={{ marginTop: -24 }}
              >
                <MaterialIcons name="chevron-left" size={32} color="#FFF" />
              </TouchableOpacity>
            )}

            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                className="absolute right-5 top-1/2 w-12 h-12 rounded-full bg-black/50 items-center justify-center"
                onPress={handleNext}
                style={{ marginTop: -24 }}
              >
                <MaterialIcons name="chevron-right" size={32} color="#FFF" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}
