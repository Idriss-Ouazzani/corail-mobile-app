import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BadgeCard } from '../components/BadgeCard';
import { apiClient } from '../services/api';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  category: string;
  requirement_description?: string;
}

interface UserBadge extends Badge {
  earned_at?: string;
  progress?: number;
}

interface BadgesScreenProps {
  onBack: () => void;
  currentUserId: string;
}

export const BadgesScreen: React.FC<BadgesScreenProps> = ({ onBack, currentUserId }) => {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  // Charger les données
  const loadBadges = async () => {
    try {
      const [allBadgesData, userBadgesData] = await Promise.all([
        apiClient.getAllBadges(),
        apiClient.getUserBadges(currentUserId),
      ]);

      setAllBadges(allBadgesData);
      
      // Fusionner les données pour créer la liste complète avec statut
      const earnedIds = new Set(userBadgesData.map((ub: any) => ub.badge_id));
      const mergedBadges = allBadgesData.map((badge: Badge) => {
        const userBadge = userBadgesData.find((ub: any) => ub.badge_id === badge.id);
        return {
          ...badge,
          earned_at: userBadge?.earned_at,
          progress: userBadge?.progress,
        };
      });

      setUserBadges(mergedBadges);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, [currentUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBadges();
  };

  // Filtrer les badges
  const filteredBadges = userBadges.filter((badge) => {
    if (filter === 'earned') return !!badge.earned_at;
    if (filter === 'locked') return !badge.earned_at;
    return true;
  });

  // Stats
  const earnedCount = userBadges.filter((b) => b.earned_at).length;
  const totalCount = userBadges.length;
  const completionPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Grouper par rareté
  const groupedBadges = {
    LEGENDARY: filteredBadges.filter((b) => b.rarity === 'LEGENDARY'),
    EPIC: filteredBadges.filter((b) => b.rarity === 'EPIC'),
    RARE: filteredBadges.filter((b) => b.rarity === 'RARE'),
    COMMON: filteredBadges.filter((b) => b.rarity === 'COMMON'),
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return '#fbbf24';
      case 'EPIC': return '#a855f7';
      case 'RARE': return '#0ea5e9';
      case 'COMMON': return '#64748b';
      default: return '#64748b';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY': return 'Légendaire';
      case 'EPIC': return 'Épique';
      case 'RARE': return 'Rare';
      case 'COMMON': return 'Commun';
      default: return rarity;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff6b47" />
        <Text style={styles.loadingText}>Chargement des badges...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Badges</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b47" />}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={['#ff6b47', '#ff8a6d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.progressGradient}
          >
            <Ionicons name="trophy" size={32} color="#fff" />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Collection</Text>
              <Text style={styles.progressStats}>
                {earnedCount} / {totalCount} badges
              </Text>
            </View>
            <View style={styles.progressPercentage}>
              <Text style={styles.progressPercentageText}>{completionPercentage}%</Text>
            </View>
          </LinearGradient>
          <View style={styles.progressBar}>
            <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          {[
            { key: 'all', label: 'Tous', icon: 'grid' },
            { key: 'earned', label: 'Obtenus', icon: 'checkmark-circle' },
            { key: 'locked', label: 'Verrouillés', icon: 'lock-closed' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={f.icon as any}
                size={16}
                color={filter === f.key ? '#fff' : '#94a3b8'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Badges by Rarity */}
        {Object.entries(groupedBadges).map(([rarity, badges]) => {
          if (badges.length === 0) return null;
          
          return (
            <View key={rarity} style={styles.raritySection}>
              <View style={styles.raritySectionHeader}>
                <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(rarity) + '20' }]}>
                  <Text style={[styles.rarityText, { color: getRarityColor(rarity) }]}>
                    {getRarityLabel(rarity)}
                  </Text>
                </View>
                <Text style={styles.rarityCount}>{badges.length}</Text>
              </View>
              <View style={styles.badgesGrid}>
                {badges.map((badge) => (
                  <View key={badge.id} style={styles.badgeItem}>
                    <View style={styles.badgeCardWrapper}>
                      <BadgeCard badge={badge} size="small" />
                    </View>
                    {!badge.earned_at && (
                      <View style={styles.lockedOverlay}>
                        <Ionicons name="lock-closed" size={20} color="#94a3b8" />
                      </View>
                    )}
                    {badge.requirement_description && !badge.earned_at && (
                      <Text style={styles.badgeRequirement} numberOfLines={2}>
                        {badge.requirement_description}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {filteredBadges.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="medal-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>Aucun badge</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'earned' && 'Accomplissez des défis pour gagner des badges'}
              {filter === 'locked' && 'Vous avez débloqué tous les badges !'}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#94a3b8',
  },
  progressCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.3)',
  },
  progressGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  progressInfo: {
    flex: 1,
    marginLeft: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  progressStats: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  progressPercentage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentageText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#fff',
  },
  raritySection: {
    marginBottom: 32,
  },
  raritySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rarityCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '31%',
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
  },
  badgeCardWrapper: {
    marginRight: 0,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRequirement: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 6,
    width: '100%',
    textAlign: 'center',
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 250,
  },
});

export default BadgesScreen;

