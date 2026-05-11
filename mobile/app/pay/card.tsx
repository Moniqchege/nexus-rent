import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CreditCard } from "lucide-react-native";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";

const colorMap = {
  neon: "#00FFFF",
  purple: "#7C3AED",
  success: "#00FFA3",
  warn: "#FFB84D",
  muted: "#888",
  border: "rgba(255,255,255,0.05)",
};

export default function PaymentCardPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuthStore();

  const amount = params.amount ? parseFloat(params.amount as string) : 0;
  const scheduleId = params.scheduleId ? parseInt(params.scheduleId as string) : 0;
  const propertyTitle = params.propertyTitle as string || "Property";

  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    Alert.alert(
      "Card Payment",
      "Stripe card payment integration requires the Stripe React Native SDK. This feature will be available in the next update.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.ambientGlow} />

      <ScrollView contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.side}>
            <Image
              source={require('../../assets/back_icon.png')}
              style={styles.backIcon}
            />
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.headerLabel}>CARD PAYMENT</Text>
            <Text style={styles.headerTitle}>Credit or Debit Card</Text>
          </View>

          <View style={styles.side} />
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <View style={styles.amountGlow} />
          <CreditCard size={32} color={colorMap.purple} />
          <Text style={styles.amountLabel}>AMOUNT TO PAY</Text>
          <Text style={styles.amountValue}>KES {amount.toLocaleString()}</Text>
          <Text style={styles.amountSub}>{propertyTitle}</Text>
        </View>

        {/* Coming Soon */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>🚧 Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Card payment integration with Stripe is currently under development. 
            Please use M-Pesa or Bank Transfer for now.
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colorMap.purple, "#9D5AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.backButtonGradient}
          >
            <Text style={styles.backButtonText}>CHOOSE ANOTHER METHOD</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060A14" },
  ambientGlow: {
    position: "absolute",
    top: 100,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(124,58,237,0.15)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 50,
  },
  side: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 65,
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: colorMap.purple,
  },
  headerLabel: {
    fontSize: 10,
    fontFamily: "Orbitron",
    letterSpacing: 2,
    color: "#888",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: "#fff",
  },
  amountCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 22,
    padding: 28,
    backgroundColor: "rgba(124,58,237,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
  },
  amountGlow: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(124,58,237,0.15)",
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: "Orbitron",
    letterSpacing: 2,
    color: "#888",
    marginTop: 12,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontFamily: "JetBrains Mono",
    fontWeight: "700",
    color: colorMap.purple,
    marginBottom: 8,
  },
  amountSub: {
    fontSize: 14,
    color: "#fff",
  },
  comingSoonCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 24,
    backgroundColor: "rgba(255,184,77,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,184,77,0.2)",
    alignItems: "center",
  },
  comingSoonTitle: {
    fontSize: 20,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 20,
  },
  backButton: {
    marginHorizontal: 20,
  },
  backButtonGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontFamily: "Orbitron",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#fff",
  },
});
