/**
 * MyRidesList - Affiche les listes de courses selon l'onglet actif
 * Pagination : 5 par section + "Voir plus". Section passées en style historique (grisée).
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PAGE_SIZE = 5;
const INITIAL_PAGE_SIZE = 5;

interface Ride {
  id: string;
  pickup_address?: string;
  dropoff_address?: string;
  scheduled_at?: string;
  price_cents?: number | null;
  status: string;
  [key: string]: any;
}

interface MyRidesListProps {
  activeTab: 'claimed' | 'published' | 'personal';
  
  // Claimed tab data
  claimedRides: Ride[];
  completedRides: Ride[];
  
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

function getRideAmountLabel(ride: Ride): string {
  const cents = Number(ride.price_cents ?? 0);
  if (!Number.isFinite(cents) || cents <= 0) return 'Devis';
  return `${(cents / 100).toFixed(2)}€`;
}

function getClaimedQuoteBadge(ride: Ride): { text: string; color: string } | null {
  if ((ride.source || '').toLowerCase() !== 'client') return null;
  const q = String((ride as any).quote_status || '').toUpperCase();
  if (q === 'SENT' || q === 'VIEWED') return { text: 'DEVIS EN ATTENTE', color: '#f59e0b' };
  if (q === 'ACCEPTED') return { text: 'CONFIRMÉE', color: '#10b981' };
  if (q === 'REFUSED') return { text: 'REFUSÉE', color: '#ef4444' };
  return { text: 'À CHIFFRER', color: '#64748b' };
}

// Sous-composant pour afficher une course compacte (isHistoric = passées ; isPastDue = date passée, à terminer)
function CompactRideRow({ 
  ride, 
  onPress, 
  iconName, 
  iconColor, 
  opacity = 1, 
  isHistoric = false,
  isPastDue = false,
  showPublishButton = false, 
  onPublish,
  statusBadge,
  statusBadgeColor,
}: any) {
  const rowStyle = [
    styles.compactRideRow,
    isHistoric && styles.compactRideRowHistoric,
    isPastDue && styles.compactRideRowPastDue,
  ];
  const textMuted = isHistoric || (opacity < 1 && !isPastDue);
  // Si le bouton publier existe, on a besoin d'un layout spécial
  if (showPublishButton && onPublish) {
    return (
      <View style={[rowStyle, { opacity }]}>
        <TouchableOpacity
          style={[styles.compactRideLeft, { flex: 1 }]}
          onPress={() => onPress(ride)}
          activeOpacity={0.7}
        >
          <View style={[styles.compactRideIconWrapper, iconColor && { backgroundColor: iconColor }]}>
            <Ionicons name={iconName} size={20} color={iconColor?.replace('0.2', '1') || '#0ea5e9'} />
          </View>
          <View style={styles.compactRideInfo}>
            <View style={styles.compactRideTimeRow}>
              <Text style={[styles.compactRideTime, textMuted && styles.compactRideTimeMuted]}>
                {new Date(ride.scheduled_at).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              {isPastDue && (
                <View style={styles.badgeATerminer}>
                  <Text style={styles.badgeATerminerText}>À terminer</Text>
                </View>
              )}
            </View>
            <View style={styles.compactRideRoute}>
              <Ionicons name="location" size={14} color={isHistoric ? '#64748b' : '#34d399'} />
              <Text style={[styles.compactRideAddress, textMuted && styles.compactRideAddressMuted]} numberOfLines={1}>
                {ride.pickup_address}
              </Text>
            </View>
            <View style={styles.compactRideRoute}>
              <Ionicons name="flag" size={14} color={isHistoric ? '#64748b' : '#f97316'} />
              <Text style={[styles.compactRideAddress, textMuted && styles.compactRideAddressMuted]} numberOfLines={1}>
                {ride.dropoff_address}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.compactRideRight}>
          <Text style={[styles.compactRidePrice, isHistoric && styles.compactRidePriceMuted]}>
            {getRideAmountLabel(ride)}
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
      style={rowStyle}
      onPress={() => onPress(ride)}
      activeOpacity={0.7}
    >
      <View style={styles.compactRideLeft}>
        <View style={[styles.compactRideIconWrapper, iconColor && { backgroundColor: iconColor }, isHistoric && styles.compactRideIconWrapperHistoric]}>
          <Ionicons name={iconName} size={20} color={isHistoric ? '#64748b' : (iconColor?.replace('0.2', '1') || '#0ea5e9')} />
        </View>
        <View style={styles.compactRideInfo}>
          <View style={styles.compactRideTimeRow}>
            <Text style={[styles.compactRideTime, textMuted && styles.compactRideTimeMuted]}>
              {new Date(ride.scheduled_at).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            {isPastDue && (
              <View style={styles.badgeATerminer}>
                <Text style={styles.badgeATerminerText}>À terminer</Text>
              </View>
            )}
          </View>
          <View style={styles.compactRideRoute}>
            <Ionicons name="location" size={14} color={isHistoric ? '#64748b' : '#34d399'} />
            <Text style={[styles.compactRideAddress, textMuted && styles.compactRideAddressMuted]} numberOfLines={1}>
              {ride.pickup_address}
            </Text>
          </View>
          <View style={styles.compactRideRoute}>
            <Ionicons name="flag" size={14} color={isHistoric ? '#64748b' : '#f97316'} />
            <Text style={[styles.compactRideAddress, textMuted && styles.compactRideAddressMuted]} numberOfLines={1}>
              {ride.dropoff_address}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.compactRideRight}>
        <View style={styles.compactRidePriceContainer}>
          <Text style={[styles.compactRidePrice, isHistoric && styles.compactRidePriceMuted]}>
            {getRideAmountLabel(ride)}
          </Text>
          {statusBadge && (
            <View style={[styles.compactStatusBadge, { backgroundColor: statusBadgeColor || '#6366f1' }]}>
              <Text style={styles.compactStatusBadgeText}>{statusBadge}</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={isHistoric ? '#475569' : '#64748b'} />
      </View>
    </TouchableOpacity>
  );
}

export default function MyRidesList({
  activeTab,
  claimedRides,
  completedRides,
  activePublished,
  claimedPublished,
  historyPublished,
  activePersonal,
  historyPersonal,
  onRidePress,
  onPersonalRidePress,
  onPublishPersonalRide,
}: MyRidesListProps) {
  const [limits, setLimits] = useState({
    claimedPendingQuotes: INITIAL_PAGE_SIZE,
    claimedEnCours: INITIAL_PAGE_SIZE,
    claimedTerminees: INITIAL_PAGE_SIZE,
    publishedEnLigne: INITIAL_PAGE_SIZE,
    publishedPrises: INITIAL_PAGE_SIZE,
    publishedHistorique: INITIAL_PAGE_SIZE,
    personalActives: INITIAL_PAGE_SIZE,
    personalHistorique: INITIAL_PAGE_SIZE,
  });
  const setLimit = useCallback((key: keyof typeof limits, value: number) => {
    setLimits((prev) => ({ ...prev, [key]: value }));
  }, []);

  const renderVoirPlus = (count: number, limitKey: keyof typeof limits) => {
    if (count <= limits[limitKey]) return null;
    const rest = count - limits[limitKey];
    return (
      <TouchableOpacity
        style={styles.voirPlus}
        onPress={() => setLimit(limitKey, limits[limitKey] + PAGE_SIZE)}
        activeOpacity={0.7}
      >
        <Text style={styles.voirPlusText}>Voir plus (+{Math.min(rest, PAGE_SIZE)})</Text>
      </TouchableOpacity>
    );
  };

  // CLAIMED TAB
  if (activeTab === 'claimed') {
    const pendingQuoteRides = claimedRides.filter((ride) => {
      if ((ride.source || '').toLowerCase() !== 'client') return false;
      const q = String((ride as any).quote_status || '').toUpperCase();
      return q === 'SENT' || q === 'VIEWED';
    });
    const otherClaimedRides = claimedRides.filter((ride) => !pendingQuoteRides.includes(ride));
    const shownPendingQuotes = pendingQuoteRides.slice(0, limits.claimedPendingQuotes);
    const shownClaimed = otherClaimedRides.slice(0, limits.claimedEnCours);
    const shownCompleted = completedRides.slice(0, limits.claimedTerminees);
    return (
      <>
        {pendingQuoteRides.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Devis en attente de réponse</Text>
            {shownPendingQuotes.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="time-outline"
                iconColor="rgba(245, 158, 11, 0.2)"
                statusBadge="DEVIS EN ATTENTE"
                statusBadgeColor="#f59e0b"
                isPastDue={ride.scheduled_at ? new Date(ride.scheduled_at).getTime() < Date.now() : false}
              />
            ))}
            {renderVoirPlus(pendingQuoteRides.length, 'claimedPendingQuotes')}
          </View>
        )}

        {claimedRides.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>En cours (devis / confirmées)</Text>
            {shownClaimed.map((ride) => (
              (() => {
                const badge = getClaimedQuoteBadge(ride);
                return (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="car-sport-outline"
                iconColor="rgba(14, 165, 233, 0.2)"
                statusBadge={badge?.text}
                statusBadgeColor={badge?.color}
                isPastDue={ride.scheduled_at ? new Date(ride.scheduled_at).getTime() < Date.now() : false}
              />
                );
              })()
            ))}
            {renderVoirPlus(otherClaimedRides.length, 'claimedEnCours')}
          </View>
        )}

        {completedRides.length > 0 && (
          <View style={[styles.section, styles.historicSection]}>
            <Text style={styles.sectionLabelHistoric}>Passées (historique)</Text>
            {shownCompleted.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="checkmark-circle-outline"
                iconColor="rgba(16, 185, 129, 0.2)"
                isHistoric={true}
              />
            ))}
            {renderVoirPlus(completedRides.length, 'claimedTerminees')}
          </View>
        )}

        {claimedRides.length === 0 && completedRides.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="hand-right-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>Aucune course à faire</Text>
            <Text style={styles.emptyStateSubtext}>
              Prenez une course dans Annonces pour la voir ici
            </Text>
          </View>
        )}
      </>
    );
  }
  
  // PUBLISHED TAB
  if (activeTab === 'published') {
    const shownEnLigne = activePublished.slice(0, limits.publishedEnLigne);
    const shownPrises = claimedPublished.slice(0, limits.publishedPrises);
    const shownHistoriquePub = historyPublished.slice(0, limits.publishedHistorique);
    return (
      <>
        {activePublished.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>En ligne</Text>
            {shownEnLigne.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="megaphone-outline"
                iconColor="rgba(16, 185, 129, 0.2)"
                statusBadge="PUBLIÉE"
                statusBadgeColor="#10b981"
                isPastDue={ride.scheduled_at ? new Date(ride.scheduled_at).getTime() < Date.now() : false}
              />
            ))}
            {renderVoirPlus(activePublished.length, 'publishedEnLigne')}
          </View>
        )}

        {claimedPublished.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Prises par un chauffeur</Text>
            {shownPrises.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onRidePress}
                iconName="hand-right-outline"
                iconColor="rgba(14, 165, 233, 0.2)"
                statusBadge="PRISE"
                statusBadgeColor="#0ea5e9"
                isPastDue={ride.scheduled_at ? new Date(ride.scheduled_at).getTime() < Date.now() : false}
              />
            ))}
            {renderVoirPlus(claimedPublished.length, 'publishedPrises')}
          </View>
        )}

        {historyPublished.length > 0 && (
          <View style={[styles.section, styles.historicSection]}>
            <Text style={styles.sectionLabelHistoric}>Passées (historique)</Text>
            {shownHistoriquePub.map((ride) => {
              const st = (ride.status || '').toUpperCase();
              const histLabel = st === 'EXPIRED' ? 'EXPIRÉE' : 'PASSÉE';
              const histColor = st === 'EXPIRED' ? '#94a3b8' : '#64748b';
              return (
                <CompactRideRow
                  key={ride.id}
                  ride={ride}
                  onPress={onRidePress}
                  iconName="time-outline"
                  iconColor="rgba(100, 116, 139, 0.25)"
                  isHistoric={true}
                  statusBadge={histLabel}
                  statusBadgeColor={histColor}
                />
              );
            })}
            {renderVoirPlus(historyPublished.length, 'publishedHistorique')}
          </View>
        )}

        {activePublished.length === 0 && claimedPublished.length === 0 && historyPublished.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>Aucune annonce en ligne</Text>
            <Text style={styles.emptyStateSubtext}>
              Publiez une course depuis Annonces pour la proposer aux autres
            </Text>
          </View>
        )}
      </>
    );
  }
  
  // PERSONAL TAB
  if (activeTab === 'personal') {
    const shownPersonal = activePersonal.slice(0, limits.personalActives);
    const shownHistoriquePerso = historyPersonal.slice(0, limits.personalHistorique);
    const personalHistoryLabel = (status: string | undefined) => {
      const u = (status || '').toUpperCase();
      if (u === 'COMPLETED') return { text: 'TERMINÉE', color: '#10b981' };
      if (u === 'EXPIRED') return { text: 'EXPIRÉE', color: '#94a3b8' };
      if (u === 'CANCELLED') return { text: 'ANNULÉE', color: '#f97316' };
      return { text: 'PASSÉE', color: '#64748b' };
    };
    return (
      <>
        {activePersonal.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Actives</Text>
            {shownPersonal.map((ride) => (
              <CompactRideRow
                key={ride.id}
                ride={ride}
                onPress={onPersonalRidePress}
                iconName="lock-closed-outline"
                iconColor="rgba(139, 92, 246, 0.2)"
                showPublishButton={true}
                onPublish={onPublishPersonalRide}
                isPastDue={ride.scheduled_at ? new Date(ride.scheduled_at).getTime() < Date.now() : false}
              />
            ))}
            {renderVoirPlus(activePersonal.length, 'personalActives')}
          </View>
        )}

        {historyPersonal.length > 0 && (
          <View style={[styles.section, activePersonal.length > 0 && styles.historicSection]}>
            <Text style={styles.sectionLabelHistoric}>Passées (historique)</Text>
            {shownHistoriquePerso.map((ride) => {
              const badge = personalHistoryLabel(ride.status);
              return (
                <CompactRideRow
                  key={ride.id}
                  ride={ride}
                  onPress={onPersonalRidePress}
                  iconName="lock-closed-outline"
                  iconColor="rgba(100, 116, 139, 0.2)"
                  isHistoric={true}
                  statusBadge={badge.text}
                  statusBadgeColor={badge.color}
                />
              );
            })}
            {renderVoirPlus(historyPersonal.length, 'personalHistorique')}
          </View>
        )}

        {activePersonal.length === 0 && historyPersonal.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>Aucune course privée</Text>
            <Text style={styles.emptyStateSubtext}>
              Créez une course (mode privé) pour votre usage uniquement
            </Text>
          </View>
        )}
      </>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
    marginHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionLabelHistoric: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  historicSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.6)',
  },
  sectionLabelMuted: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  compactRideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  compactRideRowHistoric: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderColor: 'rgba(51, 65, 85, 0.35)',
    opacity: 0.95,
  },
  compactRideRowPastDue: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
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
  compactRideTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  compactRideTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  compactRideTimeMuted: {
    color: '#64748b',
  },
  compactRideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  compactRideAddress: {
    fontSize: 13,
    fontWeight: '500',
    color: '#cbd5e1',
    flex: 1,
    lineHeight: 18,
  },
  compactRideAddressMuted: {
    color: '#64748b',
  },
  compactRideRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  compactRidePriceContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  compactRidePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: -0.2,
  },
  compactRidePriceMuted: {
    color: '#64748b',
  },
  compactRideIconWrapperHistoric: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  badgeATerminer: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeATerminerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  voirPlus: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  voirPlusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
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
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

