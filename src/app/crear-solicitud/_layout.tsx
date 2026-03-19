import { Stack } from "expo-router";
import { CreateRequestProvider } from "@/features/solicitudes/contexts/CreateRequestContext";

const CreateRequestLayout = () => {
    return (
        <CreateRequestProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    presentation: "card",
                }}
            >
            <Stack.Screen name="index" />
            <Stack.Screen name="categoria" />
            <Stack.Screen name="ubicacion" />
            <Stack.Screen name="fecha-hora" />
            <Stack.Screen name="fotos" />
            <Stack.Screen name="proveedores" />
            <Stack.Screen name="confirmacion" />
            </Stack>
        </CreateRequestProvider>
    );
};

export default CreateRequestLayout;
