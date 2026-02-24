/**
 * MarketplaceRideCard - Carte compacte pour une course du Market (annonces)
 * Aperçu clair + bouton Prendre
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RideSource } from '../types';

const MAX_ADDRESS = 28;

function shorten(str: string, max: number = MAX_ADDRESS) {
  if (!str || str.length <= max) return str || '—';
  return str.slice(0, max - 2).trim() + '…';
}

function formatWhen(scheduled_at: string | undefined) {
  if (!scheduled_at) return '—';
  const d = new Date(scheduled_at);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString();
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Auj. ${time}`;
  if (isTomorrow) return `Dem. ${time}`;
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const SOURCE_LABELS: Record<RideSource, string> = {
  chauffeur: 'Chauffeur',
  hotel: 'Hôtel',
  client: 'Client',
};
const SOURCE_ICONS: Record<RideSource, string> = {
  chauffeur: 'car-sport-outline',
  hotel: 'business-outline',
  client: 'person-outline',
};
const SOURCE_COLORS: Record<RideSource, string> = {
  chauffeur: '#64748b',
  hotel: '#f59e0b',
  client: '#0ea5e9',
};
const SOURCE_BG: Record<RideSource, string> = {
  chauffeur: 'rgba(100, 116, 139, 0.25)',
  hotel: 'rgba(245, 158, 11, 0.2)',
  client: 'rgba(14, 165, 233, 0.2)',
};

interface MarketplaceRideCardProps {
  ride: {
    id: string;
    creator_id?: string;
    visibility?: string;
    group_id?: string | null;
    group_name?: string;
    pickup_address?: string;
    dropoff_address?: string;
    scheduled_at?: string;
    price_cents?: number;
    distance_km?: number;
    duration_minutes?: number;
    source?: RideSource;
    [key: string]: any;
  };
  currentUserId: string | null;
  onPress: () => void;
}

export function MarketplaceRideCard({ ride, currentUserId, onPress }: MarketplaceRideCardProps) {
  const isMine = !!(currentUserId && ride.creator_id && ride.creator_id === currentUserId);
  const isGroup = ride.visibility === 'GROUP';
  const visibilityLabel = isGroup ? (ride.group_name || 'Groupe') : 'Public';
  const source: RideSource = ride.source || 'chauffeur';
  const sourceLabel = SOURCE_LABELS[source];
  const sourceIcon = SOURCE_ICONS[source];
  const sourceColor = SOURCE_COLORS[source];
  const pickup = shorten(ride.pickup_address || '');
  const dropoff = shorten(ride.dropoff_address || '');
  const when = formatWhen(ride.scheduled_at);
  const isClientDemand = ride.source === 'client';
  const price = ride.price_cents != null ? `${(ride.price_cents / 100).toFixed(0)} €` : '—';
  const indicativeRange =
    isClientDemand && ride.indicative_low_cents != null && ride.indicative_high_cents != null
      ? `${(ride.indicative_low_cents / 100).toFixed(0)}€ – ${(ride.indicative_high_cents / 100).toFixed(0)}€`
      : null;
  const pricePerKm = ride.distance_km != null && ride.distance_km > 0 && ride.price_cents != null
    ? ((ride.price_cents / 100) / ride.distance_km).toFixed(2)
    : null;
  const extra = [ride.distance_km != null && `${ride.distance_km} km`, ride.duration_minutes != null && `${ride.duration_minutes} min`]
    .filter(Boolean)
    .join(' · ');

  const cardSourceStyle = !isMine && (source === 'chauffeur' ? styles.cardChauffeur : source === 'hotel' ? styles.cardHotel : styles.cardClient);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, isMine && styles.cardMine, cardSourceStyle]}>
      <View style={styles.badgesRow}>
        {isMine && (
          <View style={styles.badgeMine}>
            <Ionicons name="person" size={10} color="#0ea5e9" />
            <Text style={styles.badgeMineText}>Ma course</Text>
          </View>
        )}
        <View style={[styles.badgeVisibility, isGroup && styles.badgeGroup]}>
          <Ionicons name={isGroup ? 'people' : 'globe-outline'} size={10} color={isGroup ? '#a78bfa' : '#94a3b8'} />
          <Text style={[styles.badgeVisibilityText, isGroup && styles.badgeGroupText]}>{visibilityLabel}</Text>
        </View>
        <View style={[styles.badgeSource, { backgroundColor: SOURCE_BG[source] }]}>
          <Ionicons name={sourceIcon as any} size={10} color={sourceColor} />
          <Text style={[styles.badgeSourceText, { color: sourceColor }]}>{sourceLabel}</Text>
        </View>
      </View>
      <View style={styles.main}>
        <View style={styles.route}>
          <View style={styles.routeRow}>
            <Ionicons name="location" size={14} color="#34d399" style={styles.routeIcon} />
            <Text style={styles.address} numberOfLines={1}>{pickup}</Text>
          </View>
          <View style={styles.routeRow}>
            <Ionicons name="flag" size={14} color="#f97316" style={styles.routeIcon} />
            <Text style={styles.address} numberOfLines={1}>{dropoff}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <View style={styles.rightBlock}>
            {isClientDemand && indicativeRange != null && (
              <Text style={styles.indicativeRange}>Fourchette : {indicativeRange}</Text>
            )}
            <Text style={styles.price}>{price}</Text>
            {isClientDemand && <Text style={styles.budgetClient}>Budget client</Text>}
            {pricePerKm != null && !isClientDemand && (
              <Text style={styles.pricePerKm}>{pricePerKm} €/km</Text>
            )}
            <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.8}>
              <Text style={styles.btnText}>
                {isClientDemand || isGroup ? 'Prendre' : 'Prendre (-1 crédit)'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.when}>{when}</Text>
        {extra ? <Text style={styles.extra} numberOfLines={1}>{extra}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMine: {
    borderColor: 'rgba(14, 165, 233, 0.4)',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  cardChauffeur: {
    backgroundColor: 'rgba(71, 85, 105, 0.25)',
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  cardHotel: {
    backgroundColor: 'rgba(120, 53, 15, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  cardClient: {
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderColor: 'rgba(14, 165, 233, 0.35)',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badgeMine: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  badgeMineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
  },
  badgeVisibility: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  badgeGroup: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  badgeVisibilityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  badgeGroupText: {
    color: '#c4b5fd',
  },
  badgeSource: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  badgeSourceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  main: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  route: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
    gap: 6,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {
    marginRight: 8,
  },
  address: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    flex: 1,
    lineHeight: 20,
  },
  right: {
    justifyContent: 'center',
    minWidth: 96,
  },
  rightBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: -0.3,
  },
  pricePerKm: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  indicativeRange: {
    fontSize: 11,
    color: '#94a3b8',
  },
  budgetClient: {
    fontSize: 11,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    minWidth: 92,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
    gap: 10,
  },
  when: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  extra: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
});
