import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { firebaseAuth } from '../services/firebase';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isAdmin: boolean;
  isCurrentUser: boolean;
  joined_at: string;
}

interface PendingInvitation {
  id: string;
  invitee_email: string | null;
  invitee_phone: string | null;
  inviter_name: string;
  created_at: string;
}

interface GroupDetailScreenProps {
  group: {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
  };
  onBack: () => void;
}

export const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({ group, onBack }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);

  const currentUserId = firebaseAuth.currentUser?.uid;
  const currentUserMember = members.find(m => m.isCurrentUser);
  const currentUserIsAdmin = currentUserMember?.isAdmin || false;
  const admins = members.filter(m => m.isAdmin);
  const regularMembers = members.filter(m => !m.isAdmin);

  useEffect(() => {
    loadMembers();
    loadPendingInvitations();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des membres du groupe:', group.id);
      const membersData = await apiClient.getGroupMembers(group.id);
      console.log('👥 Membres reçus:', membersData);
      setMembers(membersData);
    } catch (error: any) {
      console.error('❌ Erreur chargement membres:', error);
      Alert.alert('Erreur', 'Impossible de charger les membres: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      console.log('🔄 Chargement des invitations en attente:', group.id);
      const invitationsData = await apiClient.getGroupPendingInvitations(group.id);
      console.log('📨 Invitations reçues:', invitationsData);
      setPendingInvitations(invitationsData);
    } catch (error: any) {
      console.error('❌ Erreur chargement invitations:', error);
      // Don't alert, just log silently
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMembers(), loadPendingInvitations()]);
    setRefreshing(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail && !invitePhone) {
      Alert.alert('Erreur', 'Veuillez entrer un email ou un numéro de téléphone');
      return;
    }

    try {
      setInviting(true);
      const invitation = await apiClient.inviteToGroup({
        groupId: group.id,
        email: inviteEmail || undefined,
        phone: invitePhone || undefined,
      });
      
      // 🔔 Envoyer notification push si l'invité est déjà inscrit
      if (invitation.invitee_id && invitation.group_name && invitation.inviter_name) {
        const NotificationService = await import('../services/notifications');
        await NotificationService.notifyGroupInvitation(
          invitation.invitee_id,
          invitation.group_name,
          invitation.inviter_name
        );
      }
      
      Alert.alert('Succès', 'Invitation envoyée !');
      setShowInviteModal(false);
      setInviteEmail('');
      setInvitePhone('');
    } catch (error: any) {
      console.error('❌ Erreur invitation:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Quitter le groupe',
      'Êtes-vous sûr de vouloir quitter ce groupe ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.leaveGroup(group.id);
              Alert.alert('Succès', 'Vous avez quitté le groupe');
              onBack();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member: Member) => {
    if (member.id === currentUserId) return;

    Alert.alert(
      'Retirer du groupe',
      `Retirer ${member.name} du groupe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.removeMemberFromGroup(group.id, member.id);
              Alert.alert('Succès', 'Membre retiré du groupe');
              await loadMembers();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleCancelInvitation = (invitationId: string) => {
    Alert.alert(
      'Annuler l\'invitation',
      'Êtes-vous sûr de vouloir annuler cette invitation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.cancelGroupInvitation(invitationId);
              Alert.alert('Succès', 'Invitation annulée');
              await loadPendingInvitations();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{group.name}</Text>
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
        <Text style={styles.headerTitle}>{group.name}</Text>
        {currentUserIsAdmin && (
          <TouchableOpacity
            style={styles.inviteHeaderButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="person-add" size={22} color="#ff6b47" />
          </TouchableOpacity>
        )}
        {!currentUserIsAdmin && <View style={{ width: 40 }} />}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Group Info */}
        <View style={styles.groupInfoCard}>
          <LinearGradient
            colors={[`${group.color || '#0ea5e9'}20`, `${group.color || '#0ea5e9'}05`]}
            style={styles.groupInfoGradient}
          >
            <View style={[styles.groupInfoIcon, { backgroundColor: `${group.color || '#0ea5e9'}30` }]}>
              <Ionicons name={(group.icon || 'people') as any} size={40} color={group.color || '#0ea5e9'} />
            </View>
            <View style={styles.groupInfoContent}>
              <Text style={styles.groupInfoName}>{group.name}</Text>
              <Text style={styles.groupInfoDesc}>{group.description || 'Aucune description'}</Text>
              <View style={styles.groupInfoMeta}>
                <Ionicons name="people" size={16} color="#94a3b8" />
                <Text style={styles.groupInfoMetaText}>{members.length} membre{members.length > 1 ? 's' : ''}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Admins */}
        {admins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="shield-checkmark" size={18} color="#fbbf24" /> Administrateurs ({admins.length})
            </Text>
            {admins.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.isCurrentUser && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>Vous</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#fbbf24" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Members */}
        {regularMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="people" size={18} color="#0ea5e9" /> Membres ({regularMembers.length})
            </Text>
            {regularMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.isCurrentUser && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>Vous</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                {currentUserIsAdmin && !member.isCurrentUser && (
                  <TouchableOpacity
                    style={styles.removeMemberButton}
                    onPress={() => handleRemoveMember(member)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Pending Invitations */}
        {currentUserIsAdmin && pendingInvitations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="mail-outline" size={18} color="#f59e0b" /> Invitations en attente ({pendingInvitations.length})
            </Text>
            {pendingInvitations.map((invitation) => (
              <View key={invitation.id} style={styles.invitationCard}>
                <View style={styles.invitationIcon}>
                  <Ionicons name="mail" size={20} color="#f59e0b" />
                </View>
                <View style={styles.invitationInfo}>
                  <Text style={styles.invitationContact}>
                    {invitation.invitee_email || invitation.invitee_phone || 'Contact inconnu'}
                  </Text>
                  <Text style={styles.invitationMeta}>
                    Invité par {invitation.inviter_name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelInvitationButton}
                  onPress={() => handleCancelInvitation(invitation.id)}
                >
                  <Ionicons name="close-circle" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Leave Group Button */}
        {!currentUserIsAdmin && (
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
            <Ionicons name="exit-outline" size={20} color="#ef4444" />
            <Text style={styles.leaveButtonText}>Quitter le groupe</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Inviter un membre</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color="#f1f5f9" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Email</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="email@exemple.com"
              placeholderTextColor="#64748b"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>Ou téléphone</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+33 6 12 34 56 78"
              placeholderTextColor="#64748b"
              value={invitePhone}
              onChangeText={setInvitePhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleInvite}
              disabled={inviting}
            >
              <LinearGradient colors={['#ff6b47', '#f97316']} style={styles.modalButtonGradient}>
                {inviting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Envoyer l'invitation</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  inviteHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 16,
  },
  groupInfoCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  groupInfoGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupInfoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupInfoContent: {
    flex: 1,
  },
  groupInfoName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  groupInfoDesc: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  groupInfoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupInfoMetaText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  youBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  youBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  memberEmail: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  adminBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMemberButton: {
    padding: 4,
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  invitationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationContact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  invitationMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  cancelInvitationButton: {
    padding: 4,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 8,
    marginBottom: 32,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    marginBottom: 16,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default GroupDetailScreen;
