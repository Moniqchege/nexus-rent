import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import api, { API_BASE } from '../../../lib/api';
import { ServiceCategory } from '../../../types/service';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function Services() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      api.getServiceCategories(token)
        .then(setCategories)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  const renderCategory = ({ item }: { item: ServiceCategory }) => (
    <Pressable 
      style={styles.categoryCard}
      onPress={() => router.push(`services/${item.slug}`)}
    >
      <LinearGradient 
        colors={['rgba(0,255,255,0.1)', 'rgba(124,58,237,0.1)']} 
        style={styles.gradient}
      >
        <Text style={styles.icon}>{item.icon}</Text>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </LinearGradient>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Service</Text>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A14',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 100,
  },
  categoryCard: {
    flex: 1,
    margin: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  icon: {
    fontSize: 48,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Orbitron',
    color: '#fff',
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

