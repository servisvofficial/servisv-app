import { Stack } from "expo-router";

const PerfilLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="configuracion"
        options={{ 
          presentation: "modal", 
          headerShown: false 
        }}
      />
    </Stack>
  );
};

export default PerfilLayout;
