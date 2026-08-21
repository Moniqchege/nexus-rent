import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from 'expo-router';
import { Property } from '../../types/property';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { useTheme, rgba, type Theme } from '../../lib/theme';

type ColorKey = "neon" | "purple" | "success" | "danger" | "warn";

function listingColors(theme: Theme): Record<ColorKey, { text: string; bg: string }> {
  return {
    neon: { text: theme.accent, bg: rgba(theme.accentRgb, 0.1) },
    purple: { text: theme.accentPurple, bg: rgba(theme.accentPurpleRgb, 0.1) },
    success: { text: theme.accentGreen, bg: rgba(theme.accentGreenRgb, 0.1) },
    danger: { text: theme.accentRed, bg: rgba(theme.accentRedRgb, 0.1) },
    warn: { text: theme.accentWarn, bg: rgba(theme.accentWarnRgb, 0.1) },
  };
}

interface ListingItem {
  propertyId: number;
  unitTypeId: number;
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

const expandToListingItems = (properties: Property[]): ListingItem[] =>
  properties.flatMap(p =>
    p.unitTypes.map(u => ({
      propertyId: p.id,
      unitTypeId: u.id,
      icon: getIconFromLocation(p.location),
      price: `Ksh${Math.round(u.price).toLocaleString()}`,
      area: p.location,
      name: `${p.title} ${u.type}`,
      ai: Math.round(p.score ?? 75),
      beds: u.type,
      baths: `${u.baths} Baths`,
      size: `${u.totalUnits} units`,
      color: getColorFromScore(p.score),
      gradientColors: ['#0f2027', '#203a43'] as [string, string],
    }))
  );

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
  const { theme } = useTheme();
  const colors = listingColors(theme);
  const router = useRouter();
  // Task 6: state — removed `featured` and `listings`; added `searchQuery` and `selectedArea`
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuthStore();

  // Task 6: use fetchAllProperties; reset selectedArea on re-fetch (Req 6.9)
  const loadProperties = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      setError('');
      const data = await api.fetchAllProperties(token);
      setProperties(data);
      setSelectedArea('All Areas');
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

  // Task 6: dynamic area chips derived from real property locations (Req 6.1–6.3)
  const areaChips = useMemo((): string[] => {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const p of properties) {
      const key = p.location.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p.location); // preserve original casing of first occurrence
      }
    }
    return ['All Areas', ...unique];
  }, [properties]);

  // Task 6: combined search + area filter (Req 5.2–5.4, 6.4–6.6)
  const filteredProperties = useMemo((): Property[] => {
    const q = searchQuery.trim().toLowerCase();
    return properties.filter(p => {
      const matchesSearch =
        q === '' ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      const matchesArea =
        selectedArea === 'All Areas' ||
        p.location.toLowerCase() === selectedArea.toLowerCase();
      return matchesSearch && matchesArea;
    });
  }, [properties, searchQuery, selectedArea]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading properties...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Ambient Glow */}
      <View style={[styles.ambientGlow, { backgroundColor: rgba(theme.accentRgb, theme.ambientOpacity) }]} />

      <ScrollView
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadProperties} colors={[theme.accent]} tintColor={theme.accent} />
        }
      >
        {/* Page Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.pageGreeting, { color: theme.textMuted }]}>FIND YOUR NEXT APARTMENT</Text>
            <MaskedView
              style={{ flexDirection: "row" }}
              maskElement={
                <Text style={{
                  fontSize: 24,
                  fontFamily: "Orbitron",
                  backgroundColor: "transparent",
                  color: "black",
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
          <View style={{ width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, color: theme.textMuted }}>⏲</Text>
          </View>
        </View>

        {/* Search Bar — Task 6: wired value and onChangeText */}
        <View style={{ paddingHorizontal: 13 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.bgInput, borderRadius: 10, padding: 8, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ fontSize: 16, color: theme.accent, marginRight: 8 }}>⌕</Text>
            <TextInput
              style={{ flex: 1, color: theme.text, paddingVertical: 8, backgroundColor: 'transparent' }}
              placeholder="Westlands, Nairobi..."
              placeholderTextColor={theme.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: rgba(theme.accentPurpleRgb, 0.1), borderRadius: 12 }}>
              <Text style={{ color: theme.text, fontSize: 12 }}>⊞ Filter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Area Chips — Task 6: dynamic chips from areaChips, interactive selection */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", marginVertical: 12 }} contentContainerStyle={{ paddingHorizontal: 13 }}>
          {areaChips.map((area, i) => {
            const isActive = selectedArea === area;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedArea(area)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: isActive ? rgba(theme.accentRgb, 0.12) : theme.bgCard,
                  borderWidth: 1,
                  borderColor: isActive ? theme.accent : theme.border,
                  marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: isActive ? theme.accent : theme.textMuted }}>{area}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Available header */}
        {/* <View style={styles.availableHeader}>
          <Text style={styles.availableText}>12 AVAILABLE NEAR YOU</Text>
          <Text style={styles.mapLink}>Map ›</Text>
        </View> */}

        {/* Featured Horizontal Cards — Task 6: filteredProperties.slice(0,3) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, paddingBottom: 16 }}>
        {expandToListingItems(filteredProperties).slice(0, 3).map((item, i) => (
            <TouchableOpacity key={i} onPress={() => router.push({ pathname: '/properties/[id]', params: { id: String(item.propertyId), unitTypeId: String(item.unitTypeId) } })} activeOpacity={0.85}>
            <View style={[styles.featuredCard, { backgroundColor: theme.bgCard, borderColor: item.color === "purple" ? rgba(theme.accentPurpleRgb, 0.25) : theme.border }]}>
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
                      backgroundColor: colors[item.color as ColorKey].bg,
                      borderColor: rgba(theme.accentRgb, 0.3),
                    },
                  ]}
                >
                  <Text style={[styles.aiText, { color: colors[item.color as ColorKey].text }]}>
                    Score {item.ai}%
                  </Text>
                </View>
              </LinearGradient>
              <View style={styles.featuredBody}>
                <Text style={[styles.featuredPrice, { color: colors[item.color as ColorKey].text }]}>
                  {item.price}<Text style={[styles.priceSuffix, { color: theme.textMuted }]}>/mo</Text>
                </Text>
                <Text style={[styles.featuredName, { color: theme.textMuted }]}>{item.name}</Text>
                <Text style={[styles.featuredLoc, { color: theme.textMuted }]}>📍 {item.area}</Text>
              </View>
            </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* All Listings — Task 6: filteredProperties, with empty state */}
        <View style={styles.availableHeader}>
          <Text style={[styles.availableText, { color: theme.textMuted }]}>ALL LISTINGS</Text>
        </View>

        {/* Empty state — Task 6: shown when no properties match filters (Req 5.5, 6.7) */}
        {!loading && expandToListingItems(filteredProperties).length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: theme.textMuted, fontFamily: 'Orbitron', fontSize: 12 }}>No properties found</Text>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {expandToListingItems(filteredProperties).map((item, i) => (
            <TouchableOpacity key={i} onPress={() => router.push({ pathname: '/properties/[id]', params: { id: String(item.propertyId), unitTypeId: String(item.unitTypeId) } })} activeOpacity={0.85} style={{ marginBottom: 12 }}>
            <View style={[styles.listCard, { marginBottom: 0, backgroundColor: theme.bgCard, borderColor: theme.border }]}>
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
                  <Text style={[styles.listPrice, { color: colors[item.color as ColorKey]?.text || theme.accentRed }]}>
                    {item.price}<Text style={[styles.priceSuffix, { color: theme.textMuted }]}>/mo</Text>
                  </Text>
                  <View style={[styles.listBadge, {
                    backgroundColor: colors[item.color as ColorKey]?.bg || rgba(theme.accentRgb, 0.1),
                    borderColor: theme.border,
                    position: "absolute",
                    right: 0,
                    top: 0,
                  }]}>
                    <Text style={[styles.aiText, { color: colors[item.color as ColorKey]?.text || theme.accentRed }]}>
                      Score {item.ai}%
                    </Text>
                  </View>
                </View>
                <Text style={[styles.listName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.listLoc, { color: theme.textMuted }]}>📍 {item.area}</Text>
                <View style={styles.tagsWrap}>
                  {[item.beds, item.baths, item.size].map((t, idx) => (
                    <View key={idx} style={[styles.tag, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                      <Text style={[styles.tagText, { color: theme.textMuted }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
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
    top: -40,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(0,240,255,0.08)",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  pageGreeting: { fontSize: 11, color: "#888" },
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
  listBadge: { position: "absolute", top: 0, right: 0, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  aiText: { fontSize: 8, fontFamily: "Orbitron" },
  featuredBody: { padding: 12 },
  featuredPrice: { fontSize: 15, fontFamily: "JetBrains Mono", fontWeight: "600" },
  priceSuffix: { fontSize: 10, color: "#888", fontFamily: "Sora" },
  featuredName: { fontSize: 12, fontWeight: "600", marginBottom: 2, color: "#888" },
  featuredLoc: { fontSize: 10, color: "#888" },
  listCard: { flexDirection: "row", marginBottom: 12, backgroundColor: "#111827", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#1F2937" },
  listImg: { width: 90, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  listBody: { flex: 1, padding: 12 },
  listPrice: { fontSize: 15, fontFamily: "JetBrains Mono", fontWeight: "600" },
  listName: { fontSize: 12, fontWeight: "600", marginBottom: 2, color: "#888" },
  listLoc: { fontSize: 10, color: "#888", marginBottom: 4 },
  tagsWrap: { flexDirection: "row", gap: 6 },
  tag: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "#222", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, color: "#888" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#9CA3AF", fontSize: 14 },
});
