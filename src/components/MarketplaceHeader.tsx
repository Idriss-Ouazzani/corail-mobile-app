/**
 * MarketplaceHeader - En-tête du marketplace avec titre et bouton publier
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface MarketplaceHeaderProps {
  ridesCount: number;
  onCreateRide: () => void;
}

export default function MarketplaceHeader({ ridesCount, onCreateRide }: MarketplaceHeaderProps) {
  return (
    <View style={styles.pageHeaderRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitleCompact}>Market</Text>
        <Text style={styles.pageSubtitle}>
          <Ionicons name="car-sport" size={14} color="#b9e6fe" /> {ridesCount} courses
        </Text>
      </View>
      
      {/* Publier button */}
      <TouchableOpacity
        style={styles.createButtonCompact}
        onPress={onCreateRide}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.createButtonGradient}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createButtonText}>Publier</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageTitleCompact: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  createButtonCompact: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

