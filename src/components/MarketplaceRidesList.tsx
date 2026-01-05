/**
 * MarketplaceRidesList - Liste des courses du marketplace avec états loading/empty
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RideCard from './RideCard';
import { RideCardSkeleton } from './skeletons';

interface Ride {
  id: string;
  [key: string]: any;
}

interface MarketplaceRidesListProps {
  rides: Ride[];
  loading: boolean;
  currentUserId: string | null;
  onRidePress: (ride: Ride) => void;
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
        <RideCard 
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

