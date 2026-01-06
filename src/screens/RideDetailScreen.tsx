import React, { useState, useEffect } from 'react';
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
import { MapNavigationCard } from '../components/MapNavigationCard';

interface RideDetailScreenProps {
  ride: Ride;
  currentUserId: string;
  userCredits?: number;
  onBack: () => void;
  onClaim?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onConvertToPersonal?: () => void;
}

interface RouteInfo {
  distance: string;
  duration: string;
  distanceMeters: number;
  durationSeconds: number;
}

export const RideDetailScreen: React.FC<RideDetailScreenProps> = ({
  ride,
  currentUserId,
  userCredits = 0,
  onBack,
  onClaim,
  onDelete,
  onComplete,
  onConvertToPersonal,
}) => {
  // Les courses personnelles utilisent driver_id, les courses marketplace utilisent creator_id
  const isMyRide = ride.creator_id === currentUserId || (ride as any).driver_id === currentUserId;
  const isPicker = ride.picker_id === currentUserId;
  
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  
  const canSeeClientInfo = 
    ride.visibility === 'PERSONAL' || 
    isMyRide || 
    isPicker;

  // Calculer le temps restant avant la course
  const getTimeUntilRide = () => {
    const now = new Date();
    const rideTime = new Date(ride.scheduled_at);
    const diff = rideTime.getTime() - now.getTime();
    
    if (diff < 0) {
      return 'Passée';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `Dans ${days}j ${hours % 24}h`;
    } else if (hours > 0) {
      return `Dans ${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } else if (minutes > 0) {
      return `Dans ${minutes} min`;
    } else {
      return 'Imminent';
    }
  };
  
  // Charger les infos de distance/durée depuis les données de la course
  useEffect(() => {
    if (ride.distance_km && ride.duration_minutes) {
      setRouteInfo({
        distance: `${ride.distance_km} km`,
        duration: `${ride.duration_minutes} min`,
        distanceMeters: ride.distance_km * 1000,
        durationSeconds: ride.duration_minutes * 60,
      });
    }
  }, [ride]);

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

  const handleConvertToPersonal = () => {
    Alert.alert(
      'M\'affecter cette course',
      'Voulez-vous récupérer cette course en tant que course personnelle ?\n\n⚠️ Vous perdrez le crédit gagné lors de la publication (-1 crédit).',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: () => onConvertToPersonal?.(),
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
    const time = date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return { day, time };
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

      await Share.share({ message, title: 'Course Corail VTC' });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager la course');
    }
  };

  const timeUntil = getTimeUntilRide();
  const dateInfo = formatShortDate(ride.scheduled_at);

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
        {/* Horaire + Prix en haut */}
        <View style={styles.topSection}>
          {/* Horaire avec countdown */}
          <View style={styles.scheduleTopCard}>
            <View style={styles.scheduleIconContainer}>
              <Ionicons name="calendar-outline" size={28} color="#0ea5e9" />
            </View>
            <View style={styles.scheduleTopContent}>
              <Text style={styles.scheduleTopDate}>{dateInfo.day}</Text>
              <View style={styles.scheduleTimeRow}>
                <Text style={styles.scheduleTopTime}>{dateInfo.time}</Text>
                <View style={styles.scheduleCountdown}>
                  <Ionicons name="time-outline" size={14} color="#10b981" />
                  <Text style={styles.scheduleCountdownText}>{timeUntil}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Prix réduit */}
          <View style={styles.priceTopCard}>
            <Text style={styles.priceTopLabel}>Montant</Text>
            <Text style={styles.priceTopValue}>{formatPrice(ride.price_cents)}</Text>
            {ride.visibility === 'PUBLIC' && (
              <View style={styles.visibilityBadge}>
                <Ionicons name="globe" size={10} color="#fff" />
                <Text style={styles.visibilityBadgeText}>Public</Text>
              </View>
            )}
            {ride.visibility === 'GROUP' && (
              <View style={[styles.visibilityBadge, { backgroundColor: '#a855f7' }]}>
                <Ionicons name="people" size={10} color="#fff" />
                <Text style={styles.visibilityBadgeText}>Groupe</Text>
              </View>
            )}
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          <MapNavigationCard
            pickupAddress={ride.pickup_address}
            dropoffAddress={ride.dropoff_address}
            distance={routeInfo?.distance}
            duration={routeInfo?.duration}
          />
        </View>

        {/* Adresses départ/arrivée */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du trajet</Text>
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
        </View>

        {/* Devis si disponible - Déplacé avant client */}
        {ride.quote_id && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 Devis associé</Text>
            <View style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <View style={styles.quoteIconContainer}>
                  <Ionicons name="document-text" size={24} color="#f59e0b" />
                </View>
                <View style={styles.quoteInfo}>
                  <Text style={styles.quoteRef}>Réf: {ride.quote_id.slice(0, 8).toUpperCase()}</Text>
                  {ride.quote_status && (
                    <View style={[styles.quoteStatusBadge, getQuoteStatusStyle(ride.quote_status)]}>
                      <Text style={styles.quoteStatusText}>
                        {getQuoteStatusLabel(ride.quote_status)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {ride.quote_token && (
                <TouchableOpacity
                  style={styles.quoteLink}
                  onPress={() => {
                    const url = `https://corail-quotes-web.vercel.app/q/${ride.quote_token}`;
                    Linking.openURL(url);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="open-outline" size={18} color="#0ea5e9" />
                  <Text style={styles.quoteLinkText}>Voir le devis en ligne</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0ea5e9" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Pris par - Afficher qui a pris ma course */}
        {isMyRide && ride.status === 'CLAIMED' && ride.picker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course prise par</Text>
            <View style={styles.pickerCard}>
              {/* Infos du preneur + Boutons */}
              <View style={styles.pickerHeader}>
                <View style={styles.pickerIconContainer}>
                  <Ionicons name="person-circle" size={40} color="#10b981" />
                </View>
                <View style={styles.pickerInfo}>
                  <Text style={styles.pickerName}>{ride.picker.full_name}</Text>
                  {ride.picker.rating !== undefined && (
                    <View style={styles.pickerRatingRow}>
                      <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.pickerRatingText}>
                        {ride.picker.rating.toFixed(1)}
                      </Text>
                      {ride.picker.total_reviews !== undefined && (
                        <Text style={styles.pickerReviewsText}>
                          ({ride.picker.total_reviews} avis)
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Boutons de contact */}
              <View style={styles.contactButtons}>
                {/* Appeler */}
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => {
                    if (!ride.picker.phone) {
                      Alert.alert('Numéro indisponible', 'Le numéro de téléphone n\'est pas renseigné');
                      return;
                    }
                    Linking.openURL(`tel:${ride.picker.phone}`).catch(() =>
                      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application téléphone')
                    );
                  }}
                  activeOpacity={0.7}
                  disabled={!ride.picker.phone}
                >
                  <LinearGradient
                    colors={ride.picker.phone ? ['#0ea5e9', '#0284c7'] : ['#64748b', '#475569']}
                    style={styles.contactButtonGradient}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.contactButtonText}>Appeler</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* WhatsApp */}
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => {
                    if (!ride.picker.phone) {
                      Alert.alert('Numéro indisponible', 'Le numéro de téléphone n\'est pas renseigné');
                      return;
                    }
                    const phone = ride.picker.phone?.replace(/[\s\-\(\)]/g, '');
                    Linking.openURL(`whatsapp://send?phone=${phone}`).catch(() =>
                      Alert.alert('Erreur', 'WhatsApp n\'est pas installé')
                    );
                  }}
                  activeOpacity={0.7}
                  disabled={!ride.picker.phone}
                >
                  <LinearGradient
                    colors={ride.picker.phone ? ['#25D366', '#1DA851'] : ['#64748b', '#475569']}
                    style={styles.contactButtonGradient}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                    <Text style={styles.contactButtonText}>Écrire</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Client Information */}
        {canSeeClientInfo && (ride.client_name || ride.client_phone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.clientCard}>
              <View style={styles.clientIconContainer}>
                <Ionicons name="person" size={28} color="#8b5cf6" />
              </View>
              <View style={styles.clientInfo}>
                {ride.client_name && (
                  <Text style={styles.clientName}>{ride.client_name}</Text>
                )}
                {ride.client_phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${ride.client_phone}`)}
                    activeOpacity={0.7}
                    style={styles.clientPhoneButton}
                  >
                    <Ionicons name="call" size={16} color="#10b981" />
                    <Text style={styles.clientPhone}>{ride.client_phone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

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
          </View>
        )}

        {/* Action Buttons */}
      {!isMyRide && ride.status === 'PUBLISHED' && onClaim && (
        <View style={styles.actionContainer}>
          <View style={styles.creditsCostBanner}>
            <View style={styles.creditsCostIcon}>
              <Text style={styles.creditsCostIconText}>C</Text>
            </View>
            <Text style={styles.creditsCostText}>
              Prendre cette course coûte <Text style={{ fontWeight: '700', color: '#ff6b47' }}>1 crédit Corail</Text>
            </Text>
            <Text style={styles.creditsCostBalance}>
              Vous avez {userCredits} crédit{userCredits !== 1 ? 's' : ''}
            </Text>
          </View>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.actionButtonText}>Prendre cette course (-1</Text>
                <View style={styles.creditIconInButton}>
                  <Text style={styles.creditIconInButtonText}>C</Text>
                </View>
                <Text style={styles.actionButtonText}>)</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Convert to Personal Button - S'affecter une course publiée */}
      {isMyRide && !ride.picker_id && ride.status === 'PUBLISHED' && onConvertToPersonal && (
        <View style={{ marginBottom: 16, marginHorizontal: 20 }}>
          <TouchableOpacity
            onPress={handleConvertToPersonal}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f59e0b', '#f97316']}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                paddingVertical: 18,
                borderRadius: 16,
                shadowColor: '#f59e0b',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="person-add" size={24} color="#fff" />
              <Text style={{
                fontSize: 17,
                fontWeight: '700',
                color: '#fff',
              }}>
                M'affecter cette course
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Button */}
      {isMyRide && onDelete && (ride.status === 'PUBLISHED' || ride.visibility === 'PERSONAL' || (ride as any).driver_id) && (
        <View style={{ marginBottom: 16, marginHorizontal: 20 }}>
          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                paddingVertical: 18,
                borderRadius: 16,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="trash" size={24} color="#fff" />
              <Text style={{
                fontSize: 17,
                fontWeight: '700',
                color: '#fff',
              }}>
                Supprimer cette course
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Complete Button */}
      {isPicker && ride.status === 'CLAIMED' && onComplete && (
        <View style={{ marginBottom: 16, marginHorizontal: 20 }}>
          <TouchableOpacity
            onPress={onComplete}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                paddingVertical: 18,
                borderRadius: 16,
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={{
                fontSize: 17,
                fontWeight: '700',
                color: '#fff',
              }}>
                Terminer la course
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
    </View>
  );
};

// Helper functions
const getQuoteStatusLabel = (status: string) => {
  switch (status) {
    case 'SENT': return '📤 Envoyé';
    case 'VIEWED': return '👁️ Vu par le client';
    case 'ACCEPTED': return '✅ Accepté';
    case 'REFUSED': return '❌ Refusé';
    default: return status;
  }
};

const getQuoteStatusStyle = (status: string) => {
  switch (status) {
    case 'SENT': return { backgroundColor: 'rgba(59, 130, 246, 0.2)' };
    case 'VIEWED': return { backgroundColor: 'rgba(168, 85, 247, 0.2)' };
    case 'ACCEPTED': return { backgroundColor: 'rgba(16, 185, 129, 0.2)' };
    case 'REFUSED': return { backgroundColor: 'rgba(239, 68, 68, 0.2)' };
    default: return { backgroundColor: 'rgba(100, 116, 139, 0.2)' };
  }
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
  
  // Top Section (Horaire + Prix)
  topSection: {
    marginTop: 20,
    marginBottom: 24,
    gap: 12,
  },
  scheduleTopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  scheduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scheduleTopContent: {
    flex: 1,
  },
  scheduleTopDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleTopTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  scheduleCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scheduleCountdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  priceTopCard: {
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceTopLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  priceTopValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ff6b47',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  visibilityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // Map Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    height: 280,
    position: 'relative',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
  },
  mapFallback: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  mapBlur: {
    width: '100%',
    height: '100%',
  },
  mapNavigationOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapNavigationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
    textAlign: 'center',
  },
  mapNavButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mapNavButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mapNavLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  googleMapsIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wazeIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleMapsIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapNavButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  mapRouteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mapRouteInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapRouteInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  mapRouteInfoSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#475569',
    marginHorizontal: 12,
  },

  // Route Card (Addresses)
  routeCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 14,
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
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  routePointAddress: {
    fontSize: 14,
    color: '#f1f5f9',
    fontWeight: '600',
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    marginVertical: 10,
  },
  routeLineDashed: {
    width: 2,
    height: 30,
    backgroundColor: '#475569',
  },
  routeArrow: {
    marginLeft: 8,
  },

  // Quote Card
  quoteCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quoteInfo: {
    flex: 1,
  },
  quoteRef: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 6,
  },
  quoteStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quoteStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  quoteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  quoteLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
    flex: 1,
  },

  // Picker Card (Pris par)
  pickerCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickerIconContainer: {
    marginRight: 12,
  },
  pickerInfo: {
    flex: 1,
  },
  pickerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  pickerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickerRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
  },
  pickerReviewsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    marginLeft: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flex: 1,
    borderRadius: 12,
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
    paddingHorizontal: 16,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Client Card
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  clientIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 6,
  },
  clientPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientPhone: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },

  // Creator Card
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  creatorCardMyRide: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  creatorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ff6b47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  creatorAvatarMyRide: {
    backgroundColor: '#fbbf24',
  },
  creatorInitials: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 15,
    color: '#f1f5f9',
    fontWeight: '700',
    marginBottom: 4,
  },
  creatorNameMyRide: {
    color: '#fbbf24',
  },
  creatorEmail: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  creatorRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorRatingText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '600',
  },
  myRideIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Action Buttons
  actionContainer: {
    marginTop: 8,
    marginBottom: 16,
    marginHorizontal: 20,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  creditsCostBanner: {
    backgroundColor: 'rgba(255, 107, 71, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.2)',
    alignItems: 'center',
  },
  creditsCostIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  creditsCostIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6b47',
  },
  creditsCostText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 4,
  },
  creditsCostBalance: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  creditIconInButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditIconInButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
});

export default RideDetailScreen;
