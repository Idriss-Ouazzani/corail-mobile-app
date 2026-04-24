/**
 * Écran des notifications in-app
 * Pagination : 10 notifications par page, bouton "Voir plus" pour charger la suite.
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
  /** Nouveau membre dans un groupe (notif admin) : liste des groupes. */
  onOpenGroups?: () => void;
  /** Appelé pour "dossier refusé" : on ferme puis on ouvre l'écran de vérification du profil chauffeur. */
  onOpenVerificationProfile?: () => void;
  /** Appelé pour une course personnelle (ex. devis) : on ferme puis on ouvre le détail de la course personnelle. */
  onOpenPersonalRideDetail?: (personalRideId: string) => void;
  /** Appelé pour "nouvelle course dans un groupe" : on ferme puis on ouvre Annonces filtrées par Groupes. */
  onOpenMarketplaceGroups?: () => void;
  /** Appelé pour "réservation directe" (site) : on ferme puis on ouvre l'écran Demandes. */
  onOpenDriverRequests?: () => void;
  /** planning du jour, résumé, rappel imminent : on ferme puis on ouvre Planning (vue « À venir »). */
  onOpenPlanning?: () => void;
  /** Profil chauffeur / Page Pro après validation admin. */
  onOpenVTCProfile?: () => void;
  /** Après marquage lu : rafraîchir pastille + badge OS (depuis App). */
  onUnreadCountUpdated?: () => void | Promise<void>;
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
  onOpenGroups,
  onOpenVerificationProfile,
  onOpenPersonalRideDetail,
  onOpenMarketplaceGroups,
  onOpenDriverRequests,
  onOpenPlanning,
  onOpenVTCProfile,
  onUnreadCountUpdated,
}) => {
  const PAGE_SIZE = 10;
  const [list, setList] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (offset = 0, append = false) => {
    if (offset === 0 && !append) setLoading(true);
    if (offset > 0) setLoadingMore(true);
    try {
      const data = await apiClient.listInAppNotifications(PAGE_SIZE, offset);
      const next = Array.isArray(data) ? data : [];
      setList((prev) => (append ? [...prev, ...next] : next));
      setHasMore(next.length === PAGE_SIZE);
    } catch (e) {
      console.warn('listInAppNotifications', e);
      if (!append) setList([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(0, false);
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    load(0, false);
  }, [load]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    load(list.length, true);
  }, [load, list.length, loadingMore, hasMore]);

  const handleNotificationPress = useCallback(
    async (n: InAppNotification) => {
      try {
        await apiClient.markNotificationRead(n.id);
        await onUnreadCountUpdated?.();
        await load(0, false);
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
      if (n.type === 'group_member_joined' && onOpenGroups) {
        onBack();
        onOpenGroups();
        return;
      }
      const isVerificationRejected = n.type === 'verification_rejected' || n.target_screen === 'driver_verification_profile';
      if (isVerificationRejected && onOpenVerificationProfile) {
        onBack();
        onOpenVerificationProfile();
        return;
      }
      if (n.type === 'verification_approved' && onOpenVTCProfile) {
        onBack();
        onOpenVTCProfile();
        return;
      }
      const isPlanningNotif =
        n.type === 'daily_summary' ||
        n.type === 'ride_imminent' ||
        n.target_screen === 'planning' ||
        n.target_screen === 'planning_upcoming';
      if (isPlanningNotif && onOpenPlanning) {
        onBack();
        onOpenPlanning();
        return;
      }
      const isRideInGroup = n.type === 'ride_in_group' || n.target_screen === 'marketplace_groups';
      if (isRideInGroup && n.target_ride_id && onOpenRideDetail) {
        onBack();
        onOpenRideDetail(n.target_ride_id);
        return;
      }
      if (isRideInGroup && onOpenMarketplaceGroups) {
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
    [
      onBack,
      onOpenRideDetail,
      onOpenAdminPanel,
      onOpenGroupInvitations,
      onOpenGroups,
      onOpenVerificationProfile,
      onOpenVTCProfile,
      onOpenPersonalRideDetail,
      onOpenMarketplaceGroups,
      onOpenDriverRequests,
      onOpenPlanning,
      onUnreadCountUpdated,
      load,
    ]
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
            <>
              {list.map((n) => {
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
                            : n.type === 'group_member_joined'
                            ? 'person-add'
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
                    {(n.target_ride_id ||
                      n.target_personal_ride_id ||
                      n.target_screen ||
                      n.type === 'daily_summary' ||
                      n.type === 'ride_imminent') ? (
                      <Ionicons name="chevron-forward" size={18} color={isRead ? '#475569' : '#64748b'} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
              {hasMore && list.length > 0 && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={onLoadMore}
                  disabled={loadingMore}
                  activeOpacity={0.7}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#0ea5e9" />
                  ) : (
                    <Text style={styles.loadMoreText}>Voir plus</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
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
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0ea5e9',
  },
});

export default NotificationsScreen;
