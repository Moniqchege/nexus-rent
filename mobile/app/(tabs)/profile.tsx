import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "expo-router";

function GradientTitle({ text }: { text: string }) {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.pageTitle, { backgroundColor: "transparent" }]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={["#00FFFF", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.pageTitle, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function Profile() {
const logout = useAuthStore((state) => state.logout);
const router = useRouter();
const navigation = useNavigation<any>();
 const handleSignOut = async () => {
    logout(); // clear user state
    router.replace('/login'); 
  };

  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore.persist.hasHydrated();

  if (!isHydrated) return null;
  const displayName = user?.name?.trim().split(/\s+/).slice(0, 2).join(" ") || "User";
  return (
    <View style={styles.container}>
      {/* Ambient */}
      <View style={styles.ambient} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageGreeting}>ACCOUNT</Text>
            <GradientTitle text="Profile" />
          </View>

          <View style={styles.settingsBtn}>
            <Text style={{ color: "#fff" }}>⚙</Text>
          </View>
        </View>

        {/* Profile Hero */}
        <View style={styles.profileCard}>
          <Image
              source={require("../../assets/profile.png")} 
              style={{ width: 92, height: 92, borderRadius: 16 }}
              resizeMode="contain"
            />

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email || "No email"}</Text>

          <View style={styles.verifiedTag}>
            <Text style={styles.icon}>◈</Text>
            <View style={{ width: 6 }} />
            <Text style={styles.verifiedText}>  VERIFIED TENANT</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#00FFFF" }]}>
                3 yrs
              </Text>
              <Text style={styles.statLabel}>Tenancy</Text>
            </View>

             <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#00FFA3" }]}>
                98.4%
              </Text>
              <Text style={styles.statLabel}>On-Time</Text>
            </View>

             <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#7C3AED" }]}>
                94
              </Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
          </View>
        </View>

 {/* MY PROPERTY */}
<Text style={styles.sectionTitle}>MY PROPERTY</Text>

{user?.userProperties?.length ? (() => {
  const propertyItem = user.userProperties[0]?.property;
  if (!propertyItem) return null;

  const name = propertyItem.title ?? "Untitled Property";
  const price = propertyItem.price ? `Ksh${propertyItem.price.toLocaleString()}/mo` : "N/A";
  const location = propertyItem.location ?? "Unknown Location";

  const specs = [
    { icon: "⊞", label: `${propertyItem.beds ?? 0} Beds` },
    { icon: "◎", label: `${propertyItem.baths ?? 0} Baths` },
    { icon: "▣", label: `${propertyItem.sqft ?? "N/A"} sqft` },
    { icon: "📅", label: "Jul 15" }, // hardcoded nextDue
  ];

  const aiScore = 94; 

  return (
    <View style={styles.propertyCard}>
      {/* Image Strip */}
      <LinearGradient
        colors={["#0f2027", "#203a43", "#2c5364"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.propertyImageStrip}
      >
        <Text style={styles.propertyEmoji}>🏙</Text>

        {/* Bottom overlay with badges */}
        <View style={styles.propertyOverlay}>
          <View style={styles.badgeRow}>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>● ACTIVE LEASE</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>AI {aiScore}%</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Body */}
      <View style={styles.propertyBody}>
        <View style={styles.propertyTopRow}>
          <Text style={styles.propertyName}>{name}</Text>
          <Text style={styles.propertyPrice}>{price}</Text>
        </View>

        <Text style={styles.propertyLocation}>📍 {location} </Text>

        <View style={styles.specRow}>
          {specs.map((s, i) => (
            <View key={i} style={styles.spec}>
              <Text style={styles.specIcon}>{s.icon}</Text>
              <Text style={styles.specText}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
})() : (
  <Text style={{ marginHorizontal: 20, color: "#888", fontSize: 12 }}>No properties available.</Text>
)}

        {/* SETTINGS */}
        <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Preferences</Text>
          <View style={styles.preferencesDivider} />

        {[
  { icon: "🔔", name: "Rent Alerts", color: "#00F0FF", bg: "rgba(0,240,255,0.1)", border: "rgba(0,240,255,0.25)", on: true },
  { icon: "📊", name: "Market Reports", color: "#7C3AED", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.25)", on: true },
  { icon: "💳", name: "Auto-Pay", color: "#00FFA3", bg: "rgba(0,255,163,0.1)", border: "rgba(0,255,163,0.25)", on: false },
].map((item, i, arr) => (
  <View key={i}>
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: item.bg, borderWidth: 1, borderColor: item.border }]}>
        <Text>{item.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.name}</Text>
        <Text style={styles.rowDesc}>Manage this preference</Text>
      </View>

      {/* Toggle */}
      <View style={[styles.toggleTrack, item.on && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, item.on && styles.toggleThumbOn]} />
      </View>
    </View>

    {i < arr.length - 1 && <View style={styles.rowDivider} />}
  </View>
))}
        </View>

        <View style={styles.group}>
  <Text style={styles.groupTitle}>Account</Text>
  <View style={styles.preferencesDivider} />

  {[
    { icon: "✏️", name: "Edit Profile", color: "#00F0FF", bg: "rgba(0,240,255,0.1)", border: "rgba(0,240,255,0.25)" },
    { icon: "🔐", name: "Security & Password", color: "#7C3AED", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.25)" },
    { icon: "📁", name: "My Documents", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  ].map((item, i, arr) => (
    <View key={i}>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: item.bg, borderWidth: 1, borderColor: item.border }]}>
          <Text>{item.icon}</Text>
        </View>

        <Text style={styles.rowTitle}>{item.name}</Text>

        <Text style={styles.arrow}>›</Text>
      </View>

      {i < arr.length - 1 && <View style={styles.rowDivider} />}
    </View>
  ))}
</View>

        {/* Logout */}
    <View style={styles.group}>
  <TouchableOpacity
    onPress={handleSignOut}
    activeOpacity={0.7}
    style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 10 }}
  >
    <View style={[styles.rowIcon, { backgroundColor: "rgba(255,59,129,0.15)" }]}>
      <Text style={{ color: "#FF3B81" }}>⎋</Text>
    </View>

    <Text style={[styles.rowTitle, { color: "#FF3B81", marginLeft: 10 }]}>
      Sign Out
    </Text>

    <Text style={[styles.arrow, { color: "#FF3B81", marginLeft: "auto" }]}>›</Text>
  </TouchableOpacity>
</View>

        {/* Footer */}
        <View style={styles.footer}>
          <GradientTitle text="NEXUS RENT" />
          <Text style={styles.version}>
            v2.4.1 · Rental Platform
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060A14" },

  ambient: {
    position: "absolute",
    top: 60,
    left: "50%",
    marginLeft: -150,
    width: 300,
    height: 200,
    borderRadius: 150,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20
  },

  pageGreeting: { fontSize: 12, color: "#888" },
  pageTitle: { fontSize: 24, fontFamily: "Orbitron" },

  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },

  profileCard: {
    alignItems: "center",
    padding: 20,
  },

 avatar: {
  width: 80,
  height: 80,
  borderRadius: 40,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 10,
},

  name: { color: "#fff", fontSize: 30, fontWeight: "600" },
  email: { color: "#888", fontSize: 15, marginBottom: 8 },

verifiedTag: {
  flexDirection: 'row',
   alignItems: 'center',
  backgroundColor: "rgba(0,255,255,0.15)",
  borderWidth: 1,
  borderColor: "rgba(0,255,255,0.3)",
  paddingHorizontal: 25,
  paddingVertical: 4,
  borderRadius: 14,
  marginBottom: 12,
},

icon: {
  fontSize: 14,
  color: "#00FFFF",
  textAlign: 'center',
  fontWeight: 'bold',
},

  verifiedText: {
    fontSize: 12,
    color: "#00FFFF",
    fontFamily: "Orbitron",
  },

  statsRow: {
  flexDirection: "row",
  width: "100%",
  backgroundColor: "#111827",
  borderWidth: 1,
  borderColor: "#1F2937",
  borderRadius: 18,
  overflow: "hidden",
  padding: 20,
},
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "#1F2937", marginVertical: 4 },

  statValue: { fontSize: 14, fontWeight: "700" },
  statLabel: { fontSize: 10, color: "#888" },

  sectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 20,
    fontSize: 10,
    color: "#888",
    fontFamily: "Orbitron",
  },

 propertyCard: {
  marginHorizontal: 20,
  marginBottom: 24,
  backgroundColor: "#111827",
  borderWidth: 1,
  borderColor: "rgba(0,240,255,0.2)",
  borderRadius: 20,
  overflow: "hidden",
},

propertyImageStrip: {
  height: 160,
  alignItems: "center",
  justifyContent: "center",
},

propertyEmoji: {
  fontSize: 60,
  opacity: 0.15,
},
  propertyImage: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },

  propertyOverlay: {
  position: "absolute",
  bottom: 12,
  left: 14,
  right: 14,
},

 badgeRow: {
  flexDirection: "row",
  gap: 6,
},

activeBadge: {
  backgroundColor: "rgba(0,255,163,0.15)",
  borderWidth: 1,
  borderColor: "rgba(0,255,163,0.3)",
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 8,
},

  badge: {
    backgroundColor: "rgba(0, 240, 255, 0.15)",
    borderWidth: 0.3,
    borderColor: "rgba(0, 240, 255, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  activeBadgeText: {
  fontSize: 9,
  fontFamily: "Orbitron",
  color: "#00FFA3",
  letterSpacing: 1,
},

badgeText: {
  fontSize: 9,
  fontFamily: "Orbitron",
  color: "#00F0FF",
  letterSpacing: 1,
},

propertyBody: {
  padding: 16,
},

propertyTopRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 4,
},

propertyName: {
  fontSize: 16,
  fontWeight: "700",
  color: "#fff",
},

  propertyPrice: {
  fontSize: 15,
  fontFamily: "JetBrains Mono",
  fontWeight: "600",
  color: "#00F0FF",
},

propertyLocation: {
  fontSize: 12,
  color: "#888",
  marginBottom: 14,
},

specRow: {
  flexDirection: "row",
  gap: 10,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: "#1F2937",
},

spec: {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
},

specIcon: {
  fontSize: 13,
  color: "#7C3AED",
},

  specText: {
  fontSize: 11,
  color: "#888",
},

  group: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 10,
  },

  groupTitle: {
    color: "#888",
    fontSize: 12,
    marginBottom: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  rowIcon: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(255, 59, 129, 0.15)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  rowTitle: { color: "#fff", fontSize: 12 },
  rowDesc: { fontSize: 10, color: "#888" },

  rowDivider: {
  height: 1,
  backgroundColor: "#1F2937",
},

toggleTrack: {
  width: 40,
  height: 22,
  borderRadius: 11,
  backgroundColor: "#1F2937",
  borderWidth: 1,
  borderColor: "#2D3748",
  justifyContent: "center",
  paddingHorizontal: 2,
},
toggleTrackOn: {
  backgroundColor: "rgba(0,255,163,0.15)",
  borderColor: "rgba(0,255,163,0.4)",
},
toggleThumb: {
  width: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: "#444",
  alignSelf: "flex-start",
},
toggleThumbOn: {
  backgroundColor: "#00FFA3",
  alignSelf: "flex-end",
  shadowColor: "#00FFA3",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 6,
},

preferencesDivider: {
  height: 1,
  backgroundColor: "#1F2937",
},

  arrow: { color: "#888", marginLeft: "auto" },

  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#222",
  },

  footer: {
    alignItems: "center",
    marginTop: 20,
  },

  version: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },
});