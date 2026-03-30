import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular: require('@expo-google-fonts/orbitron/Orbitron_400Regular.ttf'),
    Orbitron_600SemiBold: require('@expo-google-fonts/orbitron/Orbitron_600SemiBold.ttf'),
    Orbitron_700Bold: require('@expo-google-fonts/orbitron/Orbitron_700Bold.ttf'),
    Orbitron_900Black: require('@expo-google-fonts/orbitron/Orbitron_900Black.ttf'),
    Sora_300Light: require('@expo-google-fonts/sora/Sora_300Light.ttf'),
    Sora_400Regular: require('@expo-google-fonts/sora/Sora_400Regular.ttf'),
    Sora_600SemiBold: require('@expo-google-fonts/sora/Sora_600SemiBold.ttf'),
    Sora_700Bold: require('@expo-google-fonts/sora/Sora_700Bold.ttf'),
    JetBrainsMono_400Regular: require('@expo-google-fonts/jetbrains-mono/JetBrainsMono_400Regular.ttf'),
    JetBrainsMono_600SemiBold: require('@expo-google-fonts/jetbrains-mono/JetBrainsMono_600SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

