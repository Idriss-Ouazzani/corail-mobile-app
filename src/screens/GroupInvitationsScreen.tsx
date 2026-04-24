/**
 * GroupInvitationsScreen - Voir et gérer les invitations reçues
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';

interface Invitation {
  id: string;
  group: {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
  };
  inviter: {
    full_name: string;
  };
  created_at: string;
}

interface GroupInvitationsScreenProps {
  onBack: () => void;
}

export const GroupInvitationsScreen: React.FC<GroupInvitationsScreenProps> = ({ onBack }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des invitations...');
      const invitationsData = await apiClient.getMyGroupInvitations();
      console.log('📨 Invitations reçues:', invitationsData);
      setInvitations(invitationsData);
    } catch (error: any) {
      console.error('❌ Erreur chargement invitations:', error);
      Alert.alert('Erreur', 'Impossible de charger les invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInvitations();
    setRefreshing(false);
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
    try {
      setResponding(invitationId);
      await apiClient.respondToInvitation(invitationId, accept);
      
      Alert.alert(
        'Succès',
        accept ? 'Vous avez rejoint le groupe !' : 'Invitation refusée'
      );
      
      // Recharger les invitations
      await loadInvitations();
    } catch (error: any) {
      console.error('❌ Erreur réponse invitation:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invitations</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b47" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitations</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{invitations.length}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.heroWrap}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            {invitations.length > 0 && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{invitations.length} invitation{invitations.length > 1 ? 's' : ''}</Text>
              </View>
            )}
            <Text style={styles.heroTitle}>Invitations</Text>
            <Text style={styles.heroSubtitle}>
              {invitations.length > 0
                ? 'Rejoignez les groupes qui vous invitent'
                : 'Les invitations à des groupes apparaîtront ici'}
            </Text>
          </View>
        </View>

        {invitations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="mail-open-outline" size={48} color="#64748b" />
            </View>
            <Text style={styles.emptyStateTitle}>Aucune invitation</Text>
            <Text style={styles.emptyStateText}>
              Vous n'avez pas d'invitations en attente
            </Text>
          </View>
        ) : (
          invitations.map((invitation) => (
            <View key={invitation.id} style={styles.invitationCard}>
              {/* Group Info */}
              <View style={styles.invitationHeader}>
                <View
                  style={[
                    styles.groupIcon,
                    { backgroundColor: `${invitation.group.color || '#0ea5e9'}30` },
                  ]}
                >
                  <Ionicons
                    name={(invitation.group.icon || 'people') as any}
                    size={24}
                    color={invitation.group.color || '#0ea5e9'}
                  />
                </View>
                <View style={styles.invitationInfo}>
                  <Text style={styles.groupName}>{invitation.group.name}</Text>
                  <Text style={styles.inviterText}>
                    Invité par <Text style={styles.inviterName}>{invitation.inviter.full_name}</Text>
                  </Text>
                  <Text style={styles.dateText}>{formatDate(invitation.created_at)}</Text>
                </View>
              </View>

              {/* Description */}
              {invitation.group.description && (
                <Text style={styles.groupDescription}>{invitation.group.description}</Text>
              )}

              {/* Actions */}
              <View style={styles.invitationActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRespond(invitation.id, false)}
                  disabled={responding === invitation.id}
                >
                  {responding === invitation.id ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <>
                      <Ionicons name="close" size={20} color="#ef4444" />
                      <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                        Refuser
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleRespond(invitation.id, true)}
                  disabled={responding === invitation.id}
                >
                  {responding === invitation.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={styles.acceptButtonGradient}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Accepter</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6b47',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  heroWrap: {
    height: 160,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 71, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1f5f9',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  invitationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  invitationHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  inviterText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  inviterName: {
    fontWeight: '600',
    color: '#cbd5e1',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  groupDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 16,
    lineHeight: 20,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rejectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  rejectButtonText: {
    color: '#ef4444',
  },
  acceptButton: {
    flex: 1,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
});

export default GroupInvitationsScreen;

