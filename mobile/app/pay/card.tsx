import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Image, Pressable, ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CreditCard, Shield, Smartphone } from "lucide-react-native";
import { useState } from "react";
import {
  useStripe,
  usePlatformPay,
  PlatformPay,
  PlatformPayButton,
  isPlatformPaySupported,
} from "@stripe/stripe-react-native";
import { useAuthStore } from "../../store/authStore";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:3000";

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
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { confirmPlatformPayPayment } = usePlatformPay();

  const amount = params.amount ? parseFloat(params.amount as string) : 0;
  const scheduleId = params.scheduleId ? parseInt(params.scheduleId as string) : 0;
  const propertyId = params.propertyId ? parseInt(params.propertyId as string) : 0;
  const tenantId = params.tenantId ? parseInt(params.tenantId as string) : user?.id ?? 0;
  const propertyTitle = (params.propertyTitle as string) || "Property";
  const accountRef = (params.accountRef as string) || `SCHED-${scheduleId}`;

  const [loading, setLoading] = useState(false);
  const [sheetReady, setSheetReady] = useState(false);

  // ── Fetch PaymentIntent from your backend ──────────────────────────
  const fetchPaymentSheetParams = async () => {
    const res = await fetch(`${API_URL}/api/payments/card/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ propertyId, tenantId, amount, accountRef }),
    });

    if (!res.ok) throw new Error("Failed to create payment session");
    return res.json() as Promise<{
      clientSecret: string;
      ephemeralKey: string;
      customerId: string;
      paymentIntentId: string;
    }>;
  };

  // ── Confirm with backend after success ─────────────────────────────
  const confirmWithBackend = async (piId: string) => {
    await fetch(`${API_URL}/api/payments/card/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ piId, tenantId, propertyId }),
    });
  };

  // ── Standard card / saved cards / Link ────────────────────────────
  const handleCardPayment = async () => {
    setLoading(true);
    try {
      const { clientSecret, ephemeralKey, customerId } = await fetchPaymentSheetParams();

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Nexus Rent",
        customerId,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: { name: user?.name },
        appearance: {
          colors: {
            primary: colorMap.purple,
            background: "#060A14",
            componentBackground: "#0D1424",
            componentBorder: "rgba(124,58,237,0.3)",
            componentDivider: "rgba(255,255,255,0.1)",
            primaryText: "#ffffff",
            secondaryText: "#888888",
            componentText: "#ffffff",
            placeholderText: "#555555",
            icon: colorMap.purple,
          },
          shapes: { borderRadius: 14 },
        },
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError, paymentOption } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") return; // user dismissed
        throw new Error(presentError.message);
      }

      // Payment succeeded — confirm with our backend
      // (webhook also handles this as a fallback)
      const piId = clientSecret.split("_secret_")[0];
      await confirmWithBackend(piId);

      Alert.alert(
        "✅ Payment Successful",
        `KES ${amount.toLocaleString()} paid for ${propertyTitle}`,
        [{ text: "OK", onPress: () => router.replace("/(tabs)/payments") }]
      );
    } catch (e: any) {
      Alert.alert("Payment Failed", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Google Pay / Apple Pay ─────────────────────────────────────────
  const handlePlatformPay = async () => {
    setLoading(true);
    try {
      const { clientSecret, paymentIntentId } = await fetchPaymentSheetParams();

      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [
            {
              label: propertyTitle,
              amount: amount.toFixed(2),
              paymentType: PlatformPay.PaymentType.Final ?? ("Final" as any),
            },
          ],
          merchantCountryCode: "KE",
          currencyCode: "KES",
        },
        googlePay: {
          merchantName: "Nexus Rent",
          merchantCountryCode: "KE",
          currencyCode: "KES",
          testEnv: __DEV__,
          billingAddressConfig: { format: PlatformPay.BillingAddressFormat.Full, isRequired: false },
        },
      });

      if (error) throw new Error(error.message);

      await confirmWithBackend(paymentIntentId);

      Alert.alert(
        "✅ Payment Successful",
        `KES ${amount.toLocaleString()} paid`,
        [{ text: "OK", onPress: () => router.replace("/(tabs)/payments") }]
      );
    } catch (e: any) {
      Alert.alert("Payment Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.ambientGlow} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.side}>
            <Image source={require("../../assets/back_icon.png")} style={styles.backIcon} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerLabel}>CARD PAYMENT</Text>
            <Text style={styles.headerTitle}>Pay Securely</Text>
          </View>
          <View style={styles.side} />
        </View>

        {/* Amount card */}
        <View style={styles.amountCard}>
          <View style={styles.amountGlow} />
          <CreditCard size={32} color={colorMap.purple} />
          <Text style={styles.amountLabel}>AMOUNT TO PAY</Text>
          <Text style={styles.amountValue}>KES {amount.toLocaleString()}</Text>
          <Text style={styles.amountSub}>{propertyTitle}</Text>
        </View>

        {/* Security badge */}
        <View style={styles.securityBadge}>
          <Shield size={14} color={colorMap.success} />
          <Text style={styles.securityText}>256-bit SSL · Powered by Stripe</Text>
        </View>

        {/* Google Pay / Apple Pay */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXPRESS CHECKOUT</Text>
          <PlatformPayButton
            onPress={handlePlatformPay}
            type={PlatformPay.ButtonType.Pay}
            appearance={PlatformPay.ButtonStyle.Automatic}
            borderRadius={14}
            style={styles.platformPayBtn}
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or pay with card</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Card button */}
        <TouchableOpacity
          onPress={handleCardPayment}
          style={styles.cardButton}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colorMap.purple, "#9D5AED"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.cardButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CreditCard size={18} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.cardButtonText}>PAY WITH CARD</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Accepted cards */}
        <View style={styles.acceptedRow}>
          {["VISA", "MC", "AMEX", "DISCOVER"].map((c) => (
            <View key={c} style={styles.cardChip}>
              <Text style={styles.cardChipText}>{c}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060A14" },
  ambientGlow: { position: "absolute", top: 100, right: -80, width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(124,58,237,0.15)" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 20, height: 50 },
  side: { width: 40, alignItems: "center", justifyContent: "center" },
  titleWrap: { flex: 1, alignItems: "flex-start", justifyContent: "center", paddingLeft: 65 },
  backIcon: { width: 22, height: 22, tintColor: colorMap.purple },
  headerLabel: { fontSize: 10, fontFamily: "Orbitron", letterSpacing: 2, color: "#888", marginBottom: 4 },
  headerTitle: { fontSize: 18, fontFamily: "Orbitron", fontWeight: "700", color: "#fff" },
  amountCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 22, padding: 28, backgroundColor: "rgba(124,58,237,0.08)", borderWidth: 1, borderColor: "rgba(124,58,237,0.2)", overflow: "hidden", alignItems: "center" },
  amountGlow: { position: "absolute", top: -40, left: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(124,58,237,0.15)" },
  amountLabel: { fontSize: 10, fontFamily: "Orbitron", letterSpacing: 2, color: "#888", marginTop: 12, marginBottom: 8 },
  amountValue: { fontSize: 36, fontFamily: "JetBrains Mono", fontWeight: "700", color: colorMap.purple, marginBottom: 8 },
  amountSub: { fontSize: 14, color: "#fff" },
  securityBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 },
  securityText: { fontSize: 11, color: colorMap.success, fontFamily: "Orbitron", letterSpacing: 1 },
  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontFamily: "Orbitron", color: "#888", letterSpacing: 2, marginBottom: 12 },
  platformPayBtn: { width: "100%", height: 52 },
  divider: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText: { color: "#555", fontSize: 12, fontFamily: "Orbitron" },
  cardButton: { marginHorizontal: 20, marginBottom: 16 },
  cardButtonGradient: { paddingVertical: 18, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  cardButtonText: { fontFamily: "Orbitron", fontSize: 14, fontWeight: "700", letterSpacing: 2, color: "#fff" },
  acceptedRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  cardChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.04)" },
  cardChipText: { fontSize: 10, color: "#666", fontFamily: "Orbitron", letterSpacing: 1 },
});