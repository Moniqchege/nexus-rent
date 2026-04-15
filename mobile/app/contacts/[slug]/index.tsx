import { View, Text, StyleSheet, Pressable, Linking, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../store/authStore';
import { Contact } from '../../../types/contact';
import api from '../../../lib/api';

export default function ContactDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (token && slug) {
    api.getContacts(token)
      .then((data) => {
        const found = data.find((c: any) => c.id === parseInt(slug));
        if (found) {
          setContact({
            id: found.id,
            name: found.name,
            email: found.email ?? '',
            phone: found.phone ?? '',
            role: found.role?.name ?? '',
            propertyId: found.property?.id,
            propertyName: found.property?.title ?? '',
            propertyLocation: found.property?.location ?? '',
          });
        } else {
          setContact(null);
        }
      })
      .finally(() => setLoading(false));
  }
}, [token, slug]);

  const callContact = () => {
    if (contact?.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  const messageContact = () => {
    if (contact?.phone) {
      Linking.openURL(`sms:${contact.phone}?body=Hi`);
    }
  };

  const emailContact = () => {
    if (contact?.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading contact...</Text>
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.center}>
        <Text>Contact not found</Text>
      </View>
    );
  }

  return (
  <View style={styles.container}>
    <View style={styles.content}>
      <LinearGradient
        colors={['rgba(0,255,255,0.15)', 'rgba(124,58,237,0.15)']}
        style={styles.header}
      >
        <Text style={styles.title}>{contact.name}</Text>
        <Text style={styles.subtitle}>{contact.role}</Text>
      </LinearGradient>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{contact.phone}</Text>
        </View>

        {contact.email && (
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{contact.email}</Text>
          </View>
        )}
      </View>
    </View>

    <View style={styles.buttons}>
      {!!contact.phone && (
        <>
          <Pressable style={styles.callButton} onPress={callContact}>
            <Text style={styles.callText}>📞 CALL NOW</Text>
          </Pressable>

          <Pressable style={styles.messageButton} onPress={messageContact}>
            <Text style={styles.messageText}>💬 MESSAGE</Text>
          </Pressable>
        </>
      )}

      {!!contact.email && (
        <Pressable style={styles.emailButton} onPress={emailContact}>
          <Text style={styles.emailText}>✉️ EMAIL</Text>
        </Pressable>
      )}
    </View>
  </View>
);
}

const styles = StyleSheet.create({
  content: {
  flex: 1,
},
container: {
  flex: 1,
  backgroundColor: '#060A14',
},

header: {
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(0,255,255,0.3)',
},

title: {
  fontSize: 18,
  color: '#00FFFF',
  fontFamily: 'Orbitron',
},

subtitle: {
  color: '#ccc',
  marginTop: 4,
},

details: {
  padding: 24,
},

row: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.1)',
},

label: {
  color: '#888',
},

value: {
  color: '#fff',
  fontFamily: 'monospace',
},

buttons: {
  padding: 20,
  gap: 12,
},

callButton: {
  backgroundColor: 'rgba(22,163,74,0.2)',
  padding: 16,
  borderRadius: 12,
},

messageButton: {
  backgroundColor: 'rgba(0,255,255,0.1)',
  padding: 16,
  borderRadius: 12,
},

emailButton: {
  backgroundColor: 'rgba(124,58,237,0.15)',
  padding: 16,
  borderRadius: 12,
},

callText: {
  color: '#16A34A',
  textAlign: 'center',
},

messageText: {
  color: '#00FFFF',
  textAlign: 'center',
},

emailText: {
  color: '#7C3AED',
  textAlign: 'center',
},

center: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
});