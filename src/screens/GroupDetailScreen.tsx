import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
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

const CURRENT_USER_ID = 'user1'; // Hassan

const MOCK_MEMBERS: Member[] = [
  { id: 'user1', name: 'Hassan Al Masri', email: 'hassan@example.com', phone: '+33 6 12 34 56 78', isAdmin: true },
  { id: 'user2', name: 'Youssef D.', email: 'youssef@example.com', phone: '+33 6 23 45 67 89', isAdmin: false },
  { id: 'user3', name: 'Marie Dubois', email: 'marie@example.com', phone: '+33 6 34 56 78 90', isAdmin: false },
  { id: 'user4', name: 'Jean Martin', email: 'jean@example.com', phone: '+33 6 45 67 89 01', isAdmin: false },
  { id: 'user5', name: 'Sophie Bernard', email: 'sophie@example.com', phone: '+33 6 56 78 90 12', isAdmin: true },
];

export const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({ group, onBack }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');

  const currentUserIsAdmin = MOCK_MEMBERS.find(m => m.id === CURRENT_USER_ID)?.isAdmin || false;
  const admins = MOCK_MEMBERS.filter(m => m.isAdmin);
  const regularMembers = MOCK_MEMBERS.filter(m => !m.isAdmin);

  const handleInvite = () => {
    if (!inviteEmail && !invitePhone) {
      Alert.alert('Erreur', 'Veuillez entrer un email ou un numéro de téléphone');
      return;
    }
    Alert.alert('Succès', 'Invitation envoyée !');
    setShowInviteModal(false);
    setInviteEmail('');
    setInvitePhone('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Info */}
        <View style={styles.groupInfoCard}>
          <LinearGradient
            colors={[`${group.color}20`, `${group.color}05`]}
            style={styles.groupInfoGradient}
          >
            <View style={[styles.groupInfoIcon, { backgroundColor: `${group.color}30` }]}>
              <Ionicons name={group.icon as any} size={40} color={group.color} />
            </View>
            <View style={styles.groupInfoContent}>
              <Text style={styles.groupInfoName}>{group.name}</Text>
              <Text style={styles.groupInfoDesc}>{group.description}</Text>
              <View style={styles.groupInfoMeta}>
                <Ionicons name="people" size={16} color="#94a3b8" />
                <Text style={styles.groupInfoMetaText}>
                  {MOCK_MEMBERS.length} membres · {admins.length} admin{admins.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Admins Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="shield-checkmark" size={18} color="#fbbf24" /> Administrateurs ({admins.length})
          </Text>
          {admins.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitials}>
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {member.id === CURRENT_USER_ID && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>Vous</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberEmail}>{member.email}</Text>
                <Text style={styles.memberPhone}>{member.phone}</Text>
              </View>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#fbbf24" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="people" size={18} color="#0ea5e9" /> Membres ({regularMembers.length})
          </Text>
          {regularMembers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitials}>
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {member.id === CURRENT_USER_ID && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>Vous</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberEmail}>{member.email}</Text>
                <Text style={styles.memberPhone}>{member.phone}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Invite Button (if admin) */}
        {currentUserIsAdmin && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setShowInviteModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6b47', '#ff8a6d']}
              style={styles.inviteButtonGradient}
            >
              <Ionicons name="person-add" size={22} color="#fff" />
              <Text style={styles.inviteButtonText}>Inviter un membre</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1e293b', '#0f172a']}
              style={styles.modalGradient}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Inviter un membre</Text>
                <TouchableOpacity
                  onPress={() => setShowInviteModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#f1f5f9" />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="mail" size={16} color="#94a3b8" /> Email
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="exemple@email.com"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                  />
                </View>

                <View style={styles.orDivider}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OU</Text>
                  <View style={styles.orLine} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="call" size={16} color="#94a3b8" /> Téléphone
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    value={invitePhone}
                    onChangeText={setInvitePhone}
                  />
                </View>
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowInviteModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextCancel}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleInvite}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ff6b47', '#ff8a6d']}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Envoyer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  inviteHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  groupInfoCard: {
    marginBottom: 30,
  },
  groupInfoGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  groupInfoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  groupInfoContent: {
    alignItems: 'center',
  },
  groupInfoName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  groupInfoDesc: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
  },
  groupInfoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupInfoMetaText: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff6b47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  youBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  memberEmail: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 12,
    color: '#64748b',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
    marginLeft: 4,
  },
  inviteButton: {
    marginTop: 10,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  inviteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalGradient: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  orText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginHorizontal: 16,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default GroupDetailScreen;

