import { View, Text } from 'react-native';

export default function Alerts() {
  return (
    <View className="flex-1 bg-[#060A14] p-5 pt-[60px] pb-[90px]">
      <Text className="text-white font-sora text-lg mb-4">Alerts Screen</Text>
      <View className="bg-bg-card border border-danger/20 rounded-2xl p-4">
        <Text className="text-danger font-semibold">3 New Notifications</Text>
        <Text className="text-muted mt-2">Rent increase predicted +20%</Text>
      </View>
    </View>
  );
}

