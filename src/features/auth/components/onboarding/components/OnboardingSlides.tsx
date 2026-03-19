import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Busca lo que necesitas",
    description:
      "Encuentra fácilmente proveedores y servicios profesionales por categoría o cerca de tu ubicación.",
    emoji: "🔍",
  },
  {
    id: "2",
    title: "Encuentra a profesionales",
    description:
      "Conecta con los mejores profesionales verificados en tu zona, listos para ayudarte.",
    emoji: "👷",
  },
  {
    id: "3",
    title: "Conecta y contrata",
    description:
      "Comunícate directamente con proveedores, compara precios y contrata el servicio que necesitas.",
    emoji: "🤝",
  },
];

const OnboardingSlides = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      router.replace("/(auth)/sign-up");
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/sign-up");
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FCE7F3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Skip Button */}
      <View className="absolute right-6 z-20" style={{ top: insets.top + 8 }}>
        <TouchableOpacity onPress={handleSkip} className="p-2">
          <Text className="text-gray-400 text-sm font-medium">Omitir</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={false}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      >
        {SLIDES.map(slide => (
          <View
            key={slide.id}
            className="flex-1 items-center justify-between px-8"
            style={{ width, paddingTop: insets.top + 36, paddingBottom: insets.bottom + 8 }}
          >
            {/* Image/Illustration Container */}
            <View className="flex-1 items-center justify-center w-full">
              <View
                className="w-80 h-80 rounded-3xl items-center justify-center mb-8"
                style={{ backgroundColor: "#5DBEA3" }}
              >
                <View className="w-64 h-64 bg-white/90 rounded-2xl items-center justify-center shadow-2xl">
                  <Text style={{ fontSize: 120 }}>{slide.emoji}</Text>
                </View>
              </View>
            </View>

            {/* Content */}
            <View className="w-full items-center mb-12">
              <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
                {slide.title}
              </Text>

              <Text className="text-base text-gray-500 text-center leading-6 px-4">
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View className="px-8" style={{ paddingBottom: insets.bottom + 16 }}>
        {/* Dots */}
        <View className="flex-row justify-center items-center mb-6">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className="h-2 mx-1 rounded-full"
              style={{
                width: currentIndex === index ? 24 : 8,
                backgroundColor: currentIndex === index ? "#6366F1" : "#D1D5DB",
              }}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.9}
          className="overflow-hidden rounded-3xl shadow-xl"
        >
          <LinearGradient
            colors={["#4F46E5", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 20,
              paddingHorizontal: 32,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-white text-lg font-bold tracking-wide">
              Siguiente
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default OnboardingSlides;
