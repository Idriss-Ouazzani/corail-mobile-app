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
  rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
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
  const list = userBadges || [];
  const earnedBadges = list.filter((b) => b.earned_at);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onShowBadges}>
          <Text style={styles.seeAllText}>
            {list.length > 0 ? `Voir plus (${earnedBadges.length}/${list.length})` : 'Voir tout'}
          </Text>
        </TouchableOpacity>
      </View>
      {earnedBadges.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesScroll}
        >
          {earnedBadges.slice(0, 5).map((badge, index) => (
            <BadgeCard key={badge.id || `badge-${index}`} badge={badge} size="small" />
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity style={styles.emptyCta} onPress={onShowBadges} activeOpacity={0.7}>
          <Ionicons name="medal-outline" size={24} color="#64748b" />
          <Text style={styles.emptyCtaText}>Découvrir mes badges</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  seeAllText: {
    fontSize: 13,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  badgesScroll: {
    paddingRight: 4,
    gap: 12,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  emptyCtaText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
});

