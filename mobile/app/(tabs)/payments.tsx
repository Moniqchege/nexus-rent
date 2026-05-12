import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/api";
import type { Payment, RentSchedule } from "../../types/payment";

const colorMap = {
  neon: "#00FFFF",
  purple: "#7C3AED",
  success: "#00FFA3",
  warn: "#FFB84D",
  muted: "#888",
  border: "rgba(255,255,255,0.05)",
};

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
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [nextDue, setNextDue] = useState<RentSchedule | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const [paymentsData, schedulesData] = await Promise.all([
        api.getPayments(token),
        api.getPaymentSchedules(token),
      ]);
      
      setPayments(paymentsData.payments || []);
      setSchedules(schedulesData.schedules || []);
      
      // Find next due payment
      const upcoming = schedulesData.schedules
        .filter((s: RentSchedule) => s.status === "scheduled" || s.status === "overdue")
        .sort((a: RentSchedule, b: RentSchedule) => 
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )[0];
      
      setNextDue(upcoming || null);
    } catch (error) {
      console.error("Failed to load payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    console.log("🔥 PAY NOW BUTTON CLICKED");
    if (!nextDue) return;

    console.log("✅ nextDue found:", nextDue);
    
    router.push({
      pathname: "/pay/method",
      params: {
        amount: (nextDue.amount + (nextDue.lateFeeAmount ?? 0)).toString(),
        scheduleId: nextDue.id.toString(),
        propertyTitle: nextDue.property.title,
        dueDate: nextDue.dueDate,
        propertyId:    nextDue.propertyId.toString(),
        tenantId:      nextDue.tenantId.toString(),
      },
    });
  };

  const formatPaymentTimeline = () => {
    return payments
      .slice(0, 10)
      .map((payment) => {
        const isLate = payment.status === "failed" || (payment.lateFee && payment.lateFee > 0);
        const methodLabel = payment.method === "mpesa" ? "M-Pesa" : 
                           payment.method === "card" ? "Card" : "Bank Transfer";
        
        return {
          title: `${payment.property.title} Rent`,
          sub: `${new Date(payment.createdAt).toLocaleDateString()} · ${methodLabel} · ${isLate ? "Late" : "On time"}`,
          amt: `-KES ${payment.amount.toLocaleString()}`,
          status: payment.status === "paid" ? (isLate ? "warn" : "success") : "muted",
        };
      });
  };

  const calculateOnTimeRate = () => {
    if (payments.length === 0) return 0;
    const onTime = payments.filter(p => p.status === "paid" && (!p.lateFee || p.lateFee === 0)).length;
    return Math.round((onTime / payments.length) * 100);
  };

  const timeline = formatPaymentTimeline();
  const onTimeRate = calculateOnTimeRate();

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

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={colorMap.neon} />
          </View>
        ) : (
          <>
            {/* Pay Now Card */}
            {nextDue ? (
              <View style={styles.payCard}>
                <View style={styles.payCardGlow} />
                <Text style={styles.payCardLabel}>NEXT PAYMENT DUE</Text>
                <Text style={styles.payCardAmount}>KES {nextDue.amount.toLocaleString()}</Text>
                <Text style={styles.payCardSub}>
                  {new Date(nextDue.dueDate).toLocaleDateString()} · {nextDue.property.title}
                </Text>
                <TouchableOpacity onPress={handlePayNow} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[colorMap.success, "#00FFA3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.payNowBtn}
                  >
                    <Text style={styles.payNowText}>PAY NOW ›</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.payCard, { backgroundColor: "rgba(0,255,255,0.08)", borderColor: "rgba(0,255,255,0.2)" }]}>
                <Text style={styles.payCardLabel}>ALL CAUGHT UP!</Text>
                <Text style={[styles.payCardAmount, { color: colorMap.neon }]}>✓</Text>
                <Text style={styles.payCardSub}>No pending payments</Text>
              </View>
            )}

            {/* Payment History Header */}
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>PAYMENT HISTORY</Text>
              {payments.length > 0 && (
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{onTimeRate}% On-Time</Text>
                </View>
              )}
            </View>

    {/* Transaction History */}
            <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
            {timeline.length > 0 ? (
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
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ color: colorMap.muted, fontSize: 14 }}>No payment history yet</Text>
              </View>
            )}
          </>
        )}
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