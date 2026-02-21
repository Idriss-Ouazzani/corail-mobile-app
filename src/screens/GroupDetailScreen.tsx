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
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const GROUP_HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';

/** Numéro au format international pour WhatsApp (ex: 0612345678 → 33612345678) */
function phoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('33') && digits.length >= 11) return digits;
  if (digits.startsWith('0') && digits.length === 10) return '33' + digits.slice(1);
  if (digits.length >= 9) return '33' + digits.replace(/^0/, '');
  return digits;
}

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
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);

  const currentUserId = user?.id;
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
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  const handleWhatsApp = (member: Member) => {
    if (!member.phone?.trim()) return;
    const num = phoneForWhatsApp(member.phone);
    Linking.openURL(`https://wa.me/${num}`).catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp'));
  };

  const handleCall = (member: Member) => {
    if (!member.phone?.trim()) return;
    const tel = member.phone.replace(/\s/g, '');
    Linking.openURL(`tel:${tel.startsWith('+') ? tel : '+' + tel}`).catch(() => Alert.alert('Erreur', 'Impossible d\'appeler'));
  };

  const renderMemberRow = (member: Member, isAdmin: boolean) => (
    <View key={member.id} style={styles.memberCard}>
      <View style={[styles.memberAvatar, { backgroundColor: (group.color || '#0ea5e9') + '35' }]}>
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
          {isAdmin && (
            <View style={styles.adminBadgeSmall}>
              <Ionicons name="shield-checkmark" size={12} color="#fbbf24" />
            </View>
          )}
        </View>
        <Text style={styles.memberEmail} numberOfLines={1}>{member.email}</Text>
      </View>
      <View style={styles.memberActions}>
        {member.phone?.trim() ? (
          <>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleWhatsApp(member)} activeOpacity={0.7}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleCall(member)} activeOpacity={0.7}>
              <Ionicons name="call" size={20} color="#0ea5e9" />
            </TouchableOpacity>
          </>
        ) : null}
        {currentUserIsAdmin && !member.isCurrentUser && (
          <TouchableOpacity style={styles.actionIcon} onPress={() => handleRemoveMember(member)} activeOpacity={0.7}>
            <Ionicons name="person-remove-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        {currentUserIsAdmin ? (
          <TouchableOpacity style={styles.inviteHeaderButton} onPress={() => setShowInviteModal(true)}>
            <Ionicons name="person-add" size={22} color="#0ea5e9" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0ea5e9" />}
      >
        {/* Hero (même photo que liste Groupes) */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: GROUP_HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={[styles.heroIconWrap, { backgroundColor: (group.color || '#0ea5e9') + '40' }]}>
              <Ionicons name={(group.icon || 'people') as any} size={28} color="#fff" />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>{group.name}</Text>
              <Text style={styles.heroSubtitle} numberOfLines={2}>{group.description || 'Aucune description'}</Text>
              <View style={styles.heroMeta}>
                <Ionicons name="people" size={14} color="#94a3b8" />
                <Text style={styles.heroMetaText}>{members.length} membre{members.length > 1 ? 's' : ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Membres (admins + membres dans une seule liste élégante) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membres du groupe</Text>
          {admins.map((member) => renderMemberRow(member, true))}
          {regularMembers.map((member) => renderMemberRow(member, false))}
        </View>

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowInviteModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Inviter un membre</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color="#f1f5f9" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.inviteModalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.inviteModalScrollContent}
            >
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
                <LinearGradient colors={['#0ea5e9', '#06b6d4']} style={styles.modalButtonGradient}>
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginHorizontal: 12,
  },
  headerRight: {
    width: 40,
  },
  inviteHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.25)',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  heroWrap: {
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#1e293b',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 6,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  youBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.25)',
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
  adminBadgeSmall: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  inviteModalScroll: {
    maxHeight: 340,
  },
  inviteModalScrollContent: {
    paddingBottom: 24,
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
