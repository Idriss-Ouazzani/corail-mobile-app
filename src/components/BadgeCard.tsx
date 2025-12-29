import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  earned_at?: string;
}

interface BadgeCardProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, size = 'medium' }) => {
  const getRarityGradient = (rarity: string): string[] => {
    switch (rarity) {
      case 'LEGENDARY':
        return ['#fbbf24', '#f59e0b', '#d97706'];
      case 'EPIC':
        return ['#a855f7', '#9333ea', '#7c3aed'];
      case 'RARE':
        return ['#0ea5e9', '#0284c7', '#0369a1'];
      case 'COMMON':
      default:
        return ['#64748b', '#475569', '#334155'];
    }
  };

  const getRarityBorder = (rarity: string): string => {
    switch (rarity) {
      case 'LEGENDARY':
        return '#fbbf24';
      case 'EPIC':
        return '#a855f7';
      case 'RARE':
        return '#0ea5e9';
      case 'COMMON':
      default:
        return '#64748b';
    }
  };

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      icon: 24,
      name: styles.badgeNameSmall,
    },
    medium: {
      container: styles.containerMedium,
      icon: 32,
      name: styles.badgeNameMedium,
    },
    large: {
      container: styles.containerLarge,
      icon: 40,
      name: styles.badgeNameLarge,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container]}>
      <LinearGradient
        colors={getRarityGradient(badge.rarity)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { borderColor: getRarityBorder(badge.rarity) },
        ]}
      >
        {/* Rarity shine effect */}
        {(badge.rarity === 'LEGENDARY' || badge.rarity === 'EPIC') && (
          <View style={styles.shineEffect} />
        )}
        
        <View style={styles.iconContainer}>
          <Ionicons name={badge.icon as any} size={currentSize.icon} color="#fff" />
        </View>
        
        {size !== 'small' && (
          <>
            <Text style={currentSize.name} numberOfLines={1}>
              {badge.name}
            </Text>
            {size === 'large' && badge.description && (
              <Text style={styles.badgeDescription} numberOfLines={2}>
                {badge.description}
              </Text>
            )}
          </>
        )}
        
        {/* Rarity indicator */}
        {size !== 'small' && (
          <View style={styles.rarityBadge}>
            <Text style={styles.rarityText}>{badge.rarity}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
    marginBottom: 12,
  },
  containerSmall: {
    width: 70,
    height: 70,
  },
  containerMedium: {
    width: 100,
    height: 120,
  },
  containerLarge: {
    width: 140,
    height: 160,
  },
  gradient: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shineEffect: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    transform: [{ rotate: '45deg' }],
  },
  iconContainer: {
    marginBottom: 8,
  },
  badgeNameSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  badgeNameMedium: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  badgeNameLarge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  badgeDescription: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 8,
  },
  rarityBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});


