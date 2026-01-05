/**
 * ProfileMenuList - Liste des options du menu profil
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileMenuListProps {
  isAdmin: boolean;
  userEmail: string;
  onShowAdminPanel: () => void;
  onShowPersonalInfo: () => void;
  onShowGroups: () => void;
  onShowGroupInvitations: () => void;
  onShowNotifications: () => void;
  onShowHelpSupport: () => void;
  onShowPrivacyPolicy: () => void;
  onShowTermsOfService: () => void;
  onShowLegalNotice: () => void;
  onShowPrivacyData: () => void;
  onSignOut: () => Promise<void>;
}

export default function ProfileMenuList({
  isAdmin,
  userEmail,
  onShowAdminPanel,
  onShowPersonalInfo,
  onShowGroups,
  onShowGroupInvitations,
  onShowNotifications,
  onShowHelpSupport,
  onShowPrivacyPolicy,
  onShowTermsOfService,
  onShowLegalNotice,
  onShowPrivacyData,
  onSignOut,
}: ProfileMenuListProps) {
  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await onSignOut();
              Alert.alert('Déconnecté', 'Vous avez été déconnecté avec succès');
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      {/* 👨‍💼 Section Admin */}
      {isAdmin && (
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="shield-checkmark" size={20} color="#fbbf24" /> Administration
            </Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.menuItem, styles.adminMenuItem]}
            onPress={onShowAdminPanel}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#fbbf24" />
            </View>
            <Text style={styles.menuTitle}>Panel Admin</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(251, 191, 36, 0.5)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Compte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <TouchableOpacity style={styles.menuItem} onPress={onShowPersonalInfo} activeOpacity={0.7}>
          <View style={styles.menuIconWrapper}>
            <Ionicons name="person" size={20} color="#ff6b47" />
          </View>
          <Text style={styles.menuTitle}>Informations personnelles</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onShowGroups} activeOpacity={0.7}>
          <View style={styles.menuIconWrapper}>
            <Ionicons name="people" size={20} color="#ff6b47" />
          </View>
          <Text style={styles.menuTitle}>Mes Groupes</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onShowGroupInvitations} activeOpacity={0.7}>
          <View style={styles.menuIconWrapper}>
            <Ionicons name="mail" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.menuTitle}>Invitations</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>
      </View>

      {/* Préférences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <TouchableOpacity style={styles.menuItem} onPress={onShowNotifications} activeOpacity={0.7}>
          <View style={styles.menuIconWrapper}>
            <Ionicons name="notifications" size={20} color="#ff6b47" />
          </View>
          <Text style={styles.menuTitle}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onShowHelpSupport} activeOpacity={0.7}>
          <View style={styles.menuIconWrapper}>
            <Ionicons name="help-circle" size={20} color="#ff6b47" />
          </View>
          <Text style={styles.menuTitle}>Aide & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>
      </View>

      {/* Contact Beta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Nous Contacter (Beta)</Text>
        
        {/* Email */}
        <TouchableOpacity 
          style={[styles.menuItem, styles.contactItem]}
          onPress={() => Linking.openURL('mailto:corail.platform@gmail.com')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(79, 70, 229, 0.1)' }]}>
            <Ionicons name="mail" size={20} color="#4f46e5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Email</Text>
            <Text style={styles.contactSubtitle}>corail.platform@gmail.com</Text>
          </View>
          <Ionicons name="open-outline" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        {/* Telegram */}
        <TouchableOpacity 
          style={[styles.menuItem, styles.contactItem, styles.telegramItem]}
          onPress={() => Linking.openURL('https://t.me/corailapp')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, styles.telegramIconWrapper]}>
            <Ionicons name="send" size={20} color="#0088cc" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Telegram</Text>
            <Text style={styles.contactSubtitle}>@corailapp</Text>
          </View>
          <Ionicons name="open-outline" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>
      </View>

      {/* Légal & Confidentialité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Légal & Confidentialité</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={onShowPrivacyData} activeOpacity={0.7}>
          <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#6366f1" />
          </View>
          <Text style={styles.menuTitle}>Confidentialité et données</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onShowPrivacyPolicy} activeOpacity={0.7}>
          <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="document-text" size={20} color="#6366f1" />
          </View>
          <Text style={styles.menuTitle}>Politique de confidentialité</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onShowTermsOfService} activeOpacity={0.7}>
          <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="reader" size={20} color="#6366f1" />
          </View>
          <Text style={styles.menuTitle}>Conditions d'utilisation</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onShowLegalNotice} activeOpacity={0.7}>
          <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="information-circle" size={20} color="#6366f1" />
          </View>
          <Text style={styles.menuTitle}>Mentions légales</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>
      </View>

      {/* Déconnexion */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.menuItem, styles.signOutItem]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="log-out" size={20} color="#ef4444" />
          </View>
          <Text style={[styles.menuTitle, { color: '#ef4444' }]}>Déconnexion</Text>
        </TouchableOpacity>

        {/* User info */}
        <View style={styles.userInfoFooter}>
          <Text style={styles.userInfoLabel}>Connecté en tant que</Text>
          <Text style={styles.userInfoEmail}>{userEmail}</Text>
        </View>
      </View>
    </>
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminMenuItem: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  signOutItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  userInfoFooter: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  userInfoLabel: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  userInfoEmail: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  contactItem: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  telegramItem: {
    backgroundColor: 'rgba(0, 136, 204, 0.05)',
    borderColor: 'rgba(0, 136, 204, 0.2)',
  },
  telegramIconWrapper: {
    backgroundColor: 'rgba(0, 136, 204, 0.1)',
  },
});

