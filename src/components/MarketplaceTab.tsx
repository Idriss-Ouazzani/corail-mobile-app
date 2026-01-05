/**
 * MarketplaceTab - Onglet Marketplace complet
 * Assemble tous les sous-composants du marketplace
 */

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import MarketplaceHeader from './MarketplaceHeader';
import CreditsInfoBanner from './CreditsInfoBanner';
import CitySelector from './CitySelector';
import MarketplaceFiltersBar from './MarketplaceFiltersBar';
import MarketplaceRidesList from './MarketplaceRidesList';

interface Ride {
  id: string;
  status: string;
  visibility: string;
  vehicle_type?: string;
  pickup_address?: string;
  dropoff_address?: string;
  scheduled_at: string;
  price_cents: number;
  distance_km?: number;
  duration_minutes?: number;
  [key: string]: any;
}

interface FilterOptions {
  vehicleTypes: string[];
  sortBy: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'distance_asc' | 'distance_desc' | 'duration_asc' | 'duration_desc' | null;
}

interface MarketplaceTabProps {
  rides: Ride[];
  currentUserId: string | null;
  loadingRides: boolean;
  selectedCity: string;
  activeFilter: 'all' | 'public' | 'groups';
  filters: FilterOptions;
  showCreditsInfo: boolean;
  onCityChange: (city: string) => void;
  onFilterChange: (filter: 'all' | 'public' | 'groups') => void;
  onShowFilters: () => void;
  onCreateRide: () => void;
  onRidePress: (ride: Ride) => void;
  onCloseCreditsInfo: () => void;
}

export default function MarketplaceTab({
  rides,
  currentUserId,
  loadingRides,
  selectedCity,
  activeFilter,
  filters,
  showCreditsInfo,
  onCityChange,
  onFilterChange,
  onShowFilters,
  onCreateRide,
  onRidePress,
  onCloseCreditsInfo,
}: MarketplaceTabProps) {
  // Filter rides based on active filter and filters
  let filteredRides = (rides || []).filter((ride) => {
    // Visibility filter
    if (activeFilter === 'public' && ride.visibility !== 'PUBLIC') return false;
    if (activeFilter === 'groups' && ride.visibility !== 'GROUP') return false;
    
    // Vehicle type filter
    if (filters.vehicleTypes.length > 0 && ride.vehicle_type) {
      if (!filters.vehicleTypes.includes(ride.vehicle_type)) return false;
    }
    
    // Region filter (case insensitive search in pickup or dropoff address)
    if (selectedCity && selectedCity !== 'toulouse') {
      const cityName = selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1);
      const pickupMatch = ride.pickup_address?.toLowerCase().includes(cityName.toLowerCase()) || false;
      const dropoffMatch = ride.dropoff_address?.toLowerCase().includes(cityName.toLowerCase()) || false;
      if (!pickupMatch && !dropoffMatch) return false;
    }
    
    // Only show published rides in marketplace
    // Exclure les courses EXPIRED et celles dont la date est passée
    if (ride.status === 'EXPIRED') return false;
    if (ride.status !== 'PUBLISHED') return false;
    
    // Filtrer les courses dont la date scheduled_at est dans le passé
    const scheduledTime = new Date(ride.scheduled_at).getTime();
    const now = Date.now();
    if (scheduledTime < now) return false;
    
    return true;
  });

  // Sort rides
  if (filters.sortBy) {
    filteredRides = [...filteredRides].sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.price_cents - b.price_cents;
        case 'price_desc':
          return b.price_cents - a.price_cents;
        case 'date_asc':
          return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
        case 'date_desc':
          return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
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

  const activeFiltersCount = filters.vehicleTypes.length + (filters.sortBy ? 1 : 0);

  return (
    <ScrollView contentContainerStyle={styles.scrollContentCourses} showsVerticalScrollIndicator={false}>
      <MarketplaceHeader
        ridesCount={filteredRides.length}
        onCreateRide={onCreateRide}
      />

      <CreditsInfoBanner
        visible={showCreditsInfo}
        onClose={onCloseCreditsInfo}
      />

      {/* Selected Region Indicator - Opens CitySelector */}
      <View style={{ marginBottom: 16 }}>
        <CitySelector selectedCity={selectedCity} onCityChange={onCityChange} />
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
});
