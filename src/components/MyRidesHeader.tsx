/**
 * MyRidesHeader - En-tête de l'onglet Mes Courses
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface MyRidesHeaderProps {
  totalCount: number;
  onCreateRide: () => void;
}

export default function MyRidesHeader({ totalCount, onCreateRide }: MyRidesHeaderProps) {
  return (
    <View style={styles.pageHeaderRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitleCompact}>Mes Courses</Text>
        <Text style={styles.pageSubtitle}>
          <Ionicons name="car-sport" size={14} color="#b9e6fe" /> {totalCount} courses
        </Text>
      </View>
      
      {/* Créer une course button */}
      <TouchableOpacity
        style={styles.createButtonCompact}
        onPress={onCreateRide}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.createButtonGradient}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createButtonText}>Créer</Text>
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
    paddingHorizontal: 20,
  },
  pageTitleCompact: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createButtonCompact: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});

