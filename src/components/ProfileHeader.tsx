/**
 * ProfileHeader - En-tête du profil avec avatar, nom, email et stats
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  displayName: string;
  displayEmail: string;
  initials: string;
  photoUrl?: string;
  userCredits: number;
  badgesCount: number;
  completedRidesCount: number;
}

export default function ProfileHeader({
  displayName,
  displayEmail,
  initials,
  photoUrl,
  userCredits,
  badgesCount,
  completedRidesCount,
}: ProfileHeaderProps) {
  return (
    <View style={styles.profileHeader}>
      {photoUrl ? (
        <Image 
          source={{ uri: photoUrl }} 
          style={styles.profilePhoto}
        />
      ) : (
        <LinearGradient colors={['#ff6b47', '#ff8a6d']} style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initials}</Text>
        </LinearGradient>
      )}
      <View style={styles.profileBadge}>
        <Ionicons name="sparkles" size={10} color="#000" style={{ marginRight: 4 }} />
        <Text style={styles.profileBadgeText}>Gratuit</Text>
      </View>
      <Text style={styles.profileName}>{displayName}</Text>
      <Text style={styles.profileEmail}>{displayEmail}</Text>

      {/* Stats */}
      <View style={styles.profileStats}>
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatValue}>{userCredits}</Text>
          <Text style={styles.profileStatLabel}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff6b47', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
              <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>C</Text>
            </View> Crédits
          </Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatValue}>{badgesCount}</Text>
          <Text style={styles.profileStatLabel}>
            <Ionicons name="trophy" size={12} color="#fbbf24" /> Badges
          </Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatValue}>{completedRidesCount}</Text>
          <Text style={styles.profileStatLabel}>
            <Ionicons name="car-sport" size={12} color="#0ea5e9" /> Courses
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.3)',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ff6b47',
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  profileStatItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Permet au flex de shrink correctement
  },
  profileStatValue: {
    fontSize: 22, // Réduit légèrement pour les grands nombres
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 11, // Réduit légèrement pour éviter le wrap
    color: '#94a3b8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap', // Empêche le retour à la ligne
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
});

