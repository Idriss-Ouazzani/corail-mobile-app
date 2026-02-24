/**
 * DashboardScreen - Accueil épuré
 * Hero, CTA principal, opportunités, Page Pro, planning, activité (sans affichage des crédits).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { theme } from '../theme';
import * as NotificationService from '../services/notifications';
import { DashboardSkeleton } from '../components/skeletons';
import { GroupInvitationsBanner } from '../components/GroupInvitationsBanner';
import { RideCard } from '../components/RideCard';
import { CustomAlert } from '../components/CustomAlert';
import { LegalInfoModal } from '../components/LegalInfoModal';
import { getInvoiceUrl, getVtcProfileUrl } from '../constants/urls';
import { getCompletionScore, getPageProStatus } from '../utils/pageProCompletion';

interface DashboardProps {
  verificationStatus: string | null;
  /** Statut vérification chauffeur (documents) : not_started | pending | approved | rejected */
  driverVerificationStatus?: string | null;
  isDriverVerified?: boolean;
  onRefreshVerification: () => Promise<void>;
  userFullName: string;
  userRides: any[]; // All marketplace rides for the user
  pendingInvitationsCount?: number; // Nombre d'invitations en attente
  onNavigateToCourses: () => void;
  onNavigateToTools: () => void;
  onNavigateToActivity: () => void; // Navigate to Courses > Activity tab
  onNavigateToPlanning: () => void; // Navigate to Planning
  onOpenQRCode: () => void;
  onCreateRide: () => void; // Ouvrir formulaire création en mode 'create'
  onRidePress: (ride: any) => void; // Ouvrir le détail d'une course
  onPersonalRidePress: (ride: any) => void; // Ouvrir le détail d'une course personnelle
  onOpenGroupInvitations?: () => void;
  onNavigateToDriverRequests?: () => void;
  onNavigateToPagePro?: () => void; // Ouvrir Ma Page Pro (optimisation)
  onNavigateToVerificationProfile?: () => void; // Écran "Vérifier mon profil"
  onShowNotifications?: () => void; // Ouvrir le centre de notifications (cloche)
  unreadNotificationsCount?: number; // Compteur pour la pastille (géré par App)
  onRefreshUnreadCount?: () => void; // Rafraîchir le compteur (appelé après loadDashboardData)
}

export default function DashboardScreen({
  verificationStatus,
  driverVerificationStatus = null,
  isDriverVerified = false,
  onRefreshVerification,
  userFullName,
  userRides,
  pendingInvitationsCount = 0,
  onNavigateToCourses,
  onNavigateToTools,
  onNavigateToActivity,
  onNavigateToPlanning,
  onOpenQRCode,
  onCreateRide,
  onRidePress,
  onPersonalRidePress,
  onOpenGroupInvitations,
  onNavigateToDriverRequests,
  onNavigateToPagePro,
  onNavigateToVerificationProfile,
  onShowNotifications,
  unreadNotificationsCount = 0,
  onRefreshUnreadCount,
}: DashboardProps) {
  // userCredits non affiché sur la home (affichage contextuel uniquement dans Marketplace)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [todayRides, setTodayRides] = useState(0);
  const [inProgressRides, setInProgressRides] = useState<any[]>([]);
  const [upcomingRides, setUpcomingRides] = useState<any[]>([]);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [showShareInvoiceAlert, setShowShareInvoiceAlert] = useState(false);
  const [pendingDriverRequestsCount, setPendingDriverRequestsCount] = useState(0);
  const [pageProStatus, setPageProStatus] = useState<'inactive' | 'incomplete' | 'active' | null>(null);
  const [pageProCompletion, setPageProCompletion] = useState<number>(0);
  const [pageProMonthViews, setPageProMonthViews] = useState<number>(0);
  const [pageProSlug, setPageProSlug] = useState<string | null>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [pendingInvoiceParams, setPendingInvoiceParams] = useState<{ sourceType: 'RIDE' | 'PERSONAL'; sourceId: string } | null>(null);
  const [showVerifiedLabel, setShowVerifiedLabel] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!showVerifiedLabel) return;
    const t = setTimeout(() => setShowVerifiedLabel(false), 2000);
    return () => clearTimeout(t);
  }, [showVerifiedLabel]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les stats des courses personnelles
      let statsData = null;
      try {
        statsData = await apiClient.getPersonalRidesStats();
      } catch (error: any) {
        console.warn('No personal rides stats yet (empty data)');
        // Initialiser avec des stats vides
        statsData = {
          totals: {
            total_rides: 0,
            completed_rides: 0,
            total_revenue_eur: 0,
            total_distance_km: 0,
          },
          by_source: {},
        };
      }

      // Charger TOUTES les courses SCHEDULED (pas de filtre sur la date)
      let allScheduledRides: any[] = [];
      try {
        const ridesData = await apiClient.listPersonalRides({ status: 'SCHEDULED', limit: 20 });
        allScheduledRides = ridesData || [];
      } catch (error: any) {
        console.warn('No rides found');
        allScheduledRides = [];
      }

      let pendingRequestsCount = 0;
      try {
        pendingRequestsCount = await apiClient.getDriverRideRequestsPendingCount();
      } catch (_e) {}
      setPendingDriverRequestsCount(pendingRequestsCount);

      try {
        onRefreshUnreadCount?.();
      } catch (_e) {}

      try {
        const vtcProfile = await apiClient.getMyVTCProfile();
        setPageProMonthViews(vtcProfile?.view_count ?? 0);
        if (!vtcProfile) {
          setPageProStatus('inactive');
          setPageProCompletion(0);
          setPageProSlug(null);
        } else {
          setPageProSlug(vtcProfile.slug || null);
          const formData = {
            photoUrl: vtcProfile.photo_url || '',
            bio: vtcProfile.bio || '',
            zoneCity: vtcProfile.zone_city || '',
            slug: vtcProfile.slug || '',
            vehicleBrand: vtcProfile.vehicle_brand || '',
            vehicleModel: vtcProfile.vehicle_model || '',
            vehicleYear: vtcProfile.vehicle_year?.toString() || '',
            vehicleSeats: vtcProfile.vehicle_seats != null && vtcProfile.vehicle_seats >= 2 && vtcProfile.vehicle_seats <= 7 ? vtcProfile.vehicle_seats : null,
            services: Array.isArray(vtcProfile.services) ? vtcProfile.services : [],
            amenities: Array.isArray(vtcProfile.amenities) ? vtcProfile.amenities : [],
          };
          setPageProCompletion(getCompletionScore(formData));
          setPageProStatus(getPageProStatus(formData, !!vtcProfile.is_public));
        }
      } catch (_e) {
        setPageProStatus('inactive');
        setPageProCompletion(0);
      }

      const now = Date.now();
      const oneHourInMs = 60 * 60 * 1000;
      
      // Séparer EN_COURS (scheduled_at passé, mais < 1h) et À_VENIR (scheduled_at futur)
      const inProgress = allScheduledRides.filter((ride: any) => {
        if (!ride.scheduled_at) return false;
        const scheduledTime = new Date(ride.scheduled_at).getTime();
        const isStarted = scheduledTime <= now;
        const isLessThanOneHour = now - scheduledTime < oneHourInMs;
        return isStarted && isLessThanOneHour;
      }).sort((a: any, b: any) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );

      const upcoming = allScheduledRides.filter((ride: any) => 
        ride.scheduled_at && new Date(ride.scheduled_at).getTime() > now
      ).sort((a: any, b: any) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ).slice(0, 2); // Limiter aux 2 prochaines

      setInProgressRides(inProgress);
      setUpcomingRides(upcoming);

      // Planifier les notifications "1 minute avant" pour les courses à venir + ajout dans la cloche
      for (const ride of upcoming) {
        if (ride.pickup_address && ride.dropoff_address) {
          await NotificationService.scheduleRideImminentReminder(
            ride.id,
            ride.scheduled_at,
            ride.pickup_address,
            ride.dropoff_address
          );
          await apiClient.insertInAppNotification({
            type: 'ride_imminent',
            title: 'Démarrage imminent de votre course',
            body: `${ride.pickup_address} → ${ride.dropoff_address}`,
            target_ride_id: ride.id,
          });
        }
      }

      // 🔔 Résumé quotidien à 9h : uniquement si des courses ce jour-là + ajout dans la cloche
      const today = new Date().toDateString();
      const allTodayRides = [...inProgress, ...upcoming].filter((ride: any) => {
        if (!ride.scheduled_at) return false;
        return new Date(ride.scheduled_at).toDateString() === today;
      });
      const nowDate = new Date();
      const today9am = new Date(nowDate);
      today9am.setHours(9, 0, 0, 0);
      const next9am = nowDate < today9am ? today9am : (() => { const t = new Date(today9am); t.setDate(t.getDate() + 1); return t; })();
      const next9amDateStr = next9am.toDateString();
      const ridesOnNext9amDay = allScheduledRides.filter((ride: any) => {
        if (!ride.scheduled_at) return false;
        return new Date(ride.scheduled_at).toDateString() === next9amDateStr;
      });
      if (ridesOnNext9amDay.length > 0) {
        await NotificationService.scheduleDailySummary(ridesOnNext9amDay.length, next9am);
        await apiClient.insertInAppNotification({
          type: 'daily_summary',
          title: 'Planning du jour',
          body: `Vous avez ${ridesOnNext9amDay.length} course${ridesOnNext9amDay.length > 1 ? 's' : ''} prévue${ridesOnNext9amDay.length > 1 ? 's' : ''} aujourd'hui.`,
        });
      }

      // Calculer revenus du jour et de la semaine
      const todayRevenueCalc = allTodayRides.reduce((sum: number, ride: any) => 
        sum + (ride.price_cents || 0), 0) / 100;
      
      setTodayRevenue(todayRevenueCalc);
      setWeekRevenue(statsData?.totals?.total_revenue_eur || 0);
      setTodayRides(allTodayRides.length);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCompleteRide = async (ride: any, generateInvoice: boolean = false) => {
    try {
      await apiClient.updatePersonalRide(ride.id, { status: 'COMPLETED' });

      if (generateInvoice) {
        let profile: any = null;
        try {
          profile = await apiClient.getMyVTCProfile();
        } catch (_e) {}
        if (!profile?.legal_info_configured) {
          setPendingInvoiceParams({ sourceType: 'PERSONAL', sourceId: ride.id });
          setShowLegalModal(true);
          await loadDashboardData();
          return;
        }
        try {
          const invoice = await apiClient.createInvoice('PERSONAL', ride.id);
          setGeneratedInvoice(invoice);
          setShowShareInvoiceAlert(true);
        } catch (error: any) {
          console.error('Erreur génération facture:', error);
          Alert.alert('Course terminée', 'Mais erreur lors de la génération de la facture');
        }
      } else {
        Alert.alert('✅', 'Course terminée !');
      }

      await loadDashboardData();
    } catch (error: any) {
      console.error('Erreur complétion course:', error);
      Alert.alert('Erreur', 'Impossible de terminer la course');
    }
  };

  const runPendingInvoiceAndShowShare = async () => {
    if (!pendingInvoiceParams) return;
    try {
      const invoice = await apiClient.createInvoice(pendingInvoiceParams.sourceType, pendingInvoiceParams.sourceId);
      setGeneratedInvoice(invoice);
      setShowShareInvoiceAlert(true);
      await loadDashboardData();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer la facture');
    }
    setPendingInvoiceParams(null);
  };

  const handleCancelRide = async (ride: any) => {
    try {
      await apiClient.updatePersonalRide(ride.id, { status: 'CANCELLED' });
      Alert.alert('✅', 'Course annulée');
      await loadDashboardData();
    } catch (error: any) {
      console.error('Erreur annulation course:', error);
      Alert.alert('Erreur', 'Impossible d\'annuler la course');
    }
  };

  const handleShareWhatsApp = async (invoice: any) => {
    try {
      const invoiceUrl = getInvoiceUrl(invoice.public_token);
      const message = `Merci pour votre course. Vous trouverez votre facture sur le lien suivant : ${invoiceUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        // Fermer l'alerte
        setShowShareInvoiceAlert(false);
        setGeneratedInvoice(null);
      } else {
        Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur partage WhatsApp:', error);
      Alert.alert('Erreur', 'Impossible de partager via WhatsApp');
    }
  };

  const handleShareEmail = async (invoice: any) => {
    try {
      const invoiceUrl = getInvoiceUrl(invoice.public_token);
      const subject = `Facture ${invoice.invoice_number}`;
      const body = `Bonjour,\n\nVeuillez trouver votre facture ${invoice.invoice_number} d'un montant de ${(invoice.total_amount_cents / 100).toFixed(2)}€.\n\nVoir la facture : ${invoiceUrl}\n\nCordialement`;
      const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
        // Fermer l'alerte
        setShowShareInvoiceAlert(false);
        setGeneratedInvoice(null);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application mail');
      }
    } catch (error) {
      console.error('Erreur partage Email:', error);
      Alert.alert('Erreur', 'Impossible de partager par email');
    }
  };

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'UBER': return 'car';
      case 'BOLT': return 'flash';
      case 'DIRECT_CLIENT': return 'person';
      case 'MARKETPLACE': return 'storefront';
      default: return 'document-text';
    }
  };

  const getSourceLabel = (src: string) => {
    switch (src) {
      case 'UBER': return 'Externe';
      case 'BOLT': return 'Externe';
      case 'DIRECT_CLIENT': return 'Direct';
      case 'MARKETPLACE': return 'Corail';
      default: return 'Autre';
    }
  };

  // Calculer les prochaines courses (CLAIMED du marketplace) - avec protection contre undefined
  const claimedRides = (userRides || []).filter((ride: any) => 
    ride.status === 'CLAIMED' && 
    ride.picker_id && 
    new Date(ride.scheduled_at).getTime() > Date.now()
  ).sort((a: any, b: any) => 
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  ).slice(0, 3); // Max 3 courses

  const firstName = userFullName?.split(' ')[0] || 'Chauffeur';
  const hasUpcoming = inProgressRides.length > 0 || upcomingRides.length > 0;

  if (loading && !refreshing) {
    return <DashboardSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Barre supérieure avec cloche notifications */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Text style={styles.topBarTitle}>Accueil</Text>
        <TouchableOpacity
          onPress={onShowNotifications}
          style={styles.bellButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="notifications-outline" size={24} color="#e2e8f0" />
          {unreadNotificationsCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.info} />}
      >
        {/* Hero accueil */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <View style={styles.heroNameRow}>
            <Text style={styles.userName}>{firstName}</Text>
            {isDriverVerified && (
              <>
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => setShowVerifiedLabel(true)}
                  style={styles.verifiedBadge}
                  activeOpacity={0.8}
                  accessibilityLabel="Profil vérifié"
                >
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </TouchableOpacity>
                {showVerifiedLabel && (
                  <View style={styles.verifiedLabel}>
                    <Text style={styles.verifiedLabelText}>Profil vérifié</Text>
                  </View>
                )}
              </>
            )}
          </View>
          <Text style={styles.heroTagline}>Vos outils pour exercer en chauffeur privé</Text>
        </View>

        {/* Carte Profil vérifié (accès réseau / réservations site) — remplace l’ancienne bannière orange */}
        {onNavigateToVerificationProfile && !isDriverVerified && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onNavigateToVerificationProfile}
            style={[
              styles.verificationCard,
              driverVerificationStatus === 'pending' && styles.verificationCardPending,
              driverVerificationStatus === 'rejected' && styles.verificationCardRejected,
              (driverVerificationStatus !== 'pending' && driverVerificationStatus !== 'rejected') && styles.verificationCardUnverified,
            ]}
          >
            <View style={styles.verificationCardLeft}>
              <Ionicons
                name={driverVerificationStatus === 'pending' ? 'time' : 'shield-outline'}
                size={18}
                color={driverVerificationStatus === 'pending' ? '#b45309' : driverVerificationStatus === 'rejected' ? '#b91c1c' : '#78716c'}
              />
              <View style={styles.verificationCardTextWrap}>
                <Text style={styles.verificationCardTitle} numberOfLines={1}>
                  {driverVerificationStatus === 'pending'
                    ? 'Vérification en cours'
                    : driverVerificationStatus === 'rejected'
                      ? 'Profil rejeté'
                      : 'Profil non vérifié'}
                </Text>
                <Text style={styles.verificationCardSubtitle} numberOfLines={1}>
                  {driverVerificationStatus === 'pending'
                    ? 'Examen de vos documents en cours'
                    : driverVerificationStatus === 'rejected'
                      ? 'Modifiez vos documents et resoumettez'
                      : 'Vérifiez votre profil pour débloquer le réseau'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}

        <GroupInvitationsBanner count={pendingInvitationsCount} onPress={() => onOpenGroupInvitations?.()} />

        {/* Course(s) en cours — bien visible en haut */}
        {inProgressRides.length > 0 && (
          <View style={styles.inProgressSection}>
            <Text style={styles.inProgressSectionTitle}>En cours</Text>
            {inProgressRides.map((ride: any) => (
              <RideCard
                key={ride.id}
                ride={ride}
                status="IN_PROGRESS"
                onPress={() => onPersonalRidePress(ride)}
                onComplete={(generateInvoice) => handleCompleteRide(ride, generateInvoice)}
                onCancel={() => handleCancelRide(ride)}
              />
            ))}
          </View>
        )}

        {pendingDriverRequestsCount > 0 && onNavigateToDriverRequests && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onNavigateToDriverRequests}
            style={styles.driverRequestsBanner}
          >
            <View style={styles.driverRequestsBannerLeft}>
              <View style={styles.driverRequestsBannerIcon}>
                <Ionicons name="mail-unread" size={20} color="#fff" />
                <View style={styles.driverRequestsBadge}>
                  <Text style={styles.driverRequestsBadgeText}>
                    {pendingDriverRequestsCount > 99 ? '99+' : pendingDriverRequestsCount}
                  </Text>
                </View>
              </View>
              <View>
                <Text style={styles.driverRequestsBannerTitle}>
                  Demande{pendingDriverRequestsCount > 1 ? 's' : ''} reçue{pendingDriverRequestsCount > 1 ? 's' : ''}
                </Text>
                <Text style={styles.driverRequestsBannerSubtitle}>Depuis votre Page Pro</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}

        {/* Module Ma Page Pro — compacte à 100 %, Partager en avant */}
        {pageProStatus !== null && onNavigateToPagePro && (() => {
          const pct = pageProCompletion;
          const isComplete = pct >= 100 || pageProStatus === 'active';
          const canShare = pageProStatus === 'active' && pageProSlug;

          if (isComplete && canShare) {
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onNavigateToPagePro}
                style={styles.pageProCardCompact}
              >
                <View style={styles.pageProCompactLeft}>
                  <Text style={styles.pageProCardTitle}>Ma Page Pro</Text>
                  <Text style={styles.pageProCardTagline}>Recevez des réservations sans intermédiaire.</Text>
                </View>
                <View style={styles.pageProCompactActions}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={async () => {
                      try {
                        const url = getVtcProfileUrl(pageProSlug!);
                        const message = `Réservez directement avec moi — mon profil chauffeur privé sur Corail : ${url}`;
                        await Share.share({ message });
                      } catch (_e) {}
                    }}
                    style={styles.pageProSharePrimary}
                  >
                    <Ionicons name="share-social" size={18} color="#fff" />
                    <Text style={styles.pageProSharePrimaryText}>Partager</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }

          const messageConstruction = pct < 50 ? 'Construisez votre page de réservation directe.' : null;
          const messageAmelioration = pct >= 50 && pct < 100 ? 'Quelques infos en plus pour optimiser.' : null;
          const messagePartage = canShare ? 'Page prête à être partagée.' : null;
          const message = messagePartage || messageAmelioration || messageConstruction;
          return (
            <View style={styles.pageProCard}>
              <Text style={styles.pageProCardTitle}>Ma Page Pro</Text>
              <Text style={styles.pageProCardTagline}>
                Recevez des réservations sans intermédiaire.
              </Text>
              <Text style={styles.pageProCardPct}>{pct} % complété</Text>
              <View style={styles.pageProProgressTrack}>
                <View style={[styles.pageProProgressFill, { width: `${Math.min(100, pct)}%` }]} />
              </View>
              <Text style={styles.pageProCardMessage}>{message}</Text>
              {canShare ? (
                <View style={styles.pageProCardShareRow}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={async () => {
                      try {
                        const url = getVtcProfileUrl(pageProSlug!);
                        const msg = `Réservez directement avec moi — mon profil chauffeur privé sur Corail : ${url}`;
                        await Share.share({ message: msg });
                      } catch (_e) {}
                    }}
                    style={styles.pageProCta}
                  >
                    <Ionicons name="share-social" size={18} color="#fff" />
                    <Text style={styles.pageProCtaText}>Partager</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={onNavigateToPagePro}
                  style={styles.pageProCta}
                >
                  <Text style={styles.pageProCtaText}>Améliorer ma page</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}

        {/* Aujourd'hui — affiché seulement s'il y a au moins une course ou un CA */}
        {(todayRevenue > 0 || todayRides > 0) && (
          <View style={styles.todayRow}>
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>{todayRevenue.toFixed(2)} €</Text>
              <Text style={styles.todayLabel}>Aujourd'hui</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>{todayRides}</Text>
              <Text style={styles.todayLabel}>courses</Text>
            </View>
          </View>
        )}

        {/* CTA principal : accès au suivi / mes outils */}
        <TouchableOpacity style={styles.ctaPrimary} onPress={onNavigateToTools} activeOpacity={0.9}>
          <LinearGradient
            colors={['#0ea5e9', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaPrimaryGradient}
          >
            <Ionicons name="briefcase" size={24} color="#fff" />
            <View style={styles.ctaPrimaryTextBlock}>
              <Text style={styles.ctaPrimaryText}>Mes outils</Text>
              <Text style={styles.ctaPrimarySubtext}>Devis, planning, factures, QR Code</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Lien vers planning si des courses à venir */}
        {hasUpcoming && (() => {
          const isInProgress = inProgressRides.length > 0;
          const count = isInProgress ? inProgressRides.length : upcomingRides.length;
          return (
            <TouchableOpacity style={styles.ctaSecondary} onPress={onNavigateToPlanning} activeOpacity={0.8}>
              <Ionicons name="calendar" size={20} color="#0ea5e9" />
              <View style={styles.ctaSecondaryTextRow}>
                <Text style={styles.ctaSecondaryText}>
                  {isInProgress ? 'Course en cours' : 'Prochaines courses'}
                </Text>
                <View style={styles.ctaSecondaryBadge}>
                  <Text style={styles.ctaSecondaryBadgeText}>{count}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>
          );
        })()}

        {/* Accès rapides : outillage */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={onCreateRide} activeOpacity={0.85}>
            <View style={[styles.actionIconWrap, { backgroundColor: theme.colors.accentBgStrong }]}>
              <Ionicons name="document-text-outline" size={24} color="#818cf8" />
            </View>
            <Text style={styles.actionLabel}>Saisir une{'\n'}course</Text>
            <Text style={styles.actionSublabel}>Suivi & facturation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={onOpenQRCode} activeOpacity={0.85}>
            <View style={[styles.actionIconWrap, { backgroundColor: theme.colors.warningBg }]}>
              <Ionicons name="qr-code-outline" size={24} color="#fb923c" />
            </View>
            <Text style={styles.actionLabel}>QR Code{'\n'}Pro</Text>
            <Text style={styles.actionSublabel}>Présentation client</Text>
          </TouchableOpacity>
        </View>

        {/* Lien discret vers les annonces */}
        <TouchableOpacity style={styles.marketLink} onPress={onNavigateToCourses} activeOpacity={0.8}>
          <Ionicons name="pricetag-outline" size={18} color="#64748b" />
          <Text style={styles.marketLinkText}>Voir les annonces de courses disponibles</Text>
          <Ionicons name="chevron-forward" size={16} color="#64748b" />
        </TouchableOpacity>

      </ScrollView>

      <LegalInfoModal
        visible={showLegalModal}
        onClose={() => { setShowLegalModal(false); setPendingInvoiceParams(null); }}
        initialBusinessName={userFullName}
        onSaved={() => runPendingInvoiceAndShowShare()}
        onLater={() => {
          Alert.alert(
            'Infos légales requises',
            'Pour générer une facture conforme, renseignez vos infos légales (SIRET, adresse) depuis Mes outils. La course a bien été marquée comme terminée.'
          );
        }}
      />

      {/* Popup de partage de facture */}
      {generatedInvoice && (
        <CustomAlert
          visible={showShareInvoiceAlert}
          title="Facture générée !"
          message={`Facture ${generatedInvoice.invoice_number} créée. Comment souhaitez-vous la partager ?`}
          buttons={[
            {
              text: 'Partager par WhatsApp',
              style: 'primary',
              onPress: () => handleShareWhatsApp(generatedInvoice),
            },
            {
              text: 'Partager par Email',
              style: 'default',
              onPress: () => handleShareEmail(generatedInvoice),
            },
            {
              text: 'Plus tard',
              style: 'cancel',
              onPress: () => {},
            },
          ]}
          onClose={() => {
            setShowShareInvoiceAlert(false);
            setGeneratedInvoice(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
  },
  topBarSpacer: { width: 40 },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  bellButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  bellBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 8,
    paddingBottom: 100,
  },
  hero: {
    marginBottom: theme.spacing.lg,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1d9bf0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedLabel: {
    backgroundColor: 'rgba(29, 155, 240, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  verifiedLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7dd3fc',
  },
  heroTagline: {
    fontSize: 14,
    color: theme.colors.textMutedDark,
    marginTop: 4,
  },
  greeting: {
    fontSize: 15,
    color: theme.colors.textMutedDark,
    marginBottom: 2,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  bannerWrap: {
    marginBottom: 8,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  verificationCardUnverified: {
    backgroundColor: 'rgba(120, 113, 108, 0.08)',
    borderColor: 'rgba(120, 113, 108, 0.2)',
  },
  verificationCardPending: {
    backgroundColor: 'rgba(180, 83, 9, 0.08)',
    borderColor: 'rgba(180, 83, 9, 0.22)',
  },
  verificationCardRejected: {
    backgroundColor: 'rgba(185, 28, 28, 0.08)',
    borderColor: 'rgba(185, 28, 28, 0.22)',
  },
  verificationCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  verificationCardTextWrap: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  verificationCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  verificationCardSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  driverRequestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  driverRequestsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverRequestsBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverRequestsBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.warningOrange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  driverRequestsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  driverRequestsBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  driverRequestsBannerSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  pageProCard: {
    marginBottom: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  pageProCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  pageProCardTagline: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
    lineHeight: 20,
  },
  pageProCardPct: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 16,
  },
  pageProProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.borderMuted,
    marginTop: 8,
    overflow: 'hidden',
  },
  pageProProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.info,
  },
  pageProCardMessage: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 14,
    lineHeight: 18,
  },
  pageProCta: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageProCardShareRow: {
    alignItems: 'center',
  },
  pageProCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  pageProShareLink: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  pageProShareLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.info,
  },
  pageProCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  pageProCompactLeft: {
    flex: 1,
  },
  pageProCompactActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageProSharePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.info,
  },
  pageProSharePrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  todayRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  todayItem: {
    flex: 1,
    alignItems: 'center',
  },
  todayValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  todayLabel: {
    fontSize: 12,
    color: theme.colors.textMutedDark,
    marginTop: 2,
  },
  todayDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 2,
  },
  ctaPrimary: {
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  ctaPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  ctaPrimaryTextBlock: {
    flex: 1,
  },
  ctaPrimaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.white,
  },
  ctaPrimarySubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  ctaSecondaryTextRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ctaSecondaryText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  ctaSecondaryBadge: {
    backgroundColor: '#f59e0b',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  ctaSecondaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.background,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actionSublabel: {
    fontSize: 11,
    color: theme.colors.textMutedDark,
    marginTop: 2,
    textAlign: 'center',
  },
  marketLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    gap: 6,
  },
  marketLinkText: {
    fontSize: 14,
    color: theme.colors.textMutedDark,
  },
  inProgressSection: {
    marginBottom: theme.spacing.xl,
  },
  inProgressSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
});

