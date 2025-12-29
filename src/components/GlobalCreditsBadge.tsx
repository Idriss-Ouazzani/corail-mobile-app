/**
 * GlobalCreditsBadge - Badge de crédits global affiché en haut à droite partout dans l'app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlobalCreditsBadgeProps {
  credits: number;
}

export default function GlobalCreditsBadge({ credits }: GlobalCreditsBadgeProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ff6b47', '#ff8a6d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.label}>C</Text>
        <Text style={styles.value}>{credits}</Text>
      </LinearGradient>
    </View>
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
});

