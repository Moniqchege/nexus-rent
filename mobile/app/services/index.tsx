import { View, Text, FlatList, Pressable, StyleSheet, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceCategory } from '../../types/service';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

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
      onPress={() => router.push(`/services/${item.slug}`)}
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

<View style={styles.header}>

  {/* Left */}
  <Pressable onPress={() => router.back()} style={styles.side}>
    <Image
      source={require('../../assets/back_icon.png')}
      style={styles.backIcon}
    />
  </Pressable>

  {/* Center */}
  <View style={styles.titleWrap}>
    <Text style={styles.title}>Select Service</Text>
  </View>

  {/* Right spacer */}
  <View style={styles.side} />
</View>

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
  paddingVertical: 20,
  paddingHorizontal: 0, 
},
side: {
  width: 40, 
  alignItems: 'center',
  justifyContent: 'center',
},
titleWrap: {
  flex: 1,
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingLeft: 65, 
},
  title: {
    fontSize: 20,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
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
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  marginBottom: 20,
  height: 50,
},

backButton: {
  position: 'absolute',
  left: 16,
  zIndex: 10,
  padding: 8,
},

backIcon: {
  width: 22,
  height: 22,
  tintColor: '#00FFFF', 
},
});

