import { View, Text, ScrollView, StyleSheet, Image, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useAuthStore } from "../../store/authStore";
import * as Linking from 'expo-linking';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from 'react';
import { useAuditTrailsStore } from "../../store/auditTrailsStore";
import {
  selectActiveLease,
  computeNextDue,
  computeOccupancyMonths,
  formatOccupancy,
  occupancyLabel,
  computeOnTimeRate,
  formatRate,
  rateLabel,
  filterNonTenantContacts,
  buildPayRentParams,
  findRootLease,
} from '../../lib/homeUtils';
import api from '../../lib/api';
import { RentSchedule } from '../../types/payment';

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

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { auditTrails, fetchAuditTrails } = useAuditTrailsStore();

  // Task 8: Lease + schedules state
  const [activeLease, setActiveLease] = useState<any>(null);
  const [allLeases, setAllLeases] = useState<any[]>([]);
  const [leaseLoading, setLeaseLoading] = useState(true);
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);

  // Task 10: Contacts state
  const [contacts, setContacts] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      fetchAuditTrails(token);

      const interval = setInterval(() => {
        fetchAuditTrails(token);
      }, 10000);

      // Task 8: Fetch active lease
      api.getMyLeases(token)
        .then(({ leases }) => {
          setAllLeases(leases);
          setActiveLease(selectActiveLease(leases));
        })
        .catch(() => {
          setActiveLease(null);
        })
        .finally(() => {
          setLeaseLoading(false);
        });

      // Task 8: Fetch payment schedules
      api.getPaymentSchedules(token)
        .then(({ schedules: fetched }) => {
          setSchedules(fetched);
        })
        .catch((err) => {
          console.error('Failed to fetch payment schedules:', err);
          setSchedules([]);
        });

      // Task 10: Fetch contacts
      api.getContacts(token)
        .then((data) => {
          const mapped = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone ?? '',
            role: c.role?.name ?? '',
            roleObj: c.role,
          }));
          setContacts(filterNonTenantContacts(mapped.map((c: any) => ({
            ...c,
            role: { name: c.role },
          }))));
        })
        .catch((err) => {
          console.error('Failed to fetch contacts:', err);
          setContacts([]);
        });

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

  // Task 11: Occupancy computed values
  const rootLease = activeLease ? findRootLease(allLeases, activeLease) : null;
  const occupancyMonths = rootLease
    ? computeOccupancyMonths(new Date(rootLease.startDate), new Date())
    : null;
  const occupancyValue = occupancyMonths !== null ? formatOccupancy(occupancyMonths) : '—';
  const occupancyChange = occupancyMonths !== null ? occupancyLabel(occupancyMonths) : 'New';

  // Task 12: On-time payment rate computed values
  const rate = computeOnTimeRate(schedules);
  const rateValue = formatRate(rate);
  const rateChangeLabel = rateLabel(rate);

  // Task 11 + 12: Dynamic stats array
  const dynamicStats = [
    { label: 'OCCUPANCY', value: occupancyValue, color: 'neon' as ColorKey, change: occupancyChange },
    { label: 'ON-TIME PAYMENT RATE', value: rateValue, color: 'purple' as ColorKey, change: rateChangeLabel },
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

        {/* Hero Card — Task 8 */}
        {user?.userProperties?.length ? (() => {
          const currentProperty = user.userProperties[0]?.property;
          if (!currentProperty) return null;

          // Derive rent display value
          let rentDisplay: string;
          if (leaseLoading) {
            rentDisplay = '...';
          } else if (!activeLease) {
            rentDisplay = '—';
          } else {
            rentDisplay = `Ksh${activeLease.rentAmount.toLocaleString()}`;
          }

          // Derive hero subtitle
          const heroTitle = activeLease?.property?.title ?? currentProperty.title ?? 'Untitled Property';
          const heroLocation = activeLease?.property?.location ?? currentProperty.location ?? 'Unknown Location';

          // Compute next due date
          const nextDueFormatted = activeLease
            ? computeNextDue(
                new Date(activeLease.startDate),
                activeLease.billingCycle,
                new Date()
              ).toLocaleString('default', { month: 'short', day: 'numeric' })
            : '—';

          const statusLabel = "✓ Paid";
          const statusColor: ColorKey = "success";

          return (
            <LinearGradient colors={["rgba(0,240,255,0.08)", "rgba(124,58,237,0.12)"]} style={styles.heroCard}>
              <Text style={styles.heroLabel}>CURRENT MONTHLY RENT</Text>
              <Text style={[styles.heroValue, colorMap.neon.text]}>{rentDisplay}</Text>
              {activeLease && (
                <Text style={styles.textMutedSmall}>{heroTitle} · {heroLocation}</Text>
              )}

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

        {/* Quick Actions — Task 9 wires Pay Rent */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.quickActions}>
          {quickActions.map((item, i) => (
            <Pressable
              key={i}
              style={{ alignItems: "center", opacity: leaseLoading && item.label === 'Pay Rent' ? 0.4 : 1 }}
              disabled={leaseLoading && item.label === 'Pay Rent'}
              onPress={() => {
                console.log("🟣 QUICK ACTION PRESSED:", item.label);

                if (item.label === 'Pay Rent') {
                  if (!activeLease) {
                    Alert.alert('No active lease found. Contact your landlord.');
                    return;
                  }
                  const nextDue = computeNextDue(
                    new Date(activeLease.startDate),
                    activeLease.billingCycle,
                    new Date()
                  );
                  const params = buildPayRentParams(activeLease, user!.id, schedules, nextDue);
                  router.push({ pathname: '/pay/method', params });
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

        {/* Stats — Task 11 + 12: dynamic values */}
        <View style={styles.statsRow}>
          {dynamicStats.map((item, i) => (
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

        {/* Contacts — Task 10 */}
        {/* <Text style={styles.sectionTitle}>CONTACTS</Text>
        {contacts.length === 0 ? (
          <Text style={[styles.textMuted, { paddingHorizontal: 20, marginBottom: 16 }]}>
            No contacts available
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            {contacts.map((contact: any) => (
              <View key={contact.id} style={[styles.contactCard, colorMap.purple.box]}>
                <Text style={[styles.contactName, colorMap.purple.text]}>{contact.name}</Text>
                <Text style={styles.textTiny}>{contact.role?.name ?? contact.role}</Text>
                <Text style={[styles.textTiny, colorMap.neon.text]}>{contact.phone || 'No phone'}</Text>
              </View>
            ))}
          </ScrollView>
        )} */}

        {/* Recent Activity */}
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
  },
  contactCard: {
    width: 140,
    padding: 14,
    borderRadius: 16,
    marginRight: 10,
  },
  contactName: {
    fontSize: 13,
    fontFamily: 'Orbitron',
    marginBottom: 4,
  },
});
