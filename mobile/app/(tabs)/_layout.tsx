import { Tabs } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, Image } from 'react-native';

function TabIcon({ source }: { source: any }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Image
        source={source}
        style={{
          width: 32,
          height: 32,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

export default function TabLayout() {
  const { user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user && segments[0] === 'login') {
      router.replace('/(tabs)/home');
    }
  }, [user, segments, router]);

  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(6,10,20,0.98)",
          borderTopColor: "rgba(0,240,255,0.15)",
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 16,
          paddingTop: 10,
          position: "absolute",
        },
        tabBarActiveTintColor: "#00F0FF",
        tabBarInactiveTintColor: "rgba(0,240,255,0.4)",
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: 'Orbitron_600SemiBold',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: () => (
            <TabIcon source={require('../../assets/home.png')} />
          ),
          tabBarLabel: 'Home',
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: () => (
            <TabIcon source={require('../../assets/explore.png')} />
          ),
          tabBarLabel: 'Explore',
        }}
      />

      <Tabs.Screen
        name="payments"
        options={{
          tabBarIcon: () => (
            <TabIcon source={require('../../assets/pay.png')} />
          ),
          tabBarLabel: 'Pay',
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          tabBarIcon: () => (
            <TabIcon source={require('../../assets/alerts.png')} />
          ),
          tabBarLabel: 'Alerts',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: () => (
            <TabIcon source={require('../../assets/profile.png')} />
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}