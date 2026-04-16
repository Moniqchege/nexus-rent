import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from "../../store/authStore";
import { useAuditTrailsStore } from "../../store/auditTrailsStore";

type ColorKey = "neon" | "purple" | "success" | "danger" | "warn";

const colorMap = {
  neon: { box: { backgroundColor: "rgba(0,255,255,0.1)", borderColor: "rgba(0,255,255,0.3)", borderWidth: 1 }, text: { color: "#00FFFF" } },
  purple: { box: { backgroundColor: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.3)", borderWidth: 1 }, text: { color: "#7C3AED" } },
  success: { box: { backgroundColor: "rgba(22,163,74,0.1)", borderColor: "rgba(7, 33, 16, 0.3)", borderWidth: 1 }, text: { color: "#16A34A" } },
  danger: { box: { backgroundColor: "rgba(150,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)", borderWidth: 1 }, text: { color: "#DC2626" } },
  warn: { box: { backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)", borderWidth: 1 }, text: { color: "#F59E0B" } },
} as Record<ColorKey, any>;

const AuditTrailsPage = () => {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { auditTrails, fetchAuditTrails, loading } = useAuditTrailsStore();

  useEffect(() => {
    if (token) {
      fetchAuditTrails(token);
    }
  }, [token]);

  const renderItem = ({ item }: { item: any }) => {
    const color: ColorKey = item.status === 'SUCCESS' ? 'success' : 'danger';
    const icon = item.status === 'SUCCESS' ? '✓' : '✗';
    const amount = item.metadata?.amount ? `Ksh${Number(item.metadata.amount).toLocaleString()}` : item.status === 'SUCCESS' ? 'Done' : 'Failed';

    return (
      <View style={styles.item}>
        <View style={[styles.dot, colorMap[color].box]}>
          <Text style={[styles.icon, colorMap[color].text]}>{icon}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle || new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        <Text style={[styles.amount, colorMap[color].text]}>
          {amount}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading activity...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00FFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Activity History</Text>
        <View style={styles.placeholder} />
      </View>

      {auditTrails.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={64} color="#888" />
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>Your recent actions will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={auditTrails}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060A14",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Orbitron',
    color: '#fff',
  },
  placeholder: {
    width: 24,
    height: 24,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Orbitron',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
  },
  amount: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Orbitron',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default AuditTrailsPage;

