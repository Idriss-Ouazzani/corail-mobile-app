import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import RideCard from '../components/RideCard';
import apiClient from '../services/api';
import type { Ride } from '../types';

export const MarketplaceScreen = ({ navigation }: any) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'public' | 'groups'>('all');

  const fetchRides = async () => {
    try {
      setLoading(true);
      const response = await apiClient.listMarketplaceRides({
        filterType: filter,
        limit: 50,
      });
      setRides(response.data);
    } catch (error) {
      console.error('Error fetching rides:', error);
      // For demo, show mock data
      setRides(getMockRides());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  const handleRidePress = (ride: Ride) => {
    navigation.navigate('RideDetail', { rideId: ride.id });
  };

  const FilterButton = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === value && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b47" />
        <Text style={styles.loadingText}>Chargement des courses...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0c4a6e', '#075985']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>{rides.length} courses disponibles</Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <FilterButton label="Toutes" value="all" />
          <FilterButton label="Public" value="public" />
          <FilterButton label="Groupes" value="groups" />
        </View>

        {/* Rides List */}
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RideCard ride={item} onPress={() => handleRidePress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ff6b47"
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>🚗</Text>
              <Text style={styles.emptyTitle}>Aucune course disponible</Text>
              <Text style={styles.emptySubtitle}>
                Revenez plus tard ou créez une nouvelle course
              </Text>
            </View>
          )}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

// Mock data for demo
const getMockRides = (): Ride[] => [
  {
    id: '1',
    creator_id: 'user1',
    picker_id: null,
    pickup_address: 'Aéroport Toulouse-Blagnac',
    dropoff_address: 'Place du Capitole, Toulouse',
    scheduled_at: new Date(Date.now() + 3600000).toISOString(),
    price_cents: 2800,
    status: 'PUBLISHED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    visibility: 'PUBLIC',
    commission_enabled: true,
    creator: {
      id: 'user1',
      full_name: 'Youssef D.',
      email: 'youssef@example.com',
    },
  },
  {
    id: '2',
    creator_id: 'user2',
    picker_id: null,
    pickup_address: 'Gare Toulouse-Matabiau',
    dropoff_address: 'Ramonville Saint-Agne',
    scheduled_at: new Date(Date.now() + 7200000).toISOString(),
    price_cents: 1800,
    status: 'PUBLISHED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    visibility: 'PUBLIC',
    commission_enabled: false,
    creator: {
      id: 'user2',
      full_name: 'Hassan Al Masri',
      email: 'hassan@example.com',
    },
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c4a6e',
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#b9e6fe',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b9e6fe',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c4a6e',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#b9e6fe',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#b9e6fe',
    textAlign: 'center',
  },
});

export default MarketplaceScreen;

