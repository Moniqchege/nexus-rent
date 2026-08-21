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
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";

export default function EditProfile() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateProfile(token, user.id, { name, phone });
      setUser(updated);
      router.back();
    } catch (e: any) {
      setError(e.message ?? "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#555"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor="#555"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{user?.email ?? "—"}</Text>
          </View>
          <Text style={styles.hint}>Email cannot be changed</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#060A14" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
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
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
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
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
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
  input: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
  },
  readOnlyField: {
    backgroundColor: "#0D1421",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readOnlyText: {
    color: "#555",
    fontSize: 14,
  },
  hint: {
    color: "#444",
    fontSize: 10,
    marginTop: 4,
  },
  error: {
    color: "#FF3B81",
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
  },
  saveBtn: {
    marginTop: 32,
    backgroundColor: "#00F0FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: "#060A14",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
