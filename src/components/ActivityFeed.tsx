import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

interface ActivityFeedProps {
  limit?: number;
}

interface Activity {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata: string;
  created_at: string;
  pickup_address?: string;
  dropoff_address?: string;
  price_cents?: number;
  ride_visibility?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ limit = 20 }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRecentActivity(limit);
      setActivities(data);
    } catch (error: any) {
      console.error('❌ Erreur chargement activités:', error);
      // Gérer l'erreur gracieusement si la table n'existe pas encore
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        setActivities([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const getActivityInfo = (activity: Activity) => {
    const { action_type, pickup_address, dropoff_address, price_cents, ride_visibility } = activity;

    switch (action_type) {
      case 'RIDE_PUBLISHED_PUBLIC':
        return {
          icon: 'megaphone' as const,
          color: '#0ea5e9',
          title: 'Course publiée sur la marketplace',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Course publique',
          badge: price_cents ? `${(price_cents / 100).toFixed(2)}€` : undefined,
        };
      
      case 'RIDE_PUBLISHED_GROUP':
        return {
          icon: 'people' as const,
          color: '#a855f7',
          title: 'Course publiée dans un groupe',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Course groupe',
          badge: price_cents ? `${(price_cents / 100).toFixed(2)}€` : undefined,
        };
      
      case 'RIDE_PUBLISHED_PERSONAL':
        return {
          icon: 'lock-closed' as const,
          color: '#6366f1',
          title: 'Course personnelle créée',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Course privée',
          badge: undefined,
        };
      
      case 'RIDE_CLAIMED':
        return {
          icon: 'car-sport' as const,
          color: '#ff6b47',
          title: 'Course prise',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Course réclamée',
          badge: '-1 [C]',
        };
      
      case 'RIDE_COMPLETED':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10b981',
          title: 'Course terminée',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Course complétée',
          badge: ride_visibility && ['PUBLIC', 'GROUP'].includes(ride_visibility) ? '+1 [C]' : undefined,
        };
      
      case 'RIDE_DELETED':
        return {
          icon: 'trash' as const,
          color: '#ef4444',
          title: 'Course supprimée',
          subtitle: 'Course retirée',
          badge: undefined,
        };
      
      case 'PERSONAL_RIDE_ADDED':
        return {
          icon: 'document-text' as const,
          color: '#6366f1',
          title: 'Course personnelle enregistrée',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Course privée ajoutée',
          badge: price_cents ? `${(price_cents / 100).toFixed(2)}€` : undefined,
        };
      
      case 'RIDE_PUBLISHED':
        return {
          icon: 'megaphone' as const,
          color: '#0ea5e9',
          title: 'Course publiée',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Nouvelle course',
          badge: price_cents ? `${(price_cents / 100).toFixed(2)}€` : undefined,
        };
      
      case 'RIDE_CREATED':
        return {
          icon: 'add-circle' as const,
          color: '#10b981',
          title: 'Course créée',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Nouvelle course',
          badge: price_cents ? `${(price_cents / 100).toFixed(2)}€` : undefined,
        };
      
      case 'RIDE_UPDATED':
        return {
          icon: 'create' as const,
          color: '#f59e0b',
          title: 'Course modifiée',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Course mise à jour',
          badge: undefined,
        };
      
      case 'RIDE_CANCELLED':
        return {
          icon: 'close-circle' as const,
          color: '#ef4444',
          title: 'Course annulée',
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Course annulée',
          badge: undefined,
        };
      
      default:
        // Pour les actions inconnues, essayer de rendre lisible
        const readableTitle = action_type
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase());
        
        return {
          icon: 'information-circle' as const,
          color: '#64748b',
          title: readableTitle,
          subtitle: pickup_address && dropoff_address
            ? `${pickup_address} → ${dropoff_address}`
            : 'Action',
          badge: price_cents ? `${(price_cents / 100).toFixed(2)}€` : undefined,
        };
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Chargement de l'activité...</Text>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
        }
      >
        <Ionicons name="time-outline" size={64} color="#475569" />
        <Text style={styles.emptyText}>Aucune activité récente</Text>
        <Text style={styles.emptySubtext}>
          Vos actions (publier, prendre, terminer des courses) apparaîtront ici
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activité récente</Text>
        <Text style={styles.headerSubtitle}>{activities.length} action{activities.length > 1 ? 's' : ''}</Text>
      </View>

      {activities.map((activity) => {
        const info = getActivityInfo(activity);
        
        return (
          <View key={activity.id} style={styles.activityCard}>
            <View style={[styles.iconWrapper, { backgroundColor: info.color + '20' }]}>
              <Ionicons name={info.icon} size={22} color={info.color} />
            </View>
            
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>{info.title}</Text>
                {info.badge && (
                  <View style={[styles.badge, { backgroundColor: info.color + '20' }]}>
                    <Text style={[styles.badgeText, { color: info.color }]}>{info.badge}</Text>
                  </View>
                )}
              </View>
              
              {/* Détails de la course */}
              {activity.pickup_address && (
                <View style={styles.routeDetails}>
                  <View style={styles.routeRow}>
                    <Ionicons name="location" size={14} color="#10b981" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {activity.pickup_address}
                    </Text>
                  </View>
                  {activity.dropoff_address && (
                    <View style={styles.routeRow}>
                      <Ionicons name="flag" size={14} color="#ff6b47" />
                      <Text style={styles.routeText} numberOfLines={1}>
                        {activity.dropoff_address}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Prix et temps */}
              <View style={styles.metaRow}>
                {activity.price_cents && (
                  <View style={styles.priceTag}>
                    <Ionicons name="cash-outline" size={14} color="#10b981" />
                    <Text style={styles.priceText}>
                      {(activity.price_cents / 100).toFixed(2)}€
                    </Text>
                  </View>
                )}
                <Text style={styles.activityTime}>
                  {formatRelativeTime(activity.created_at)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 6,
  },
  routeDetails: {
    marginBottom: 8,
    gap: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default ActivityFeed;

