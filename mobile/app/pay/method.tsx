import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CreditCard, Smartphone, Building2, ArrowLeft } from "lucide-react-native";

const colorMap = {
  neon: "#00FFFF",
  purple: "#7C3AED",
  success: "#00FFA3",
  warn: "#FFB84D",
  muted: "#888",
  border: "rgba(255,255,255,0.05)",
};

export default function PaymentMethodPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const amount = params.amount ? parseFloat(params.amount as string) : 0;
  const scheduleId = params.scheduleId ? parseInt(params.scheduleId as string) : 0;
  const propertyTitle = params.propertyTitle as string || "Property";
  const dueDate = params.dueDate as string || "";
  const propertyId    = (params.propertyId    as string) || "0";
  const tenantId      = (params.tenantId      as string) || "0";
  const accountRef    = (params.accountRef    as string) || `SCHED-${scheduleId}`;

  const paymentMethods: {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  gradient: [string, string];
  route: string;
}[] = [
  {
    id: "mpesa",
    title: "M-Pesa",
    subtitle: "Pay via M-Pesa STK Push",
    icon: Smartphone,
    gradient: ["#00FFA3", "#00FFFF"],
    route: "/pay/mpesa",
  },
  {
    id: "card",
    title: "Card Payment",
    subtitle: "Credit or Debit Card via Stripe",
    icon: CreditCard,
    gradient: ["#7C3AED", "#00FFFF"],
    route: "/pay/card",
  },
  {
    id: "bank",
    title: "Bank Transfer",
    subtitle: "Direct bank transfer",
    icon: Building2,
    gradient: ["#FFB84D", "#FF6B6B"],
    route: "/pay/bank",
  },
];

  const handleMethodSelect = (method: typeof paymentMethods[0]) => {
    router.push({
      pathname: method.route as any,
      params: {
        amount: amount.toString(),
        scheduleId: scheduleId.toString(),
        propertyTitle,
        dueDate,
        propertyId:    (params.propertyId ?? "0").toString(), 
        tenantId:      (params.tenantId   ?? "0").toString(),
        accountRef:    (params.accountRef ?? `SCHED-${scheduleId}`).toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.side}>
            <Image
             source={require('../../assets/back_icon.png')}
             style={styles.backIcon}
            />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headerLabel}>SELECT PAYMENT METHOD</Text>
            <Text style={styles.headerTitle}>Choose How to Pay</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryGlow} />
          <Text style={styles.summaryLabel}>AMOUNT DUE</Text>
          <Text style={styles.summaryAmount}>KES {amount.toLocaleString()}</Text>
          <Text style={styles.summarySub}>{propertyTitle}</Text>
          {dueDate && <Text style={styles.summaryDate}>Due: {new Date(dueDate).toLocaleDateString()}</Text>}
        </View>

        {/* Payment Methods */}
        <View style={styles.methodsContainer}>
          {paymentMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => handleMethodSelect(method)}
                style={styles.methodCard}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[...method.gradient, method.gradient[0]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.methodGradientBorder}
                >
                  <View style={styles.methodInner}>
                    <View style={styles.methodIconContainer}>
                      <Icon size={28} color={method.gradient[0]} />
                    </View>
                    <View style={styles.methodContent}>
                      <Text style={styles.methodTitle}>{method.title}</Text>
                      <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                    </View>
                    <Text style={[styles.methodArrow, { color: method.gradient[0] }]}>›</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 All payments are secure and encrypted. You'll receive a receipt via email once payment is confirmed.
          </Text>
        </View>
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
    backgroundColor: "rgba(124,58,237,0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 13,
    fontFamily: "Orbitron",
    letterSpacing: 2,
    color: "#FFF",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: "#888",
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 22,
    padding: 24,
    backgroundColor: "rgba(124,58,237,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
  },
  summaryGlow: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(124,58,237,0.15)",
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: "Orbitron",
    letterSpacing: 2,
    color: "#888",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontFamily: "JetBrains Mono",
    fontWeight: "700",
    color: "#7C3AED",
    marginBottom: 8,
  },
  summarySub: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 12,
    color: "#888",
  },
  methodsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  methodCard: {
    marginBottom: 16,
  },
  methodGradientBorder: {
    borderRadius: 18,
    padding: 2,
  },
  methodInner: {
    backgroundColor: "#0B0F19",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  methodIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 12,
    color: "#888",
  },
  methodArrow: {
    fontSize: 32,
    fontWeight: "300",
  },
  infoBox: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(0,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.1)",
  },
  infoText: {
    fontSize: 12,
    color: "#888",
    lineHeight: 18,
  },
    side: {
  width: 40, 
  alignItems: 'center',
  justifyContent: 'center',
},
backIcon: {
  width: 22,
  height: 22,
  tintColor: '#00FFFF', 
},
});
