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
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../../store/authStore";
import api, { API_BASE } from "../../lib/api";

export default function EditProfile() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  // local URI of a newly-picked image (not yet saved)
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve what to display in the avatar circle
  const displayImage = pendingImageUri
    ? { uri: pendingImageUri }
    : user?.image
    ? { uri: `${API_BASE}${user.image}` }
    : null;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setPendingImageUri(uri);

      // Upload immediately so it's persisted even if the user cancels the form
      if (!token) return;
      setAvatarLoading(true);
      try {
        const { image } = await api.uploadAvatar(token, uri);
        setUser({ ...user!, image });
      } catch (e: any) {
        setError(e.message ?? "Failed to upload photo");
        setPendingImageUri(null);
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateProfile(token, user.id, { name, phone, username });
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} style={styles.side}>
            <Image
              source={require("../../assets/back_icon.png")}
              style={styles.backIcon}
            />
          </Pressable>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        {/* Avatar — WhatsApp-style circular picker */}
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickImage} style={styles.avatarWrap}>
            {displayImage ? (
              <Image source={displayImage} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-outline" size={44} color="#555" />
              </View>
            )}

            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              {avatarLoading ? (
                <ActivityIndicator size={14} color="#060A14" />
              ) : (
                <Ionicons name="camera" size={14} color="#060A14" />
              )}
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
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

          <Text style={styles.label}>Username</Text>
          <View style={styles.usernameRow}>
            <Text style={styles.usernameAt}>@</Text>
            <TextInput
              style={styles.usernameInput}
              value={username}
              onChangeText={(t) => setUsername(t.replace(/\s/g, "").toLowerCase())}
              placeholder="username"
              placeholderTextColor="#555"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

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
              <ActivityIndicator color="#00FFFF" size="small" />
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

  // --- Header ---
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingLeft: 4,
  },
  side: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: "#00FFFF",
  },
  title: {
    fontSize: 18,
    fontFamily: "Orbitron",
    color: "#00FFFF",
    paddingLeft: 50,
  },

  // --- Avatar ---
  avatarSection: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 4,
  },
  avatarWrap: {
    position: "relative",
    width: 96,
    height: 96,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "rgba(0,255,255,0.4)",
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#00F0FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#060A14",
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 11,
    color: "#555",
    letterSpacing: 0.3,
  },

  // --- Form ---
  form: {
    paddingHorizontal: 20,
    marginTop: 12,
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
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 12,
    paddingLeft: 14,
  },
  usernameAt: {
    color: "#00F0FF",
    fontSize: 15,
    marginRight: 2,
  },
  usernameInput: {
    flex: 1,
    paddingHorizontal: 4,
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
    backgroundColor: "rgba(0,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.4)",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: "#00FFFF",
    fontFamily: "Orbitron",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
