import { View, Text, FlatList, Pressable, StyleSheet, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';
import { Contact } from '../../types/contact';
import { useAuthStore } from '../../store/authStore';

export default function ContactsIndex() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      api.getContacts(token)
        .then((data) => {
          const mapped: Contact[] = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email ?? '',
            phone: c.phone ?? '',
            role: c.role?.name ?? '',
            propertyId: c.property?.id,
            propertyName: c.property?.title ?? '',
            propertyLocation: c.property?.location ?? '',
          }));

          setContacts(mapped);
        })
        .finally(() => setLoading(false));
    }
  }, [token, slug]);

  const renderContact = ({ item }: { item: Contact }) => (
    <Pressable
      style={styles.categoryCard}
       onPress={() => {
      console.log('[ContactsIndex] Contact pressed:', {
        id: item.id,
        name: item.name,
        route: `/contacts/${item.id}`,
      });
      router.push(`/contacts/${item.id}`);
    }}
    >
      <LinearGradient
        colors={['rgba(0,255,255,0.1)', 'rgba(124,58,237,0.1)']}
        style={styles.gradient}
      >
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.role}</Text>

        <Text style={styles.meta}>
          📞 {item.phone || 'No phone'}
        </Text>

        {item.email && (
          <Text style={styles.meta}>
            ✉️ {item.email}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A14',
  },
  categoryCard: {
    margin: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  name: {
    fontSize: 18,
    fontFamily: 'Orbitron',
    color: '#7C3AED',
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    color: '#888',
  },
  meta: {
    fontSize: 12,
    color: '#00FFFF',
    marginTop: 6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});