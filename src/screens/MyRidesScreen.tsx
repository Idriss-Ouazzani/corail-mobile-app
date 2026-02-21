import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RideCard } from '../components/RideCard';
import apiClient from '../services/api';
import type { Ride } from '../types';

export const MyRidesScreen = ({ navigation }: any) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ongoing' | 'completed' | 'all'>('ongoing');

  const fetchMyRides = async () => {
    try {
      if (!refreshing) setLoading(true);
      setLoadError(null);
      const response = await apiClient.listMyRides();
      setRides(response.data ?? []);
    } catch (error) {
      console.error('Error fetching my rides:', error);
      setLoadError('Impossible de charger vos courses. Vérifiez votre connexion.');
      setRides([]);
    } finally {
      setLoading(false);
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={['#0c4a6e', '#075985']} style={styles.gradient}>
          <View style={styles.header}>
            <Text style={styles.title}>Mes Courses</Text>
            <Text style={styles.subtitle}>Chargement...</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6b47" />
            <Text style={styles.loadingText}>Chargement de vos courses...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={['#0c4a6e', '#075985']} style={styles.gradient}>
          <View style={styles.header}>
            <Text style={styles.title}>Mes Courses</Text>
            <Text style={styles.subtitle}>Erreur de chargement</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>📡</Text>
            <Text style={styles.errorTitle}>Connexion impossible</Text>
            <Text style={styles.errorMessage}>{loadError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchMyRides()} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
                status={ride.status === 'CLAIMED' ? 'IN_PROGRESS' : 'UPCOMING'}
                onPress={() => navigation.navigate('RideDetail', { rideId: ride.id })}
              />
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#b9e6fe',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: '#b9e6fe',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#ff6b47',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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

