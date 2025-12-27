import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Ride } from '../types';

interface RideCardProps {
  ride: Ride;
  onPress?: () => void;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onPress }) => {
  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return '#10b981';
      case 'CLAIMED': return '#0ea5e9';
      case 'COMPLETED': return '#6b7280';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'Disponible';
      case 'CLAIMED': return 'En cours';
      case 'COMPLETED': return 'Terminée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(ride.price_cents)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(ride.status)}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.route}>
          <View style={styles.routeItem}>
            <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>DÉPART</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {ride.pickup_address}
              </Text>
            </View>
          </View>
          
          <View style={styles.routeLine} />
          
          <View style={styles.routeItem}>
            <View style={[styles.dot, { backgroundColor: '#ff6b47' }]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>ARRIVÉE</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {ride.dropoff_address}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.time}>📅 {formatDate(ride.scheduled_at)}</Text>
          {ride.creator && (
            <Text style={styles.creator}>👤 {ride.creator.full_name}</Text>
          )}
        </View>

        {/* Tags */}
        <View style={styles.tags}>
          {ride.visibility === 'PUBLIC' && (
            <View style={[styles.tag, { backgroundColor: '#0ea5e9' }]}>
              <Text style={styles.tagText}>Public</Text>
            </View>
          )}
          {ride.visibility === 'GROUP' && (
            <View style={[styles.tag, { backgroundColor: '#a855f7' }]}>
              <Text style={styles.tagText}>Groupe</Text>
            </View>
          )}
          {!ride.commission_enabled && (
            <View style={[styles.tag, { backgroundColor: '#10b981' }]}>
              <Text style={styles.tagText}>Sans commission</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff8a6d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  route: {
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b9e6fe',
    letterSpacing: 1,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: 'rgba(185, 230, 254, 0.3)',
    marginLeft: 5,
    marginVertical: -4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  time: {
    fontSize: 13,
    color: '#7dd3fc',
  },
  creator: {
    fontSize: 13,
    color: '#7dd3fc',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default RideCard;

