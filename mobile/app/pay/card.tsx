import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Image, Pressable, ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CreditCard, Shield } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import {
  useStripe,
  usePlatformPay,
  PlatformPay,
  PlatformPayButton,
} from "@stripe/stripe-react-native";
import { useAuthStore } from "../../store/authStore";
import api, { API_BASE } from "../../lib/api";


const log    = (label: string, data?: unknown) =>
  console.log(`[NexusPay] ${label}`, data !== undefined ? data : "");
const logErr = (label: string, e: unknown) =>
  console.error(`[NexusPay] ❌ ${label}`, {
    message: (e as any)?.message,
    code:    (e as any)?.code,
  });

const C = {
  purple:      "#7C3AED",
  purpleLight: "#9D5AED",
  success:     "#00FFA3",
  warn:        "#FFB84D",
  error:       "#FF4D4D",
  bg:          "#060A14",
  card:        "#0D1424",
  muted:       "#888",
};

export default function PaymentCardPage() {
  const router  = useRouter();
  const params  = useLocalSearchParams();
  const { token, user } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { confirmPlatformPayPayment, isPlatformPaySupported } = usePlatformPay();
  const amount        = params.amount      ? parseFloat(params.amount as string)    : 0;
  const scheduleId    = params.scheduleId  ? parseInt(params.scheduleId  as string) : 0;
  const propertyId    = params.propertyId  ? parseInt(params.propertyId  as string) : 0;
  const tenantId      = params.tenantId    ? parseInt(params.tenantId    as string) : user?.id ?? 0;
  const propertyTitle = (params.propertyTitle as string) || "Property";
  const accountRef    = (params.accountRef  as string) || `SCHED-${scheduleId}`;
  const [loading,              setLoading]              = useState(false);
  const [platformPayAvailable, setPlatformPayAvailable] = useState(false);

  useEffect(() => {
    log("Mount", { API_BASE, amount, propertyId, tenantId, accountRef });
    log("Token",  token ? `${token.slice(0, 16)}...` : "MISSING ⚠️");
    log("User",   user  ? { id: user.id, name: user.name } : "MISSING ⚠️");

    (async () => {
      const supported = await isPlatformPaySupported({ googlePay: { testEnv: __DEV__ } });
      setPlatformPayAvailable(supported);
      log("Platform Pay supported", supported);
      log("Platform", Platform.OS);
    })();
  }, []);

  const fetchSession = useCallback(async () => {
    log("Fetching card session...", { propertyId, tenantId, amount, accountRef });

    const data = await api.createCardSession(token!, {
      propertyId,
      tenantId,
      amount,
      accountRef,
    });

    log("Session received", {
      hasClientSecret: !!(data as any).clientSecret,
      hasEphemeralKey: !!(data as any).ephemeralKey,
      hasCustomerId:   !!(data as any).customerId,
      paymentIntentId: (data as any).paymentIntentId,
    });

    return data as {
      clientSecret:    string;
      ephemeralKey:    string;
      customerId:      string;
      paymentIntentId: string;
    };
  }, [token, propertyId, tenantId, amount, accountRef]);

  const confirmWithBackend = useCallback(async (piId: string) => {
    log("Confirming with backend", { piId });
    try {
      const res = await fetch(`${API_BASE}/api/payments/card/confirm`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ piId, tenantId, propertyId }),
      });
      log("Confirm status", res.status);
    } catch (e) {
      logErr("confirmWithBackend (non-fatal — webhook fallback active)", e);
    }
  }, [token, tenantId, propertyId]);

  const handleCardPayment = async () => {
    if (!token) { Alert.alert("Not authenticated", "Please log in first."); return; }
    setLoading(true);
    log("=== Card payment start ===");

    try {
      const { clientSecret, ephemeralKey, customerId } = await fetchSession();

      log("Initializing PaymentSheet...");
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName:         "Nexus Rent",
        customerId,
        customerEphemeralKeySecret:  ephemeralKey,
        paymentIntentClientSecret:   clientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails:       { name: user?.name ?? "" },
        appearance: {
          colors: {
            primary:             C.purple,
            background:          C.bg,
            componentBackground: C.card,
            componentBorder:     "#7C3AED4D",
            componentDivider:    "#FFFFFF1A",
            primaryText:         "#ffffff",
            secondaryText:       "#888888",
            componentText:       "#ffffff",
            placeholderText:     "#555555",
            icon:                "#7C3AED",
          },
          shapes: { borderRadius: 14 },
        },
      });

      if (initError) {
        logErr("initPaymentSheet", initError);
        throw new Error(initError.message);
      }

      log("Presenting PaymentSheet...");
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") { log("User dismissed"); return; }
        logErr("presentPaymentSheet", presentError);
        throw new Error(presentError.message);
      }

      log("PaymentSheet ✅");
      await confirmWithBackend(clientSecret.split("_secret_")[0]);

      Alert.alert(
        "✅ Payment Successful",
        `KES ${amount.toLocaleString()} paid for ${propertyTitle}`,
        [{ text: "Done", onPress: () => router.replace("/(tabs)/payments") }]
      );
    } catch (e: any) {
      logErr("handleCardPayment", e);
      Alert.alert("Payment Failed", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformPay = async () => {
    if (!token) { Alert.alert("Not authenticated", "Please log in first."); return; }
    setLoading(true);
    log("=== Platform Pay start ===");

    try {
      const { clientSecret, paymentIntentId } = await fetchSession();

      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [{
            label:       propertyTitle,
            amount:      amount.toFixed(2),
            paymentType: 1 as any, 
          }],
          merchantCountryCode: "KE",
          currencyCode:        "KES",
        },
        googlePay: {
          merchantName:        "Nexus Rent",
          merchantCountryCode: "KE",
          currencyCode:        "KES",
          testEnv:             __DEV__,
          billingAddressConfig: {
            format:     PlatformPay.BillingAddressFormat.Full,
            isRequired: false,
          },
        },
      });

      if (error) { logErr("confirmPlatformPayPayment", error); throw new Error(error.message); }

      log("Platform Pay ✅", { paymentIntentId });
      await confirmWithBackend(paymentIntentId);

      Alert.alert(
        "✅ Payment Successful",
        `KES ${amount.toLocaleString()} paid for ${propertyTitle}`,
        [{ text: "Done", onPress: () => router.replace("/(tabs)/payments") }]
      );
    } catch (e: any) {
      logErr("handlePlatformPay", e);
      Alert.alert("Payment Failed", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.ambientGlow} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.side}>
            <Image source={require("../../assets/back_icon.png")} style={s.backIcon} />
          </Pressable>
          <View style={s.titleWrap}>
            <Text style={s.headerLabel}>CARD PAYMENT</Text>
            <Text style={s.headerTitle}>Pay Securely</Text>
          </View>
          <View style={s.side} />
        </View>

        {/* Amount card */}
        <View style={s.amountCard}>
          <View style={s.amountGlow} />
          <CreditCard size={32} color={C.purple} />
          <Text style={s.amountLabel}>AMOUNT TO PAY</Text>
          <Text style={s.amountValue}>KES {amount.toLocaleString()}</Text>
          <Text style={s.amountSub}>{propertyTitle}</Text>
        </View>

        {/* Security badge */}
        <View style={s.securityBadge}>
          <Shield size={14} color={C.success} />
          <Text style={s.securityText}>256-bit SSL · Powered by Stripe</Text>
        </View>

        {/* Google Pay / Apple Pay — only if supported on this device */}
        {platformPayAvailable && (
          <>
            <View style={s.section}>
              <Text style={s.sectionLabel}>EXPRESS CHECKOUT</Text>
              <PlatformPayButton
                onPress={handlePlatformPay}
                type={PlatformPay.ButtonType.Pay}
                appearance={PlatformPay.ButtonStyle.Automatic}
                borderRadius={14}
                style={s.platformPayBtn}
              />
            </View>
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or pay with card</Text>
              <View style={s.dividerLine} />
            </View>
          </>
        )}

        {/* iOS simulator note */}
        {!platformPayAvailable && Platform.OS === "ios" && __DEV__ && (
          <View style={s.infoBox}>
            <Text style={s.infoText}>
              Apple Pay requires a physical iPhone with a card added to Wallet.
              Not available on simulators.
            </Text>
          </View>
        )}

        {/* Pay with card button */}
        <TouchableOpacity
          onPress={handleCardPayment}
          style={s.cardButton}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[C.purple, C.purpleLight]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.cardButtonGradient}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <CreditCard size={18} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={s.cardButtonText}>PAY WITH CARD</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Accepted cards */}
        <View style={s.acceptedRow}>
          {["VISA", "MC", "AMEX", "DISCOVER"].map((c) => (
            <View key={c} style={s.cardChip}>
              <Text style={s.cardChipText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* DEV debug strip */}
        {__DEV__ && (
          <View style={s.debugStrip}>
            <Text style={s.debugText}>
              {"─── DEV ───\n"}
              {`API: ${API_BASE}\n`}
              {`amount=${amount}  pid=${propertyId}  tid=${tenantId}\n`}
              {`accountRef=${accountRef}\n`}
              {`token: ${token ? token.slice(0, 20) + "..." : "MISSING ⚠️"}\n`}
              {`platformPay: ${platformPayAvailable ? "✅" : "❌"}  (${Platform.OS})`}
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: C.bg },
  ambientGlow:        { position: "absolute", top: 100, right: -80, width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(124,58,237,0.15)" },

  header:             { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 20, height: 50 },
  side:               { width: 40, alignItems: "center", justifyContent: "center" },
  titleWrap:          { flex: 1, alignItems: "flex-start", justifyContent: "center", paddingLeft: 65 },
  backIcon:           { width: 22, height: 22, tintColor: C.purple },
  headerLabel:        { fontSize: 10, fontFamily: "Orbitron", letterSpacing: 2, color: C.muted, marginBottom: 4 },
  headerTitle:        { fontSize: 18, fontFamily: "Orbitron", fontWeight: "700", color: "#fff" },

  amountCard:         { marginHorizontal: 20, marginBottom: 16, borderRadius: 22, padding: 28, backgroundColor: "rgba(124,58,237,0.08)", borderWidth: 1, borderColor: "rgba(124,58,237,0.2)", overflow: "hidden", alignItems: "center" },
  amountGlow:         { position: "absolute", top: -40, left: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(124,58,237,0.15)" },
  amountLabel:        { fontSize: 10, fontFamily: "Orbitron", letterSpacing: 2, color: C.muted, marginTop: 12, marginBottom: 8 },
  amountValue:        { fontSize: 36, fontFamily: "JetBrains Mono", fontWeight: "700", color: C.purple, marginBottom: 8 },
  amountSub:          { fontSize: 14, color: "#fff" },

  securityBadge:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 },
  securityText:       { fontSize: 11, color: C.success, fontFamily: "Orbitron", letterSpacing: 1 },

  section:            { marginHorizontal: 20, marginBottom: 20 },
  sectionLabel:       { fontSize: 10, fontFamily: "Orbitron", color: C.muted, letterSpacing: 2, marginBottom: 12 },
  platformPayBtn:     { width: "100%", height: 52 },

  divider:            { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 20, gap: 12 },
  dividerLine:        { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText:        { color: "#555", fontSize: 12, fontFamily: "Orbitron" },

  infoBox:            { marginHorizontal: 20, marginBottom: 20, padding: 12, borderRadius: 10, backgroundColor: "rgba(255,184,77,0.08)", borderWidth: 1, borderColor: "rgba(255,184,77,0.2)" },
  infoText:           { fontSize: 11, color: C.warn, lineHeight: 18 },

  cardButton:         { marginHorizontal: 20, marginBottom: 16 },
  cardButtonGradient: { paddingVertical: 18, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  cardButtonText:     { fontFamily: "Orbitron", fontSize: 14, fontWeight: "700", letterSpacing: 2, color: "#fff" },

  acceptedRow:        { flexDirection: "row", justifyContent: "center", gap: 8 },
  cardChip:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.04)" },
  cardChipText:       { fontSize: 10, color: "#666", fontFamily: "Orbitron", letterSpacing: 1 },

  debugStrip:         { margin: 20, padding: 12, backgroundColor: "rgba(255,255,0,0.04)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,0,0.15)" },
  debugText:          { fontSize: 10, color: C.warn, fontFamily: "monospace", lineHeight: 17 },
});