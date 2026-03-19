import { Stack } from "expo-router";

const ServiciosLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="buscar-proveedores"
        options={{ 
          presentation: "card",
          headerShown: false 
        }}
      />
      <Stack.Screen
        name="perfil-proveedor"
        options={{ 
          presentation: "card",
          headerShown: false 
        }}
      />
    </Stack>
  );
};

export default ServiciosLayout;
