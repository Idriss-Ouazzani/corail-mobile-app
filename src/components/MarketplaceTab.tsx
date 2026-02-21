/**
 * MarketplaceTab - Onglet Marketplace complet
 * Assemble tous les sous-composants du marketplace
 */

import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MarketplaceHeader from './MarketplaceHeader';
import MarketplaceFiltersBar from './MarketplaceFiltersBar';
import MarketplaceRidesList from './MarketplaceRidesList';
import { useUserLocation } from '../hooks/useUserLocation';
import { calculateDistance, extractRideCoordinates, formatDistance } from '../utils/distance';

interface Ride {
  id: string;
  status: string;
  visibility?: string;
  creator_id?: string;
  picker_id?: string | null;
  vehicle_type?: string;
  pickup_address?: string;
  dropoff_address?: string;
  scheduled_at?: string;
  price_cents?: number;
  distance_km?: number;
  duration_minutes?: number;
  [key: string]: any;
}

interface FilterOptions {
  vehicleTypes: string[];
  sortBy: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'distance_asc' | 'distance_desc' | 'duration_asc' | 'duration_desc' | 'price_per_km_desc' | null;
  radiusKm?: number | null;
}

interface MarketplaceTabProps {
  verificationStatus: string | null;
  onRefreshVerification: () => Promise<void>;
  rides: Ride[];
  currentUserId: string | null;
  loadingRides: boolean;
  loadRides?: () => Promise<void>; // Pour pull-to-refresh (optionnel)
  selectedCity: string;
  activeFilter: 'all' | 'public' | 'groups';
  filters: FilterOptions;
  onCityChange: (city: string) => void;
  onFilterChange: (filter: 'all' | 'public' | 'groups') => void;
  onShowFilters: () => void;
  onCreateRide: () => void;
  onRidePress: (ride: Ride) => void;
}

export default function MarketplaceTab({
  verificationStatus,
  onRefreshVerification,
  rides,
  currentUserId,
  loadingRides,
  loadRides,
  selectedCity,
  activeFilter,
  filters,
  onCityChange,
  onFilterChange,
  onShowFilters,
  onCreateRide,
  onRidePress,
}: MarketplaceTabProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!loadRides) {
      console.warn('⚠️ loadRides non fourni, utilisez onRefreshVerification');
      setRefreshing(true);
      await onRefreshVerification();
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };
  // Géolocalisation pour filtrer par distance
  const { location, loading: loadingLocation, hasPermission, requestLocation } = useUserLocation();

  // Filter rides based on active filter and filters
  const isMyRide = (ride: Ride) => !!(currentUserId && ride.creator_id && String(ride.creator_id) === String(currentUserId));

  let filteredRides = (rides || []).filter((ride) => {
    // Exclure uniquement les expirées
    const status = (ride.status || '').toUpperCase();
    if (status === 'EXPIRED') return false;

    // Uniquement les courses publiées
    if (status !== 'PUBLISHED') return false;

    // Exclure les dates passées (si scheduled_at valide)
    const scheduledTime = ride.scheduled_at ? new Date(ride.scheduled_at).getTime() : NaN;
    if (!Number.isNaN(scheduledTime) && scheduledTime < Date.now()) return false;

    // Mes courses : toujours les afficher (ignorer filtre visibilité et rayon)
    if (isMyRide(ride)) return true;

    // Visibility filter (pour les autres courses)
    const vis = (ride.visibility || 'PUBLIC').toUpperCase();
    if (activeFilter === 'public' && vis !== 'PUBLIC') return false;
    if (activeFilter === 'groups' && vis !== 'GROUP') return false;

    // Distance filter (sauf pour mes courses)
    const radiusKm = filters.radiusKm ?? null;
    if (location && radiusKm !== null) {
      const rideCoords = extractRideCoordinates(ride);
      if (rideCoords) {
        const distance = calculateDistance(location, rideCoords);
        if (distance > radiusKm) return false;
      }
    }

    return true;
  });

  // Sort rides
  if (filters.sortBy) {
    filteredRides = [...filteredRides].sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return (a.price_cents ?? 0) - (b.price_cents ?? 0);
        case 'price_desc':
          return (b.price_cents ?? 0) - (a.price_cents ?? 0);
        case 'price_per_km_desc': {
          const eurPerKm = (r: typeof a) =>
            r.distance_km != null && r.distance_km > 0 && r.price_cents != null
              ? (r.price_cents / 100) / r.distance_km
              : -1;
          const va = eurPerKm(a);
          const vb = eurPerKm(b);
          return vb - va; // Meilleur €/km = plus élevé en premier
        }
        case 'date_asc':
          return new Date(a.scheduled_at ?? 0).getTime() - new Date(b.scheduled_at ?? 0).getTime();
        case 'date_desc':
          return new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime();
        case 'distance_asc':
          return (a.distance_km || 999) - (b.distance_km || 999);
        case 'distance_desc':
          return (b.distance_km || 0) - (a.distance_km || 0);
        case 'duration_asc':
          return (a.duration_minutes || 999) - (b.duration_minutes || 999);
        case 'duration_desc':
          return (b.duration_minutes || 0) - (a.duration_minutes || 0);
        default:
          return 0;
      }
    });
  }

  const activeFiltersCount = (filters.sortBy ? 1 : 0);

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContentCourses} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#0ea5e9"
          colors={['#0ea5e9']}
        />
      }
    >
      <MarketplaceHeader
        ridesCount={filteredRides.length}
        onCreateRide={onCreateRide}
      />

      {/* Rayon / localisation : tap pour modifier le rayon */}
      <View style={styles.metaRow}>
        {loadingLocation ? (
          <View style={styles.metaChip}>
            <ActivityIndicator size="small" color="#10b981" style={{ marginRight: 4 }} />
            <Text style={styles.metaChipText}>Localisation…</Text>
          </View>
        ) : !hasPermission || !location ? (
          <TouchableOpacity style={styles.metaChip} onPress={requestLocation} activeOpacity={0.7}>
            <Ionicons name="location-outline" size={12} color="#f59e0b" />
            <Text style={[styles.metaChipText, styles.metaChipTextMuted]}>Localisation off</Text>
            <Ionicons name="chevron-forward" size={12} color="#64748b" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.radiusChip} onPress={onShowFilters} activeOpacity={0.7}>
            <Ionicons name="navigate-circle" size={14} color="#10b981" />
            <Text style={styles.metaChipText}>
              {filters.radiusKm === null ? 'France' : `Rayon ${filters.radiusKm} km`}
            </Text>
            <Text style={styles.radiusModifier}>modifier</Text>
            <Ionicons name="chevron-forward" size={14} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      <MarketplaceFiltersBar
        activeFilter={activeFilter}
        activeFiltersCount={activeFiltersCount}
        onFilterChange={onFilterChange}
        onShowAdvancedFilters={onShowFilters}
      />

      <MarketplaceRidesList
        rides={filteredRides}
        loading={loadingRides}
        currentUserId={currentUserId}
        onRidePress={onRidePress}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContentCourses: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metaChipText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  metaChipTextMuted: {
    color: '#94a3b8',
  },
  radiusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  radiusModifier: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 2,
  },
});
