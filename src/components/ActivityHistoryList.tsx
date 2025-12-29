/**
 * ActivityHistoryList - Liste de l'activité générale ligne par ligne
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

interface PersonalRide {
  id: string;
  source: string;
  pickup_address: string;
  dropoff_address: string;
  completed_at?: string;
  created_at: string;
  price_cents?: number;
  distance_km?: number;
  duration_minutes?: number;
  status: string;
}

export default function ActivityHistoryList() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<PersonalRide[]>([]);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listPersonalRides({ limit: 100 });
      setRides(data);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivity();
    setRefreshing(false);
  };

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'UBER': return 'car';
      case 'BOLT': return 'flash';
      case 'DIRECT_CLIENT': return 'person';
      case 'MARKETPLACE': return 'storefront';
      default: return 'document-text';
    }
  };

  const getSourceLabel = (src: string) => {
    switch (src) {
      case 'UBER': return 'Uber';
      case 'BOLT': return 'Bolt';
      case 'DIRECT_CLIENT': return 'Direct';
      case 'MARKETPLACE': return 'Corail';
      default: return 'Autre';
    }
  };

  const getSourceColor = (src: string) => {
    switch (src) {
      case 'UBER': return '#000000';
      case 'BOLT': return '#34d399';
      case 'DIRECT_CLIENT': return '#6366f1';
      case 'MARKETPLACE': return '#ff6b47';
      default: return '#94a3b8';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (rides.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>Aucune activité</Text>
            <Text style={styles.emptyStateSubtext}>
              Vos courses apparaîtront ici
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activité générale</Text>
          <Text style={styles.headerSubtitle}>{rides.length} courses enregistrées</Text>
        </View>

        {rides.map((ride) => (
          <View key={ride.id} style={styles.activityRow}>
            {/* Icon et Source */}
            <View style={[styles.iconContainer, { backgroundColor: `${getSourceColor(ride.source)}20` }]}>
              <Ionicons name={getSourceIcon(ride.source) as any} size={20} color={getSourceColor(ride.source)} />
            </View>

            {/* Content */}
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <Text style={styles.activitySource}>{getSourceLabel(ride.source)}</Text>
                <Text style={styles.activityPrice}>
                  {ride.price_cents ? `${(ride.price_cents / 100).toFixed(2)} €` : '—'}
                </Text>
              </View>

              <View style={styles.routeRow}>
                <Ionicons name="location" size={12} color="#64748b" />
                <Text style={styles.routeText} numberOfLines={1}>
                  {ride.pickup_address}
                </Text>
              </View>

              <View style={styles.routeRow}>
                <Ionicons name="flag" size={12} color="#64748b" />
                <Text style={styles.routeText} numberOfLines={1}>
                  {ride.dropoff_address}
                </Text>
              </View>

              <View style={styles.activityMeta}>
                {ride.distance_km && (
                  <View style={styles.metaItem}>
                    <Ionicons name="resize" size={11} color="#94a3b8" />
                    <Text style={styles.metaText}>{ride.distance_km} km</Text>
                  </View>
                )}
                {ride.duration_minutes && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={11} color="#94a3b8" />
                    <Text style={styles.metaText}>{ride.duration_minutes} min</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Ionicons name="calendar" size={11} color="#94a3b8" />
                  <Text style={styles.metaText}>
                    {new Date(ride.completed_at || ride.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  activityRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activitySource: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  activityPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 6,
  },
  routeText: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
});

