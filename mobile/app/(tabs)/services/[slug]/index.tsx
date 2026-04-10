import { View, Text, FlatList, StyleSheet, Image, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../../store/authStore';
import api from '../../../../lib/api';
import { ServiceProvider } from '../../../../types/service';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function Providers() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    if (token && slug) {
      // Get category to get ID
      api.getServiceCategories(token).then(categories => {
        const category = categories.find(c => c.slug === slug);
        if (category) {
          api.getProviders(token, category.id)
            .then(setProviders)
            .catch(console.error)
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }).catch(console.error);
    }
  }, [token, slug]);

  const renderProvider = ({ item }: { item: ServiceProvider }) => (
    <Pressable 
      style={styles.providerCard}
      onPress={() => router.push(`/ (tabs)/services/${slug}/${item.id}`)}
    >
      <LinearGradient 
        colors={['rgba(0,255,255,0.05)', 'rgba(124,58,237,0.05)']} 
        style={styles.gradientCard}
      >
        <Image 
          source={{ uri: item.image || 'https://via.placeholder.com/80x80/00FFFF/000000?text=SP' }} 
          style={styles.avatar}
          defaultSource={{ uri: 'https://via.placeholder.com/80x80/00FFFF/000000?text=SP' }}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.bio}>{item.bio || 'Experienced service provider'}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>{item.rating.toFixed(1)} ★</Text>
            <Text style={styles.rate}>Ksh {item.hourlyRate?.toLocaleString() || 'Negotiable'}/hr</Text>
          </View>
          <Text style={styles.location}>{item.location}</Text>
          <Text style={styles.phone}>📞 {item.phone}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading providers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{slug?.toUpperCase().replace('-', ' ')} SERVICES</Text>
      {providers.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noData}>No providers available yet</Text>
          <Text style={styles.subtitle}>Landlords can add providers from dashboard</Text>
        </View>
      ) : (
        <FlatList
          data={providers}
          renderItem={renderProvider}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noData: {
    fontSize: 18,
    color: '#888',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 100,
  },
  providerCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientCard: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.2)',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Orbitron',
    color: '#fff',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#FFD700',
  },
  rate: {
    fontSize: 14,
    color: '#00FFFF',
    fontFamily: 'monospace',
  },
  location: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: '#4ADE80',
    fontWeight: 'bold',
  },
});

