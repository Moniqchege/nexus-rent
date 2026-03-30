import { View, Text } from 'react-native';

export default function Explore() {
  return (
    <View className="flex-1 bg-[#060A14] p-5 pt-[60px] pb-[90px]">
      <Text className="text-white font-sora text-lg mb-4">Explore Screen</Text>
      <View className="bg-bg-card border border-[rgba(0,240,255,0.2)] rounded-2xl p-4">
        <Text className="text-muted font-orbitron uppercase tracking-wider text-xs mb-2">Search Properties</Text>
        <Text className="text-neon text-xl font-jetbrains font-semibold">Westlands, Nairobi...</Text>
      </View>
    </View>
  );
}

