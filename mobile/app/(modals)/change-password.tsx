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
  Image,
  Pressable,
} from "react-native";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";
import { useTheme } from '../../lib/theme';

// --- Password strength helper -------------------------------------------------

type StrengthResult = {
  score: number; // 0 - 4
  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
  color: string;
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    symbol: boolean;
  };
};

function getPasswordStrength(password: string): StrengthResult {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;

  // Score 0-4 based on how many criteria are met (length always required)
  let score = 0;
  if (checks.length) score = Math.max(1, passedCount - 1);
  if (!checks.length) score = 0;

  const levels: { label: StrengthResult["label"]; color: string }[] = [
    { label: "Very weak", color: "#FF3B81" },
    { label: "Weak", color: "#FF6B3B" },
    { label: "Fair", color: "#FFC93B" },
    { label: "Strong", color: "#8CFF3B" },
    { label: "Very strong", color: "#00FFA3" },
  ];

  const clampedScore = Math.min(score, 4);

  return {
    score: clampedScore,
    label: levels[clampedScore].label,
    color: levels[clampedScore].color,
    checks,
  };
}

// A password is considered acceptable for submission once it meets these
// baseline requirements (feel free to tighten further, e.g. require symbol).
function isPasswordStrongEnough(checks: StrengthResult["checks"]) {
  return (
    checks.length &&
    checks.lowercase &&
    checks.uppercase &&
    checks.number
  );
}

// --------------------------------------------------------------------------

export default function ChangePassword() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const strongEnough = isPasswordStrongEnough(strength.checks);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (!strongEnough) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number"
      );
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      await api.changePassword(token, currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    } catch (e: any) {
      setError(e.message ?? "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.side}>
            <Image
              source={require("../../assets/back_icon.png")}
              style={[styles.backIcon, { tintColor: theme.accent }]}
            />
          </Pressable>

          <Text style={[styles.title, { color: theme.accent }]}>Security & Password</Text>
        </View>

        {/* Form — vertically centered in the remaining scroll space */}
        <View style={styles.centerWrap}>
          {/* Hero graphic — fills the space above the form so it doesn't look empty */}
          <View style={styles.hero}>
            <View style={[styles.heroIconCircle, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Ionicons name="shield-checkmark-outline" size={64} color={theme.accent} />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Update Your Password</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textMuted }]}>
              Choose a strong password to keep your account secure.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Current Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
              <TextInput
                style={[styles.inputField, { color: theme.text, backgroundColor: "transparent" }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={theme.textDim}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrent((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showCurrent ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.accent}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.textMuted }]}>New Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
              <TextInput
                style={[styles.inputField, { color: theme.text, backgroundColor: "transparent" }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={theme.textDim}
                secureTextEntry={!showNew}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNew((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showNew ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.accent}
                />
              </TouchableOpacity>
            </View>

            {/* Strength meter — only once the user starts typing */}
            {newPassword.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthTrack}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            i <= strength.score ? strength.color : theme.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>

                <View style={styles.requirementsList}>
                  <RequirementRow met={strength.checks.length} text="At least 8 characters" theme={theme} />
                  <RequirementRow met={strength.checks.uppercase} text="One uppercase letter" theme={theme} />
                  <RequirementRow met={strength.checks.lowercase} text="One lowercase letter" theme={theme} />
                  <RequirementRow met={strength.checks.number} text="One number" theme={theme} />
                  <RequirementRow
                    met={strength.checks.symbol}
                    text="One symbol (recommended)"
                    theme={theme}
                  />
                </View>
              </View>
            )}

            <Text style={[styles.label, { color: theme.textMuted }]}>Confirm New Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
              <TextInput
                style={[styles.inputField, { color: theme.text, backgroundColor: "transparent" }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={theme.textDim}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.accent}
                />
              </TouchableOpacity>
            </View>

            {error && <Text style={[styles.error, { color: theme.accentRed }]}>{error}</Text>}
            {success && (
              <Text style={[styles.successText, { color: theme.accentGreen }]}>✓ Password updated successfully!</Text>
            )}

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { borderColor: theme.borderAccent },
                (loading || (newPassword.length > 0 && !strongEnough)) &&
                  styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.accent} size="small" />
              ) : (
                <Text style={[styles.submitBtnText, { color: theme.accent }]}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RequirementRow({ met, text, theme }: { met: boolean; text: string; theme: import('../../lib/theme').Theme }) {
  return (
    <View style={styles.requirementRow}>
      <Text style={[styles.requirementBullet, { color: met ? theme.accentGreen : theme.textDim }]}>
        {met ? "✓" : "○"}
      </Text>
      <Text style={[styles.requirementText, { color: met ? theme.textSub : theme.textMuted }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A14",
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  // New: makes the form sit in the vertical middle of the remaining space
  centerWrap: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: "#00F0FF",
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Orbitron",
    color: "#00FFFF",
    paddingLeft: 50,
  },
  form: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  label: {
    color: "#888",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 12,
    paddingRight: 6,
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: 30,
    marginBottom: 8,
  },
  heroIconCircle: {
    width: 94,
    height: 94,
    borderRadius: 32,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
  },
  strengthWrap: {
    marginTop: 10,
  },
  strengthTrack: {
    flexDirection: "row",
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  requirementsList: {
    marginTop: 10,
    gap: 4,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  requirementBullet: {
    width: 16,
    fontSize: 12,
  },
  requirementText: {
    fontSize: 12,
  },
  error: {
    color: "#FF3B81",
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
  },
  successText: {
    color: "#00FFA3",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
  submitBtn: {
    marginTop: 32,
    backgroundColor: 'rgba(0,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1, 
    borderColor: 'rgba(0,255,255,0.4)' 
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#00FFFF",
    fontFamily: 'Orbitron',
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 6,
    marginTop: 16,
  },
  side: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: "#00FFFF",
  },
});