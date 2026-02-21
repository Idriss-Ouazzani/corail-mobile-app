/**
 * MyRidesTabBar - 3 chips compacts pour filtrer Mes courses (À faire / En ligne / Privées)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface MyRidesTabBarProps {
  activeTab: 'claimed' | 'published' | 'personal';
  claimedCount: number;
  publishedCount: number;
  personalCount: number;
  onTabChange: (tab: 'claimed' | 'published' | 'personal') => void;
}

const TABS: { key: 'claimed' | 'published' | 'personal'; label: string }[] = [
  { key: 'claimed', label: 'À faire' },
  { key: 'published', label: 'En ligne' },
  { key: 'personal', label: 'Privées' },
];

export default function MyRidesTabBar({
  activeTab,
  claimedCount,
  publishedCount,
  personalCount,
  onTabChange,
}: MyRidesTabBarProps) {
  const counts = { claimed: claimedCount, published: publishedCount, personal: personalCount };

  return (
    <View style={styles.row}>
      {TABS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.chip, activeTab === key && styles.chipActive]}
          onPress={() => onTabChange(key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipLabel, activeTab === key && styles.chipLabelActive]}>
            {label} {counts[key]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  chipLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

