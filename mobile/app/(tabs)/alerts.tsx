import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useAuthStore } from "../../store/authStore";
import { useNotificationsStore } from "../../store/notificationsStore";

const colorMap = {
  neon: "#00F0FF",
  purple: "#7C3AED",
  success: "#16A34A",
  danger: "#FF3B81",
  warn: "#F59E0B",
  muted: "#888",
  neutral: "#E8E8E8"
};

function GradientTitle({ text }: { text: string }) {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.pageTitle, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={["#FF3B81", "#7C3AED"]}
      >
        <Text style={[styles.pageTitle, { color: "transparent", opacity: 1 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

function formatNotificationTime(isoString: string) {
  if (!isoString) return "";

  const date = new Date(isoString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  // fallback readable date
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Alerts() {
  const token = useAuthStore(state => state.token);
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markRead,
    _hasHydrated,
  } = useNotificationsStore();
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) return;

    fetchNotifications(token);

    // Poll every 30 seconds
    const interval = setInterval(() => {
        fetchNotifications(token);
    }, 30000);

    return () => clearInterval(interval);
}, [_hasHydrated, token]);
  const handleMarkAll = async () => {
    if (!token) return;
    const unreadNotifications = notifications.filter(n => !n.isRead);
    for (const n of unreadNotifications) {
      await markRead(n.id, token);
    }
  };
  const computedUnreadCount = notifications.filter(n => !n.isRead).length;
  return (
    <View style={styles.container}>
      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      <ScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}>
        {/* Page Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageGreeting}>UPDATES & ALERTS</Text>
            <GradientTitle text="Notifications" />
          </View>
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll}>
            <Text style={styles.markAllText}>Mark All</Text>
          </TouchableOpacity>
        </View>

        {/* New Notifications Badge */}
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>NEW</Text>

  {computedUnreadCount > 0 && (
    <View style={styles.unreadBadge}>
      <Text style={styles.unreadBadgeText}>
        {computedUnreadCount > 99 ? "99+" : computedUnreadCount}
      </Text>
    </View>
  )}
</View>

        {/* Notification List */}
        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
          {notifications.map((t, i) => (
            <TouchableOpacity
    key={i}
    activeOpacity={0.8}
    onPress={() => {
      if (!t.isRead && token) {
        markRead(t.id, token);
      }
    }}
  >
     <View
  key={i}
  style={[
    styles.notifItem,
    t.status === "danger" && { borderColor: "rgba(255,59,129,0.25)" },
    t.status === "success" && { borderColor: "rgba(22,163,74,0.25)" },
    t.status === "warn" && { borderColor: "rgba(245,158,11,0.25)" },
    t.status === "neutral" && { borderColor: "rgba(232, 232, 232, 0.25)" },
  ]}
>
              <View
                style={[
                  styles.notifIcon,
                  t.status === "danger"
                    ? { backgroundColor: "rgba(255,59,129,0.1)", borderColor: "rgba(255,59,129,0.25)" }
                    : t.status === "success"
                    ? { backgroundColor: "rgba(0,255,163,0.08)", borderColor: "rgba(0,255,163,0.15)" }
                    : t.status === "warn"
                    ? { backgroundColor: "rgba(232, 232, 232, 0.08)", borderColor: "rgba(232, 232, 232, 0.25)" }
                    : t.status === "neutral"
                    ? { backgroundColor: "rgba(255,184,77,0.08)", borderColor: "rgba(255,184,77,0.15)" }
                    : { backgroundColor: "rgba(136,136,136,0.08)", borderColor: "rgba(136,136,136,0.15)" },
                ]}
              >
                <Image
    source={require("../../assets/notifications.png")}
    style={{ width: 18, height: 18, resizeMode: "contain" }}
  />
              </View>

              <View style={styles.notifBody}>
  <Text
  style={[
    styles.notifTitle,
    t.isRead ? { color: colorMap.success } : { color: colorMap.danger },
  ]}
>
  {t.title?.trim() ? t.title : "New Notification"}
</Text>

  <Text style={styles.notifText}>{t.message}</Text>

  {/* bottom row */}
  <View style={styles.notifBottomRow}>
    <Text style={styles.notifTime}>
      {formatNotificationTime(t.sentAt)}
    </Text>
  </View>
</View>

              {!t.isRead && (
                <View
                  style={[
                    styles.unreadDot,
                     { backgroundColor: colorMap.danger, shadowColor: colorMap.danger },
                  ]}
                />
              )}
            </View>
  </TouchableOpacity>
          
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060A14" },
  ambientGlow: {
    position: "absolute",
    top: 80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,59,129,0.08)",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  pageGreeting: { fontSize: 12, color: "#888" },
  pageTitle: { fontSize: 24, fontFamily: "Orbitron", fontWeight: "700", color: "#fff" },
  markAllBtn: { backgroundColor: "rgba(255,59,129,0.1)", borderColor: "rgba(255,59,129,0.25)", borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  markAllText: { fontSize: 11, fontFamily: "Orbitron", color: colorMap.danger },
  sectionTitle: { fontSize: 10, fontFamily: "Orbitron", color: "#888" },
  newBadge: { backgroundColor: colorMap.danger, color: "#fff", fontSize: 9, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8, marginLeft: 6 },
  notifItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, position: "relative", backgroundColor: "#0D1117", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 12},
  notifIcon: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 12 },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  notifText: { fontSize: 10, color: "#888", marginBottom: 2 },
  notifTime: { fontSize: 9, color: "#888" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, position: "absolute", top: 8, right: 5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 3 },
  notifBottomRow: {
  marginTop: 6,
  flexDirection: "row",
  justifyContent: "flex-end",
},
sectionHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center", 
  paddingHorizontal: 20,
  marginBottom: 10,
},

unreadBadge: {
  backgroundColor: colorMap.danger,
  borderRadius: 10,
  minHeight: 18,              
  paddingHorizontal: 6,
  justifyContent: "center",   
  alignItems: "center",
},

unreadBadgeText: {
  color: "#fff",
  fontSize: 10,               // 🔥 slightly increase for balance
  fontFamily: "Orbitron",
  textAlignVertical: "center" 
},
});