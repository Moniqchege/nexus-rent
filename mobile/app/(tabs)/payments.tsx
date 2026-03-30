import { View, Text } from 'react-native';

export default function Payments() {
  return (
    <View className="flex-1 bg-[#060A14] p-5 pt-[60px] pb-[90px]">
      <Text className="text-white font-sora text-lg mb-4">Payments Screen</Text>
      <View className="bg-gradient-to-br from-success/10 to-neon/5 border border-success/20 rounded-3xl p-6">
        <Text className="text-xs font-orbitron uppercase tracking-wider text-muted mb-2">Next Due</Text>
        <Text className="text-3xl font-jetbrains text-success font-semibold">$2,400</Text>
      </View>
    </View>
  );
}

