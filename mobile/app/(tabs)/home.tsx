import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

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
  { icon: "💳", label: "Pay Rent", color: "neon" },
  { icon: "📄", label: "My Lease", color: "purple" },
  { icon: "🔧", label: "Maintenance", color: "success" },
  { icon: "📞", label: "Contact", color: "danger" },
];

// Stats
const stats: { icon: string; label: string; value: string; color: ColorKey }[] = [
  { icon: "🏢", label: "OCCUPANCY", value: "3 yrs", color: "neon" },
  { icon: "✅", label: "ON-TIME RATE", value: "98.4%", color: "purple" },
  { icon: "📊", label: "AI SCORE", value: "94", color: "success" },
];

// Forecast
const forecast: { month: string; price: string; color: ColorKey }[] = [
  { month: "MAR", price: "$2,400", color: "neon" },
  { month: "APR", price: "$2,640", color: "warn" },
  { month: "MAY", price: "$2,880", color: "danger" },
];

function GradientTitle({ text }: { text: string }) {
  return (
    <MaskedView
      maskElement={
        <Text
          style={{
            fontSize: 32,
            fontFamily: "Orbitron",
            color: "black", // Must be non-transparent for MaskedView to work
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
            color: "transparent", // Gradient shows through
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
  return (
    <View style={styles.container}>
      {/* Ambient Glow */}
      <View style={styles.ambientPurple} />
      <View style={styles.ambientNeon} />

      <ScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.textMuted}>Good morning,</Text>
            <MaskedView
              style={{ flexDirection: "row" }}  
              maskElement={
                <Text style={{ 
                  fontSize: 24, 
                  fontFamily: "Orbitron", 
                  backgroundColor: "transparent",
                  color: "black" 
                }}>
                  Alex Kimani
                </Text>
              }
            >
                    <LinearGradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      colors={["#00FFFF", "#7C3AED"]}
                    >
                      <Text style={{ fontSize: 24, fontFamily: "Orbitron", color: "transparent" }}>Alex Kimani</Text>
                    </LinearGradient>
                  </MaskedView>
          </View>
          <View style={styles.profileCircle}>
            <Text>👤</Text>
          </View>
        </View>

        {/* Hero Card */}
        <LinearGradient colors={["rgba(0,240,255,0.08)", "rgba(124,58,237,0.12)"]} style={styles.heroCard}>
          <Text style={styles.heroLabel}>CURRENT MONTHLY RENT</Text>
          <Text style={[styles.heroValue, colorMap.neon.text]}>$2,400</Text>
          <Text style={styles.textMutedSmall}>Sky Vista Penthouse · Westlands</Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { label: "LEASE LEFT", value: "147 days", color: "neon" as ColorKey },
              { label: "STATUS", value: "✓ Paid", color: "success" as ColorKey },
              { label: "NEXT DUE", value: "Mar 1", color: "warn" as ColorKey },
            ].map((item, i) => (
              <View key={i} style={styles.heroStatBox}>
                <Text style={styles.textMutedSmall}>{item.label}</Text>
                <Text style={[{ fontFamily: "monospace" }, colorMap[item.color].text]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.quickActions}>
          {quickActions.map((item, i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <View style={[{ width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" }, colorMap[item.color].box]}>
                <Text>{item.icon}</Text>
              </View>
              <Text style={styles.textTiny}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          {stats.map((item, i) => (
            <View key={i} style={styles.statBox}>
              <View style={[{ height: 2, marginBottom: 4 }, colorMap[item.color].bar]} />
              <Text>{item.icon}</Text>
              <Text style={styles.textTiny}>{item.label}</Text>
              <Text style={[{ fontFamily: "monospace", fontSize: 18 }, colorMap[item.color].text]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* recent activity */}
        // After the Stats section, add:

<Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
<View style={styles.timeline}>
  {[
    {
      icon: "✓",
      color: "success" as ColorKey,
      title: "February Rent Paid",
      subtitle: "Feb 1, 2025 · On time · M-Pesa",
      amount: "$2,400",
      amountColor: "success" as ColorKey,
    },
    {
      icon: "📄",
      color: "neon" as ColorKey,
      title: "Lease Renewed",
      subtitle: "Jan 15, 2025 · 6 months extension",
      amount: "↑ Done",
      amountColor: "neon" as ColorKey,
    },
    {
      icon: "🔧",
      color: "danger" as ColorKey,
      title: "AC Maintenance Request",
      subtitle: "Jan 8, 2025 · Resolved in 48h",
      amount: "Closed",
      amountColor: "muted" as any, // fallback for muted text
    },
  ].map((item, i) => (
    <View key={i} style={styles.timelineItem}>
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
  textMutedSmall: { fontSize: 10, color: "#888" },
  headerName: { fontSize: 24, fontFamily: "Orbitron", color: "#fff" },
  profileCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "purple" },
  aiBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: "rgba(220,38,38,0.3)", backgroundColor: "rgba(220,38,38,0.1)", marginHorizontal: 20, marginBottom: 20 },
  aiIcon: { width: 40, height: 40, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroCard: { marginHorizontal: 20, marginBottom: 20, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: "rgba(0,255,255,0.3)" },
  heroLabel: { fontSize: 10, fontFamily: "Orbitron", color: "#888", letterSpacing: 2, marginBottom: 8 },
  heroValue: { fontSize: 32, fontFamily: "monospace" },
  heroStatBox: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 10 },
  sectionTitle: { paddingHorizontal: 20, marginBottom: 8, fontSize: 10, fontFamily: "Orbitron", color: "#888", letterSpacing: 2 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  textTiny: { fontSize: 10, color: "#888", marginTop: 4 },
  stats: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: "#111", borderWidth: 1, borderColor: "#222", borderRadius: 16, padding: 16 },
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
});