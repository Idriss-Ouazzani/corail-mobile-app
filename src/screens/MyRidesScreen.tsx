import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import RideCard from '../components/RideCard';
import apiClient from '../services/api';
import type { Ride } from '../types';

export const MyRidesScreen = ({ navigation }: any) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ongoing' | 'completed' | 'all'>('ongoing');

  const fetchMyRides = async () => {
    try {
      const response = await apiClient.listMyRides();
      setRides(response.data);
    } catch (error) {
      console.error('Error fetching my rides:', error);
      // Mock data for demo
      setRides(getMockMyRides());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyRides();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyRides();
  };

  const filteredRides = rides.filter((ride) => {
    if (filter === 'ongoing') return ride.status === 'CLAIMED';
    if (filter === 'completed') return ride.status === 'COMPLETED';
    return true;
  });

  const ongoingCount = rides.filter((r) => r.status === 'CLAIMED').length;
  const completedCount = rides.filter((r) => r.status === 'COMPLETED').length;

  const StatCard = ({ label, value, active }: { label: string; value: number; active: boolean }) => (
    <TouchableOpacity
      style={[styles.statCard, active && styles.statCardActive]}
      onPress={() => setFilter(label.toLowerCase() as any)}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0c4a6e', '#075985']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mes Courses</Text>
          <Text style={styles.subtitle}>Gérez vos courses actives et historique</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard label="En cours" value={ongoingCount} active={filter === 'ongoing'} />
          <StatCard label="Terminées" value={completedCount} active={filter === 'completed'} />
          <StatCard label="Toutes" value={rides.length} active={filter === 'all'} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ff6b47"
            />
          }
        >
          {filteredRides.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>Aucune course</Text>
              <Text style={styles.emptySubtitle}>
                Vous n'avez pas encore de courses dans cette catégorie
              </Text>
            </View>
          ) : (
            filteredRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onPress={() => navigation.navigate('RideDetail', { rideId: ride.id })}
              />
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const getMockMyRides = (): Ride[] => [
  {
    id: '3',
    creator_id: 'user3',
    picker_id: 'current-user',
    pickup_address: 'CHU Purpan, Toulouse',
    dropoff_address: 'Labège Innopole',
    scheduled_at: new Date(Date.now() + 1800000).toISOString(),
    price_cents: 3200,
    status: 'CLAIMED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    visibility: 'PUBLIC',
    commission_enabled: true,
    creator: {
      id: 'user3',
      full_name: 'Marie Dubois',
      email: 'marie@example.com',
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 6,
  },
  statCardActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#b9e6fe',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
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
    paddingHorizontal: 40,
  },
});

export default MyRidesScreen;

