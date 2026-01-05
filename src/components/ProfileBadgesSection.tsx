/**
 * ProfileBadgesSection - Section des badges dans le profil
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeCard } from './BadgeCard';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at?: string;
}

interface ProfileBadgesSectionProps {
  userBadges: Badge[];
  onShowBadges: () => void;
}

export default function ProfileBadgesSection({
  userBadges,
  onShowBadges,
}: ProfileBadgesSectionProps) {
  if (!userBadges || userBadges.length === 0) {
    return null; // Pas d'affichage si pas de badges
  }

  const earnedBadges = userBadges.filter((b) => b.earned_at);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="trophy" size={18} color="#fbbf24" /> Badges
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onShowBadges}>
          <Text style={styles.seeAllText}>Voir plus ({earnedBadges.length}/{userBadges.length})</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesScroll}
      >
        {earnedBadges.slice(0, 5).map((badge, index) => (
          <BadgeCard key={badge.id || `badge-${index}`} badge={badge} size="small" />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  badgesScroll: {
    paddingRight: 20,
    gap: 12,
  },
});

