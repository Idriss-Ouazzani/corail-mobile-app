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
        <Text style={styles.pageTitle}>Annonces</Text>
        <Text style={styles.pageSubtitleDiscreet}>Réseau public Corail</Text>
        <Text style={styles.pageSubtitle}>
          {ridesCount} course{ridesCount !== 1 ? 's' : ''} disponible{ridesCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreateRide}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createButtonGradient}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
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
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -0.2,
  },
  pageSubtitleDiscreet: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    opacity: 0.85,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  createButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

