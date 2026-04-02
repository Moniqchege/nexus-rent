import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../store/authStore";

function GradientText({ text, fontSize = 24 }: { text: string; fontSize?: number }) {
  return (
    <MaskedView
      style={{ flexDirection: "row", alignSelf: "center" }}
      maskElement={
        <Text
          style={{
            fontSize,
            fontFamily: "Orbitron",
            color: "black",
            backgroundColor: "transparent",
          }}
        >
          {text}
        </Text>
      }
    >
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={["#00FFFF", "#7C3AED"]}
      >
        <Text
          style={{
            fontSize,
            fontFamily: "Orbitron",
            color: "transparent",
          }}
        >
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function OtpVerification() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useAuthStore();
  const params = useLocalSearchParams();
  const router = useRouter();

  const userId = params.userId as string | undefined;
  const email = params.email as string | undefined;

  // ✅ FIX: navigation side-effect handled properly
  useEffect(() => {
    if (!userId || !email) {
      router.back();
    }
  }, [userId, email]);

  if (!userId || !email) return null;

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setError(null);
    setLoading(true);

  try {
  await auth.verifyOtp(userId, otp);
  router.replace("/home");
} catch (err: any) {
  setError(err?.message || "Invalid OTP. Please try again.");
} finally {
  setLoading(false);
}
  };

  const handleResendOtp = async () => {
    setError(null);
    // TODO: implement resend API
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background Glow */}
      <View style={styles.glowTopLeft} />
      <View style={styles.glowBottomRight} />
      <View style={styles.glowCenter} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.logoBlock}>
          <LinearGradient
            colors={["rgba(0,240,255,0.12)", "rgba(124,58,237,0.15)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <Text style={styles.logoIconText}>⬡</Text>
          </LinearGradient>

          <GradientText text="VERIFY OTP" fontSize={26} />

          <View style={styles.tagPill}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>ENTER 6-DIGIT CODE</Text>
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>OTP Verification</Text>
            <Text style={styles.cardSub}>Code sent to {email}</Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {/* OTP Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>OTP CODE</Text>

            <View style={styles.otpInputWrap}>
              <TextInput
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor="#4B5563"
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
                  setOtp(cleaned);
                }}
              />
            </View>

            <Text style={styles.otpHint}>
              Enter the 6-digit code sent to your email
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.ctaWrap,
              (loading || otp.length !== 6) && { opacity: 0.5 },
            ]}
            onPress={handleVerifyOtp}
            disabled={loading || otp.length !== 6}
          >
            <LinearGradient
              colors={["rgba(0,240,255,0.15)", "rgba(124,58,237,0.2)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              {loading ? (
                <ActivityIndicator color="#00F0FF" />
              ) : (
                <>
                  <Text style={styles.ctaText}>VERIFY OTP</Text>
                  <Text style={styles.ctaArrow}>›</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity onPress={handleResendOtp} style={styles.resendRow}>
            <Text style={styles.resendText}>Resend OTP?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060A14" },

  glowTopLeft: {
    position: "absolute",
    top: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(124,58,237,0.1)",
  },
  glowBottomRight: {
    position: "absolute",
    bottom: 60,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0,240,255,0.07)",
  },
  glowCenter: {
    position: "absolute",
    top: "40%",
    left: "20%",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(124,58,237,0.05)",
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 50,
    paddingBottom: 48,
    alignItems: "center",
  },

  logoBlock: {
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },

  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.2)",
  },

  logoIconText: { fontSize: 32, color: "#00F0FF" },

  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,240,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#00F0FF",
  },

  tagText: {
    fontSize: 9,
    fontFamily: "Orbitron",
    color: "#00F0FF",
    letterSpacing: 1.5,
  },

  card: {
    width: "100%",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },

  cardHeader: {
    marginBottom: 28,
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 22,
    fontFamily: "Orbitron",
    color: "#E5E7EB",
    marginBottom: 6,
  },

  cardSub: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Sora",
  },

  fieldGroup: { marginBottom: 20 },

  fieldLabel: {
    fontSize: 9,
    fontFamily: "Orbitron",
    color: "#9CA3AF",
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  otpInputWrap: {
    backgroundColor: "rgba(0,240,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.4)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
    alignItems: "center",
  },

  otpInput: {
    fontSize: 24,
    fontFamily: "Orbitron",
    color: "#00F0FF",
    letterSpacing: 8,
    textAlign: "center",
    width: "100%",
  },

  otpHint: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Sora",
    textAlign: "center",
    marginTop: 8,
  },

  ctaWrap: {
    marginBottom: 24,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.3)",
  },

  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },

  ctaText: {
    fontSize: 13,
    fontFamily: "Orbitron",
    color: "#00F0FF",
    letterSpacing: 3,
  },

  ctaArrow: {
    fontSize: 20,
    color: "#00F0FF",
  },

  resendRow: { alignItems: "center" },

  resendText: {
    fontSize: 13,
    color: "#00F0FF",
    fontFamily: "Sora",
  },

  errorBanner: {
    backgroundColor: "rgba(255,59,129,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,59,129,0.3)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },

  errorText: {
    color: "#FF3B81",
    fontSize: 12,
    fontFamily: "Sora",
  },
});