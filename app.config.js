const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";

export default {
  expo: {
    name: "ServiSV",
    slug: "servisv-app",
    version: "1.0.0",
    extra: {
      eas: {
        projectId: "0858e9b8-c95d-4547-9d0e-05f3557283f6",
      },
    },
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "servisvapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.servisv.app",
      config: {
        googleMapsApiKey,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "Necesitamos tu ubicación para mostrarte proveedores cercanos.",
        NSCameraUsageDescription:
          "Necesitamos acceso a la cámara para que puedas tomar fotos de tu solicitud.",
        NSPhotoLibraryUsageDescription:
          "Necesitamos acceso a tu galería para que puedas compartir imágenes.",
        NSPhotoLibraryAddUsageDescription:
          "Necesitamos guardar fotos en tu galería.",
      },
    },
    android: {
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#FFFFFF",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.servisv.app",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "@react-native-community/datetimepicker",
      "expo-font",
      [
        "expo-router",
        {
          root: "./src/app",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
          dark: {
            backgroundColor: "#FFFFFF",
          },
        },
      ],
      ["expo-notifications"],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
