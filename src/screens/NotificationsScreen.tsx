/**
 * Écran des notifications in-app
 * Affiche les 10 dernières notifications ; les déjà consultées sont grisées.
 * Au tap sur une notification avec target_ride_id → marquer lu et ouvrir le détail de la course.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import type { InAppNotification } from '../services/supabaseApi';

interface NotificationsScreenProps {
  onBack: () => void;
  /** Appelé quand l'utilisateur tape une notification liée à une course : on ferme l'écran puis on ouvre le détail. */
  onOpenRideDetail?: (rideId: string) => void;
  /** Appelé quand l'utilisateur tape une notification "dossier à vérifier" (admin) : on ferme puis on ouvre le panel admin. */
  onOpenAdminPanel?: () => void;
  /** Appelé pour une invitation à un groupe : on ferme puis on ouvre l'écran des invitations. */
  onOpenGroupInvitations?: () => void;
  /** Appelé pour "dossier refusé" : on ferme puis on ouvre l'écran de vérification du profil chauffeur. */
  onOpenVerificationProfile?: () => void;
  /** Appelé pour une course personnelle (ex. devis) : on ferme puis on ouvre le détail de la course personnelle. */
  onOpenPersonalRideDetail?: (personalRideId: string) => void;
  /** Appelé pour "nouvelle course dans un groupe" : on ferme puis on ouvre Annonces filtrées par Groupes. */
  onOpenMarketplaceGroups?: () => void;
  /** Appelé pour "réservation directe" (site) : on ferme puis on ouvre l'écran Demandes. */
  onOpenDriverRequests?: () => void;
}

function formatNotificationDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  onOpenRideDetail,
  onOpenAdminPanel,
  onOpenGroupInvitations,
  onOpenVerificationProfile,
  onOpenPersonalRideDetail,
  onOpenMarketplaceGroups,
  onOpenDriverRequests,
}) => {
  const [list, setList] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.listInAppNotifications(50);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('listInAppNotifications', e);
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleNotificationPress = useCallback(
    async (n: InAppNotification) => {
      try {
        await apiClient.markNotificationRead(n.id);
      } catch (_) {}
      const isAdminNotification = n.type === 'driver_verification_submitted' || n.target_screen === 'admin_driver_verification';
      if (isAdminNotification && onOpenAdminPanel) {
        onBack();
        onOpenAdminPanel();
        return;
      }
      const isGroupInvitation = n.type === 'group_invitation' || n.target_screen === 'group_invitations';
      if (isGroupInvitation && onOpenGroupInvitations) {
        onBack();
        onOpenGroupInvitations();
        return;
      }
      const isVerificationRejected = n.type === 'verification_rejected' || n.target_screen === 'driver_verification_profile';
      if (isVerificationRejected && onOpenVerificationProfile) {
        onBack();
        onOpenVerificationProfile();
        return;
      }
      const isMarketplaceGroups = n.type === 'ride_in_group' || n.target_screen === 'marketplace_groups';
      if (isMarketplaceGroups && onOpenMarketplaceGroups) {
        onBack();
        onOpenMarketplaceGroups();
        return;
      }
      const isRideFromSite = n.type === 'ride_from_site' || n.target_screen === 'driver_requests';
      if (isRideFromSite && onOpenDriverRequests) {
        onBack();
        onOpenDriverRequests();
        return;
      }
      if (n.target_personal_ride_id && onOpenPersonalRideDetail) {
        onBack();
        onOpenPersonalRideDetail(n.target_personal_ride_id);
        return;
      }
      if (n.target_ride_id && onOpenRideDetail) {
        onBack();
        onOpenRideDetail(n.target_ride_id);
      }
    },
    [onBack, onOpenRideDetail, onOpenAdminPanel, onOpenGroupInvitations, onOpenVerificationProfile, onOpenPersonalRideDetail, onOpenMarketplaceGroups, onOpenDriverRequests]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />
        }
      >
        {/* Liste des notifications (consultées = grisées) */}
        <View style={styles.section}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#0ea5e9" />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="notifications-off-outline" size={32} color="#64748b" />
              <Text style={styles.emptyText}>Aucune notification</Text>
            </View>
          ) : (
            list.map((n) => {
              const isRead = !!n.read_at;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.notifRow, !isRead && styles.notifRowUnread, isRead && styles.notifRowRead]}
                  onPress={() => handleNotificationPress(n)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notifIconWrap, isRead && styles.notifIconWrapRead]}>
                    <Ionicons
                      name={
                        n.type === 'ride_claimed'
                          ? 'car-sport'
                          : n.type === 'ride_completed'
                          ? 'checkmark-circle'
                          : n.type === 'ride_rating'
                          ? 'star'
                          : n.type === 'ride_cancelled'
                          ? 'close-circle'
                          : n.type === 'driver_verification_submitted'
                          ? 'document-text'
                          : n.type === 'verification_approved'
                          ? 'shield-checkmark'
                          : n.type === 'verification_rejected'
                          ? 'alert-circle'
                          : n.type === 'group_invitation'
                          ? 'people'
                          : n.type === 'quote_accepted'
                          ? 'checkmark-done-circle'
                          : n.type === 'quote_refused'
                          ? 'close-circle-outline'
                          : n.type === 'ride_in_group'
                          ? 'car-sport'
                          : n.type === 'ride_from_site'
                          ? 'globe-outline'
                          : 'notifications'
                      }
                      size={20}
                      color={isRead ? '#64748b' : '#0ea5e9'}
                    />
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={[styles.notifTitle, isRead && styles.notifTitleRead]} numberOfLines={1}>
                      {n.title}
                    </Text>
                    {n.body ? (
                      <Text style={[styles.notifSubtext, isRead && styles.notifSubtextRead]} numberOfLines={2}>
                        {n.body}
                      </Text>
                    ) : null}
                    <Text style={[styles.notifDate, isRead && styles.notifDateRead]}>{formatNotificationDate(n.created_at)}</Text>
                  </View>
                  {(n.target_ride_id || n.target_personal_ride_id || n.target_screen) ? (
                    <Ionicons name="chevron-forward" size={18} color={isRead ? '#475569' : '#64748b'} />
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </View>
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
    paddingTop: 60,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyRow: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notifRowUnread: {
    borderColor: 'rgba(14, 165, 233, 0.4)',
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
  },
  notifRowRead: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderColor: '#334155',
    opacity: 0.85,
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifIconWrapRead: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  notifBody: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  notifTitleRead: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  notifSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  notifSubtextRead: {
    color: '#64748b',
  },
  notifDate: {
    fontSize: 12,
    color: '#64748b',
  },
  notifDateRead: {
    color: '#475569',
  },
});

export default NotificationsScreen;
