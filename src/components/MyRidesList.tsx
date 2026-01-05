/**
 * MyRidesList - Affiche les listes de courses selon l'onglet actif
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  price_cents: number;
  status: string;
  [key: string]: any;
}

interface MyRidesListProps {
  activeTab: 'claimed' | 'published' | 'personal';
  
  // Claimed tab data
  claimedRides: Ride[];
  completedRides: Ride[];
  historyClaimed: Ride[];
  
  // Published tab data
  activePublished: Ride[];
  claimedPublished: Ride[];
  historyPublished: Ride[];
  
  // Personal tab data
  activePersonal: Ride[];
  historyPersonal: Ride[];
  
  onRidePress: (ride: Ride) => void;
  onPersonalRidePress: (ride: Ride) => void;
  onPublishPersonalRide?: (ride: Ride) => void; // Nouveau: pour publier une course perso
}

// Sous-composant pour afficher une course compacte
function CompactRideRow({ 
  ride, 
  onPress, 
  iconName, 
  iconColor, 
  opacity = 1, 
  showPublishButton = false, 
  onPublish,
  statusBadge,
  statusBadgeColor,
}: any) {
  // Si le bouton publier existe, on a besoin d'un layout spécial
  if (showPublishButton && onPublish) {
    return (
      <View style={[styles.compactRideRow, { opacity }]}>
        <TouchableOpacity
          style={[styles.compactRideLeft, { flex: 1 }]}
          onPress={() => onPress(ride)}
          activeOpacity={0.7}
        >
          <View style={[styles.compactRideIconWrapper, iconColor && { backgroundColor: iconColor }]}>
            <Ionicons name={iconName} size={20} color={iconColor?.replace('0.2', '1') || '#0ea5e9'} />
          </View>
          <View style={styles.compactRideInfo}>
            <Text style={[styles.compactRideTime, opacity < 1 && { color: '#64748b' }]}>
              {new Date(ride.scheduled_at).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <View style={styles.compactRideRoute}>
              <Ionicons name="location" size={12} color="#10b981" />
              <Text style={styles.compactRideAddress} numberOfLines={1}>
                {ride.pickup_address}
              </Text>
            </View>
            <View style={styles.compactRideRoute}>
              <Ionicons name="flag" size={12} color="#ff6b47" />
              <Text style={styles.compactRideAddress} numberOfLines={1}>
                {ride.dropoff_address}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.compactRideRight}>
          <Text style={styles.compactRidePrice}>
            {(ride.price_cents / 100).toFixed(2)}€
          </Text>
          <TouchableOpacity
            style={styles.publishButton}
            onPress={() => onPublish(ride)}
            activeOpacity={0.7}
          >
            <Ionicons name="megaphone" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Layout par défaut : toute la ligne est cliquable
  return (
    <TouchableOpacity
      style={[styles.compactRideRow, { opacity }]}
      onPress={() => onPress(ride)}
      activeOpacity={0.7}
    >
      <View style={styles.compactRideLeft}>
        <View style={[styles.compactRideIconWrapper, iconColor && { backgroundColor: iconColor }]}>
          <Ionicons name={iconName} size={20} color={iconColor?.replace('0.2', '1') || '#0ea5e9'} />
        </View>
        <View style={styles.compactRideInfo}>
          <Text style={[styles.compactRideTime, opacity < 1 && { color: '#64748b' }]}>
            {new Date(ride.scheduled_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <View style={styles.compactRideRoute}>
            <Ionicons name="location" size={12} color="#10b981" />
            <Text style={styles.compactRideAddress} numberOfLines={1}>
              {ride.pickup_address}
            </Text>
          </View>
          <View style={styles.compactRideRoute}>
            <Ionicons name="flag" size={12} color="#ff6b47" />
            <Text style={styles.compactRideAddress} numberOfLines={1}>
              {ride.dropoff_address}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.compactRideRight}>
        <View style={styles.compactRidePriceContainer}>
          <Text style={styles.compactRidePrice}>
            {(ride.price_cents / 100).toFixed(2)}€
          </Text>
          {statusBadge && (
            <View style={[styles.compactStatusBadge, { backgroundColor: statusBadgeColor || '#6366f1' }]}>
              <Text style={styles.compactStatusBadgeText}>{statusBadge}</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748b" />
      </View>
    </TouchableOpacity>
  );
}

export default function MyRidesList({
  activeTab,
  claimedRides,
  completedRides,
  historyClaimed,
  activePublished,
  claimedPublished,
  historyPublished,
  activePersonal,
  historyPersonal,
  onRidePress,
  onPersonalRidePress,
  onPublishPersonalRide,
}: MyRidesListProps) {
  
  // CLAIMED TAB
  if (activeTab === 'claimed') {
    return (
      <>
        {/* Stats */}
        <View style={styles.myRidesStats}>
          <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
              <Ionicons name="time" size={16} color="#0ea5e9" />
            </View>
            <Text style={styles.statValue}>{claimedRides.length}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{completedRides.length}</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
        </View>

        {/* Claimed Rides - Compact View */}
        {claimedRides.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="time" size={16} color="#0ea5e9" /> En cours
            </Text>
            {claimedRides.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="car-sport-outline"
                iconColor="rgba(14, 165, 233, 0.2)"
              />
            ))}
          </View>
        )}

        {/* Completed Rides - Compact View */}
        {completedRides.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" /> Terminées
            </Text>
            {completedRides.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="checkmark-circle-outline"
                iconColor="rgba(16, 185, 129, 0.2)"
              />
            ))}
          </View>
        )}

        {/* Historique */}
        {historyClaimed.length > 0 && (
          <View style={[styles.section, { marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: '#64748b' }]}>
              <Ionicons name="time-outline" size={16} color="#64748b" /> Historique
            </Text>
            {historyClaimed.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="checkmark-done-outline"
                iconColor="rgba(100, 116, 139, 0.2)"
                opacity={0.6}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {claimedRides.length === 0 && completedRides.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="hand-right-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>Aucune course prise</Text>
            <Text style={styles.emptyStateSubtext}>
              Consultez le marketplace pour prendre une course
            </Text>
          </View>
        )}
      </>
    );
  }
  
  // PUBLISHED TAB
  if (activeTab === 'published') {
    return (
      <>
        {/* Stats */}
        <View style={styles.myRidesStats}>
          <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="megaphone" size={16} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{activePublished.length}</Text>
            <Text style={styles.statLabel}>Actives</Text>
          </View>
          <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#0ea5e9" />
            </View>
            <Text style={styles.statValue}>{claimedPublished.length}</Text>
            <Text style={styles.statLabel}>Prises</Text>
          </View>
        </View>

        {/* Active Published */}
        {activePublished.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="megaphone" size={16} color="#10b981" /> Actives
            </Text>
            {activePublished.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="megaphone-outline"
                iconColor="rgba(16, 185, 129, 0.2)"
                statusBadge="PUBLIÉE"
                statusBadgeColor="#10b981"
              />
            ))}
          </View>
        )}

        {/* Claimed Published */}
        {claimedPublished.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="checkmark-circle" size={16} color="#0ea5e9" /> Prises
            </Text>
            {claimedPublished.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="hand-right-outline"
                iconColor="rgba(14, 165, 233, 0.2)"
                statusBadge="PRISE"
                statusBadgeColor="#0ea5e9"
              />
            ))}
          </View>
        )}

        {/* Historique */}
        {historyPublished.length > 0 && (
          <View style={[styles.section, { marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: '#64748b' }]}>
              <Ionicons name="time-outline" size={16} color="#64748b" /> Historique
            </Text>
            {historyPublished.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="checkmark-done-outline"
                iconColor="rgba(100, 116, 139, 0.2)"
                opacity={0.6}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {activePublished.length === 0 && claimedPublished.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>Aucune course publiée</Text>
            <Text style={styles.emptyStateSubtext}>
              Publiez une course pour la partager avec d'autres chauffeurs
            </Text>
          </View>
        )}
      </>
    );
  }
  
  // PERSONAL TAB
  if (activeTab === 'personal') {
    return (
      <>
        {/* Stats */}
        <View style={styles.myRidesStats}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Ionicons name="lock-closed" size={16} color="#8b5cf6" />
            </View>
            <Text style={styles.statValue}>{activePersonal.length}</Text>
            <Text style={styles.statLabel}>Actives</Text>
          </View>
        </View>

        {/* Active Personal */}
        {activePersonal.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="lock-closed" size={16} color="#8b5cf6" /> Actives
            </Text>
            {activePersonal.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onPersonalRidePress}
                iconName="lock-closed-outline"
                iconColor="rgba(139, 92, 246, 0.2)"
                showPublishButton={true}
                onPublish={onPublishPersonalRide}
              />
            ))}
          </View>
        )}

        {/* Historique */}
        {historyPersonal.length > 0 && (
          <View style={[styles.section, { marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: '#64748b' }]}>
              <Ionicons name="time-outline" size={16} color="#64748b" /> Historique
            </Text>
            {historyPersonal.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onPersonalRidePress}
                iconName="checkmark-done-outline"
                iconColor="rgba(100, 116, 139, 0.2)"
                opacity={0.6}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {activePersonal.length === 0 && historyPersonal.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>Aucune course personnelle</Text>
            <Text style={styles.emptyStateSubtext}>
              Créez une course privée pour votre propre usage
            </Text>
          </View>
        )}
      </>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  myRidesStats: {
    flexDirection: 'row',
    marginBottom: 16,
    marginHorizontal: 20,
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactRideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  compactRideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactRideIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactRideInfo: {
    flex: 1,
  },
  compactRideTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  compactRideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  compactRideAddress: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
  },
  compactRideRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  compactRidePriceContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  compactRidePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  compactStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  compactStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  publishButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

