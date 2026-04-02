import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useState } from "react";
import { useNavigation } from "expo-router";
import api from "../lib/api";

type ColorKey = "neon" | "purple" | "success" | "danger" | "warn";

const colorMap: Record<ColorKey, { box: any; text: any; bar: any }> = {
  neon: {
    box: { backgroundColor: "rgba(0,240,255,0.1)", borderColor: "rgba(0,240,255,0.3)", borderWidth: 1 },
    text: { color: "#00F0FF" },
    bar: { backgroundColor: "#00F0FF" },
  },
  purple: {
    box: { backgroundColor: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.3)", borderWidth: 1 },
    text: { color: "#7C3AED" },
    bar: { backgroundColor: "#7C3AED" },
  },
  success: {
    box: { backgroundColor: "rgba(0,255,163,0.1)", borderColor: "rgba(0,255,163,0.3)", borderWidth: 1 },
    text: { color: "#00FFA3" },
    bar: { backgroundColor: "#00FFA3" },
  },
  danger: {
    box: { backgroundColor: "rgba(255,59,129,0.1)", borderColor: "rgba(255,59,129,0.3)", borderWidth: 1 },
    text: { color: "#FF3B81" },
    bar: { backgroundColor: "#FF3B81" },
  },
  warn: {
    box: { backgroundColor: "rgba(255,184,77,0.1)", borderColor: "rgba(255,184,77,0.3)", borderWidth: 1 },
    text: { color: "#FFB84D" },
    bar: { backgroundColor: "#FFB84D" },
  },
};

function Icon({ type, size = 18 }: { type: "email" | "lock" | "eye-open" | "eye-closed"; size?: number }) {
  const icons = {
    "email": (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <View style={{
          width: size, height: size * 0.72,
          borderWidth: 1.5, borderColor: "#2DD4BF",
          borderRadius: 3,
          alignItems: "center", justifyContent: "flex-start",
          overflow: "hidden",
        }}>
          <View style={{
            width: 0, height: 0,
            borderLeftWidth: size / 2, borderRightWidth: size / 2,
            borderTopWidth: size * 0.38,
            borderLeftColor: "transparent", borderRightColor: "transparent",
            borderTopColor: "#2DD4BF",
          }} />
        </View>
      </View>
    ),
    "lock": (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <View style={{
          width: size * 0.5, height: size * 0.4,
          borderWidth: 1.5, borderColor: "#A78BFA",
          borderBottomWidth: 0,
          borderTopLeftRadius: size * 0.25, borderTopRightRadius: size * 0.25,
          marginBottom: -1,
        }} />
        <View style={{
          width: size * 0.78, height: size * 0.5,
          backgroundColor: "rgba(167,139,250,0.15)",
          borderWidth: 1.5, borderColor: "#A78BFA",
          borderRadius: 3,
          alignItems: "center", justifyContent: "center",
        }}>
          <View style={{
            width: 4, height: 4,
            borderRadius: 2,
            backgroundColor: "#A78BFA",
          }} />
        </View>
      </View>
    ),
    "eye-open": (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <View style={{
          width: size, height: size * 0.55,
          borderWidth: 1.5, borderColor: "#67E8F9",
          borderRadius: size * 0.3,
          alignItems: "center", justifyContent: "center",
        }}>
          <View style={{
            width: size * 0.35, height: size * 0.35,
            borderRadius: size * 0.175,
            borderWidth: 1.5, borderColor: "#67E8F9",
          }} />
        </View>
      </View>
    ),
    "eye-closed": (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <View style={{
          width: size, height: size * 0.55,
          borderBottomWidth: 1.5, borderColor: "#67E8F9",
          borderBottomLeftRadius: size * 0.3,
          borderBottomRightRadius: size * 0.3,
        }} />
        <View style={{
          position: "absolute",
          width: 1.5, height: size * 0.85,
          backgroundColor: "#67E8F9",
          transform: [{ rotate: "45deg" }],
        }} />
      </View>
    ),
  };
  return icons[type];
}

function GradientText({ text, fontSize = 24 }: { text: string; fontSize?: number }) {
  return (
     <MaskedView
      style={{ flexDirection: "row" }}    
      maskElement={
        <Text style={{ fontSize, fontFamily: "Orbitron", color: "black", backgroundColor: "transparent" }}>
          {text}
        </Text>
      }
    >
      <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={["#00FFFF", "#7C3AED"]}>
        <Text style={{ fontSize, fontFamily: "Orbitron", color: "transparent" }}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigation = useNavigation<any>();

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.logoBlock}>
            <LinearGradient
              colors={["rgba(0,240,255,0.12)", "rgba(124,58,237,0.15)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoIcon}
            >
              <Text style={styles.logoIconText}>⬡</Text>
            </LinearGradient>
            <GradientText text="RESET PASSWORD" fontSize={26} />
          </View>

          <View style={styles.card}>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successSub}>We've sent a reset link to {email}</Text>
            <Text style={styles.successText}>Click the link in the email to continue resetting your password. Check spam if not found.</Text>

            <TouchableOpacity activeOpacity={0.85} style={styles.ctaWrap} onPress={() => navigation.navigate("reset-password")}>
              <LinearGradient
                colors={["rgba(0,240,255,0.15)", "rgba(124,58,237,0.2)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>ENTER RESET CODE</Text>
                <Text style={styles.ctaArrow}>›</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setSuccess(false); setEmail(""); }}>
              <Text style={styles.changeEmail}>Change email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.glowTopLeft} />
      <View style={styles.glowBottomRight} />
      <View style={styles.glowCenter} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBlock}>
          <LinearGradient
            colors={["rgba(0,240,255,0.12)", "rgba(124,58,237,0.15)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <Text style={styles.logoIconText}>⬡</Text>
          </LinearGradient>
          <GradientText text="FORGOT PASSWORD" fontSize={26} />
          <View style={styles.tagPill}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>RESET YOUR PASSWORD</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Reset password</Text>
            <Text style={styles.cardSub}>Enter your email to receive reset instructions</Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrap}>
              <Icon type="email" size={18} />
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor="#4B5563"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
              />
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.ctaWrap} onPress={handleForgotPassword} disabled={loading}>
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
                  <Text style={styles.ctaText}>SEND RESET LINK</Text>
                  <Text style={styles.ctaArrow}>›</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("login")}>
            <Text style={styles.backLink}>← Back to login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A14",
  },
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
    marginBottom: 4,
  },
  logoIconText: {
    fontSize: 32,
    color: "#00F0FF",
  },
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
  successTitle: {
    fontSize: 22,
    fontFamily: "Orbitron",
    color: "#00FFA3",
    marginBottom: 6,
    textAlign: "center",
  },
  successSub: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Sora",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Sora",
    lineHeight: 20,
    marginBottom: 32,
    textAlign: "center",
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 9,
    fontFamily: "Orbitron",
    color: "#9CA3AF",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1520",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#E5E7EB",
    fontFamily: "Sora",
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
    lineHeight: 22,
  },
  backLink: {
    fontSize: 13,
    color: "#00F0FF",
    fontFamily: "Sora",
    textAlign: "center",
  },
  changeEmail: {
    fontSize: 13,
    color: "#00F0FF",
    fontFamily: "Sora",
    textAlign: "center",
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
