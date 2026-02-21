/**
 * MarketplaceFiltersBar - Barre de filtres du marketplace
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MarketplaceFiltersBarProps {
  activeFilter: 'all' | 'public' | 'groups';
  activeFiltersCount: number;
  onFilterChange: (filter: 'all' | 'public' | 'groups') => void;
  onShowAdvancedFilters: () => void;
}

export default function MarketplaceFiltersBar({
  activeFilter,
  activeFiltersCount,
  onFilterChange,
  onShowAdvancedFilters,
}: MarketplaceFiltersBarProps) {
  const filters = [
    { key: 'all' as const, label: 'Toutes', icon: 'grid' },
    { key: 'public' as const, label: 'Public', icon: 'globe' },
    { key: 'groups' as const, label: 'Groupes', icon: 'people' },
  ];

  return (
    <View style={styles.filtersRow}>
      {/* Bouton Tri / Filtres en premier (plus visible) */}
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

      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
          onPress={() => onFilterChange(filter.key)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={filter.icon as any} 
            size={15} 
            color={activeFilter === filter.key ? '#fff' : '#94a3b8'} 
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
  },
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

