import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

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
          backgroundColor: 'rgba(10,14,22,0.97)',
          borderTopColor: '#1F2937',
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 16,
          paddingTop: 8,
          position: 'absolute',
        },
        tabBarActiveTintColor: '#00F0FF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: 'Orbitron_600SemiBold',
          letterSpacing: 0.5,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={20} color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="search" size={20} color={color} />,
          tabBarLabel: 'Explore',
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="card" size={20} color={color} />,
          tabBarLabel: 'Pay',
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={20} color={color} />,
          tabBarLabel: 'Alerts',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="person" size={20} color={color} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

