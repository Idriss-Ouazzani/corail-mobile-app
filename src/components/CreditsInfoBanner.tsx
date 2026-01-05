/**
 * CreditsInfoBanner - Banner d'information sur les crédits (collapsible)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreditsInfoBannerProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreditsInfoBanner({ visible, onClose }: CreditsInfoBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.creditsInfoBanner}>
      <View style={styles.creditsInfoLeft}>
        <View style={styles.creditsInfoIcon}>
          <Text style={styles.creditsInfoIconText}>C</Text>
        </View>
        <Text style={styles.creditsInfoTitle}>Prendre une course = -1 crédit</Text>
      </View>
              <TouchableOpacity onPress={onClose} style={styles.creditsInfoClose}>
                <Ionicons name="close" size={16} color="#94a3b8" />
              </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  creditsInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  creditsInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  creditsInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff6b47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsInfoIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  creditsInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    flex: 1,
  },
  creditsInfoClose: {
    padding: 4,
  },
});

