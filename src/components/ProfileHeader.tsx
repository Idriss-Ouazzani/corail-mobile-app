/**
 * ProfileHeader - En-tête du profil avec avatar, nom, email et stats
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
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
  onChangePhoto?: () => void;
}

export default function ProfileHeader({
  displayName,
  displayEmail,
  initials,
  photoUrl,
  userCredits,
  badgesCount,
  completedRidesCount,
  onChangePhoto,
}: ProfileHeaderProps) {
  return (
    <View style={styles.profileHeader}>
      <TouchableOpacity onPress={onChangePhoto} activeOpacity={0.8}>
        <View style={styles.avatarContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
          ) : (
            <LinearGradient colors={['#0ea5e9', '#06b6d4']} style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{initials}</Text>
            </LinearGradient>
          )}
          <View style={styles.editPhotoIcon}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
      <Text style={styles.profileName}>{displayName}</Text>
      <Text style={styles.profileEmail}>{displayEmail}</Text>

      {/* Stats — style accueil (todayRow) */}
      <View style={styles.profileStats}>
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatValue}>{userCredits}</Text>
          <Text style={styles.profileStatLabel}>Crédits</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatValue}>{badgesCount}</Text>
          <Text style={styles.profileStatLabel}>Badges</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStatItem}>
          <Text style={styles.profileStatValue}>{completedRidesCount}</Text>
          <Text style={styles.profileStatLabel}>Courses</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  editPhotoIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0ea5e9',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#334155',
  },
  profileAvatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
});

