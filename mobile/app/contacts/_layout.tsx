import { Stack, useRouter } from 'expo-router';
import { Image, Pressable, View, Text } from 'react-native';

export default function ContactsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#060A14',
        },
        headerTintColor: '#00FFFF',

        // ✅ Replace back button HERE
        headerLeft: () => (
          <Pressable onPress={() => router.back()} style={{ paddingLeft: 8 }}>
            <Image
              source={require('../../assets/back_icon.png')}
              style={{
                width: 22,
                height: 22,
                tintColor: '#00FFFF',
              }}
              resizeMode="contain"
            />
          </Pressable>
        ),

        headerTitle: () => (
          <Text
            style={{
              color: '#00FFFF',
              fontFamily: 'Orbitron',
              fontSize: 16,
              marginLeft: 100
            }}
          >
            Contacts
          </Text>
        ),
      }}
    />
  );
}