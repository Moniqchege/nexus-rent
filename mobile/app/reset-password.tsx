import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useState } from "react";
import { useNavigation, useLocalSearchParams } from "expo-router";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

function Icon({ type, size = 18 }: { type: "email" | "lock" | "key" | "eye-open" | "eye-closed"; size?: number }) {
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
    "key": (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        {/* Key head */}
        <View style={{
          width: size * 0.45, height: size * 0.45,
          backgroundColor: "rgba(255,184,77,0.3)",
          borderWidth: 1.5, borderColor: "#FFB84D",
          borderRadius: size * 0.225,
          marginBottom: 2,
        }} />
        {/* Key shaft */}
        <View style={{
          width: 2.5, height: size * 0.55,
          backgroundColor: "#FFB84D",
          borderRadius: 1.25,
        }} />
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

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [focused, setFocused] = useState<"token" | "password" | "confirm" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigation = useNavigation<any>();
  const auth = useAuthStore();

  const [passwordCriteria, setPasswordCriteria] = useState({
  minLength: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false,
});

const validatePassword = (pwd: string) => {
  setPasswordCriteria({
    minLength: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
  });
};


  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError("Password and confirm password are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
   if (!Object.values(passwordCriteria).every(Boolean)) {
  setError("Password does not meet all requirements.");
  return;
}

    setError(null);
    setLoading(true);

    try {
      if (auth.isFirstLogin && auth.tempToken && auth.user) {
  // Step 1: reset the password
  await api.resetFirstPassword(auth.tempToken, password);
  
  // Step 2: directly request OTP using the temp token — no re-login needed
  await api.sendOtp(auth.tempToken);

  // Step 3: go to OTP screen
  navigation.navigate("otp", {
    userId: auth.user.id.toString(),
    email: auth.user.email,
  });
} else {
        await api.resetPassword(password);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
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
            <GradientText text="PASSWORD RESET" fontSize={26} />
          </View>

          <View style={styles.card}>
            <Text style={styles.successTitle}>Password updated!</Text>
            <Text style={styles.successSub}>Your password has been successfully reset.</Text>

            <TouchableOpacity activeOpacity={0.85} style={styles.ctaWrap} onPress={() => navigation.navigate("login")}>
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
          <GradientText text="RESET PASSWORD" fontSize={26} />
          <View style={styles.tagPill}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>ENTER NEW PASSWORD</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>New password</Text>
            <Text style={styles.cardSub}>Enter new password</Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
            <View style={[styles.inputWrap, focused === "password" && styles.inputFocused]}>
              <Icon type="lock" size={18} />
              <TextInput
                style={styles.input}
                placeholder="Create new password"
                placeholderTextColor="#4B5563"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={(t) => { setPassword(t); validatePassword(t); setError(null); }}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={passwordVisible ? styles.eyeIconOpen : styles.eyeIconClosed}>
                  {passwordVisible ? "👁" : "🫣"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.criteriaBox}>
  <Text style={styles.criteriaTitle}>Password must contain:</Text>
  {[
    { key: "minLength",  label: "Minimum 8 characters" },
    { key: "uppercase",  label: "At least one uppercase letter" },
    { key: "lowercase",  label: "At least one lowercase letter" },
    { key: "number",     label: "At least one number" },
    { key: "special",    label: "At least one special character" },
  ].map(({ key, label }) => {
    const met = passwordCriteria[key as keyof typeof passwordCriteria];
    return (
      <View key={key} style={styles.criteriaRow}>
        <Text style={[styles.criteriaIcon, met && styles.criteriaIconMet]}>
          {met ? "✓" : "○"}
        </Text>
        <Text style={[styles.criteriaText, met && styles.criteriaTextMet]}>
          {label}
        </Text>
      </View>
    );
  })}
</View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
            <View style={[styles.inputWrap, focused === "confirm" && styles.inputFocused]}>
              <Icon type="lock" size={18} />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#4B5563"
                secureTextEntry={!confirmVisible}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); validatePassword(t); setError(null); }}
                onFocus={() => setFocused("confirm")}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity
                onPress={() => setConfirmVisible(!confirmVisible)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={confirmVisible ? styles.eyeIconOpen : styles.eyeIconClosed}>
                  {confirmVisible ? "👁" : "🫣"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.ctaWrap} onPress={handleResetPassword} disabled={loading}>
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
                  <Text style={styles.ctaText}>RESET PASSWORD</Text>
                </>
              )}
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
  // ... same glows, logoBlock, etc. as forgot-password.tsx
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
  inputFocused: {
    borderColor: "rgba(0,240,255,0.5)",
    backgroundColor: "rgba(0,240,255,0.03)",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#E5E7EB",
    fontFamily: "Sora",
  },
  eyeIconOpen: {
    fontSize: 16,
    color: "#67E8F9",
  },
  eyeIconClosed: {
    fontSize: 16,
    color: "#374151",
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
  criteriaBox: {
  backgroundColor: "rgba(0,240,255,0.03)",
  borderWidth: 1,
  borderColor: "#1F2937",
  borderRadius: 12,
  padding: 14,
  marginTop: -8,
  marginBottom: 20,
},
criteriaTitle: {
  fontSize: 10,
  fontFamily: "Orbitron",
  color: "#9CA3AF",
  letterSpacing: 1,
  marginBottom: 10,
},
criteriaRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginBottom: 6,
},
criteriaIcon: {
  fontSize: 12,
  color: "#374151",
  width: 14,
},
criteriaIconMet: {
  color: "#00FFA3",
},
criteriaText: {
  fontSize: 12,
  fontFamily: "Sora",
  color: "#6B7280",
},
criteriaTextMet: {
  color: "#00FFA3",
},
});
