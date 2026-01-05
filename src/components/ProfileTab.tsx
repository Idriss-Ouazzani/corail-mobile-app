/**
 * ProfileTab - Onglet Profil complet
 * Assemble tous les sous-composants du profil
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ProfileHeader from './ProfileHeader';
import ProfileGroupsSection from './ProfileGroupsSection';
import ProfileBadgesSection from './ProfileBadgesSection';
import ProfileMenuList from './ProfileMenuList';
import BetaContactBanner from './BetaContactBanner';

interface User {
  uid: string;
  email?: string;
  displayName?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at?: string;
}

interface Group {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  memberCount?: number;
}

interface Ride {
  id: string;
  picker_id?: string;
  status: string;
  [key: string]: any;
}

interface ProfileTabProps {
  user: User | null;
  userFullName: string;
  userPhotoUrl?: string;
  userCredits: number;
  userBadges: Badge[];
  userGroups: Group[];
  rides: Ride[];
  personalRides?: any[];
  isAdmin: boolean;
  formatName: (name: string) => string;
  onShowPersonalInfo: () => void;
  onShowNotifications: () => void;
  onShowHelpSupport: () => void;
  onShowBadges: () => void;
  onShowGroups: () => void;
  onShowGroupInvitations: () => void;
  onShowAdminPanel: () => void;
  onShowPrivacyPolicy: () => void;
  onShowTermsOfService: () => void;
  onShowLegalNotice: () => void;
  onShowPrivacyData: () => void;
  onSelectGroup: (group: Group) => void;
  onSignOut: () => Promise<void>;
}

export default function ProfileTab({
  user,
  userFullName,
  userPhotoUrl,
  userCredits,
  userBadges,
  userGroups,
  rides,
  personalRides = [],
  isAdmin,
  formatName,
  onShowPersonalInfo,
  onShowNotifications,
  onShowHelpSupport,
  onShowBadges,
  onShowGroups,
  onShowGroupInvitations,
  onShowAdminPanel,
  onShowPrivacyPolicy,
  onShowTermsOfService,
  onShowLegalNotice,
  onShowPrivacyData,
  onSelectGroup,
  onSignOut,
}: ProfileTabProps) {
  // Générer les initiales depuis le nom réel
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = formatName(userFullName) || user?.email?.split('@')[0] || 'Utilisateur';
  const displayEmail = user?.email || 'email@example.com';
  const initials = getInitials(userFullName || displayName);

  // Stats
  const badgesCount = userBadges?.length || 0;
  
  // Compter toutes les courses terminées (marketplace + personnelles)
  // Marketplace : compter les courses créées OU prises par l'utilisateur et complétées
  const marketplaceCompleted = (rides || []).filter(
    r => (r.picker_id === user?.uid || r.creator_id === user?.uid) && r.status === 'COMPLETED'
  ).length;
  
  // Personnelles : compter les courses complétées
  const personalCompleted = (personalRides || []).filter(
    r => r.status === 'COMPLETED'
  ).length;
  
  const completedRidesCount = marketplaceCompleted + personalCompleted;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <ProfileHeader
        displayName={displayName}
        displayEmail={displayEmail}
        initials={initials}
        photoUrl={userPhotoUrl}
        userCredits={userCredits}
        badgesCount={badgesCount}
        completedRidesCount={completedRidesCount}
      />

      {/* Bannière Contact Beta - Visible et accessible */}
      <BetaContactBanner />

      <ProfileGroupsSection
        userGroups={userGroups || []}
        onShowGroups={onShowGroups}
        onSelectGroup={(group) => {
          onSelectGroup(group);
          onShowGroups();
        }}
      />

      <ProfileBadgesSection
        userBadges={userBadges || []}
        onShowBadges={onShowBadges}
      />

      <ProfileMenuList
        isAdmin={isAdmin}
        userEmail={displayEmail}
        onShowAdminPanel={onShowAdminPanel}
        onShowPersonalInfo={onShowPersonalInfo}
        onShowGroups={onShowGroups}
        onShowGroupInvitations={onShowGroupInvitations}
        onShowNotifications={onShowNotifications}
        onShowHelpSupport={onShowHelpSupport}
        onShowPrivacyPolicy={onShowPrivacyPolicy}
        onShowTermsOfService={onShowTermsOfService}
        onShowLegalNotice={onShowLegalNotice}
        onShowPrivacyData={onShowPrivacyData}
        onSignOut={onSignOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
});
