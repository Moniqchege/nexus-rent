import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Linking,
  Image,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Property, PropertyContact } from '../../types/property';

export default function PropertyDetailScreen() {
  const { id, unitTypeId } = useLocalSearchParams<{ id: string; unitTypeId: string }>();
  const router = useRouter();
  const { token } = useAuthStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [contacts, setContacts] = useState<PropertyContact[]>([]);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Fetch property
    api.fetchAllProperties(token)
      .then(data => {
        const found = data.find(p => p.id === Number(id)) ?? null;
        setProperty(found);
      })
      .catch(() => setProperty(null))
      .finally(() => setLoadingProperty(false));

    // Fetch contacts in parallel
    api.fetchPropertyContacts(token, Number(id))
      .then(data => setContacts(data))
      .catch(err => setContactsError(err.message))
      .finally(() => setLoadingContacts(false));
  }, [token, id]);

  const unitType = property?.unitTypes.find(u => u.id === Number(unitTypeId));

  const bedroomLabel = unitType?.type
  ?.replace(/\bBR\b/gi, 'Bedrooms')
  ?.replace(/\bBedroom\b/gi, 'Bedrooms');

  const handleSubmitBooking = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 365);
    const errors: Record<string, string> = {};
    if (!bookingName.trim()) errors.name = 'Name is required';
    if (!bookingPhone.trim()) errors.phone = 'Phone is required';
    if (!bookingDate.trim()) {
      errors.date = 'Date is required';
    } else {
      const d = new Date(bookingDate);
      if (isNaN(d.getTime()) || d < today || d > maxDate) {
        errors.date = 'Enter a valid date within the next 365 days';
      }
    }
    if (Object.keys(errors).length > 0) { setBookingErrors(errors); return; }
    setBookingErrors({});
    setBookingConfirmed(true);
    setShowBookingForm(false);
  };

  // Loading state
  if (loadingProperty) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00FFFF" />
      </View>
    );
  }

  // Error state (not found)
  if (!property || !unitType) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Property or unit type not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main content
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

         {/* Back button */}
         <View style={styles.titleRow}>
            <Pressable onPress={() => router.back()} style={styles.side}>
              <Image
                source={require('../../assets/back_icon.png')}
                style={styles.backIcon}
              />
            </Pressable>

            <Text style={styles.title}>Apartment Details</Text>
          </View>

{/* Property Hero Card */}
<View style={styles.heroCard}>
  {/* Property Image */}
  <Image
    source={require('../../assets/apartment.jpg')}
    style={styles.heroImage}
    resizeMode="cover"
  />

  {/* Gradient overlay */}
  <LinearGradient
    colors={[
      'transparent',
      'rgba(6,10,20,0.15)',
      'rgba(6,10,20,0.92)',
    ]}
    locations={[0, 0.45, 1]}
    style={styles.heroGradient}
  />

  {/* Property information — bottom left */}
  <View style={styles.heroDetails}>
    <Text style={styles.propertyTitle}>
      {property.title}  {bedroomLabel}
    </Text>
    <Text style={styles.statValueNeon}>Ksh {unitType.price.toLocaleString()}</Text>

    <Text style={styles.locationText}>
      📍 {property.location}
    </Text>
  </View>
</View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {/* <View style={styles.statBox}>
            <Text style={styles.statLabel}>PRICE</Text>
            <Text style={styles.statValueNeon}>Ksh {unitType.price.toLocaleString()}/Mo</Text>
          </View> */}
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>BATHS</Text>
            <Text style={styles.statValueMuted}>{unitType.baths} Bath{unitType.baths !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>UNITS</Text>
            <Text style={styles.statValueMuted}>{unitType.totalUnits} available</Text>
          </View>
        </View>

        {/* Amenities */}
        <Text style={styles.sectionTitle}>AMENITIES</Text>
        {(!property.amenities || property.amenities.length === 0) ? (
          <Text style={styles.mutedText}>No amenities listed</Text>
        ) : (
          <View style={styles.amenitiesWrap}>
            {property.amenities.map((a, i) => (
              <View key={i} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Contacts */}
        <Text style={styles.sectionTitle}>CONTACTS</Text>
        {loadingContacts ? (
          <ActivityIndicator color="#00FFFF" style={{ marginVertical: 8 }} />
        ) : contactsError ? (
          <Text style={styles.errorInline}>{contactsError}</Text>
        ) : contacts.length === 0 ? (
          <Text style={styles.mutedText}>No contact information available</Text>
        ) : (
          contacts.map((c, i) => (
            <View key={i} style={styles.contactCard}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactRole}>{c.role}</Text>
              <Text style={styles.contactPhone}>{c.phone ?? 'Not available'}</Text>
              {c.phone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${c.phone}`)} style={styles.callBtn}>
                  <Text style={styles.callBtnText}>📞 Call</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {/* Book Viewing */}
        <Text style={styles.sectionTitle}>BOOK A VIEWING</Text>

        {bookingConfirmed ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>✓ Viewing request submitted! We'll be in touch shortly.</Text>
          </View>
        ) : showBookingForm ? (
          <View style={styles.bookingForm}>
            <Text style={styles.formLabel}>Name</Text>
            <TextInput
              value={bookingName} onChangeText={setBookingName}
              style={styles.formInput} placeholderTextColor="#888" placeholder="Your full name"
            />
            {bookingErrors.name && <Text style={styles.fieldError}>{bookingErrors.name}</Text>}

            <Text style={styles.formLabel}>Phone</Text>
            <TextInput
              value={bookingPhone} onChangeText={setBookingPhone}
              style={styles.formInput} keyboardType="phone-pad" placeholderTextColor="#888" placeholder="+254..."
            />
            {bookingErrors.phone && <Text style={styles.fieldError}>{bookingErrors.phone}</Text>}

            <Text style={styles.formLabel}>Preferred Date (YYYY-MM-DD)</Text>
            <TextInput
              value={bookingDate} onChangeText={setBookingDate}
              style={styles.formInput} placeholderTextColor="#888" placeholder="2026-09-15"
            />
            {bookingErrors.date && <Text style={styles.fieldError}>{bookingErrors.date}</Text>}

            <TouchableOpacity onPress={handleSubmitBooking} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>SUBMIT REQUEST</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowBookingForm(false); setBookingErrors({}); }} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowBookingForm(true)} style={styles.bookBtn}>
            <Text style={styles.bookBtnText}>BOOK VIEWING</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060A14' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#060A14', gap: 16 },
  errorText: { color: '#DC2626', fontFamily: 'Orbitron', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,255,255,0.3)' },
  backBtnText: { color: '#00FFFF', fontFamily: 'Orbitron', fontSize: 11 },
  backRow: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  backText: { color: '#00FFFF', fontSize: 12, fontFamily: 'Orbitron' },
  headerCard: { marginHorizontal: 20, marginBottom: 20, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,255,255,0.3)' },
  propertyTitle: { fontSize: 18, fontFamily: 'Orbitron', color: '#00FFFF'},
  locationText: { fontSize: 12, color: '#888' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 10 },
  statBox: { flex: 1, backgroundColor: '#111827', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#1F2937' },
  statLabel: { fontSize: 9, color: '#9CA3AF', fontFamily: 'Orbitron', letterSpacing: 1, marginBottom: 4 },
  statValueNeon: { fontSize: 13, color: '#00FFFF', fontFamily: 'monospace', fontWeight: '600' },
  statValueMuted: { fontSize: 13, color: '#fff', fontFamily: 'monospace' },
  sectionTitle: { paddingHorizontal: 20, marginBottom: 8, marginTop: 8, fontSize: 10, fontFamily: 'Orbitron', color: '#888', letterSpacing: 2 },
  mutedText: { paddingHorizontal: 20, color: '#888', fontSize: 12, marginBottom: 16 },
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  amenityChip: { backgroundColor: 'rgba(0,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,255,255,0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  amenityText: { color: '#00FFFF', fontSize: 11 },
  contactCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1F2937' },
  contactName: { fontSize: 14, fontFamily: 'Orbitron', color: '#00FFFF', marginBottom: 2 },
  contactRole: { fontSize: 11, color: '#888', marginBottom: 4 },
  contactPhone: { fontSize: 12, color: '#fff', fontFamily: 'monospace', marginBottom: 8 },
  callBtn: { backgroundColor: 'rgba(22,163,74,0.2)', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(22,163,74,0.4)' },
  callBtnText: { color: '#16A34A', fontSize: 12, fontFamily: 'Orbitron' },
  errorInline: { color: '#DC2626', paddingHorizontal: 20, fontSize: 12, marginBottom: 12 },
  bookingForm: { paddingHorizontal: 20, marginBottom: 20 },
  formLabel: { color: '#888', fontSize: 11, fontFamily: 'Orbitron', marginBottom: 4, marginTop: 12 },
  formInput: { backgroundColor: '#1F2937', borderRadius: 10, padding: 12, color: '#fff', borderWidth: 1, borderColor: 'rgba(0,255,255,0.2)', fontSize: 13 },
  fieldError: { color: '#DC2626', fontSize: 11, marginTop: 4 },
  submitBtn: { marginTop: 16, backgroundColor: 'rgba(0,255,255,0.15)', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,255,255,0.4)' },
  submitBtnText: { color: '#00FFFF', fontFamily: 'Orbitron', fontSize: 12 },
  cancelBtn: { marginTop: 8, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: '#888', fontSize: 12 },
  bookBtn: { marginHorizontal: 20, marginTop: 8, marginBottom: 20, backgroundColor: 'rgba(0,255,255,0.1)', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,255,255,0.4)' },
  bookBtnText: { color: '#00FFFF', fontFamily: 'Orbitron', fontSize: 13, letterSpacing: 1 },
  confirmBox: { marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(22,163,74,0.12)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(22,163,74,0.4)' },
  confirmText: { color: '#16A34A', fontFamily: 'Orbitron', fontSize: 11, lineHeight: 18 },
    titleRow: {
  flexDirection: 'row',
  alignItems: 'center', 
  marginBottom: 30,
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
  title: {
    fontSize: 18,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
    paddingLeft: 50,
  },
  heroCard: {
  height: 300,
  marginHorizontal: 20,
  marginBottom: 20,
  borderRadius: 24,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: 'rgba(0,255,255,0.3)',
  backgroundColor: '#111827',
},

heroImage: {
  ...StyleSheet.absoluteFillObject,
  width: '100%',
  height: '100%',
},

heroGradient: {
  ...StyleSheet.absoluteFillObject,
},

heroDetails: {
  position: 'absolute',
  left: 20,
  right: 20,
  bottom: 20,
},
});
