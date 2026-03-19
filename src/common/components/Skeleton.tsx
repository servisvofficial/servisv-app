import { useEffect, useRef } from "react";
import { View, Animated, StyleProp, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  /** Para círculos: pasar mismo width/height y borderRadius = width/2 */
  style?: StyleProp<ViewStyle>;
  /** Color de fondo del placeholder (por defecto gris claro) */
  backgroundColor?: string;
}

/**
 * Placeholder con la forma del contenedor (rectángulo, círculo, etc.).
 * Opcional: animación de opacidad suave.
 */
export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
  backgroundColor,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: backgroundColor ?? "#E5E7EB",
          opacity,
        },
        style,
      ]}
    />
  );
}
