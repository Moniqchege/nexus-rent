import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { 
  Orbitron_400Regular,
  Orbitron_600SemiBold,
  Orbitron_700Bold,
  Orbitron_900Black
} from '@expo-google-fonts/orbitron';

import {
  Sora_300Light,
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold
} from '@expo-google-fonts/sora';

import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold
} from '@expo-google-fonts/jetbrains-mono';
import { useAuthStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Orbitron_900Black,
    Sora_300Light,
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
  });

  const auth = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;

    const inTabsGroup = segments[0] === '(tabs)';

    // Allow reset-password and otp screens during firstLogin flow
    const isAuthFlow = segments[0] === 'reset-password' || segments[0] === 'otp' || segments[0] === 'forgot-password';

    if (!auth.token && !auth.tempToken && inTabsGroup && !isAuthFlow) {
      router.replace('/login');
      return;
    }

    if ((auth.token || auth.tempToken) && !inTabsGroup && !isAuthFlow) {
      router.replace('/(tabs)/home');
    }
  }, [auth.token, auth.tempToken, segments, router, fontsLoaded]);

  if (!fontsLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}