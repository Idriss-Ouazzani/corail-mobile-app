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

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  const Row = ({
    icon,
    iconColor,
    iconBg,
    label,
    onPress,
    subtitle,
    isDestructive,
    showOpen,
  }: {
    icon: string;
    iconColor: string;
    iconBg: string;
    label: string;
    onPress: () => void;
    subtitle?: string;
    isDestructive?: boolean;
    showOpen?: boolean;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, isDestructive && styles.rowLabelDestructive]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name={showOpen ? 'open-outline' : 'chevron-forward'} size={20} color="#64748b" />
    </TouchableOpacity>
  );

  return (
    <>
      {isAdmin && (
        <Card title="Administration">
          <Row
            icon="shield-checkmark"
            iconColor="#fbbf24"
            iconBg="rgba(251, 191, 36, 0.15)"
            label="Panel Admin"
            onPress={onShowAdminPanel}
          />
        </Card>
      )}

      <Card title="Compte">
        <Row icon="person" iconColor="#0ea5e9" iconBg="rgba(14, 165, 233, 0.15)" label="Informations personnelles" onPress={onShowPersonalInfo} />
        <Row icon="people" iconColor="#0ea5e9" iconBg="rgba(14, 165, 233, 0.15)" label="Mes Groupes" onPress={onShowGroups} />
        <Row icon="mail" iconColor="#f59e0b" iconBg="rgba(245, 158, 11, 0.15)" label="Invitations" onPress={onShowGroupInvitations} />
      </Card>

      <Card title="Préférences">
        <Row icon="notifications-outline" iconColor="#64748b" iconBg="rgba(100, 116, 139, 0.15)" label="Notifications" onPress={onShowNotifications} />
        <Row icon="help-circle-outline" iconColor="#64748b" iconBg="rgba(100, 116, 139, 0.15)" label="Aide & Support" onPress={onShowHelpSupport} />
      </Card>

      <Card title="Nous contacter">
        <Row icon="mail" iconColor="#6366f1" iconBg="rgba(99, 102, 241, 0.15)" label="Email" subtitle="contact@getcorail.com" onPress={() => Linking.openURL('mailto:contact@getcorail.com')} showOpen />
        <Row icon="send" iconColor="#0088cc" iconBg="rgba(0, 136, 204, 0.15)" label="Telegram" subtitle="@corailapp" onPress={() => Linking.openURL('https://t.me/corailapp')} showOpen />
      </Card>

      <Card title="Légal & confidentialité">
        <Row icon="shield-checkmark-outline" iconColor="#64748b" iconBg="rgba(100, 116, 139, 0.15)" label="Confidentialité et données" onPress={onShowPrivacyData} />
        <Row icon="document-text-outline" iconColor="#64748b" iconBg="rgba(100, 116, 139, 0.15)" label="Politique de confidentialité" onPress={onShowPrivacyPolicy} />
        <Row icon="reader-outline" iconColor="#64748b" iconBg="rgba(100, 116, 139, 0.15)" label="Conditions d'utilisation" onPress={onShowTermsOfService} />
        <Row icon="information-circle-outline" iconColor="#64748b" iconBg="rgba(100, 116, 139, 0.15)" label="Mentions légales" onPress={onShowLegalNotice} />
      </Card>

      <View style={styles.card}>
        <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut} activeOpacity={0.7}>
          <View style={styles.signOutIcon}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </View>
          <Text style={styles.signOutLabel}>Déconnexion</Text>
        </TouchableOpacity>
        <View style={styles.userInfoFooter}>
          <Text style={styles.userInfoLabel}>Connecté en tant que</Text>
          <Text style={styles.userInfoEmail}>{userEmail}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  rowLabelDestructive: { color: '#ef4444' },
  rowSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  signOutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  userInfoFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  userInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  userInfoEmail: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
});

