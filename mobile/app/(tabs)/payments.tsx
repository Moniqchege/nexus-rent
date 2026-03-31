import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const colorMap = {
  neon: "#00FFFF",
  purple: "#7C3AED",
  success: "#00FFA3",
  warn: "#FFB84D",
  muted: "#888",
  border: "rgba(255,255,255,0.05)",
};

// Sample timeline data
const timeline = [
  { title: "February Rent", sub: "Feb 1, 2025 · M-Pesa · On time", amt: "-$2,400", status: "success" },
  { title: "January Rent", sub: "Jan 1, 2025 · M-Pesa · On time", amt: "-$2,400", status: "success" },
  { title: "December Rent", sub: "Dec 1, 2024 · M-Pesa · On time", amt: "-$2,400", status: "success" },
  { title: "November Rent", sub: "Nov 3, 2024 · M-Pesa · 2 days late", amt: "-$2,400", status: "warn" },
  { title: "Security Deposit", sub: "Jan 5, 2022 · Bank Transfer", amt: "-$4,800", status: "muted" },
];


function GradientTitle({ text }: { text: string }) {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.pageTitle, { color: "black" }]}>{text}</Text>
      }
    >
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={["#00FFFF", "#7C3AED"]}
      >
        <Text style={[styles.pageTitle, { color: "transparent" }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function Payments() {
  return (
    <View style={styles.container}>
          {/* Ambient Glow */}
    <View style={styles.ambientGlow} />

      <ScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}>
        {/* Page Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageGreeting}>BILLING & HISTORY</Text>
            <GradientTitle text="Payments" />
          </View>
          <View style={styles.downloadBtn}>
            <Text style={{ fontSize: 16, color: colorMap.success }}>⬇</Text>
          </View>
        </View>

        {/* Pay Now Card */}
        <View style={styles.payCard}>
          <View style={styles.payCardGlow} />
          <Text style={styles.payCardLabel}>NEXT PAYMENT DUE</Text>
          <Text style={styles.payCardAmount}>$2,400</Text>
          <Text style={styles.payCardSub}>March 1, 2025 · Sky Vista Penthouse</Text>
          <LinearGradient
            colors={[colorMap.success, "#00FFA3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payNowBtn}
          >
            <Text style={styles.payNowText}>PAY NOW ›</Text>
          </LinearGradient>
        </View>

        {/* Payment History Header */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>PAYMENT HISTORY</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>98.4% On-Time</Text>
          </View>
        </View>

       {/* Chart */}
<View style={[styles.chart, { height: 100 }]}>
  {["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"].map((month, i) => {
    const heights = [55, 60, 65, 72, 78, 70, 88, 100];
    const heightPct = heights[i];
    const isGradient = i === 6 || i === 7;

    return (
      <View key={i} style={[styles.barWrap, { justifyContent: "flex-end" }]}>
        {isGradient ? (
          <LinearGradient
            colors={i === 7 ? ["#00FFA3", "#00FFFF"] : ["#00FFFF", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.bar, { height: heightPct }]}
          />
        ) : (
          <View
            style={[
              styles.bar,
              {
                height: heightPct,
                backgroundColor:
                  i === 3 ? "rgba(124,58,237,0.5)" :
                  i === 4 ? "rgba(124,58,237,0.6)" :
                  i === 5 ? "rgba(0,240,255,0.5)" :
                  colorMap.border,
              },
            ]}
          />
        )}
        <Text style={[
          styles.barLabel,
          i === 6 ? { color: colorMap.neon } :
          i === 7 ? { color: colorMap.success } : {}
        ]}>
          {month}
        </Text>
      </View>
    );
  })}
</View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
        <View style={{ marginTop: 4 }}>
          {timeline.map((t, i) => (
            <View key={i} style={styles.timelineItem}>
             <View
  style={[
    styles.tlDot,
    t.status === "success"
      ? { backgroundColor: "rgba(0,255,163,0.1)", borderColor: "rgba(0,255,163,0.3)" }
      : t.status === "warn"
      ? { backgroundColor: "rgba(255,184,77,0.1)", borderColor: "rgba(255,184,77,0.3)" }
      : { backgroundColor: "rgba(136,136,136,0.1)", borderColor: "rgba(136,136,136,0.3)" },
  ]}
>
  <Text
    style={{
      color:
        t.status === "warn"
          ? colorMap.warn
          : t.status === "success"
          ? colorMap.success
          : colorMap.muted,
      fontSize: 12,
    }}
  >
    {t.status === "warn" ? "!" : "✓"}
  </Text>
</View>
              <View style={styles.tlBody}>
                <Text style={styles.tlTitle}>{t.title}</Text>
                <Text style={styles.tlSub}>{t.sub}</Text>
              </View>
              <Text style={[styles.tlAmt, t.status==="warn"?{color: colorMap.warn}:t.status==="success"?{color: colorMap.success}:{color: colorMap.muted}]}>{t.amt}</Text>
            </View>
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
    top: 100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(0,255,163,0.07)",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 20 },
  pageGreeting: { fontSize: 12, color: colorMap.muted },
  pageTitle: { fontSize: 28, fontFamily: "Orbitron", color: "#fff" },
  downloadBtn: { width: 42, height: 42, backgroundColor: "rgba(0,255,163,0.08)", borderRadius: 12, borderWidth:1, borderColor: "rgba(0,255,163,0.2)", alignItems:"center", justifyContent:"center" },
  payCard: { marginHorizontal:20, marginBottom:20, borderRadius:22, padding:22, backgroundColor: "rgba(0,255,163,0.08)", borderWidth:1, borderColor:"rgba(0,255,163,0.2)", overflow:"hidden", position:"relative" },
  payCardGlow: { position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:60, backgroundColor:"rgba(0,255,163,0.1)" },
  payCardLabel: { fontSize:10, fontFamily:"Orbitron", letterSpacing:2, color: colorMap.muted, marginBottom:8 },
  payCardAmount: { fontSize:28, fontFamily:"JetBrains Mono", fontWeight:"700", color: colorMap.success, marginBottom:4 },
  payCardSub: { fontSize:12, color: colorMap.muted, marginBottom:20 },
  payNowBtn: { paddingVertical:14, borderRadius:14, alignItems:"center", justifyContent:"center", shadowColor: colorMap.success, shadowOffset:{width:0,height:0}, shadowOpacity:0.3, shadowRadius:20 },
  payNowText: { fontFamily:"Orbitron", fontSize:13, fontWeight:"700", letterSpacing:2, color:"#0B0F19" },
  historyHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginHorizontal:20, marginBottom:25 },
  historyTitle: { fontFamily:"Orbitron", fontSize:12, color: colorMap.muted },
  statusPill: { backgroundColor:"rgba(0,255,163,0.1)", borderWidth:1, borderColor:"rgba(0,255,163,0.2)", borderRadius:12, paddingHorizontal:8, paddingVertical:2 },
  statusText: { fontFamily:"Orbitron", fontSize:10, color: colorMap.success },
  chart: { flexDirection:"row", justifyContent:"space-between", paddingHorizontal:20, marginBottom:20 },
  barWrap: { alignItems:"center" },
  bar: { width:10, borderRadius:4 },
  barLabel: { fontSize:10, color: colorMap.muted, marginTop:2 },
  sectionTitle: { fontFamily:"Orbitron", fontSize:12, color: colorMap.muted, marginHorizontal:20, marginTop:20 },
  timelineItem: { flexDirection:"row", alignItems:"center", marginHorizontal:20, marginBottom:12 },
  tlDot: { width:24, height:24, borderRadius:12, borderWidth:1, alignItems:"center", justifyContent:"center", marginRight:12 },
  tlBody: { flex:1 },
  tlTitle: { fontSize:12, fontWeight:"600", color:"#fff" },
  tlSub: { fontSize:10, color: colorMap.muted },
  tlAmt: { fontSize:12, fontWeight:"600" },
});