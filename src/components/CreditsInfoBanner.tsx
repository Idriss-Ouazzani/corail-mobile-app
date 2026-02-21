/**
 * CreditsInfoBanner - Info crédits en chip minimal (pour partager la ligne avec le rayon)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreditsInfoBannerProps {
  visible: boolean;
  onClose: () => void;
  /** Inline dans la ligne meta (pas de marge, plus petit) */
  compact?: boolean;
}

export default function CreditsInfoBanner({ visible, onClose, compact }: CreditsInfoBannerProps) {
  if (!visible) return null;

  return (
    <View style={[styles.banner, compact && styles.bannerCompact]}>
      <Ionicons name="diamond-outline" size={12} color="#94a3b8" />
      <Text style={styles.text}>1 cr./course</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={styles.close}>
        <Ionicons name="close" size={12} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bannerCompact: {
    marginBottom: 0,
  },
  text: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  close: {
    padding: 2,
  },
});

