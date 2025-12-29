/**
 * GlobalCreditsBadge - Badge de crédits global affiché en haut à droite partout dans l'app
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface GlobalCreditsBadgeProps {
  credits: number;
  onPress?: () => void;
}

export default function GlobalCreditsBadge({ credits, onPress }: GlobalCreditsBadgeProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#ff6b47', '#ff8a6d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.label}>C</Text>
        <Text style={styles.value}>{credits}</Text>
        <View style={styles.plusButton}>
          <Ionicons name="add" size={14} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 55,
    right: 20,
    zIndex: 1000,
    borderRadius: 12,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  plusButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});

