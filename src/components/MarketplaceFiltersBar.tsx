/**
 * MarketplaceFiltersBar - Barre de filtres Annonces (visibilité uniquement)
 * Toutes | Public | Groupes
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type MarketplaceFilterKey = 'all' | 'public' | 'groups';

interface MarketplaceFiltersBarProps {
  activeFilter: MarketplaceFilterKey;
  activeFiltersCount: number;
  onFilterChange: (filter: MarketplaceFilterKey) => void;
  onShowAdvancedFilters: () => void;
}

const FILTERS: { key: MarketplaceFilterKey; label: string; icon: string }[] = [
  { key: 'all', label: 'Toutes', icon: 'grid' },
  { key: 'public', label: 'Public', icon: 'globe' },
  { key: 'groups', label: 'Groupes', icon: 'people' },
];

export default function MarketplaceFiltersBar({
  activeFilter,
  activeFiltersCount,
  onFilterChange,
  onShowAdvancedFilters,
}: MarketplaceFiltersBarProps) {
  return (
    <View style={styles.filtersRow}>
      <TouchableOpacity
        style={[styles.filterIconButton, activeFiltersCount > 0 && styles.filterIconButtonActive]}
        onPress={onShowAdvancedFilters}
        activeOpacity={0.7}
      >
        <Ionicons
          name="options"
          size={18}
          color={activeFiltersCount > 0 ? '#fff' : '#7dd3fc'}
        />
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScrollContent}
        style={styles.chipsScroll}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
            onPress={() => onFilterChange(filter.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filter.icon as any}
              size={14}
              color={activeFilter === filter.key ? '#fff' : '#94a3b8'}
              style={styles.filterChipIcon}
            />
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  chipsScroll: { flex: 1, minWidth: 0 },
  chipsScrollContent: { flexDirection: 'row', gap: 6, paddingRight: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
  },
  filterChipIcon: { marginRight: 4 },
  filterChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    position: 'relative',
  },
  filterIconButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  filterBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
