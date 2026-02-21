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
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

const GROUPS_HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  color: string;
  icon: string;
}

interface GroupsScreenProps {
  onBack: () => void;
  onSelectGroup?: (group: Group) => void;
}

// Couleurs prédéfinies pour les nouveaux groupes
const GROUP_COLORS = ['#10b981', '#0ea5e9', '#a855f7', '#f59e0b', '#ef4444', '#6366f1'];

export const GroupsScreen: React.FC<GroupsScreenProps> = ({ onBack, onSelectGroup }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      console.log('🔄 GroupsScreen - Chargement des groupes...');
      const groupsData = await apiClient.listGroups();
      console.log('📦 GroupsScreen - Groupes reçus:', groupsData);
      
      // Mapper les groupes de l'API au format local avec couleur et icône par défaut
      const mappedGroups: Group[] = groupsData.map((g: any, index: number) => ({
        id: g.id,
        name: g.name,
        description: g.description || '',
        memberCount: g.memberCount || 0,
        color: g.color || GROUP_COLORS[index % GROUP_COLORS.length],
        icon: g.icon || 'people',
      }));
      
      console.log('✅ GroupsScreen - Groupes mappés:', mappedGroups);
      setGroups(mappedGroups);
    } catch (error: any) {
      console.error('❌ GroupsScreen - Erreur loading groups:', error);
      Alert.alert('Erreur', 'Impossible de charger les groupes: ' + error.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de groupe');
      return;
    }

    try {
      setLoading(true);
      await apiClient.createGroup({
        name: newGroupName,
        description: newGroupDesc,
        icon: 'people',
        is_public: false,
      });
      
      Alert.alert('Succès', 'Groupe créé avec succès !');
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      
      // Recharger la liste des groupes
      await loadGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert('Erreur', 'Impossible de créer le groupe: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header épuré (aligné accueil) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Groupes</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0ea5e9" />
        }
      >
        {/* Bandeau image + descriptif */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: GROUPS_HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="people" size={28} color="#fff" />
            </View>
            <Text style={styles.heroText}>
              Partagez des annonces de courses avec vos proches et collègues.
            </Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.loadingText}>Chargement des groupes...</Text>
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{groups.length}</Text>
                <Text style={styles.statLabel}>Groupes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {groups.reduce((sum, g) => sum + g.memberCount, 0)}
                </Text>
                <Text style={styles.statLabel}>Membres</Text>
              </View>
            </View>

            {/* Groups List */}
            {groups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Vos groupes</Text>
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[styles.groupCard, { borderLeftColor: group.color }]}
                    onPress={() => onSelectGroup?.(group)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.groupIcon, { backgroundColor: `${group.color}18` }]}>
                      <Ionicons name={group.icon as any} size={24} color={group.color} />
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupDesc}>{group.description}</Text>
                      <View style={styles.groupMeta}>
                        <Ionicons name="people" size={14} color="#94a3b8" />
                        <Text style={styles.groupMetaText}>
                          {group.memberCount} membre{group.memberCount > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#64748b" />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Empty State (if no groups) */}
            {groups.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#475569" />
                <Text style={styles.emptyStateText}>Aucun groupe</Text>
                <Text style={styles.emptyStateSubtext}>
                  Créez votre premier groupe pour commencer
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowCreateModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Créer un groupe</Text>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#f1f5f9" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.formScrollContent}
              >
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nom du groupe</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Famille, Collègues..."
                      placeholderTextColor="#64748b"
                      value={newGroupName}
                      onChangeText={setNewGroupName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description (optionnel)</Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      placeholder="Décrivez votre groupe..."
                      placeholderTextColor="#64748b"
                      multiline
                      numberOfLines={3}
                      value={newGroupDesc}
                      onChangeText={setNewGroupDesc}
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowCreateModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalButtonTextCancel}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleCreateGroup}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#0ea5e9', '#06b6d4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalButtonGradient}
                    >
                      <Text style={styles.modalButtonText}>Créer</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
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
    backgroundColor: '#0f172a',
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
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroWrap: {
    height: 100,
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
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  groupDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMetaText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
  },
  modalContent: {
    height: '80%',
    maxHeight: '80%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalGradient: {
    backgroundColor: '#1e293b',
    paddingTop: 24,
    paddingBottom: 24,
    flex: 1,
    minHeight: 0,
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
  formScroll: {
    flex: 1,
    minHeight: 0,
  },
  formScrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  form: {
    paddingHorizontal: 0,
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
    backgroundColor: '#334155',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 18,
    overflow: 'hidden',
  },
  modalButtonCancel: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 18,
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

export default GroupsScreen;

