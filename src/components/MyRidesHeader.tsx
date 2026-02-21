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
      <Text style={styles.pageTitle}>Mes courses</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreateRide}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.createButtonGradient}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
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
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -0.2,
  },
  createButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

