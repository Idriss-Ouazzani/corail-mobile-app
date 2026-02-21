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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Ride, RideSource } from '../types';
import { MapNavigationCard } from '../components/MapNavigationCard';
import { getCreatorProfileStats } from '../services/supabaseApi';
import { computeIndicativeRange } from '../lib/pricing';
import { getQuoteUrl, getInvoiceUrl, getInvoicePdfUrl } from '../constants/urls';

interface RideDetailScreenProps {
  ride: Ride;
  currentUserId: string;
  userCredits?: number;
  onBack: () => void;
  onClaim?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onConvertToPersonal?: () => void;
  onPublish?: () => void;
  onRideUpdated?: (updatedRide: Ride) => void;
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
  onPublish,
  onRideUpdated,
}) => {
  // Les courses personnelles utilisent driver_id, les courses marketplace utilisent creator_id
  const isPersonalRide = !!(ride as any).driver_id;
  const isMyRide = ride.creator_id === currentUserId || (ride as any).driver_id === currentUserId;
  const isPicker = ride.picker_id != null && String(ride.picker_id) === String(currentUserId);
  const isClaimed = String(ride.status).toUpperCase() === 'CLAIMED';
  const canSeeClientInfo = isPersonalRide || isMyRide || (isPicker && isClaimed);
  
  // 🔍 Debug logs pour contact buttons
  console.log('🔍 [RideDetailScreen] Debug info:', {
    rideId: ride.id,
    isPersonalRide,
    isMyRide,
    isPicker,
    picker_id: ride.picker_id,
    driver_id: (ride as any).driver_id,
    creator_id: ride.creator_id,
    currentUserId,
    scheduled_at: ride.scheduled_at,
    status: ride.status,
  });
  
  console.log('🔍 [RideDetailScreen] Client info:', {
    client_name: ride.client_name,
    client_phone: ride.client_phone,
    client_email: ride.client_email,
    canSeeClientInfo,
    willShowClientSection: canSeeClientInfo && (ride.client_name || ride.client_phone || ride.client_email),
  });
  
  console.log('🔍 [RideDetailScreen] Creator info:', {
    creator_name: ride.creator?.full_name,
    creator_phone: ride.creator?.phone,
    creator_email: ride.creator?.email,
    willShowCreatorContactButtons: !isMyRide && ride.creator?.phone,
  });
  
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [creatorStats, setCreatorStats] = useState<{ publicationsCount: number; ridesTakenCount: number; badges: any[] } | null>(null);
  const isClientDemand = ride.source === 'client';
  const hasClientContact = !!(ride.client_email || ride.client_phone);
  const hasStoredRange = ride.indicative_low_cents != null && ride.indicative_high_cents != null;
  const computedRange =
    isClientDemand && ride.distance_km != null && ride.distance_km > 0
      ? computeIndicativeRange(ride.distance_km)
      : null;
  const lowEur = isClientDemand
    ? (hasStoredRange ? ride.indicative_low_cents! / 100 : computedRange?.low ?? 0)
    : 0;
  const highEur = isClientDemand
    ? (hasStoredRange ? ride.indicative_high_cents! / 100 : computedRange?.high ?? 100)
    : 100;
  const budgetEur = ride.price_cents / 100;
  const indicativeRange =
    isClientDemand && (hasStoredRange || computedRange)
      ? `${lowEur.toFixed(0)}€ – ${highEur.toFixed(0)}€`
      : null;
  const rangeSpan = highEur - lowEur;
  const budgetPositionPercent =
    rangeSpan <= 0
      ? 50
      : budgetEur <= lowEur
        ? 0
        : budgetEur >= highEur
          ? 100
          : Math.round(((budgetEur - lowEur) / rangeSpan) * 100);
  const budgetStatus: 'in_range' | 'below' | 'above' =
    !isClientDemand || (lowEur === 0 && highEur === 100)
      ? 'in_range'
      : budgetEur < lowEur
        ? 'below'
        : budgetEur > highEur
          ? 'above'
          : 'in_range';

  useEffect(() => {
    if (!ride.creator?.id || ride.creator_id === currentUserId) return;
    let cancelled = false;
    getCreatorProfileStats(ride.creator.id)
      .then((stats) => { if (!cancelled) setCreatorStats(stats); })
      .catch(() => { if (!cancelled) setCreatorStats(null); });
    return () => { cancelled = true; };
  }, [ride.creator_id, ride.creator?.id, currentUserId]);

  // Vérifier si on doit afficher la navigation
  const shouldShowNavigation = () => {
    // Ne pas afficher pour les courses COMPLETED
    if (ride.status === 'COMPLETED') return false;
    
    // Pour les autres courses, vérifier si elle est dans moins d'1h dans le passé
    const now = new Date();
    const rideTime = new Date(ride.scheduled_at);
    const diffInHours = (now.getTime() - rideTime.getTime()) / (1000 * 60 * 60);
    
    // Afficher seulement si la course est future ou passée de moins d'1h
    return diffInHours < 1;
  };

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

  // Charger la facture associée à cette course
  useEffect(() => {
    const loadInvoice = async () => {
      if (!isMyRide && !isPicker) {
        console.log('⚠️ Pas de chargement facture: ni créateur ni picker');
        return; // Seulement pour le créateur ou picker
      }
      
      try {
        setLoadingInvoice(true);
        console.log('🔍 Chargement facture pour:', {
          rideId: ride.id,
          isPersonalRide,
          sourceType: isPersonalRide ? 'PERSONAL' : 'RIDE',
        });
        
        const { apiClient } = await import('../services/api');
        const sourceType = isPersonalRide ? 'PERSONAL' : 'RIDE';
        const invoiceData = await apiClient.getInvoiceByRide(sourceType, ride.id);
        
        if (invoiceData) {
          console.log('✅ Facture trouvée:', invoiceData);
          setInvoice(invoiceData);
        } else {
          console.log('ℹ️ Aucune facture associée à cette course');
          setInvoice(null);
        }
      } catch (error) {
        console.error('❌ Erreur chargement facture:', error);
        setInvoice(null);
      } finally {
        setLoadingInvoice(false);
      }
    };
    
    loadInvoice();
  }, [ride.id, isMyRide, isPicker, isPersonalRide]);

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

  const handleGenerateInvoice = async () => {
    try {
      setGeneratingInvoice(true);
      const { apiClient } = await import('../services/api');
      const sourceType = isPersonalRide ? 'PERSONAL' : 'RIDE';
      
      console.log('🧾 Génération de facture...', { 
        sourceType, 
        rideId: ride.id, 
        isPersonalRide,
        driver_id: (ride as any).driver_id,
        creator_id: ride.creator_id,
      });
      const newInvoice = await apiClient.createInvoice(sourceType, ride.id);
      
      console.log('✅ Facture générée:', newInvoice);
      setInvoice(newInvoice);
      
      Alert.alert(
        'Facture générée',
        `Facture ${newInvoice.invoice_number} créée avec succès !`,
        [
          { text: 'OK' },
          {
            text: 'Télécharger PDF',
            onPress: () => {
              const pdfUrl = getInvoicePdfUrl(newInvoice.public_token);
              Linking.openURL(pdfUrl);
            },
          },
          {
            text: 'Partager WhatsApp',
            onPress: () => {
              const invoiceUrl = getInvoiceUrl(newInvoice.public_token);
              const clientName = ride.client_name || 'Client';
              const message = `Bonjour ${clientName},\n\nVoici votre facture ${newInvoice.invoice_number} :\n${invoiceUrl}\n\nVous pouvez télécharger le PDF directement depuis ce lien.\n\nCordialement`;
              
              // Utiliser https://wa.me qui fonctionne sur iOS, Android et web
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
              
              Linking.openURL(whatsappUrl).catch(err => {
                console.error('Erreur ouverture WhatsApp:', err);
                Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erreur génération facture:', error);
      Alert.alert('Erreur', error.message || 'Impossible de générer la facture');
    } finally {
      setGeneratingInvoice(false);
    }
  };
  
  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

  const getSourceLabel = (s?: RideSource) => ({ chauffeur: 'Chauffeur', hotel: 'Hôtel', client: 'Client' }[s || 'chauffeur']);
  const getSourceIcon = (s?: RideSource) => ({ chauffeur: 'car-sport-outline', hotel: 'business-outline', client: 'person-outline' }[s || 'chauffeur']);
  const getSourceColor = (s?: RideSource) => ({ chauffeur: '#cbd5e1', hotel: '#f59e0b', client: '#0ea5e9' }[s || 'chauffeur']);
  const getSourceBadgeBg = (s?: RideSource) => ({ chauffeur: 'rgba(71, 85, 105, 0.5)', hotel: 'rgba(245,158,11,0.25)', client: 'rgba(14,165,233,0.25)' }[s || 'chauffeur']);
  
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
    <View style={[styles.container, isClientDemand && styles.containerClient]}>
      {/* Header */}
      <View style={[styles.header, isClientDemand && styles.headerClient]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la course</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton} activeOpacity={0.7}>
          <Ionicons name="share-social" size={22} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      {isPersonalRide && (ride.status as string) === 'SCHEDULED' && onPublish && (
        <TouchableOpacity
          style={styles.publishBanner}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              'Publier sur la Marketplace',
              'Vous n\'êtes pas disponible pour cette course ?\n\nPubliez-la sur la Marketplace et laissez d\'autres chauffeurs la récupérer ! Vous gagnerez 1 crédit.',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Publier', onPress: onPublish },
              ]
            );
          }}
        >
          <View style={styles.publishBannerIcon}>
            <Ionicons name="megaphone" size={22} color="#0ea5e9" />
          </View>
          <View style={styles.publishBannerContent}>
            <Text style={styles.publishBannerTitle}>Vous n'êtes pas disponible ?</Text>
            <Text style={styles.publishBannerText}>Publiez cette course sur la Marketplace</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#0ea5e9" />
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Horaire + Détails trajet (en haut pour demande client) + Prix ou Demande client */}
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

          {/* Détails du trajet en haut pour demande client (évite répétition) */}
          {isClientDemand && (
            <View style={styles.routeCard}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#10b981' }]} />
                <View style={styles.routePointContent}>
                  <Text style={styles.routePointLabel}>DÉPART</Text>
                  <Text style={styles.routePointAddress}>{ride.pickup_address}</Text>
                </View>
              </View>
              <View style={styles.routeLine}>
                <View style={styles.routeLineDashed} />
                <Ionicons name="arrow-down" size={20} color="#64748b" style={styles.routeArrow} />
              </View>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#ff6b47' }]} />
                <View style={styles.routePointContent}>
                  <Text style={styles.routePointLabel}>ARRIVÉE</Text>
                  <Text style={styles.routePointAddress}>{ride.dropoff_address}</Text>
                </View>
              </View>
              {ride.distance_km != null && ride.distance_km > 0 && (
                <Text style={styles.clientDemandKm}>{ride.distance_km} km</Text>
              )}
            </View>
          )}

          {/* Demande client : fourchette (barre lisible) + budget en exergue + message */}
          {isClientDemand && (
            <View style={styles.clientDemandCard}>
              <Text style={styles.clientDemandTitle}>Demande client</Text>
              {indicativeRange != null && (
                <>
                  <Text style={styles.clientDemandFourchetteLabel}>Fourchette indicative</Text>
                  <View style={styles.indicativeBarWrap}>
                    <View style={styles.indicativeBar}>
                      <View
                        style={[
                          styles.indicativeBarMarker,
                          { left: `${budgetPositionPercent}%`, marginLeft: -10 },
                        ]}
                      />
                    </View>
                    <View style={styles.indicativeBarLabels}>
                      <Text style={styles.indicativeBarLabel}>{lowEur.toFixed(0)} €</Text>
                      <Text style={styles.indicativeBarLabel}>{highEur.toFixed(0)} €</Text>
                    </View>
                  </View>
                </>
              )}
              <View style={styles.budgetClientHighlight}>
                <Text style={styles.budgetClientLabel}>Budget client</Text>
                <Text style={styles.budgetClientValue}>{budgetEur.toFixed(0)} €</Text>
              </View>
              {indicativeRange != null && (
                <View style={[
                  styles.budgetStatusMessage,
                  budgetStatus === 'in_range' && styles.budgetStatusInRange,
                  budgetStatus === 'below' && styles.budgetStatusBelow,
                  budgetStatus === 'above' && styles.budgetStatusAbove,
                ]}>
                  <Text style={[
                    styles.budgetStatusText,
                    budgetStatus === 'in_range' && styles.budgetStatusTextInRange,
                    budgetStatus === 'below' && styles.budgetStatusTextBelow,
                    budgetStatus === 'above' && styles.budgetStatusTextAbove,
                  ]}>
                    {budgetStatus === 'in_range' && 'Dans la fourchette — Le premier qui accepte confirme la course.'}
                    {budgetStatus === 'below' && 'Budget inférieur au marché.'}
                    {budgetStatus === 'above' && 'Budget supérieur aux tarifs habituels.'}
                  </Text>
                </View>
              )}
              <Text style={styles.clientDemandWarning}>
                Si un autre chauffeur accepte au budget du client, vous pourriez louper la course.
              </Text>
            </View>
          )}
          {/* Montant (caché pour demande client, déjà affiché dans le bloc jaune) */}
          {!isClientDemand && (
            <View style={styles.priceTopCard}>
              <View style={styles.priceTopLeft}>
                <Text style={styles.priceTopLabel}>Montant</Text>
                <Text style={styles.priceTopValue}>{formatPrice(ride.price_cents)}</Text>
                {ride.distance_km != null && ride.distance_km > 0 && (
                  <Text style={styles.pricePerKm}>
                    {((ride.price_cents / 100) / ride.distance_km).toFixed(2)} €/km
                  </Text>
                )}
              </View>
              <View style={styles.badgesRow}>
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
                <View style={[styles.sourceBadge, { backgroundColor: getSourceBadgeBg(ride.source) }]}>
                  <Ionicons name={getSourceIcon(ride.source) as any} size={10} color={getSourceColor(ride.source)} />
                  <Text style={[styles.sourceBadgeText, { color: getSourceColor(ride.source) }]}>{getSourceLabel(ride.source)}</Text>
                </View>
              </View>
            </View>
          )}
          {/* Badges seuls pour demande client (Public / Client) */}
          {isClientDemand && (
            <View style={styles.badgesRow}>
              {ride.visibility === 'PUBLIC' && (
                <View style={styles.visibilityBadge}>
                  <Ionicons name="globe" size={10} color="#fff" />
                  <Text style={styles.visibilityBadgeText}>Public</Text>
                </View>
              )}
              <View style={[styles.sourceBadge, { backgroundColor: getSourceBadgeBg(ride.source) }]}>
                <Ionicons name={getSourceIcon(ride.source) as any} size={10} color={getSourceColor(ride.source)} />
                <Text style={[styles.sourceBadgeText, { color: getSourceColor(ride.source) }]}>{getSourceLabel(ride.source)}</Text>
              </View>
            </View>
          )}

        </View>

        {/* Navigation - Seulement pour les courses en cours ou futures (ou < 1h dans le passé) */}
        {shouldShowNavigation() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Navigation</Text>
            <MapNavigationCard
              pickupAddress={ride.pickup_address}
              dropoffAddress={ride.dropoff_address}
              distance={routeInfo?.distance}
              duration={routeInfo?.duration}
            />
          </View>
        )}

        {/* Commentaire de l'auteur */}
        {ride.notes != null && String(ride.notes).trim() !== '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commentaire de l'auteur</Text>
            <View style={styles.notesCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0ea5e9" style={styles.notesIcon} />
              <Text style={styles.notesText}>{ride.notes}</Text>
            </View>
          </View>
        )}

        {/* Adresses départ/arrivée (caché pour demande client, déjà en haut) */}
        {!isClientDemand && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails du trajet</Text>
            <View style={styles.routeCard}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#10b981' }]} />
                <View style={styles.routePointContent}>
                  <Text style={styles.routePointLabel}>DÉPART</Text>
                  <Text style={styles.routePointAddress}>{ride.pickup_address}</Text>
                </View>
              </View>
              <View style={styles.routeLine}>
                <View style={styles.routeLineDashed} />
                <Ionicons name="arrow-down" size={20} color="#64748b" style={styles.routeArrow} />
              </View>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#ff6b47' }]} />
                <View style={styles.routePointContent}>
                  <Text style={styles.routePointLabel}>ARRIVÉE</Text>
                  <Text style={styles.routePointAddress}>{ride.dropoff_address}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {ride.quote_id && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Devis associé</Text>
            <View style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <View style={styles.quoteIconContainer}>
                  <Ionicons name="document-text" size={24} color="#0ea5e9" />
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
                    if (ride.quote_token) Linking.openURL(getQuoteUrl(ride.quote_token));
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

        {/* Facture si disponible */}
        {(isMyRide || isPicker) && invoice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facture associée</Text>
            <View style={styles.quoteCard}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Facture ' + invoice.invoice_number,
                    'Choisissez une action',
                    [
                      {
                        text: 'Télécharger PDF',
                        onPress: () => {
                          const pdfUrl = getInvoicePdfUrl(invoice.public_token);
                          Linking.openURL(pdfUrl);
                        },
                      },
                      {
                        text: 'Voir en ligne',
                        onPress: () => {
                          const url = getInvoiceUrl(invoice.public_token);
                          Linking.openURL(url);
                        },
                      },
                      {
                        text: 'Partager WhatsApp',
                        onPress: () => {
                          const invoiceUrl = getInvoiceUrl(invoice.public_token);
                          const clientName = ride.client_name || 'Client';
                          const message = `Bonjour ${clientName},\n\nVoici votre facture ${invoice.invoice_number} :\n${invoiceUrl}\n\nVous pouvez télécharger le PDF directement depuis ce lien.\n\nCordialement`;
                          
                          // Utiliser https://wa.me qui fonctionne sur iOS, Android et web
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                          
                          Linking.openURL(whatsappUrl).catch(err => {
                            console.error('Erreur ouverture WhatsApp:', err);
                            Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
                          });
                        },
                      },
                      { text: 'Annuler', style: 'cancel' },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={styles.quoteHeader}>
                  <View style={styles.quoteIconContainer}>
                    <Ionicons name="receipt" size={24} color="#10b981" />
                  </View>
                  <View style={styles.quoteInfo}>
                    <Text style={styles.quoteRef}>{invoice.invoice_number}</Text>
                    <View style={[styles.quoteStatusBadge, { backgroundColor: '#10b98120' }]}>
                      <Text style={[styles.quoteStatusText, { color: '#10b981' }]}>
                        ✅ Émise
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#10b981" />
                </View>
              </TouchableOpacity>
              
              {/* Séparateur */}
              <View style={styles.invoiceSeparator} />
              
              {/* Actions rapides WhatsApp et Email */}
              <View style={styles.invoiceActionsRow}>
                <TouchableOpacity
                  style={styles.invoiceActionBtn}
                  onPress={() => {
                    const invoiceUrl = getInvoiceUrl(invoice.public_token);
                    const clientName = ride.client_name || 'Client';
                    const message = `Bonjour ${clientName},\n\nVoici votre facture ${invoice.invoice_number} :\n${invoiceUrl}\n\nVous pouvez télécharger le PDF directement depuis ce lien.\n\nCordialement`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    
                    Linking.openURL(whatsappUrl).catch(err => {
                      console.error('Erreur ouverture WhatsApp:', err);
                      Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.invoiceActionBtn}
                  onPress={() => {
                    const invoiceUrl = getInvoiceUrl(invoice.public_token);
                    const clientName = ride.client_name || 'Client';
                    const subject = `Facture ${invoice.invoice_number}`;
                    const message = `Bonjour ${clientName},\n\nVoici votre facture ${invoice.invoice_number} :\n${invoiceUrl}\n\nVous pouvez télécharger le PDF directement depuis ce lien.\n\nCordialement`;
                    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                    
                    Linking.openURL(mailtoUrl).catch(err => {
                      console.error('Erreur ouverture email:', err);
                      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application mail');
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="mail" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Bouton Générer facture si course terminée et pas de facture */}
        {(isMyRide || isPicker) && !invoice && !loadingInvoice && (
          ride.status === 'COMPLETED' || 
          (isPersonalRide && ride.scheduled_at && new Date(ride.scheduled_at) < new Date())
        ) && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.generateInvoiceButton, generatingInvoice && { opacity: 0.6 }]}
              onPress={handleGenerateInvoice}
              disabled={generatingInvoice}
              activeOpacity={0.7}
            >
              <View style={styles.generateInvoiceInner}>
                <Ionicons name="receipt-outline" size={20} color="#fff" />
                <Text style={styles.generateInvoiceText}>
                  {generatingInvoice ? 'Génération...' : 'Générer la facture'}
                </Text>
              </View>
            </TouchableOpacity>
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
                  <Text style={styles.pickerName}>{ride.picker!.full_name}</Text>
                </View>
              </View>

              {/* Boutons de contact */}
              <View style={styles.contactButtons}>
                {/* Appeler */}
                <TouchableOpacity
                  style={[styles.contactButton, styles.contactButtonInner, !ride.picker?.phone && styles.contactButtonDisabled]}
                  onPress={() => {
                    if (!ride.picker?.phone) {
                      Alert.alert('Numéro indisponible', 'Le numéro de téléphone n\'est pas renseigné');
                      return;
                    }
                    Linking.openURL(`tel:${ride.picker!.phone}`).catch(() =>
                      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application téléphone')
                    );
                  }}
                  activeOpacity={0.7}
                  disabled={!ride.picker?.phone}
                >
                  <Ionicons name="call" size={18} color="#fff" />
                  <Text style={styles.contactButtonText}>Appeler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.contactButton, styles.contactButtonWhatsApp, !ride.picker?.phone && styles.contactButtonDisabled]}
                  onPress={() => {
                    if (!ride.picker?.phone) {
                      Alert.alert('Numéro indisponible', 'Le numéro de téléphone n\'est pas renseigné');
                      return;
                    }
                    const phone = ride.picker!.phone?.replace(/[\s\-\(\)]/g, '');
                    Linking.openURL(`whatsapp://send?phone=${phone}`).catch(() =>
                      Alert.alert('Erreur', 'WhatsApp n\'est pas installé')
                    );
                  }}
                  activeOpacity={0.7}
                  disabled={!ride.picker?.phone}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                  <Text style={styles.contactButtonText}>Écrire</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Client Information */}
        {canSeeClientInfo && (ride.client_name || ride.client_phone || ride.client_email) && (
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
                {ride.client_email && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${ride.client_email}`)}
                    activeOpacity={0.7}
                    style={{ marginBottom: ride.client_phone ? 8 : 0 }}
                  >
                    <Text style={styles.clientEmail}>
                      <Ionicons name="mail" size={16} color="#64748b" /> {ride.client_email}
                    </Text>
                  </TouchableOpacity>
                )}
                {ride.client_phone && (
                  <View style={styles.contactButtonsRow}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${ride.client_phone}`)}
                      activeOpacity={0.7}
                      style={styles.clientContactButton}
                    >
                      <Ionicons name="call" size={18} color="#fff" />
                      <Text style={styles.clientContactButtonText}>Appeler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`https://wa.me/${ride.client_phone?.replace(/[^0-9]/g, '')}`)}
                      activeOpacity={0.7}
                      style={[styles.clientContactButton, styles.clientWhatsappButton]}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                      <Text style={styles.clientContactButtonText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Auteur de l'annonce (masqué pour demandes site client) */}
        {ride.creator && !isClientDemand && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Auteur de l'annonce</Text>
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
                {!isMyRide && creatorStats && (
                  <View style={styles.creatorStatsRow}>
                    <View style={styles.creatorStat}>
                      <Ionicons name="document-text-outline" size={16} color="#0ea5e9" />
                      <Text style={styles.creatorStatText}>{creatorStats.publicationsCount} publication{creatorStats.publicationsCount !== 1 ? 's' : ''}</Text>
                    </View>
                    <View style={styles.creatorStat}>
                      <Ionicons name="car-outline" size={16} color="#10b981" />
                      <Text style={styles.creatorStatText}>{creatorStats.ridesTakenCount} course{creatorStats.ridesTakenCount !== 1 ? 's' : ''} prise{creatorStats.ridesTakenCount !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                )}
                {!isMyRide && creatorStats && creatorStats.badges.length > 0 && (
                  <View style={styles.creatorBadgesRow}>
                    {creatorStats.badges.slice(0, 5).map((b: { id: string; icon?: string; name: string }) => (
                      <View key={b.id} style={styles.creatorBadgePill}>
                        <Text style={styles.creatorBadgePillText}>{b.icon || '🏆'} {b.name}</Text>
                      </View>
                    ))}
                    {creatorStats.badges.length > 5 && (
                      <Text style={styles.creatorBadgeMore}>+{creatorStats.badges.length - 5}</Text>
                    )}
                  </View>
                )}
                {/* Boutons pour joindre l'auteur : Appeler (tél/SMS) et Écrire (WhatsApp/SMS) */}
                {!isMyRide && ride.creator.phone && (
                  <View style={[styles.creatorContactRow, { marginTop: 10 }]}>
                    <TouchableOpacity
                      onPress={() => {
                        const phone = ride.creator!.phone!;
                        Alert.alert(
                          'Appeler',
                          'Choisir comment joindre l\'auteur de l\'annonce.',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            { text: 'Téléphone', onPress: () => Linking.openURL(`tel:${phone}`) },
                            { text: 'SMS', onPress: () => Linking.openURL(`sms:${phone}`) },
                          ]
                        );
                      }}
                      activeOpacity={0.7}
                      style={[styles.clientContactButton, styles.creatorContactButton, styles.creatorContactCall]}
                    >
                      <Ionicons name="call" size={18} color="#fff" />
                      <Text style={styles.clientContactButtonText}>Appeler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const phone = ride.creator!.phone!.replace(/[^0-9]/g, '');
                        Alert.alert(
                          'Écrire',
                          'Choisir comment envoyer un message.',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            { text: 'WhatsApp', onPress: () => Linking.openURL(`https://wa.me/${phone}`) },
                            { text: 'SMS', onPress: () => Linking.openURL(`sms:${ride.creator!.phone}`) },
                          ]
                        );
                      }}
                      activeOpacity={0.7}
                      style={[styles.clientContactButton, styles.creatorContactButton, styles.clientWhatsappButton]}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                      <Text style={styles.clientContactButtonText}>Écrire</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {isMyRide && (
                <View style={styles.myRideIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color="#fbbf24" />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Prendre cette course (toutes les annonces, y compris demande client) */}
      {!isMyRide && ride.status === 'PUBLISHED' && onClaim && (
        <View style={styles.actionContainer}>
          <View style={styles.creditsCostBanner}>
            <View style={styles.creditsCostIcon}>
              <Text style={styles.creditsCostIconText}>C</Text>
            </View>
            <Text style={styles.creditsCostText}>
              Prendre cette course coûte <Text style={{ fontWeight: '700', color: '#0ea5e9' }}>1 crédit Corail</Text>
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
            <View style={styles.actionButtonInner}>
              <Ionicons name="car" size={24} color="#fff" />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.actionButtonText}>Prendre cette course (-1</Text>
                <View style={styles.creditIconInButton}>
                  <Text style={styles.creditIconInButtonText}>C</Text>
                </View>
                <Text style={styles.actionButtonText}>)</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Convert to Personal Button - S'affecter une course publiée */}
      {isMyRide && !ride.picker_id && ride.status === 'PUBLISHED' && onConvertToPersonal && (
        <View style={styles.bottomButtonWrap}>
          <TouchableOpacity style={styles.convertButton} onPress={handleConvertToPersonal} activeOpacity={0.8}>
            <Ionicons name="person-add" size={24} color="#fff" />
            <Text style={styles.convertButtonText}>M'affecter cette course</Text>
          </TouchableOpacity>
        </View>
      )}

      {isMyRide && onDelete && (ride.status === 'PUBLISHED' || (ride.visibility as string) === 'PERSONAL' || (ride as any).driver_id) && (
        <View style={styles.bottomButtonWrap}>
          <TouchableOpacity style={styles.deleteButtonInner} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash" size={24} color="#fff" />
            <Text style={styles.deleteButtonText}>Supprimer cette course</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPicker && ride.status === 'CLAIMED' && onComplete && (
        <View style={styles.bottomButtonWrap}>
          <TouchableOpacity style={styles.completeButtonInner} onPress={onComplete} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.completeButtonText}>Terminer la course</Text>
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
  containerClient: {
    backgroundColor: '#0d1929',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerClient: {
    backgroundColor: '#0d1929',
    borderBottomColor: 'rgba(14, 165, 233, 0.35)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  publishBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  publishBannerContent: {
    flex: 1,
  },
  publishBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  publishBannerText: {
    fontSize: 12,
    color: '#64748b',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  topSection: {
    marginBottom: 20,
    gap: 12,
  },
  scheduleTopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scheduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scheduleTopContent: {
    flex: 1,
  },
  scheduleTopDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
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
    color: '#f8fafc',
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
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceTopLeft: {
    flex: 1,
  },
  priceTopLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  priceTopValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10b981',
  },
  pricePerKm: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    overflow: 'hidden',
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clientDemandCard: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  clientDemandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0ea5e9',
    marginBottom: 10,
  },
  clientDemandFourchetteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  clientDemandKm: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 10,
  },
  clientDemandWarning: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f59e0b',
    marginTop: 10,
    fontStyle: 'italic',
  },
  indicativeBarWrap: {
    marginTop: 4,
    marginBottom: 12,
  },
  indicativeBar: {
    height: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 8,
    overflow: 'visible',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  indicativeBarMarker: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  indicativeBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 0,
  },
  indicativeBarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  budgetClientHighlight: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    marginTop: 4,
    marginBottom: 8,
  },
  budgetClientLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 2,
  },
  budgetClientValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fbbf24',
  },
  budgetStatusMessage: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  budgetStatusInRange: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  budgetStatusBelow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  budgetStatusAbove: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  budgetStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetStatusTextInRange: {
    color: '#10b981',
  },
  budgetStatusTextBelow: {
    color: '#f59e0b',
  },
  budgetStatusTextAbove: {
    color: '#0ea5e9',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    letterSpacing: 0.3,
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

  notesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  notesIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notesText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#e2e8f0',
    fontStyle: 'italic',
  },
  routeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
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

  quoteCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
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
    borderTopColor: '#334155',
  },
  quoteLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
    flex: 1,
  },
  invoiceSeparator: {
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    marginVertical: 12,
  },
  invoiceActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  invoiceActionBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },

  pickerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
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
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flex: 1,
    borderRadius: 14,
  },
  contactButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: '#0ea5e9',
  },
  contactButtonWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: '#25D366',
  },
  contactButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.7,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clientIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
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
  clientEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
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
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  creatorContactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  creatorContactButton: {
    flex: 1,
    minWidth: 0,
  },
  creatorContactCall: {},
  clientContactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  clientWhatsappButton: {
    backgroundColor: '#25d366',
    shadowColor: '#25d366',
  },
  clientContactButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  creatorCardMyRide: {
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
  },
  creatorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0ea5e9',
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
    color: '#fff',
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
    marginBottom: 8,
  },
  creatorStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  creatorStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorStatText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  creatorBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  creatorBadgePill: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  creatorBadgePillText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  creatorBadgeMore: {
    fontSize: 11,
    color: '#64748b',
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

  actionContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  creditsCostBanner: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  creditsCostIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  creditsCostIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  creditsCostText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 4,
  },
  creditsCostBalance: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    backgroundColor: '#0ea5e9',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  creditIconInButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditIconInButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  bottomButtonWrap: {
    marginBottom: 12,
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: '#0ea5e9',
  },
  convertButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  completeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: '#10b981',
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  generateInvoiceButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  generateInvoiceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    backgroundColor: '#10b981',
  },
  generateInvoiceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default RideDetailScreen;
