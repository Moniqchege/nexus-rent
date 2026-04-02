import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Property } from '../../types/property';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

type ColorKey = "neon" | "purple" | "success" | "danger" | "warn";

// Color palette
const colorMap: Record<ColorKey, { text: string; bg: string }> = {
  neon: { text: "#00FFFF", bg: "rgba(0,255,255,0.08)" },
  purple: { text: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  success: { text: "#16A34A", bg: "rgba(0,255,163,0.08)" },
  danger: { text: "#FF3B81", bg: "rgba(255,59,129,0.08)" },
  warn: { text: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
};


const areas = ["All Areas", "Westlands", "Kilimani", "Karen", "Lavington", "Parklands", "Upper Hill"];

interface ListingItem {
  icon: string;
  price: string;
  area: string;
  name: string;
  ai: number;
  beds: string;
  baths: string;
  size: string;
  color: 'neon' | 'purple' | 'success' | 'danger';
  gradientColors: [string, string];
}

const getIconFromLocation = (location: string): string => {
  const icons = { westlands: '🏙', kilimani: '🏘', karen: '🌿', 'upper hill': '🏯' };
  const lower = location.toLowerCase();
  for (const [key, icon] of Object.entries(icons)) {
    if (lower.includes(key)) return icon;
  }
  return '🏠';
};

const getColorFromScore = (score?: number | null): 'neon' | 'purple' | 'success' | 'danger' => {
  if (!score) return 'neon';
  if (score > 90) return 'success';
  if (score > 80) return 'purple';
  if (score > 70) return 'neon';
  return 'danger';
};

const propertyToListing = (p: Property): ListingItem => ({
  icon: getIconFromLocation(p.location),
  price: `$${Math.round(p.price)}`,
  area: p.location,
  name: p.title,
  ai: Math.round((p.score || 75) || 75),
  beds: `${p.beds} Beds`,
  baths: `${p.baths} Baths`,
  size: `${Math.round(p.sqft / 100) / 10}K sqft`,
  color: getColorFromScore(p.score != null ? p.score : undefined),
  gradientColors: ['#0f2027', '#203a43'] as [string, string],
});

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

export default function Explore() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [featured, setFeatured] = useState<ListingItem[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuthStore();

  const loadProperties = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      setError('');
      const data = await api.fetchProperties(token);
      setProperties(data);
      setFeatured(data.slice(0, 3).map(propertyToListing).sort((a, b) => b.ai - a.ai));
      setListings(data.map(propertyToListing));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [token]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.loadingText}>Loading properties...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      <ScrollView 
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadProperties} colors={['#00FFFF']} />
        }
      >
  {/* Page Header */}
  <View style={styles.header}>
    <View>
      <Text style={styles.pageGreeting}>FIND YOUR NEXT APARTMENT</Text>
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
    <View style={{ width: 42, height: 42, borderRadius: 12, borderWidth: 0.2, borderColor: "#00FFFF", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20, color: "#888" }}>⏲</Text>
    </View>
  </View>

  {/* Search Bar */}
  <View style={{ paddingHorizontal: 13 }}>
  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", borderRadius: 10, padding: 8, paddingHorizontal: 12, marginBottom: 12, borderWidth: 0.3, borderColor: "#00f0ff" }}>
    <Text style={{ fontSize: 16, color: "#00FFFF", marginRight: 8 }}>⌕</Text>
    <TextInput style={{ flex: 1, color: "#fff", paddingVertical: 8 }} placeholder="Westlands, Nairobi..." placeholderTextColor="#9CA3AF" />
    <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 12 }}>
      <Text style={{ color: "#fff", fontSize: 12 }}>⊞ Filter</Text>
    </TouchableOpacity>
  </View>
  </View>

  {/* Chips */}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", marginVertical: 12 }} contentContainerStyle={{ paddingHorizontal: 13 }}>
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
 colors={item.gradientColors as [string, string]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
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
  featuredCard: { width: 200, borderWidth: 1, borderRadius: 18, overflow: "hidden", marginRight: 12, backgroundColor: "#111827" },
  featuredImage: { height: 110, alignItems: "center", justifyContent: "center", position: "relative" },
  aiBadge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  featuredBadge: { position: "absolute", top: 8, left: 8 },
  listBadge: { position: "absolute", top: 0, right: 0, paddingHorizontal: 6, paddingVertical: 2,borderRadius: 6, borderWidth: 1  }, 
  aiText: { fontSize: 8, fontFamily: "Orbitron" },
  featuredBody: { padding: 12 },
  featuredPrice: { fontSize: 15, fontFamily: "JetBrains Mono", fontWeight: "600" },
  priceSuffix: { fontSize: 10, color: "#888", fontFamily: "Sora" },
  featuredName: { fontSize: 12, fontWeight: "600", marginBottom: 2, color: "#888" },
  featuredLoc: { fontSize: 10, color: "#888" },
  listCard: { flexDirection: "row", marginBottom: 12, backgroundColor: "#111827", borderRadius: 18, overflow: "hidden" },
  listImg: { width: 90, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  listBody: { flex: 1, padding: 12 },
  listPrice: { fontSize: 15, fontFamily: "JetBrains Mono", fontWeight: "600" },
  listName: { fontSize: 12, fontWeight: "600", marginBottom: 2, color: "#888" },
  listLoc: { fontSize: 10, color: "#888", marginBottom: 4 },
  tagsWrap: { flexDirection: "row", gap: 6 },
  tag: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "#222", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, color: "#888" },
  center: { justifyContent: "center", alignItems: "center", },
  loadingText: {  marginTop: 10, color: "#9CA3AF", fontSize: 14 }
});