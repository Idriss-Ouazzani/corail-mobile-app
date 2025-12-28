import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Ride } from '../types';

interface RideDetailScreenProps {
  ride: Ride;
  currentUserId: string;
  onBack: () => void;
  onClaim?: () => void;
  onDelete?: () => void;
}

export const RideDetailScreen: React.FC<RideDetailScreenProps> = ({
  ride,
  currentUserId,
  onBack,
  onClaim,
  onDelete,
}) => {
  const isMyRide = ride.creator_id === currentUserId;
  
  const handleDelete = () => {
    Alert.alert(
      'Supprimer la course',
      'Êtes-vous sûr de vouloir supprimer cette course ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDelete?.(),
        },
      ]
    );
  };
  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
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

  const openInMaps = (type: 'google' | 'waze' | 'apple') => {
    const pickup = encodeURIComponent(ride.pickup_address);
    const dropoff = encodeURIComponent(ride.dropoff_address);
    
    let url = '';
    switch (type) {
      case 'google':
        url = `https://www.google.com/maps/dir/${pickup}/${dropoff}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?ll=${pickup}&navigate=yes`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}`;
        break;
    }
    
    Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application'));
  };

  const handleShare = async () => {
    try {
      const message = `🪸 Course Corail VTC\n\n` +
        `📍 ${ride.pickup_address}\n` +
        `📍 ${ride.dropoff_address}\n\n` +
        `💰 ${formatPrice(ride.price_cents)}\n` +
        `📅 ${formatDate(ride.scheduled_at)}\n\n` +
        `${ride.creator?.full_name ? `👤 Proposé par ${ride.creator.full_name}\n` : ''}` +
        `${ride.visibility === 'GROUP' ? '👥 Réservé au groupe\n' : '🌍 Public\n'}` +
        `\n✨ Téléchargez Corail VTC pour réserver !`;

      const result = await Share.share({
        message: message,
        title: 'Course Corail VTC',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Partagé via une app spécifique
          Alert.alert('Succès', 'Course partagée avec succès !');
        } else {
          // Partagé mais on ne sait pas via quelle app
          Alert.alert('Succès', 'Course partagée avec succès !');
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager la course');
    }
  };

  const handleContactWhatsApp = () => {
    // Numéro de téléphone fictif pour démo - à remplacer par le vrai numéro du créateur
    const phoneNumber = '+33612345678';
    const message = encodeURIComponent(
      `Bonjour ${ride.creator?.full_name}, je suis intéressé par votre course : ${ride.pickup_address} → ${ride.dropoff_address}`
    );
    const url = `https://wa.me/${phoneNumber.replace('+', '')}?text=${message}`;
    Linking.openURL(url).catch(() => Alert.alert('Erreur', 'WhatsApp n\'est pas installé'));
  };

  const handleContactPhone = () => {
    const phoneNumber = '+33612345678'; // Numéro fictif pour démo
    Linking.openURL(`tel:${phoneNumber}`).catch(() => Alert.alert('Erreur', 'Impossible d\'appeler'));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.headerTitle}>Détails de la course</Text>
          {isMyRide && (
            <View style={styles.myRideBadgeHeader}>
              <Ionicons name="star" size={12} color="#000" />
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-social" size={22} color="#ff6b47" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Price & Status */}
        <View style={styles.priceStatusSection}>
          <LinearGradient
            colors={['#ff6b47', '#ff8a6d']}
            style={styles.priceCard}
          >
            <Ionicons name="wallet" size={28} color="#fff" style={{ opacity: 0.9 }} />
            <View style={styles.priceContent}>
              <Text style={styles.priceLabel}>Montant</Text>
              <Text style={styles.priceValue}>{formatPrice(ride.price_cents)}</Text>
            </View>
          </LinearGradient>

          {ride.status === 'PUBLISHED' && (
            <View style={styles.statusCard}>
              <View style={styles.statusDot} />
              <Text style={styles.statusLabel}>Disponible maintenant</Text>
            </View>
          )}
        </View>

        {/* Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itinéraire</Text>
          <View style={styles.routeCard}>
            {/* Departure */}
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#10b981' }]} />
              <View style={styles.routePointContent}>
                <Text style={styles.routePointLabel}>DÉPART</Text>
                <Text style={styles.routePointAddress}>{ride.pickup_address}</Text>
              </View>
            </View>

            {/* Line */}
            <View style={styles.routeLine}>
              <View style={styles.routeLineDashed} />
              <Ionicons name="arrow-down" size={20} color="#64748b" style={styles.routeArrow} />
            </View>

            {/* Arrival */}
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#ff6b47' }]} />
              <View style={styles.routePointContent}>
                <Text style={styles.routePointLabel}>ARRIVÉE</Text>
                <Text style={styles.routePointAddress}>{ride.dropoff_address}</Text>
              </View>
            </View>
          </View>

          {/* Navigation Options */}
          <Text style={styles.navTitle}>Ouvrir dans :</Text>
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => openInMaps('google')}
              activeOpacity={0.7}
            >
              <Ionicons name="map" size={20} color="#4285F4" />
              <Text style={styles.navButtonText}>Google Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => openInMaps('waze')}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate" size={20} color="#33CCFF" />
              <Text style={styles.navButtonText}>Waze</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => openInMaps('apple')}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.navButtonText}>Apple Plans</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horaire</Text>
          <View style={styles.scheduleCard}>
            <Ionicons name="calendar" size={24} color="#0ea5e9" />
            <Text style={styles.scheduleText}>{formatDate(ride.scheduled_at)}</Text>
          </View>
        </View>

        {/* Creator */}
        {ride.creator && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Apporteur d'affaires</Text>
            <View style={[styles.creatorCard, isMyRide && styles.creatorCardMyRide]}>
              <View style={[styles.creatorAvatar, isMyRide && styles.creatorAvatarMyRide]}>
                <Text style={styles.creatorInitials}>
                  {ride.creator.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              <View style={styles.creatorInfo}>
                <Text style={[styles.creatorName, isMyRide && styles.creatorNameMyRide]}>
                  {isMyRide ? 'Vous-même' : ride.creator.full_name}
                </Text>
                <Text style={styles.creatorEmail}>{ride.creator.email}</Text>
                <View style={styles.creatorRating}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.creatorRatingText}>
                    {(ride.creator.rating / 10).toFixed(1)} ({ride.creator.total_reviews} avis)
                  </Text>
                </View>
              </View>
              {isMyRide && (
                <View style={styles.myRideIndicator}>
                  <Ionicons name="star" size={20} color="#fbbf24" />
                </View>
              )}
            </View>

            {/* Contact Buttons (only if not my ride) */}
            {!isMyRide && (
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleContactWhatsApp}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#25D366', '#20BA5A']}
                    style={styles.contactButtonGradient}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    <Text style={styles.contactButtonText}>WhatsApp</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleContactPhone}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#0ea5e9', '#38bdf8']}
                    style={styles.contactButtonGradient}
                  >
                    <Ionicons name="call" size={20} color="#fff" />
                    <Text style={styles.contactButtonText}>Appeler</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.tags}>
            {ride.visibility === 'PUBLIC' && (
              <View style={[styles.tag, { backgroundColor: '#0ea5e9' }]}>
                <Ionicons name="globe" size={14} color="#fff" />
                <Text style={styles.tagText}>Public</Text>
              </View>
            )}
            {ride.visibility === 'GROUP' && (
              <View style={[styles.tag, { backgroundColor: '#a855f7' }]}>
                <Ionicons name="people" size={14} color="#fff" />
                <Text style={styles.tagText}>Groupe</Text>
              </View>
            )}
            {!ride.commission_enabled && (
              <View style={[styles.tag, { backgroundColor: '#10b981' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.tagText}>Sans commission</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      {!isMyRide && ride.status === 'PUBLISHED' && onClaim && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onClaim}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6b47', '#ff8a6d']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="car" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Prendre cette course</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Button - Only for creator */}
      {isMyRide && ride.status === 'PUBLISHED' && onDelete && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="trash" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Supprimer cette course</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  myRideBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myRideBadgeHeader: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  priceStatusSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  priceContent: {
    marginLeft: 16,
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    marginRight: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  routePointContent: {
    flex: 1,
  },
  routePointLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  routePointAddress: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '600',
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    marginVertical: 12,
  },
  routeLineDashed: {
    width: 2,
    height: 40,
    backgroundColor: '#475569',
  },
  routeArrow: {
    marginLeft: 8,
  },
  navTitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  navButtonText: {
    fontSize: 11,
    color: '#f1f5f9',
    fontWeight: '600',
    marginTop: 6,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scheduleText: {
    fontSize: 15,
    color: '#f1f5f9',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  creatorCardMyRide: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff6b47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  creatorAvatarMyRide: {
    backgroundColor: '#fbbf24',
  },
  creatorInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '700',
    marginBottom: 4,
  },
  creatorNameMyRide: {
    color: '#fbbf24',
  },
  creatorEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  creatorRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorRatingText: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '600',
  },
  myRideIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  contactButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 6,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
});

export default RideDetailScreen;

