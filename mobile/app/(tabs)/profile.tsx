import { View, Text } from 'react-native';

export default function Profile() {
  return (
    <View className="flex-1 bg-[#060A14] p-5 pt-[60px] pb-[90px]">
      <Text className="text-white font-sora text-lg mb-4">Profile Screen</Text>
      <View className="bg-gradient-to-r from-purple to-neon rounded-full w-20 h-20 items-center justify-center mx-auto mb-4">
        <Text className="text-white font-bold text-xl">👤</Text>
      </View>
      <Text className="text-neon text-center text-xl font-orbitron font-bold mb-2">Alex Kimani</Text>
      <Text className="text-muted text-center font-jetbrains">Verified Tenant</Text>
    </View>
  );
}

