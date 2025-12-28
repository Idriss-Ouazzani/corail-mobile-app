import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Ride } from '../types';

interface RideCardProps {
  ride: Ride;
  onPress?: () => void;
  currentUserId?: string;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onPress, currentUserId = 'user2' }) => {
  const isMyRide = ride.creator_id === currentUserId;
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

  // Obtenir le nom d'affichage du créateur
  const getCreatorDisplayName = () => {
    if (isMyRide) return 'Vous-même';
    if (ride.creator?.full_name) return ride.creator.full_name;
    // Afficher les 8 premiers caractères du creator_id si pas de nom
    return `Utilisateur ${ride.creator_id.slice(0, 8)}...`;
  };

  const getCreatorInitials = () => {
    if (ride.creator?.full_name) {
      return ride.creator.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    // Utiliser les 2 premiers caractères de l'ID Firebase
    return ride.creator_id.slice(0, 2).toUpperCase();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <LinearGradient
        colors={isMyRide 
          ? ['rgba(251, 191, 36, 0.08)', 'rgba(251, 191, 36, 0.02)']
          : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
        }
        style={[styles.gradient, isMyRide && styles.gradientMyRide]}
      >
        {/* Small elegant badge for "Votre course" */}
        {isMyRide && (
          <View style={styles.myRideBadge}>
            <Ionicons name="star" size={10} color="#000" />
            <Text style={styles.myRideBadgeText}>Votre course</Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(ride.price_cents)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(ride.status)}</Text>
          </View>
        </View>

        {/* Route - Improved with continuous line */}
        <View style={styles.route}>
          {/* Continuous Line */}
          <View style={styles.routeLineContainer}>
            <View style={[styles.routeDot, { backgroundColor: '#10b981' }]} />
            <View style={styles.routeLineContinuous} />
            <Ionicons name="arrow-down" size={16} color="#64748b" style={styles.routeArrow} />
            <View style={styles.routeLineContinuous} />
            <View style={[styles.routeDot, { backgroundColor: '#ff6b47' }]} />
          </View>
          
          {/* Route Content */}
          <View style={styles.routeContentContainer}>
            <View style={styles.routeBox}>
              <Text style={styles.routeLabel}>DÉPART</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {ride.pickup_address}
              </Text>
            </View>
            
            <View style={styles.routeSpacer} />
            
            <View style={styles.routeBox}>
              <Text style={styles.routeLabel}>ARRIVÉE</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {ride.dropoff_address}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer - Time & Creator */}
        <View style={styles.footer}>
          <View style={styles.timeContainer}>
            <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
            <Text style={styles.time}>{formatDate(ride.scheduled_at)}</Text>
          </View>
        </View>
        
        {/* Creator - Always visible with elegant design */}
        <View style={[styles.creatorSection, isMyRide && styles.creatorSectionMyRide]}>
          <View style={[styles.creatorAvatar, isMyRide && styles.creatorAvatarMyRide]}>
            <Text style={styles.creatorInitials}>
              {getCreatorInitials()}
            </Text>
          </View>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorLabel}>Apporteur d'affaires</Text>
            <Text style={[styles.creatorName, isMyRide && styles.creatorNameMyRide]}>
              {getCreatorDisplayName()}
            </Text>
          </View>
          {isMyRide && (
            <View style={styles.myRideIndicator}>
              <Ionicons name="star" size={16} color="#fbbf24" />
            </View>
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
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  gradient: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  gradientMyRide: {
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  // Small elegant badge
  myRideBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  myRideBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  // Route - Improved with continuous line
  route: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  routeLineContainer: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  routeLineContinuous: {
    width: 2,
    height: 24,
    backgroundColor: '#475569',
  },
  routeArrow: {
    marginVertical: 2,
  },
  routeContentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routeBox: {
    flex: 1,
  },
  routeSpacer: {
    height: 12,
  },
  routeLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  routeAddress: {
    fontSize: 15,
    color: '#f1f5f9',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 6,
  },
  // Creator - Enhanced Highlight
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  creatorSectionMyRide: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff6b47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatarMyRide: {
    backgroundColor: '#fbbf24',
  },
  creatorInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creatorName: {
    fontSize: 14,
    color: '#f1f5f9',
    fontWeight: '600',
  },
  creatorNameMyRide: {
    color: '#fbbf24',
  },
  myRideIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default RideCard;

