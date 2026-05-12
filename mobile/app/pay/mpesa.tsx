import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Smartphone, CheckCircle2 } from "lucide-react-native";
import { useState } from "react";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

const colorMap = {
  neon: "#00FFFF",
  purple: "#7C3AED",
  success: "#00FFA3",
  warn: "#FFB84D",
  muted: "#888",
  border: "rgba(255,255,255,0.05)",
};

export default function PaymentMpesaPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuthStore();

  const amount = params.amount ? parseFloat(params.amount as string) : 0;
  const scheduleId = params.scheduleId ? parseInt(params.scheduleId as string) : 0;
  const propertyTitle = params.propertyTitle as string || "Property";
  const dueDate = params.dueDate as string || "";

  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // M-Pesa Paybill Details (these would ideally come from backend)
  const paybillNumber = "174379";
  const accountNumber = `RENT-${scheduleId}`;

  const formatPhoneNumber = (text: string) => {
  const cleaned = text.replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    return "254" + cleaned.slice(1);
  }

  if (
    cleaned.length === 9 &&
    (cleaned.startsWith("7") || cleaned.startsWith("1"))
  ) {
    return "254" + cleaned;
  }

  if (cleaned.startsWith("254")) {
    return cleaned;
  }

  return cleaned;
};

 const handlePayment = async () => {
  const formattedPhone = formatPhoneNumber(phone);

  console.log("========== PHONE DEBUG ==========");
  console.log("Raw phone:", phone);
  console.log("Formatted phone:", formattedPhone);
  console.log("Raw length:", phone.length);
  console.log("Formatted length:", formattedPhone.length);
  console.log("================================");

  if (!formattedPhone || formattedPhone.length !== 12) {
    Alert.alert(
      "Invalid Phone",
      "Please enter a valid Safaricom number"
    );
    return;
  }

  if (!token || !user) {
    Alert.alert("Authentication Error", "Please login again");
    return;
  }

  setLoading(true);

  try {
    const payload = {
      phone: formattedPhone,
      amount,
      propertyId: user.userProperties[0]?.propertyId || 0,
      tenantId: user.id,
      accountRef: accountNumber,
      description: `Rent payment for ${propertyTitle}`,
    };

    console.log("========== STK PUSH REQUEST ==========");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("======================================");

    const result = await api.initiateMpesaSTK(token, payload);

    console.log("========== STK PUSH RESPONSE ==========");
    console.log("Response:", JSON.stringify(result, null, 2));
    console.log("======================================");

    if (result.success) {
      setSuccess(true);

      setTimeout(() => {
        router.replace("/(tabs)/payments");
      }, 3000);
    } else {
      Alert.alert(
        "Payment Failed",
        result.error || "Unable to initiate payment"
      );
    }
  } catch (error: any) {
    console.log("========== STK PUSH ERROR ==========");
    console.log("Full Error:", error);

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(
        "Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }

    console.log("Message:", error.message);
    console.log("====================================");

    Alert.alert(
      "Error",
      error.response?.data?.message ||
        error.message ||
        "Failed to process payment"
    );
  } finally {
    setLoading(false);
  }
};

  if (success) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <CheckCircle2 size={80} color={colorMap.success} />
        <Text style={styles.successTitle}>STK Push Sent!</Text>
        <Text style={styles.successText}>
          Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

          <View style={styles.titleWrap}>
            <Text style={styles.headerLabel}>M-PESA PAYMENT</Text>
            <Text style={styles.headerTitle}>Lipa na M-Pesa</Text>
          </View>

          <View style={styles.side} />
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <View style={styles.amountGlow} />
          <Smartphone size={32} color={colorMap.success} />
          <Text style={styles.amountLabel}>AMOUNT TO PAY</Text>
          <Text style={styles.amountValue}>KES {amount.toLocaleString()}</Text>
          <Text style={styles.amountSub}>{propertyTitle}</Text>
        </View>

        {/* Paybill Information */}
        <View style={styles.paybillCard}>
          <Text style={styles.paybillTitle}>M-PESA PAYBILL DETAILS</Text>
          <View style={styles.paybillRow}>
            <Text style={styles.paybillLabel}>Paybill Number:</Text>
            <Text style={styles.paybillValue}>{paybillNumber}</Text>
          </View>
          <View style={styles.paybillRow}>
            <Text style={styles.paybillLabel}>Account Number:</Text>
            <Text style={styles.paybillValue}>{accountNumber}</Text>
          </View>
          <View style={styles.paybillRow}>
            <Text style={styles.paybillLabel}>Amount:</Text>
            <Text style={[styles.paybillValue, { color: colorMap.success }]}>
              KES {amount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Phone Input */}
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>M-PESA PHONE NUMBER</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>+254</Text>
            <TextInput
              style={styles.input}
              placeholder="712345678"
              placeholderTextColor="#444"
              keyboardType="phone-pad"
              value={phone.replace(/^254/, "").replace(/^0/, "")}
              onChangeText={(text) => setPhone(text)}
              maxLength={9}
            />
          </View>
          <Text style={styles.inputHint}>
            You'll receive an STK push notification on this number
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How it works:</Text>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Enter your M-Pesa registered phone number</Text>
          </View>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Tap "Send STK Push" below</Text>
          </View>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Check your phone for M-Pesa prompt</Text>
          </View>
          <View style={styles.instructionStep}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>Enter your M-Pesa PIN to complete</Text>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          onPress={handlePayment}
          disabled={loading || !phone}
          style={[styles.payButton, (!phone || loading) && styles.payButtonDisabled]}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={!phone || loading ? ["#444", "#333"] : [colorMap.success, "#00FFAA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#0B0F19" />
            ) : (
              <Text style={styles.payButtonText}>SEND STK PUSH</Text>
            )}
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
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(0,255,163,0.1)",
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
    tintColor: colorMap.success,
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
    marginBottom: 20,
    borderRadius: 22,
    padding: 28,
    backgroundColor: "rgba(0,255,163,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,255,163,0.2)",
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
  },
  amountGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(0,255,163,0.15)",
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
    color: colorMap.success,
    marginBottom: 8,
  },
  amountSub: {
    fontSize: 14,
    color: "#fff",
  },
  paybillCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,255,163,0.2)",
  },
  paybillTitle: {
    fontSize: 11,
    fontFamily: "Orbitron",
    letterSpacing: 1.5,
    color: "#888",
    marginBottom: 16,
  },
  paybillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  paybillLabel: {
    fontSize: 13,
    color: "#888",
  },
  paybillValue: {
    fontSize: 14,
    fontFamily: "JetBrains Mono",
    color: "#fff",
    fontWeight: "600",
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: "Orbitron",
    letterSpacing: 1.5,
    color: "#888",
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,163,0.2)",
    paddingHorizontal: 16,
    height: 56,
  },
  inputPrefix: {
    fontSize: 16,
    fontFamily: "JetBrains Mono",
    color: "#fff",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "JetBrains Mono",
    color: "#fff",
  },
  inputHint: {
    fontSize: 11,
    color: "#666",
    marginTop: 8,
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: "rgba(0,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.1)",
  },
  instructionsTitle: {
    fontSize: 13,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: "rgba(0,255,163,0.15)",
    borderRadius: 12,
    fontSize: 12,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: colorMap.success,
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: "#aaa",
  },
  payButton: {
    marginHorizontal: 20,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    fontFamily: "Orbitron",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#0B0F19",
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Orbitron",
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
