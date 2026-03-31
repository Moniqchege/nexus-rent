import { View, Text, TouchableOpacity } from 'react-native';

export default function Profile() {
  return (
    <View className="flex-1 bg-[#060A14] p-5 pt-[60px] pb-[90px]">
      <Text className="text-white font-sora text-lg mb-6">Profile</Text>
      
      {/* User avatar & info stub */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-gradient-to-br from-[#00F0FF] to-[#7C3AED] rounded-3xl items-center justify-center mb-4">
          <Text className="text-[#060A14] font-bold text-3xl">QN</Text>
        </View>
        <Text className="text-white text-xl font-jetbrains font-semibold mb-1">Qui Chege</Text>
        <Text className="text-muted text-sm">quichege@example.com</Text>
      </View>

      {/* Profile sections */}
      <View className="space-y-4">
        <TouchableOpacity className="bg-[#1F2937] rounded-2xl p-6">
          <Text className="text-white font-semibold mb-1">My Rentals</Text>
          <Text className="text-muted text-sm">Current lease details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-[#1F2937] rounded-2xl p-6">
          <Text className="text-white font-semibold mb-1">Settings</Text>
          <Text className="text-muted text-sm">Notifications, payments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-[#1F2937] rounded-2xl p-6">
          <Text className="text-white font-semibold mb-1">Help & Support</Text>
          <Text className="text-muted text-sm">Contact maintenance</Text>
        </TouchableOpacity>
      </View>

      {/* Lease info */}
      <View className="bg-gradient-to-br from-[rgba(0,240,255,0.08)] to-[rgba(124,58,237,0.12)] border border-[rgba(0,240,255,0.2)] rounded-2xl p-6 mt-6">
        <Text className="text-xs font-orbitron uppercase tracking-wider text-muted mb-2">LEASE END</Text>
        <Text className="text-xl font-jetbrains text-neon font-semibold">Dec 31, 2024</Text>
      </View>
    </View>
  );
}
