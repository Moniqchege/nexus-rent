import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useState } from "react";

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
        {/* Envelope shape using nested Views */}
        <View style={{
          width: size, height: size * 0.72,
          borderWidth: 1.5, borderColor: "#2DD4BF",
          borderRadius: 3,
          alignItems: "center", justifyContent: "flex-start",
          overflow: "hidden",
        }}>
          {/* V-flap */}
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
        {/* Lock shackle */}
        <View style={{
          width: size * 0.5, height: size * 0.4,
          borderWidth: 1.5, borderColor: "#A78BFA",
          borderBottomWidth: 0,
          borderTopLeftRadius: size * 0.25, borderTopRightRadius: size * 0.25,
          marginBottom: -1,
        }} />
        {/* Lock body */}
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
        {/* Eye outline */}
        <View style={{
          width: size, height: size * 0.55,
          borderWidth: 1.5, borderColor: "#67E8F9",
          borderRadius: size * 0.3,
          alignItems: "center", justifyContent: "center",
        }}>
          {/* Pupil */}
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
        {/* Closed eye — just a curved line using border trick */}
        <View style={{
          width: size, height: size * 0.55,
          borderBottomWidth: 1.5, borderColor: "#67E8F9",
          borderBottomLeftRadius: size * 0.3,
          borderBottomRightRadius: size * 0.3,
        }} />
        {/* Strike-through line */}
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Ambient glows */}
      <View style={styles.glowTopLeft} />
      <View style={styles.glowBottomRight} />
      <View style={styles.glowCenter} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Logo block ── */}
        <View style={styles.logoBlock}>
          <LinearGradient
            colors={["rgba(0,240,255,0.12)", "rgba(124,58,237,0.15)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <Text style={styles.logoIconText}>⬡</Text>
          </LinearGradient>

          <GradientText text="NEXUS RENT" fontSize={26} />

          <View style={styles.tagPill}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>POWERED RENTAL PLATFORM</Text>
          </View>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>

          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>
          </View>

          {/* ── Email input ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={[
              styles.inputWrap,
              focused === "email" && styles.inputFocused,
            ]}>
              <Icon type="email" size={18} />
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor="#4B5563"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* ── Password input ── */}
          <View style={styles.fieldGroup}>
           <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={[
              styles.inputWrap,
              focused === "password" && styles.inputFocused,
            ]}>
              <Icon type="lock" size={18} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#4B5563"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {passwordVisible ? (
    // Open eye — password visible
    <Text style={styles.eyeIconOpen}>👁</Text>
  ) : (
    // Closed eye — password hidden
    <Text style={styles.eyeIconClosed}>🫣</Text>
  )}
              </TouchableOpacity>
            </View>
            <View style={styles.forgotRow}>
  <TouchableOpacity>
    <Text style={styles.forgotLink}>Forgot password?</Text>
  </TouchableOpacity>
</View>
          </View>

          {/* ── Remember me ── */}
          <TouchableOpacity style={styles.rememberRow} activeOpacity={0.7}>
            <View style={styles.checkbox}>
              <View style={styles.checkboxInner} />
            </View>
            <Text style={styles.rememberText}>Keep me signed in</Text>
          </TouchableOpacity>

          {/* ── Primary CTA ── */}
          <TouchableOpacity activeOpacity={0.85} style={styles.ctaWrap}>
            <LinearGradient
              colors={["rgba(0,240,255,0.15)", "rgba(124,58,237,0.2)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>SIGN IN</Text>
              <Text style={styles.ctaArrow}>›</Text>
            </LinearGradient>
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

  // ── Ambient ──
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

  // ── Logo ──
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

  // ── Card ──
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

  // ── Fields ──
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
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 11,
    color: "#00F0FF",
    fontFamily: "Sora",
  },
  forgotRow: {
  alignItems: "flex-end",
  marginTop: 6,
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
  inputFocused: {
    borderColor: "rgba(0,240,255,0.5)",
    backgroundColor: "rgba(0,240,255,0.03)",
  },
  inputIcon: {
    fontSize: 25,
    color: "#4B5563",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#E5E7EB",
    fontFamily: "Sora",
  },
  eyeIcon: {
    fontSize: 15,
    color: "#4B5563",
  },

  // ── Remember ──
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.3)",
    backgroundColor: "rgba(0,240,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#00F0FF",
  },
  rememberText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Sora",
  },

  // ── CTA ──
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

  // ── Divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1F2937",
  },
  dividerText: {
    fontSize: 11,
    color: "#4B5563",
    fontFamily: "Sora",
  },

  // ── Social ──
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#0d1520",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  socialIcon: {
    fontSize: 14,
    color: "#E5E7EB",
    fontWeight: "600",
  },
  socialLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Sora",
  },

  // ── Trust ──
  trustRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
    width: "100%",
  },
  trustBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  trustIcon: {
    fontSize: 11,
    color: "#00F0FF",
  },
  trustLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    fontFamily: "Orbitron",
    letterSpacing: 0.5,
  },

  // ── Sign up ──
  signupRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  signupText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Sora",
  },
  signupLink: {
    fontSize: 13,
    color: "#00F0FF",
    fontFamily: "Sora",
  },

  // ── Role toggle ──
  roleToggle: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 12,
    padding: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  roleBtnActive: {
    backgroundColor: "rgba(0,240,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.25)",
  },
  roleLabel: {
    fontSize: 12,
    fontFamily: "Orbitron",
    color: "#4B5563",
    letterSpacing: 1,
  },
  roleLabelActive: {
    fontSize: 12,
    fontFamily: "Orbitron",
    color: "#00F0FF",
    letterSpacing: 1,
  },
  inputIconEmail: {
  fontSize: 16,
  color: "#2DD4BF",       
},

inputIconPassword: {
  fontSize: 16,
  color: "#A78BFA",       
},

eyeIconOpen: {
  fontSize: 16,
  color: "#67E8F9",      
},

eyeIconClosed: {
  fontSize: 16,
  color: "#374151",        
},
});