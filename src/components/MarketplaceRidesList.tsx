/**
 * MarketplaceRidesList - Liste des courses du marketplace avec états loading/empty
 * Utilise MarketplaceRideCard (compact, bouton Prendre).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceRideCard } from './MarketplaceRideCard';
import { RideCardSkeleton } from './skeletons';

export interface MarketplaceListRide {
  id: string;
  creator_id?: string;
  status: string;
  visibility?: string;
  group_id?: string | null;
  group_name?: string;
  pickup_address?: string;
  dropoff_address?: string;
  scheduled_at?: string;
  price_cents?: number;
  vehicle_type?: string;
  distance_km?: number;
  duration_minutes?: number;
  source?: 'chauffeur' | 'hotel' | 'client';
  [key: string]: any;
}

interface MarketplaceRidesListProps {
  rides: MarketplaceListRide[];
  loading: boolean;
  currentUserId: string | null;
  onRidePress: (ride: MarketplaceListRide) => void;
}

export default function MarketplaceRidesList({
  rides,
  loading,
  currentUserId,
  onRidePress,
}: MarketplaceRidesListProps) {
  if (loading) {
    return (
      <>
        <RideCardSkeleton />
        <RideCardSkeleton />
        <RideCardSkeleton />
      </>
    );
  }

  if (rides.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="car-sport-outline" size={64} color="#475569" />
        <Text style={styles.emptyStateText}>Aucune course disponible</Text>
        <Text style={styles.emptyStateSubtext}>
          Changez de filtre pour voir plus de courses
        </Text>
      </View>
    );
  }

  return (
    <>
      {rides.map((ride) => (
        <MarketplaceRideCard
          key={ride.id}
          ride={ride}
          currentUserId={currentUserId}
          onPress={() => onRidePress(ride)}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

