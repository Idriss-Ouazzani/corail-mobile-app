import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

interface PendingVerification {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  professional_card_number: string;
  siren: string;
  verification_submitted_at: string;
}

interface AdminPanelScreenProps {
  onBack: () => void;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({ onBack }) => {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPendingVerifications = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPendingVerifications();
      setPendingVerifications(data);
      console.log('✅ Vérifications en attente:', data.length);
    } catch (error: any) {
      console.error('❌ Erreur chargement vérifications:', error);
      Alert.alert('Erreur', 'Impossible de charger les vérifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const handleApprove = async (verification: PendingVerification) => {
    Alert.alert(
      'Valider cette vérification ?',
      `${verification.full_name}\n${verification.email}\n\nCarte VTC: ${verification.professional_card_number}\nSIREN: ${verification.siren}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider ✅',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(verification.id);
              await apiClient.reviewVerification(verification.id, {
                status: 'VERIFIED',
              });
              Alert.alert('Validé ! 🎉', `${verification.full_name} peut maintenant utiliser l'app.`);
              // Retirer de la liste
              setPendingVerifications(prev => prev.filter(v => v.id !== verification.id));
            } catch (error: any) {
              console.error('❌ Erreur validation:', error);
              Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de valider');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (verification: PendingVerification) => {
    Alert.prompt(
      'Rejeter cette vérification',
      `${verification.full_name}\n${verification.email}\n\nIndiquez la raison du rejet :`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter ❌',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Erreur', 'Veuillez indiquer une raison');
              return;
            }

            try {
              setProcessingId(verification.id);
              await apiClient.reviewVerification(verification.id, {
                status: 'REJECTED',
                rejection_reason: reason,
              });
              Alert.alert('Rejeté', `${verification.full_name} a été notifié du rejet.`);
              // Retirer de la liste
              setPendingVerifications(prev => prev.filter(v => v.id !== verification.id));
            } catch (error: any) {
              console.error('❌ Erreur rejet:', error);
              Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de rejeter');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Panel Admin</Text>
          <Text style={styles.headerSubtitle}>Validation VTC</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingVerifications.length}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPendingVerifications();
            }}
            tintColor="#ff6b47"
          />
        }
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color="#0ea5e9" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoBannerTitle}>Vérifications en attente</Text>
            <Text style={styles.infoBannerText}>
              Valide ou rejette les demandes après vérification de la carte VTC et du SIREN.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6b47" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : pendingVerifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={64} color="#10b981" />
            <Text style={styles.emptyStateTitle}>Tout est à jour ! 🎉</Text>
            <Text style={styles.emptyStateText}>
              Aucune vérification en attente.
            </Text>
          </View>
        ) : (
          pendingVerifications.map((verification) => (
            <View key={verification.id} style={styles.verificationCard}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {verification.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{verification.full_name}</Text>
                  <Text style={styles.userEmail}>{verification.email}</Text>
                </View>
                <View style={styles.timeTag}>
                  <Text style={styles.timeText}>{formatDate(verification.verification_submitted_at)}</Text>
                </View>
              </View>

              {/* Infos VTC */}
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={16} color="#94a3b8" />
                  <Text style={styles.infoLabel}>Téléphone :</Text>
                  <Text style={styles.infoValue}>{verification.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="card" size={16} color="#94a3b8" />
                  <Text style={styles.infoLabel}>Carte VTC :</Text>
                  <Text style={styles.infoValue}>{verification.professional_card_number}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={16} color="#94a3b8" />
                  <Text style={styles.infoLabel}>SIREN :</Text>
                  <Text style={styles.infoValue}>{verification.siren}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(verification)}
                  disabled={processingId === verification.id}
                  activeOpacity={0.7}
                >
                  {processingId === verification.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Rejeter</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(verification)}
                  disabled={processingId === verification.id}
                  activeOpacity={0.7}
                >
                  {processingId === verification.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Valider</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#ff6b47',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  verificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff6b47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  timeTag: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fbbf24',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default AdminPanelScreen;


