import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CreditsIconProps {
  size?: number;
  showLabel?: boolean;
}

/**
 * Icône élégante des crédits Corail
 * Un "C" dans un cercle avec le gradient orange/rouge de l'app
 */
export default function CreditsIcon({ size = 24, showLabel = false }: CreditsIconProps) {
  const fontSize = size * 0.6;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LinearGradient
        colors={['#FF6B35', '#FF4500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Text style={[styles.letter, { fontSize, lineHeight: size }]}>C</Text>
      </LinearGradient>
      {showLabel && (
        <Text style={styles.label}>Crédits</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
});


