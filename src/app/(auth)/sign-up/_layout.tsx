import { Stack } from "expo-router";

const SignUpLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                presentation: "card",
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="personal-data" />
            <Stack.Screen name="verify-identity" />
            <Stack.Screen name="select-services" />
            <Stack.Screen name="service-zone" />
            <Stack.Screen name="review" />
        </Stack>
    );
};

export default SignUpLayout;

