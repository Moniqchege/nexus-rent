import 'dotenv/config';

export default {
  expo: {
    name: "nexus-rent-mobile",
    slug: "nexus-rent-mobile",
    scheme: "nexus-rent-mobile",
    version: "1.0.0",
    platforms: ["ios", "android", "web"],
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    extra: {
      apiUrl: "https://lavenia-pronounceable-radically.ngrok-free.dev",  
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0B0F19"
    },
    plugins: [
      "expo-router",
      ["expo-font", { fonts: ["./assets/fonts/*.ttf"] }]
    ],
    ios: { supportsTablet: false },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0B0F19"
      },
      edgeToEdgeEnabled: true
    },
    web: { favicon: "./assets/favicon.png" },
    experiments: { typedRoutes: true }
  }
};