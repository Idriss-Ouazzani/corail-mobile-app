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
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
          onPress={() => onFilterChange(filter.key)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={filter.icon as any} 
            size={16} 
            color={activeFilter === filter.key ? '#fff' : '#7dd3fc'} 
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
      
      {/* Advanced Filters Button - Icon Only */}
      <TouchableOpacity
        style={[styles.filterIconButton, activeFiltersCount > 0 && styles.filterIconButtonActive]}
        onPress={onShowAdvancedFilters}
        activeOpacity={0.7}
      >
        <Ionicons
          name="options"
          size={20}
          color={activeFiltersCount > 0 ? '#fff' : '#7dd3fc'}
        />
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>
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
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7dd3fc',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  filterIconButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff6b47',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

