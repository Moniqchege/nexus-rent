import { View, Text, FlatList, Pressable, StyleSheet, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';
import { Contact, ContactCategory } from '../../types/contact';
import { useAuthStore } from '../../store/authStore';

export default function ContactsIndex() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

useEffect(() => {
  if (token) {
    console.log("🔐 Token available, fetching contacts...");

    api.getContacts(token)
      .then((data) => {
        console.log("📦 Raw contacts response:", data);

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

        console.log("🔄 Mapped contacts:", mapped);

        setContacts(mapped);
      })
      .catch((error) => {
        console.error("❌ Failed to fetch contacts:", error);
      })
      .finally(() => {
        console.log("🏁 Contacts fetch completed");
        setLoading(false);
      });
  } else {
    console.log("⚠️ No token found, skipping contacts fetch");
  }
}, [token]);

  const renderContact = ({ item }: { item: Contact }) => (
  <Pressable style={styles.categoryCard}>
    <LinearGradient
      colors={['rgba(0,255,255,0.1)', 'rgba(124,58,237,0.1)']}
      style={styles.gradient}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.description}>{item.role}</Text>

      {!!item.phone && <Text style={styles.description}>{item.phone}</Text>}
      {!!item.email && <Text style={styles.description}>{item.email}</Text>}
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
  list: {
    paddingBottom: 100,
  },
  categoryCard: {
    flex: 1,
    margin: 8,
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
    fontSize: 28,
    marginBottom: 10,
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
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
