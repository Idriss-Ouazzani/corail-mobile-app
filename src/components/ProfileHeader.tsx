/**
 * ProfileHeader - En-tête du profil avec avatar, nom, email et stats
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  displayName: string;
  displayEmail: string;
  initials: string;
  photoUrl?: string;
  badgesCount: number;
  completedRidesCount: number;
  isDriverVerified?: boolean;
  onChangePhoto?: () => void;
}

export default function ProfileHeader({
  displayName,
  displayEmail,
  initials,
  photoUrl,
  badgesCount,
  completedRidesCount,
  isDriverVerified = false,
  onChangePhoto,
}: ProfileHeaderProps) {
  const [showVerifiedLabel, setShowVerifiedLabel] = useState(false);

  useEffect(() => {
    if (!showVerifiedLabel) return;
    const t = setTimeout(() => setShowVerifiedLabel(false), 2000);
    return () => clearTimeout(t);
  }, [showVerifiedLabel]);

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
      <View style={styles.nameRow}>
        <Text style={styles.profileName}>{displayName}</Text>
        {isDriverVerified && (
          <>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setShowVerifiedLabel(true)}
              style={styles.verifiedBadge}
              activeOpacity={0.8}
              accessibilityLabel="Profil vérifié"
            >
              <Ionicons name="checkmark" size={12} color="#fff" />
            </TouchableOpacity>
            {showVerifiedLabel && (
              <View style={styles.verifiedLabel}>
                <Text style={styles.verifiedLabelText}>Profil vérifié</Text>
              </View>
            )}
          </>
        )}
      </View>
      <Text style={styles.profileEmail}>{displayEmail}</Text>

      {/* Stats — Badges et Courses (crédits affichés uniquement dans Marketplace) */}
      <View style={styles.profileStats}>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1d9bf0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedLabel: {
    backgroundColor: 'rgba(29, 155, 240, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  verifiedLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7dd3fc',
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

