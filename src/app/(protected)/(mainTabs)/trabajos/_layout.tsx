import { Stack } from "expo-router";

const TrabajosLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="detalle-solicitud"
        options={{ 
          presentation: "card",
          headerShown: false 
        }}
      />
    </Stack>
  );
};

export default TrabajosLayout;
