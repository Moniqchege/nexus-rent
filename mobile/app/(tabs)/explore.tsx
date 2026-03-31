import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

type ColorKey = "neon" | "purple" | "success" | "danger" | "warn";

// Color palette
const colorMap: Record<ColorKey, { text: string; bg: string }> = {
  neon: { text: "#00FFFF", bg: "rgba(0,255,255,0.08)" },
  purple: { text: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  success: { text: "#16A34A", bg: "rgba(0,255,163,0.08)" },
  danger: { text: "#DC2626", bg: "rgba(255,59,129,0.08)" },
  warn: { text: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
};

// Chips data
const areas = ["All Areas", "Westlands", "Kilimani", "Karen", "Lavington", "Parklands", "Upper Hill"];

// Featured cards data
const featured = [
  { icon: "🏙", price: "$2,400", area: "Westlands", name: "Sky Vista", ai: 94, color: "neon" },
  { icon: "🏘", price: "$1,850", area: "Kilimani", name: "Aurora Res.", ai: 88, color: "purple" },
  { icon: "🌿", price: "$3,100", area: "Karen", name: "Emerald Court", ai: 91, color: "success" },
];

// Full listings data
const listings = [
  {
    icon: "🏯",
    price: "$5,500",
    area: "Upper Hill",
    name: "The Crimson Tower",
    ai: 83,
    beds: "5 Beds",
    baths: "4 Baths",
    size: "3.6K sqft",
    color: "danger",
  },
  {
    icon: "🌊",
    price: "$2,800",
    area: "Lavington",
    name: "Azure Heights",
    ai: 79,
    beds: "3 Beds",
    baths: "2 Baths",
    size: "1.6K sqft",
    color: "neon",
  },
  {
    icon: "🏗",
    price: "$1,200",
    area: "Parklands",
    name: "Sapphire Studios",
    ai: 76,
    beds: "1 Bed",
    baths: "1 Bath",
    size: "550 sqft",
    color: "neon",
  },
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

export default function Explore() {
  return (
    <View style={styles.container}>
      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      <ScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
  {/* Page Header */}
  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <View>
      <Text style={{ fontSize: 12, color: "#888" }}>FIND YOUR NEXT APARTMENT</Text>
      <MaskedView
  style={{ flexDirection: "row" }}  
  maskElement={
    <Text style={{ 
      fontSize: 24, 
      fontFamily: "Orbitron", 
      backgroundColor: "transparent",
      color: "black" 
    }}>
      Explore
    </Text>
  }
>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={["#00FFFF", "#7C3AED"]}
        >
          <Text style={{ fontSize: 24, fontFamily: "Orbitron", color: "transparent" }}>Explore</Text>
        </LinearGradient>
      </MaskedView>
    </View>
    <View style={{ width: 42, height: 42, borderRadius: 12, borderWidth: 0.3, borderColor: "#00FFFF", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 18, color: "#888" }}>🗺</Text>
    </View>
  </View>

  {/* Search Bar */}
  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", borderRadius: 10, padding: 8, paddingHorizontal: 12, marginBottom: 12, borderWidth: 0.3, borderColor: "#00f0ff" }}>
    <Text style={{ fontSize: 16, color: "#00FFFF", marginRight: 8 }}>⌕</Text>
    <TextInput style={{ flex: 1, color: "#fff", paddingVertical: 8 }} placeholder="Westlands, Nairobi..." placeholderTextColor="#9CA3AF" />
    <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 12 }}>
      <Text style={{ color: "#fff", fontSize: 12 }}>⊞ Filter</Text>
    </TouchableOpacity>
  </View>

  {/* Chips */}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", marginVertical: 12 }}>
  {areas.map((area, i) => (
    <View key={i} style={{ 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderRadius: 16, 
      backgroundColor: i === 0 ? "rgba(0,240,255,0.2)" : "#1F2937", 
      borderWidth: i === 0 ? 0.5 : 0,           
      borderColor: i === 0 ? "#00f0ff" : "transparent",
      marginRight: 8 
    }}>
      <Text style={{ fontSize: 12, color: i === 0 ? colorMap.neon.text : "#888" }}>{area}</Text>
    </View>
  ))}
</ScrollView>
</View>

        {/* Available header */}
        <View style={styles.availableHeader}>
          <Text style={styles.availableText}>12 AVAILABLE NEAR YOU</Text>
          <Text style={styles.mapLink}>Map ›</Text>
        </View>

        {/* Featured Horizontal Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, paddingBottom: 16 }}>
          {featured.map((item, i) => (
            <View key={i} style={[styles.featuredCard, { borderColor: item.color === "purple" ? "rgba(124,58,237,0.2)" : "rgba(0,240,255,0.2)" }]}>
              <LinearGradient
                colors={
                  item.color === "purple"
                    ? ["#1a0533", "#2d1b6e", "#1a0533"]
                    : item.color === "success"
                    ? ["#0b2013", "#0d3b22", "#0b2013"]
                    : ["#0f2027", "#203a43", "#2c5364"]
                }
                style={styles.featuredImage}
              >
                <Text style={{ fontSize: 44, opacity: 0.4 }}>{item.icon}</Text>
               <View
  style={[
    styles.aiBadge,
    {
      backgroundColor: `rgba(0,255,255,0.15)`,
      borderColor: `rgba(0,255,255,0.3)`,
    },
  ]}
>
  <Text style={[styles.aiText, { color: colorMap[item.color as ColorKey].text }]}>
    Score {item.ai}%
  </Text>
</View>
              </LinearGradient>
              <View style={styles.featuredBody}>
                <Text style={[styles.featuredPrice, { color: colorMap[item.color as ColorKey].text }]}>
                  {item.price}<Text style={styles.priceSuffix}>/mo</Text>
                </Text>
                <Text style={styles.featuredName}>{item.name}</Text>
                <Text style={styles.featuredLoc}>📍 {item.area}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* All Listings */}
         <View style={styles.availableHeader}>
          <Text style={styles.availableText}>ALL LISTINGS</Text>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {listings.map((item, i) => (
            <View key={i} style={styles.listCard}>
              <LinearGradient
                colors={
                  item.color === "purple"
                    ? ["#1a0a2e", "#16213e"]
                    : ["#0a1628", "#0d2137"]
                }
                style={styles.listImg}
              >
                <Text style={{ fontSize: 44 }}>{item.icon}</Text>
              </LinearGradient>
              <View style={styles.listBody}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
  <Text style={[styles.listPrice, { color: colorMap[item.color as ColorKey]?.text || "#DC2626" }]}>
    {item.price}<Text style={styles.priceSuffix}>/mo</Text>
  </Text>
  <View style={[styles.listBadge, { 
    backgroundColor: "rgba(0,240,255,0.08)", 
    borderColor: "rgba(0,240,255,0.2)",
    position: "absolute",  
    right: 0,    
    top: 0,         
  }]}>
    <Text style={[styles.aiText, { color: colorMap[item.color as ColorKey]?.text || "#DC2626" }]}>
      Score {item.ai}%
    </Text>
  </View>
</View>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listLoc}>📍 {item.area}</Text>
                <View style={styles.tagsWrap}>
                  {[item.beds, item.baths, item.size].map((t, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
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
    top: -40,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(0,240,255,0.08)",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  pageGreeting: { fontSize: 12, color: "#888" },
  pageTitle: { fontSize: 24, fontFamily: "Orbitron", color: "#fff" },
  headerIcons: { flexDirection: "row", gap: 8 },
  mapBtn: { width: 42, height: 42, backgroundColor: "#111", borderWidth: 1, borderColor: "#222", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", borderRadius: 16, paddingHorizontal: 12, marginVertical: 12 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 8 },
  searchIcon: { fontSize: 16, color: "#9CA3AF", marginRight: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: "#222", borderRadius: 12 },
  filterText: { color: "#fff", fontSize: 12 },
  chipsWrap: { flexDirection: "row", marginVertical: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: "#111", marginRight: 8 },
  chipActive: { backgroundColor: "#222" },
  chipText: { fontSize: 12, color: "#888" },
  availableHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 8 },
  availableText: { fontSize: 10, fontFamily: "Orbitron", color: "#888" },
  mapLink: { fontSize: 10, fontFamily: "Orbitron", color: "#00FFFF" },
  featuredCard: { width: 200, borderWidth: 1, borderRadius: 18, overflow: "hidden", marginRight: 12 },
  featuredImage: { height: 110, alignItems: "center", justifyContent: "center", position: "relative" },
  aiBadge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  featuredBadge: { position: "absolute", top: 8, left: 8 },
  listBadge: { position: "absolute", top: 0, right: 0, paddingHorizontal: 6, paddingVertical: 2,borderRadius: 6, borderWidth: 1  }, 
  aiText: { fontSize: 8, fontFamily: "Orbitron" },
  featuredBody: { padding: 12 },
  featuredPrice: { fontSize: 15, fontFamily: "JetBrains Mono", fontWeight: "600" },
  priceSuffix: { fontSize: 10, color: "#888", fontFamily: "Sora" },
  featuredName: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  featuredLoc: { fontSize: 10, color: "#888" },
  listCard: { flexDirection: "row", marginBottom: 12, backgroundColor: "#111", borderRadius: 18, overflow: "hidden" },
  listImg: { width: 90, height: 90, alignItems: "center", justifyContent: "center" },
  listBody: { flex: 1, padding: 12 },
  listPrice: { fontSize: 15, fontFamily: "JetBrains Mono", fontWeight: "600" },
  listName: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  listLoc: { fontSize: 10, color: "#888", marginBottom: 4 },
  tagsWrap: { flexDirection: "row", gap: 6 },
  tag: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "#222", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, color: "#888" },
});