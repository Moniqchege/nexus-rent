import { View, Text } from 'react-native';

export default function Alerts() {
  return (
    <View className="flex-1 bg-[#060A14] p-5 pt-[60px] pb-[90px]">
      <Text className="text-white font-sora text-lg mb-4">Alerts & Notifications</Text>
      <Text className="text-muted mb-6">Stay updated on your rental...</Text>
      
      {/* Alert badges stub */}
      <View className="space-y-4 mb-6">
        <View className="flex-row items-center bg-[#1F2937] rounded-2xl p-4">
          <View className="w-3 h-3 bg-[#00F0FF] rounded-full mr-3" />
          <View>
            <Text className="text-white text-sm font-semibold mb-1">Payment Due Soon</Text>
            <Text className="text-muted text-xs">Rent due in 3 days</Text>
          </View>
        </View>
        <View className="flex-row items-center bg-[#1F2937] rounded-2xl p-4">
          <View className="w-3 h-3 bg-[#F59E0B] rounded-full mr-3" />
          <View>
            <Text className="text-white text-sm font-semibold mb-1">Maintenance Request</Text>
            <Text className="text-muted text-xs">AC repair completed</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View className="bg-gradient-to-br from-[rgba(0,240,255,0.08)] to-[rgba(124,58,237,0.12)] border border-[rgba(0,240,255,0.2)] rounded-2xl p-6">
        <Text className="text-xs font-orbitron uppercase tracking-wider text-muted mb-2">ACTIVE ALERTS</Text>
        <Text className="text-3xl font-jetbrains text-neon font-semibold">2</Text>
      </View>
    </View>
  );
}
