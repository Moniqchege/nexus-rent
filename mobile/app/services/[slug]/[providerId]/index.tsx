import { View, Text, StyleSheet, Pressable, Linking, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceProvider } from '../../../../types/service';
import { useAuthStore } from '../../../../store/authStore';
import api from '../../../../lib/api';

export default function ProviderDetail() {
  const { slug, providerId } = useLocalSearchParams<{ slug: string; providerId: string }>();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
   const router = useRouter();

  useEffect(() => {
    if (token && providerId) {
      api.getServiceCategories(token).then(categories => {
        const category = categories.find(c => c.slug === slug);
        if (category) {
          // Fetch providers and find this one
          api.getProviders(token, category.id).then(providers => {
            const found = providers.find(p => p.id === parseInt(providerId as string));
            setProvider(found || null);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      }).catch(console.error);
    }
  }, [token, slug, providerId]);

  const callProvider = () => {
    if (provider?.phone) {
      Linking.openURL(`tel:${provider.phone}`);
    }
  };

  const messageProvider = () => {
    if (provider?.phone) {
      Linking.openURL(`sms:${provider.phone}?body=Hi, I'm interested in your services.`);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading provider...</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.center}>
        <Text>Provider not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
  colors={['rgba(0,255,255,0.15)', 'rgba(124,58,237,0.15)']} 
  style={styles.header}
>

  {/* Row: Back + Title */}
  <View style={styles.titleRow}>
    <Pressable onPress={() => router.back()} style={styles.backButton}>
      <Image
        source={require('../../../../assets/back_icon.png')}
        style={styles.backIcon}
      />
    </Pressable>

    <Text style={styles.title}>{provider.name}</Text>
  </View>

  {/* Subtitle */}
  <Text style={styles.subtitle}>
    {provider.bio || 'Experienced service provider'}
  </Text>

</LinearGradient>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Rating:</Text>
          <Text style={styles.value}>{provider.rating} ★</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Rate:</Text>
          <Text style={styles.value}>Ksh {provider.hourlyRate?.toLocaleString() || 'Negotiable'}/hr</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{provider.location}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{provider.phone}</Text>
        </View>

        {provider.email && (
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{provider.email}</Text>
          </View>
        )}
      </View>

      <View style={styles.buttons}>
        <Pressable style={styles.callButton} onPress={callProvider}>
          <Text style={styles.callText}>📞 CALL NOW</Text>
        </Pressable>
        <Pressable style={styles.messageButton} onPress={messageProvider}>
          <Text style={styles.messageText}>💬 MESSAGE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A14',
    marginTop: 30,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,255,0.3)',
  },
  titleRow: {
  flexDirection: 'row',
  alignItems: 'center', 
  // marginBottom: 6,
},
  title: {
    fontSize: 18,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
    paddingLeft: 50,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    // marginTop: 4,
    lineHeight: 22,
  },
    side: {
  width: 40, 
  alignItems: 'center',
  justifyContent: 'center',
},
backIcon: {
  width: 22,
  height: 22,
  tintColor: '#00FFFF', 
},
  details: {
    padding: 24,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
  value: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  buttons: {
    padding: 20,
    gap: 12,
  },
  callButton: {
    backgroundColor: 'rgba(22,163,74,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.5)',
    padding: 16,
    borderRadius: 12,
  },
  callText: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Orbitron',
  },
  messageButton: {
    backgroundColor: 'rgba(0,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
    padding: 16,
    borderRadius: 12,
  },
  messageText: {
    color: '#00FFFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Orbitron',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

