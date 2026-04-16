import { View, Text, ScrollView, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useAuthStore } from "../../store/authStore";
import * as Linking from 'expo-linking';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from 'react';
import { useAuditTrailsStore } from "../../store/auditTrailsStore";

type ColorKey = "neon" | "purple" | "success" | "danger" | "warn";

// Define RN-compatible styles for each color
const colorMap: Record<ColorKey, { box: any; text: any; bar: any }> = {
  neon: {
    box: { backgroundColor: "rgba(0,255,255,0.1)", borderColor: "rgba(0,255,255,0.3)", borderWidth: 1 },
    text: { color: "#00FFFF" },
    bar: { backgroundColor: "#00FFFF" },
  },
  purple: {
    box: { backgroundColor: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.3)", borderWidth: 1 },
    text: { color: "#7C3AED" },
    bar: { backgroundColor: "#7C3AED" },
  },
  success: {
    box: { backgroundColor: "rgba(22,163,74,0.1)", borderColor: "rgba(7, 33, 16, 0.3)", borderWidth: 1 },
    text: { color: "#16A34A" },
    bar: { backgroundColor: "#16A34A" },
  },
  danger: {
    box: { backgroundColor: "rgba(150,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)", borderWidth: 1 },
    text: { color: "#DC2626" },
    bar: { backgroundColor: "#DC2626" },
  },
  warn: {
    box: { backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)", borderWidth: 1 },
    text: { color: "#F59E0B" },
    bar: { backgroundColor: "#F59E0B" },
  },
};

// Quick actions
const quickActions: { icon: string; label: string; color: ColorKey }[] = [
  { icon: "⚡", label: "Pay Rent", color: "neon" },
  { icon: "💾", label: "My Lease", color: "purple" },
  { icon: "🛠️", label: "Services", color: "success" },
  { icon: "📞", label: "Contact", color: "danger" },
];

// Stats
const stats: {  label: string; value: string; color: ColorKey; change: string }[] = [
  {  label: "OCCUPANCY",    value: "3 yrs",  color: "neon",    change: "↑ Loyal" },
  { label: "ON-TIME PAYMENT RATE", value: "98.4%",  color: "purple",  change: "↑ Great" },
];

function GradientTitle({ text }: { text: string }) {
  return (
    <MaskedView
      maskElement={
        <Text
          style={{
            fontSize: 32,
            fontFamily: "Orbitron",
            color: "black", 
            textAlign: "left",
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
            fontSize: 32,
            fontFamily: "Orbitron",
            color: "transparent", 
            textAlign: "left",
          }}
        >
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { auditTrails, fetchAuditTrails, loading } = useAuditTrailsStore();

useFocusEffect(
  useCallback(() => {
    if (!token) return;

    fetchAuditTrails(token);

    const interval = setInterval(() => {
      fetchAuditTrails(token);
    }, 10000);

    return () => clearInterval(interval);
  }, [token])
);

  const firstName = user?.name?.split(" ").slice(0, 2).join(" ") || "User";

  const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning ☀️";
  if (hour < 17) return "Good afternoon 🌤️";
  return "Good evening 🌙";
};

  // Map backend data to UI format
  const recentActivities = auditTrails.slice(0, 3).map(trail => ({
    icon: trail.status === 'SUCCESS' ? '✓' : '✗',
    color: trail.status === 'SUCCESS' ? 'success' : 'danger' as ColorKey,
    title: trail.title,
    subtitle: trail.subtitle || new Date(trail.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    amount: trail.metadata?.amount ? `Ksh${Number(trail.metadata.amount).toLocaleString()}` : trail.status === 'SUCCESS' ? 'Done' : 'Failed',
    amountColor: trail.status === 'SUCCESS' ? 'success' : 'danger' as any,
  }));

  // Fallback to hardcoded if no data
  const displayActivities = recentActivities.length > 0 ? recentActivities : [
    {
      icon: "✓",
      color: "success" as ColorKey,
      title: "No recent activity",
      subtitle: "Your activity will appear here",
      amount: "Soon",
      amountColor: "warn" as any,
    }
  ];

  return (
    <View style={styles.container}>
      {/* Ambient Glow */}
      <View style={styles.ambientPurple} />
      <View style={styles.ambientNeon} />

      <ScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.textMuted}>
               {getGreeting()},
            </Text>
            <MaskedView
              style={{ flexDirection: "row" }}  
              maskElement={
                <Text style={{ 
                  fontSize: 24, 
                  fontFamily: "Orbitron", 
                  backgroundColor: "transparent",
                  color: "black" 
                }}>
                   {firstName}
                </Text>
              }
            >
                    <LinearGradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      colors={["#00FFFF", "#7C3AED"]}
                    >
                      <Text style={{ fontSize: 24, fontFamily: "Orbitron", color: "transparent" }}>{firstName}</Text>
                    </LinearGradient>
                  </MaskedView>
          </View>
  <Image
    source={require("../../assets/profile.png")} 
    style={{ width: 42, height: 42, borderRadius: 16 }}
    resizeMode="contain"
  />
        </View>

     {/* Hero Card */}
{user?.userProperties?.length ? (() => {
  const currentProperty = user.userProperties[0]?.property;

  if (!currentProperty) return null;

  // Fallbacks
  const price = currentProperty.price ?? 0;
  const title = currentProperty.title ?? "Untitled Property";
  const location = currentProperty.location ?? "Unknown Location";

  // Format next due date (1st of next month)
  const today = new Date();
  const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextDueFormatted = nextDue.toLocaleString("default", { month: "short", day: "numeric" });

  // Status - placeholder logic (replace with real status if available)
  const statusLabel = "✓ Paid";
  const statusColor: ColorKey = "success";

  return (
    <LinearGradient colors={["rgba(0,240,255,0.08)", "rgba(124,58,237,0.12)"]} style={styles.heroCard}>
      <Text style={styles.heroLabel}>CURRENT MONTHLY RENT</Text>
      <Text style={[styles.heroValue, colorMap.neon.text]}>Ksh{price.toLocaleString()}</Text>
      <Text style={styles.textMutedSmall}>{title} · {location}</Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {[
          { label: "STATUS", value: statusLabel, color: statusColor },
          { label: "NEXT DUE", value: nextDueFormatted, color: "warn" as ColorKey },
        ].map((item, i) => (
          <View key={i} style={styles.heroStatBox}>
            <Text style={styles.textMutedSmall}>{item.label}</Text>
            <Text style={[{ fontFamily: "monospace" }, colorMap[item.color].text]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
})() : null}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.quickActions}>
          {quickActions.map((item, i) => (
            <Pressable 
              key={i} 
              style={{ alignItems: "center" }}
            onPress={() => {
  console.log("🟣 QUICK ACTION PRESSED:", item.label);

  if (item.label === 'Pay Rent') {
    console.log("💳 Pay Rent clicked");
    // TODO: Navigate to payments
  } 
  
  else if (item.label === 'My Lease') {
    console.log("📄 My Lease clicked");

    const leaseDoc = user?.leaseDocument;

    console.log("📄 Raw user object:", user);
    console.log("📄 Lease document value:", leaseDoc);

    if (!leaseDoc) {
      alert('No lease document found. Please upload during onboarding.');
      return;
    }

    console.log("🚀 Attempting to open lease document:", leaseDoc);

    const BASE_URL = 'https://lavenia-pronounceable-radically.ngrok-free.dev';
    const fullUrl = leaseDoc.startsWith('http') ? leaseDoc : `${BASE_URL}${leaseDoc}`;

    Linking.openURL(fullUrl)
      .then(() => {
        console.log("✅ Lease document opened successfully");
      })
      .catch((err) => {
        console.log("❌ Failed to open lease document:", err);
      });

  } 
  
  else if (item.label === 'Services') {
    console.log("🛠️ Services clicked");
    router.push('/services');
  } 
  
  else if (item.label === 'Contact') {
    console.log("📞 Contact clicked");
    router.push('/contacts');
  }
}}
            >
              <View style={[{ width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" }, colorMap[item.color].box]}> 
                <Text>{item.icon}</Text>
              </View>
              <Text style={styles.textTiny}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

       {/* Stats */}
<View style={styles.statsRow}>
  {stats.map((item, i) => (
    <View key={i} style={styles.statBox}>

      {/* Glowing top bar */}
      <View style={[styles.statTopBar, colorMap[item.color].bar,
        { shadowColor: colorMap[item.color].text.color, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 }
      ]} />

      {/* Label */}
      <Text style={styles.statLabel}>{item.label}</Text>

      {/* Value */}
      <Text style={[styles.statValue, colorMap[item.color].text]}>
        {item.value}
      </Text>

      {/* Change pill */}
      <View style={[styles.statChangePill, colorMap[item.color].box]}>
        <Text style={[styles.statChangeText, colorMap[item.color].text]}>
          {item.change}
        </Text>
      </View>

    </View>
  ))}
</View>

        {/* recent activity */}
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>

  <Pressable
    style={styles.seeAllButton}
    onPress={() => router.push('/audit-trails')}
  >
    <Text style={styles.seeAllText}>See all</Text>
  </Pressable>
</View>
<View style={styles.timeline}>
  {displayActivities.map((item, i) => (
    <View key={i || 'empty'} style={styles.timelineItem}>
      <View style={[styles.tlDot, colorMap[item.color]?.box]}>
        <Text style={[{ fontSize: 14 }, colorMap[item.color]?.text]}>{item.icon}</Text>
      </View>
      <View style={styles.tlBody}>
        <Text style={styles.tlTitle}>{item.title}</Text>
        <Text style={styles.tlSub}>{item.subtitle}</Text>
      </View>
     <Text
  style={[
    styles.tlAmount,
    (item.amountColor && item.amountColor !== "muted")
      ? colorMap[item.amountColor as ColorKey].text
      : { color: "#888" },
  ]}
>
  {item.amount}
</Text>
    </View>
  ))}
</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060A14" },
  ambientPurple: { position: "absolute", top: -64, left: -64, width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(124,58,237,0.1)" },
  ambientNeon: { position: "absolute", bottom: 100, right: -20, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(0,255,255,0.1)" },
  statusBar: { position: "absolute", top: 18, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 28, zIndex: 10 },
  statusText: { fontSize: 13, fontFamily: "monospace", color: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  textMuted: { fontSize: 12, color: "#888" },
  textMutedSmall: { fontSize: 12, marginBottom: 5, color: "#888" },
  headerName: { fontSize: 24, fontFamily: "Orbitron", color: "#fff" },
  profileCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  aiBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: "rgba(220,38,38,0.3)", backgroundColor: "rgba(220,38,38,0.1)", marginHorizontal: 20, marginBottom: 20 },
  aiIcon: { width: 40, height: 40, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroCard: { marginHorizontal: 20, marginBottom: 20, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: "rgba(0,255,255,0.3)" },
  heroLabel: { fontSize: 10, fontFamily: "Orbitron", color: "#888", letterSpacing: 2, marginBottom: 4 },
  heroValue: { fontSize: 20, fontFamily: "monospace" },
  heroStatBox: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 10 },
  sectionTitle: { paddingHorizontal: 20, marginBottom: 8, fontSize: 10, fontFamily: "Orbitron", color: "#888", letterSpacing: 2 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 25, paddingHorizontal: 20, marginBottom: 24 },
  textTiny: { fontSize: 10, color: "#888", marginTop: 4 },
  stats: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  timeline: {
  marginHorizontal: 20,
  marginBottom: 24,
},
timelineItem: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
},
tlDot: {
  width: 28,
  height: 28,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  marginRight: 12,
},
tlBody: {
  flex: 1,
},
tlTitle: {
  fontSize: 12,
  fontFamily: "Orbitron",
  color: "#fff",
  marginBottom: 2,
},
tlSub: {
  fontSize: 10,
  color: "#888",
},
tlAmount: {
  fontSize: 12,
  fontFamily: "monospace",
  marginLeft: 8,
},
 avatar: {
  width: 40,
  height: 40,
  borderRadius: 43,
  alignItems: "center",
  justifyContent: "center",
},
statsRow: {
  flexDirection: "row",
  gap: 10,
  paddingHorizontal: 20,
  marginBottom: 24,
},
statBox: {
  flex: 1,
  backgroundColor: "#111827",       
  borderWidth: 1,
  borderColor: "#1F2937",           
  borderRadius: 18,
  padding: 14,
  overflow: "hidden",
  position: "relative",
},
statTopBar: {
  height: 2,
  borderRadius: 2,
  marginBottom: 12,
  width: "100%",
},
statIcon: {
  fontSize: 18,
  marginBottom: 8,
},
statLabel: {
  fontSize: 9,
  color: "#9CA3AF",
  fontFamily: "Orbitron",
  letterSpacing: 1,
  marginBottom: 4,
},
statValue: {
  fontFamily: "JetBrainsMono",
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 6,
},
statChangePill: {
  alignSelf: "flex-start",
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 6,
  borderWidth: 1,
},
  statChangeText: {
  fontSize: 9,
  fontFamily: "Sora",
},
  seeAllButton: {
    alignSelf: 'center',
    marginHorizontal: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  seeAllText: {
    fontSize: 11,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
    letterSpacing: 0.5,
  },
  sectionHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  // paddingHorizontal: 5,
},
});
