import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatPhoneInput, formatPhoneDisplay, toFrenchNational10 } from '../utils/phoneFormat';
import { WEB_APP_BASE_URL, CORAIL_IOS_APP_STORE_URL } from '../constants/urls';
import type { GroupInvitePreviewResult } from '../services/supabaseApi';

const GROUP_HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';

/** Numéro au format international pour WhatsApp (ex: 0612345678 → 33612345678) */
function phoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('33') && digits.length >= 11) return digits;
  if (digits.startsWith('0') && digits.length === 10) return '33' + digits.slice(1);
  if (digits.length >= 9) return '33' + digits.replace(/^0/, '');
  return digits;
}

function looksLikeValidEmail(s: string): boolean {
  const t = s.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function national10ToSmsAddress(digits10: string): string {
  const d = digits10.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) return `+33${d.slice(1)}`;
  return `+${d}`;
}

/** 06… / 6… / +33… saisis dans le champ → 10 chiffres nationaux 0XXXXXXXXX, ou null si incomplet. */
function frenchMobileNational10FromField(display: string): string | null {
  const digits = display.replace(/\D/g, '');
  if (!digits) return null;
  return toFrenchNational10(digits);
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
  /** Prénom / nom Corail si compte trouvé (invitee_id ou résolution email / téléphone). */
  invitee_display_name: string | null;
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
  /** Inviter soit par e-mail soit par téléphone (un seul champ affiché). */
  const [inviteContactMode, setInviteContactMode] = useState<'email' | 'phone'>('email');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invitePreview, setInvitePreview] = useState<GroupInvitePreviewResult | null>(null);
  const [invitePreviewLoading, setInvitePreviewLoading] = useState(false);
  const [invitePreviewError, setInvitePreviewError] = useState(false);
  const [invitingExternal, setInvitingExternal] = useState(false);
  /** Carte iOS / Android en cours d’enregistrement (spinner ciblé). */
  const [externalInviteSavingFor, setExternalInviteSavingFor] = useState<'ios' | 'android' | null>(null);
  /** Feuille de partage (WhatsApp / SMS / Mail) après choix iOS ou Android. */
  const [externalShareTarget, setExternalShareTarget] = useState<'ios' | 'android' | null>(null);
  /** Après un premier enregistrement réussi (hors Corail), on ne refait pas insert — seulement le partage. */
  const externalInviteSavedRef = useRef(false);

  const currentUserId = user?.id;
  const currentUserMember = members.find(m => m.isCurrentUser);
  const currentUserIsAdmin = currentUserMember?.isAdmin || false;
  const admins = members.filter(m => m.isAdmin);
  const regularMembers = members.filter(m => !m.isAdmin);

  useEffect(() => {
    loadMembers();
    loadPendingInvitations();
  }, []);

  useEffect(() => {
    externalInviteSavedRef.current = false;
    setExternalShareTarget(null);
    setExternalInviteSavingFor(null);
  }, [inviteEmail, invitePhone, inviteContactMode]);

  useEffect(() => {
    if (!showInviteModal) {
      setInvitePreview(null);
      setInvitePreviewLoading(false);
      setInvitePreviewError(false);
      externalInviteSavedRef.current = false;
      setExternalShareTarget(null);
      setExternalInviteSavingFor(null);
      return;
    }
    const email = inviteEmail.trim();
    const phoneNational = frenchMobileNational10FromField(invitePhone);
    const gateOk =
      inviteContactMode === 'email'
        ? looksLikeValidEmail(email)
        : phoneNational != null;
    if (!gateOk) {
      setInvitePreview(null);
      setInvitePreviewLoading(false);
      setInvitePreviewError(false);
      return;
    }

    let cancelled = false;
    setInvitePreviewLoading(true);
    setInvitePreviewError(false);

    const t = setTimeout(() => {
      (async () => {
        try {
          const p = await apiClient.previewGroupInvite(
            group.id,
            inviteContactMode === 'email'
              ? { email }
              : { phone: phoneNational! }
          );
          if (!cancelled) {
            setInvitePreview(p);
            setInvitePreviewError(false);
          }
        } catch {
          if (!cancelled) {
            setInvitePreview(null);
            setInvitePreviewError(true);
          }
        } finally {
          if (!cancelled) setInvitePreviewLoading(false);
        }
      })();
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(t);
      setInvitePreviewLoading(false);
    };
  }, [showInviteModal, inviteContactMode, inviteEmail, invitePhone, group.id]);

  const resetInviteModal = useCallback(() => {
    setShowInviteModal(false);
    setInviteContactMode('email');
    setInviteEmail('');
    setInvitePhone('');
    setInvitePreview(null);
    setInvitePreviewLoading(false);
    setInvitePreviewError(false);
    setExternalShareTarget(null);
    setExternalInviteSavingFor(null);
    externalInviteSavedRef.current = false;
  }, []);

  const openInviteModalFresh = useCallback(() => {
    setInviteContactMode('email');
    setInviteEmail('');
    setInvitePhone('');
    setInvitePreview(null);
    setInvitePreviewLoading(false);
    setInvitePreviewError(false);
    setExternalShareTarget(null);
    setExternalInviteSavingFor(null);
    externalInviteSavedRef.current = false;
    setShowInviteModal(true);
  }, []);

  const switchInviteContactMode = useCallback((mode: 'email' | 'phone') => {
    setInviteContactMode(mode);
    setInvitePreview(null);
    setInvitePreviewError(false);
    setExternalShareTarget(null);
    setExternalInviteSavingFor(null);
    externalInviteSavedRef.current = false;
    if (mode === 'email') setInvitePhone('');
    else setInviteEmail('');
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

  const buildInviteShareBodyForTarget = (target: 'ios' | 'android') => {
    const intro = `Tu es invité(e) au groupe « ${group.name} » sur Corail.\n\n`;
    if (target === 'ios') {
      return `${intro}Télécharge l’app Corail sur l’App Store :\n${CORAIL_IOS_APP_STORE_URL}\n\n${WEB_APP_BASE_URL}`;
    }
    return `${intro}Sur Android (Google Play), l’app sera bientôt disponible.\n\nApp Store (iPhone / iPad) :\n${CORAIL_IOS_APP_STORE_URL}\n\n${WEB_APP_BASE_URL}`;
  };

  const executeInviteShareChannel = (
    channel: 'whatsapp' | 'sms' | 'mail',
    target: 'ios' | 'android'
  ) => {
    const body = buildInviteShareBodyForTarget(target);
    const phoneNational = frenchMobileNational10FromField(invitePhone);
    const emailTo = inviteEmail.trim();
    const subject = `Invitation groupe ${group.name} — Corail`;
    const hasPhone = phoneNational != null;
    const hasEmail = looksLikeValidEmail(emailTo);

    if (channel === 'whatsapp') {
      const url = hasPhone
        ? `https://wa.me/${phoneForWhatsApp(phoneNational)}?text=${encodeURIComponent(body)}`
        : `https://wa.me/?text=${encodeURIComponent(body)}`;
      Linking.openURL(url).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir WhatsApp"));
    } else if (channel === 'sms') {
      if (hasPhone) {
        const addr = national10ToSmsAddress(phoneNational);
        Linking.openURL(`sms:${addr}?body=${encodeURIComponent(body)}`).catch(() =>
          Alert.alert('Erreur', "Impossible d'ouvrir les messages")
        );
      } else {
        Linking.openURL(`sms:?body=${encodeURIComponent(body)}`).catch(() =>
          Alert.alert('Erreur', "Impossible d'ouvrir les messages")
        );
      }
    } else {
      const mailQuery = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const mailUrl = hasEmail ? `mailto:${encodeURIComponent(emailTo)}?${mailQuery}` : `mailto:?${mailQuery}`;
      Linking.openURL(mailUrl).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir l'application mail"));
    }
  };

  const persistExternalInviteIfNeeded = async (): Promise<boolean> => {
    if (externalInviteSavedRef.current) return true;
    const emailTrim = inviteEmail.trim();
    const phoneNational = frenchMobileNational10FromField(invitePhone);
    if (inviteContactMode === 'email') {
      if (!looksLikeValidEmail(emailTrim)) return false;
    } else if (!phoneNational) {
      return false;
    }
    try {
      setInvitingExternal(true);
      await apiClient.inviteToGroup({
        groupId: group.id,
        ...(inviteContactMode === 'email' ? { email: emailTrim } : { phone: phoneNational! }),
      });
      externalInviteSavedRef.current = true;
      await loadPendingInvitations();
      return true;
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible d’enregistrer l’invitation');
      return false;
    } finally {
      setInvitingExternal(false);
    }
  };

  const handleExternalPlatformPress = async (target: 'ios' | 'android') => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      /* ignore */
    }
    setExternalInviteSavingFor(target);
    const ok = await persistExternalInviteIfNeeded();
    setExternalInviteSavingFor(null);
    if (!ok) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      /* ignore */
    }
    setExternalShareTarget(target);
  };

  const closeExternalShareSheet = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* ignore */
    }
    setExternalShareTarget(null);
  };

  const onPickShareChannel = (channel: 'whatsapp' | 'sms' | 'mail') => {
    const target = externalShareTarget;
    if (!target) return;
    try {
      void Haptics.selectionAsync();
    } catch {
      /* ignore */
    }
    executeInviteShareChannel(channel, target);
    setExternalShareTarget(null);
  };

  const handleInvite = async () => {
    const emailTrim = inviteEmail.trim();
    const phoneNational = frenchMobileNational10FromField(invitePhone);
    if (inviteContactMode === 'email') {
      if (!looksLikeValidEmail(emailTrim)) {
        Alert.alert('Champs requis', 'Renseignez une adresse e-mail valide.');
        return;
      }
    } else if (!phoneNational) {
      Alert.alert('Champs requis', 'Renseignez un numéro de mobile complet.');
      return;
    }
    if (!invitePreview?.inviteeId) {
      Alert.alert(
        'Aucun compte',
        'Aucun profil Corail ne correspond à ces coordonnées. Utilisez la carte iPhone ci-dessous pour envoyer le lien App Store.'
      );
      return;
    }
    if (invitePreview?.isSelf) {
      Alert.alert('Invitation impossible', 'Vous ne pouvez pas vous inviter vous-même.');
      return;
    }
    if (invitePreview?.alreadyMember) {
      Alert.alert('Déjà membre', 'Cette personne fait déjà partie du groupe.');
      return;
    }
    if (invitePreview?.pendingInvitation) {
      Alert.alert('Invitation en cours', 'Une invitation est déjà en attente pour ce contact.');
      return;
    }

    try {
      setInviting(true);
      const invitation = await apiClient.inviteToGroup({
        groupId: group.id,
        ...(inviteContactMode === 'email'
          ? { email: emailTrim }
          : { phone: phoneNational! }),
      });
      
      // 🔔 Envoyer notification push si l'invité est déjà inscrit
      if (invitation.invitee_id && invitation.group_name && invitation.inviter_name) {
        const NotificationService = await import('../services/notifications');
        await NotificationService.notifyGroupInvitation(
          invitation.invitee_id,
          invitation.group_name,
          invitation.inviter_name,
          { inviterUserId: currentUserId ?? null }
        );
      }
      
      Alert.alert('Succès', 'Invitation envoyée !');
      resetInviteModal();
      await loadPendingInvitations();
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

  const inviteEmailTrim = inviteEmail.trim();
  const invitePhoneNational10 = frenchMobileNational10FromField(invitePhone);
  const inviteModalGateOk =
    inviteContactMode === 'email'
      ? looksLikeValidEmail(inviteEmailTrim)
      : invitePhoneNational10 != null;
  const invitePreviewContactLabel =
    inviteContactMode === 'email'
      ? inviteEmailTrim
      : invitePhoneNational10
        ? formatPhoneDisplay(invitePhoneNational10)
        : invitePhone.trim();

  const showCorailUserReadyToInvite =
    inviteModalGateOk &&
    !invitePreviewLoading &&
    !invitePreviewError &&
    invitePreview != null &&
    !!invitePreview.inviteeId &&
    !invitePreview.isSelf &&
    !invitePreview.alreadyMember &&
    !invitePreview.pendingInvitation;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        {currentUserIsAdmin ? (
          <TouchableOpacity style={styles.inviteHeaderButton} onPress={openInviteModalFresh}>
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
                  <Text style={styles.invitationContact} numberOfLines={1}>
                    {invitation.invitee_display_name?.trim() ||
                      invitation.invitee_email ||
                      (invitation.invitee_phone
                        ? formatPhoneDisplay(String(invitation.invitee_phone))
                        : '') ||
                      'Contact inconnu'}
                  </Text>
                  {(invitation.invitee_display_name?.trim() &&
                    (invitation.invitee_email || invitation.invitee_phone)) ? (
                    <Text style={styles.invitationContactSub} numberOfLines={1}>
                      {invitation.invitee_email ||
                        (invitation.invitee_phone
                          ? formatPhoneDisplay(String(invitation.invitee_phone))
                          : '')}
                    </Text>
                  ) : null}
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
        onRequestClose={resetInviteModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={resetInviteModal}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Inviter un membre</Text>
              <TouchableOpacity onPress={resetInviteModal}>
                <Ionicons name="close" size={24} color="#f1f5f9" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.inviteModalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.inviteModalScrollContent}
            >
              <View style={styles.inviteModeRow}>
                <TouchableOpacity
                  style={[styles.inviteModeChip, inviteContactMode === 'email' && styles.inviteModeChipActive]}
                  onPress={() => switchInviteContactMode('email')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={inviteContactMode === 'email' ? '#0ea5e9' : '#94a3b8'}
                  />
                  <Text
                    style={[styles.inviteModeChipText, inviteContactMode === 'email' && styles.inviteModeChipTextActive]}
                  >
                    E-mail
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inviteModeChip, inviteContactMode === 'phone' && styles.inviteModeChipActive]}
                  onPress={() => switchInviteContactMode('phone')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="call-outline"
                    size={22}
                    color={inviteContactMode === 'phone' ? '#0ea5e9' : '#94a3b8'}
                  />
                  <Text
                    style={[styles.inviteModeChipText, inviteContactMode === 'phone' && styles.inviteModeChipTextActive]}
                  >
                    Téléphone
                  </Text>
                </TouchableOpacity>
              </View>

              {inviteContactMode === 'email' ? (
                <TextInput
                  style={styles.modalInput}
                  placeholder="exemple@domaine.fr"
                  placeholderTextColor="#64748b"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <TextInput
                  style={styles.modalInput}
                  placeholder="06 12 34 56 78"
                  placeholderTextColor="#64748b"
                  value={invitePhone}
                  onChangeText={(t) => {
                    const nat = toFrenchNational10(t.replace(/\D/g, ''));
                    if (nat) setInvitePhone(formatPhoneDisplay(nat));
                    else setInvitePhone(formatPhoneInput(t));
                  }}
                  keyboardType="phone-pad"
                />
              )}

              {!inviteModalGateOk ? (
                <Text style={styles.previewHint}>
                  {inviteContactMode === 'email'
                    ? 'Saisissez une adresse e-mail.'
                    : 'Saisissez un numéro de mobile.'}
                </Text>
              ) : invitePreviewLoading ? (
                <Text style={styles.previewHint}>Vérification…</Text>
              ) : invitePreviewError ? (
                <Text style={styles.previewError}>
                  Impossible de vérifier pour le moment. Vérifiez la connexion et réessayez.
                </Text>
              ) : invitePreview ? (
                <View style={styles.previewBox}>
                  {invitePreview.isSelf ? (
                    <Text style={styles.previewError}>Vous ne pouvez pas vous inviter vous-même.</Text>
                  ) : invitePreview.alreadyMember ? (
                    <Text style={styles.previewError}>Cette personne est déjà dans le groupe.</Text>
                  ) : invitePreview.pendingInvitation ? (
                    <Text style={styles.previewWarn}>Une invitation est déjà en attente pour ce contact.</Text>
                  ) : invitePreview.inviteeId ? (
                    <Text style={styles.previewOk}>
                      Utilisateur Corail :{' '}
                      <Text style={styles.previewName}>
                        {invitePreview.profileName?.trim() || invitePreviewContactLabel}
                      </Text>
                    </Text>
                  ) : (
                    <View style={styles.externalPremiumBlock}>
                      <Text style={styles.externalTitle}>Votre contact n’a pas encore Corail ?</Text>
                      <Text style={styles.externalSubtitle}>Partager le lien de l’app en 1 clic</Text>
                      <View style={styles.platformLuxRow}>
                        <TouchableOpacity
                          style={styles.platformLuxWrap}
                          activeOpacity={0.9}
                          onPress={() => void handleExternalPlatformPress('ios')}
                          disabled={invitingExternal}
                        >
                          <LinearGradient
                            colors={['#38bdf8', '#6366f1', '#a78bfa']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.platformLuxRing}
                          >
                            <View style={styles.platformLuxInner}>
                              {externalInviteSavingFor === 'ios' ? (
                                <ActivityIndicator color="#94a3b8" />
                              ) : (
                                <>
                                  <FontAwesome5 name="apple" size={32} color="#f8fafc" brand />
                                  <Text style={styles.platformLuxTitle}>iPhone</Text>
                                  <Text style={styles.platformLuxHint}>App Store</Text>
                                </>
                              )}
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                        <View style={[styles.platformLuxWrap, styles.platformLuxDisabled]}>
                          <LinearGradient
                            colors={['#334155', '#1e293b']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.platformLuxRing}
                          >
                            <View style={[styles.platformLuxInner, styles.platformLuxInnerMuted]}>
                              <FontAwesome5 name="google-play" size={24} color="#64748b" brand />
                              <Text style={styles.platformLuxTitleMuted}>Android</Text>
                              <Text style={styles.platformLuxSoon}>Bientôt disponible</Text>
                            </View>
                          </LinearGradient>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ) : null}
            </ScrollView>

            {showCorailUserReadyToInvite ? (
              <View style={styles.inviteModalFooter}>
                <TouchableOpacity style={styles.modalButton} onPress={handleInvite} disabled={inviting}>
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
              </View>
            ) : null}

            {externalShareTarget != null ? (
              <View style={styles.shareLuxOverlayRoot}>
                <BlurView intensity={52} tint="dark" style={StyleSheet.absoluteFillObject} />
                <View style={[StyleSheet.absoluteFillObject, styles.shareLuxColumn]}>
                  <Pressable style={styles.shareLuxBackdrop} onPress={closeExternalShareSheet} />
                  <View style={styles.shareLuxSheet}>
                    <View style={styles.shareLuxHandle} />
                    <Text style={styles.shareLuxTitle}>Envoyer le lien</Text>
                    <Text style={styles.shareLuxSubtitle}>
                      Le message inclut le lien officiel de l’App Store.
                    </Text>
                    <View style={styles.shareLuxChannels}>
                      <TouchableOpacity
                        style={styles.shareLuxChannel}
                        onPress={() => onPickShareChannel('whatsapp')}
                        activeOpacity={0.88}
                      >
                        <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.shareLuxChannelIcon}>
                          <Ionicons name="logo-whatsapp" size={28} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.shareLuxChannelLabel}>WhatsApp</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareLuxChannel}
                        onPress={() => onPickShareChannel('sms')}
                        activeOpacity={0.88}
                      >
                        <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.shareLuxChannelIcon}>
                          <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.shareLuxChannelLabel}>SMS</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareLuxChannel}
                        onPress={() => onPickShareChannel('mail')}
                        activeOpacity={0.88}
                      >
                        <LinearGradient colors={['#a855f7', '#7c3aed']} style={styles.shareLuxChannelIcon}>
                          <Ionicons name="mail-outline" size={26} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.shareLuxChannelLabel}>E-mail</Text>
                      </TouchableOpacity>
                    </View>
                    <Pressable style={styles.shareLuxClose} onPress={closeExternalShareSheet}>
                      <Text style={styles.shareLuxCloseText}>Fermer</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}
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
  invitationContactSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
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
    position: 'relative',
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 20,
    maxHeight: '88%',
  },
  inviteModalScroll: {
    maxHeight: 520,
  },
  inviteModalScrollContent: {
    paddingBottom: 12,
  },
  inviteModalFooter: {
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#334155',
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
  inviteModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  inviteModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  inviteModeChipActive: {
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  inviteModeChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  inviteModeChipTextActive: {
    color: '#e2e8f0',
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
  previewHint: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 12,
  },
  previewBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewError: {
    fontSize: 14,
    color: '#f87171',
  },
  previewWarn: {
    fontSize: 14,
    color: '#fbbf24',
  },
  previewOk: {
    fontSize: 14,
    color: '#94a3b8',
  },
  previewName: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  previewNeutral: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  modalButtonDisabled: {
    opacity: 0.45,
  },
  externalPremiumBlock: {
    paddingTop: 2,
  },
  externalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  externalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 14,
  },
  platformLuxRow: {
    flexDirection: 'row',
    gap: 12,
  },
  platformLuxWrap: {
    flex: 1,
  },
  platformLuxRing: {
    borderRadius: 18,
    padding: 2,
  },
  platformLuxInner: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
    minHeight: 118,
    justifyContent: 'center',
  },
  platformLuxTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  platformLuxHint: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  platformLuxDisabled: {
    opacity: 0.92,
  },
  platformLuxInnerMuted: {
    opacity: 0.95,
  },
  platformLuxTitleMuted: {
    fontSize: 17,
    fontWeight: '700',
    color: '#64748b',
  },
  platformLuxSoon: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 0.2,
  },
  shareLuxOverlayRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 80,
    elevation: 80,
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  shareLuxColumn: {
    flexDirection: 'column',
  },
  shareLuxBackdrop: {
    flex: 1,
  },
  shareLuxSheet: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 32 : 22,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  shareLuxHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.45)',
    marginBottom: 16,
  },
  shareLuxTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  shareLuxSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  shareLuxChannels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  shareLuxChannel: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  shareLuxChannelIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  shareLuxChannelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  shareLuxClose: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  shareLuxCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
});

export default GroupDetailScreen;
