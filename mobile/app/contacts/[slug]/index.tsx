import { View, Text, FlatList, Pressable, StyleSheet, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Contact } from '../../../types/contact';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';

export default function ContactsDetail() {
  const { slug } = useLocalSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

useEffect(() => {
  if (!token) return;

  const propertyId = 1; 

  setLoading(true);

  api.getContacts(token)
    .then((contacts) => {
      const filtered = contacts.filter(
        (c: Contact) => c.type === slug
      );
      setContacts(filtered);
    })
    .catch(console.error)
    .finally(() => setLoading(false));

}, [token, slug]);

  const renderContact = ({ item }: { item: Contact }) => (
    <Pressable style={styles.providerCard} onPress={() => {
      if (item.phone) {
        Linking.openURL(`sms:${item.phone}?body=Hi, regarding property maintenance...`);
      }
    }}>
      <LinearGradient 
        colors={['rgba(0,255,255,0.1)', 'rgba(124,58,237,0.1)']} 
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.role}>{item.role}</Text>
          {item.phone && (
            <Text style={styles.phone}>{item.phone}</Text>
          )}
          {item.email && (
            <Text style={styles.email}>{item.email}</Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading {slug} contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  providerCard: {
    margin: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  cardContent: {
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Orbitron',
    color: '#fff',
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    color: '#00FFFF',
    fontFamily: 'Orbitron',
  },
  phone: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  email: {
    fontSize: 12,
    color: '#888',
  },
  separator: {
    height: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
