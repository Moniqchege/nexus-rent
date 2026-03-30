import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View className="flex-1 bg-[#060A14] p-5 pt-[60px] pb-[90px]">
      <Text className="text-white font-sora text-lg">Nexus Rent Mobile - Home Screen</Text>
      <Text className="text-muted mt-4">Exact mockup UI coming soon...</Text>
      {/* Hero card stub */}
      <View className="bg-gradient-to-br from-[rgba(0,240,255,0.08)] to-[rgba(124,58,237,0.12)] border border-[rgba(0,240,255,0.2)] rounded-3xl p-6 mt-6">
        <Text className="text-xs font-orbitron uppercase tracking-wider text-muted mb-2">CURRENT RENT</Text>
        <Text className="text-4xl font-jetbrains text-neon font-semibold">$2,400</Text>
      </View>
    </View>
  );
}

