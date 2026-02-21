/**
 * DashboardScreen - Accueil épuré type Uber
 * Hero, crédits, CTA principal, explication crédits.
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { theme } from '../theme';
import * as NotificationService from '../services/notifications';
import { DashboardSkeleton } from '../components/skeletons';
import { GroupInvitationsBanner } from '../components/GroupInvitationsBanner';
import { ValidationBanner } from '../components/ValidationBanner';
import { RideCard } from '../components/RideCard';
import { CustomAlert } from '../components/CustomAlert';
import { getInvoiceUrl } from '../constants/urls';

interface DashboardProps {
  verificationStatus: string | null;
  onRefreshVerification: () => Promise<void>;
  userFullName: string;
  userCredits: number;
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
  onOpenGroupInvitations?: () => void; // Ouvrir l'écran des invitations
  onNavigateToDriverRequests?: () => void; // Ouvrir l'écran des demandes (page publique)
}

export default function DashboardScreen({
  verificationStatus,
  onRefreshVerification,
  userFullName,
  userCredits,
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
}: DashboardProps) {
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

  useEffect(() => {
    loadDashboardData();
  }, []);

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

      // Planifier les notifications "1 minute avant" pour les courses à venir
      for (const ride of upcoming) {
        if (ride.pickup_address && ride.dropoff_address) {
          await NotificationService.scheduleRideImminentReminder(
            ride.id,
            ride.scheduled_at,
            ride.pickup_address,
            ride.dropoff_address
          );
        }
      }

      // 🔔 Planifier le résumé quotidien si des courses prévues aujourd'hui
      const today = new Date().toDateString();
      const allTodayRides = [...inProgress, ...upcoming].filter((ride: any) => {
        if (!ride.scheduled_at) return false;
        return new Date(ride.scheduled_at).toDateString() === today;
      });
      
      if (allTodayRides.length > 0) {
        await NotificationService.scheduleDailySummary(allTodayRides.length);
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
      // Marquer la course comme COMPLETED
      await apiClient.updatePersonalRide(ride.id, { status: 'COMPLETED' });

      if (generateInvoice) {
        // Générer la facture
        try {
          const invoice = await apiClient.createInvoice('PERSONAL', ride.id);
          console.log('✅ Facture générée:', invoice);
          
          // Stocker la facture et afficher le popup de partage
          setGeneratedInvoice(invoice);
          setShowShareInvoiceAlert(true);
        } catch (error: any) {
          console.error('Erreur génération facture:', error);
          Alert.alert('Course terminée', 'Mais erreur lors de la génération de la facture');
        }
      } else {
        Alert.alert('✅', 'Course terminée !');
      }

      // Recharger les données
      await loadDashboardData();
    } catch (error: any) {
      console.error('Erreur complétion course:', error);
      Alert.alert('Erreur', 'Impossible de terminer la course');
    }
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
      const message = `Facture ${invoice.invoice_number}\n\nMontant : ${(invoice.total_amount_cents / 100).toFixed(2)}€\n\nVoir la facture : ${invoiceUrl}`;
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.info} />}
      >
        {/* Hero accueil */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>{firstName}</Text>
          <Text style={styles.heroTagline}>Vos outils pour exercer en chauffeur privé</Text>
          <View style={styles.creditsPill}>
            <View style={styles.creditsPillIcon}>
              <Text style={styles.creditsPillIconText}>C</Text>
            </View>
            <Text style={styles.creditsPillValue}>{userCredits}</Text>
            <Text style={styles.creditsPillLabel}>crédits</Text>
          </View>
        </View>

        {(verificationStatus === 'PENDING' || verificationStatus === 'REJECTED') && (
          <View style={styles.bannerWrap}>
            <ValidationBanner verificationStatus={verificationStatus} onRefresh={onRefreshVerification} />
          </View>
        )}

        <GroupInvitationsBanner count={pendingInvitationsCount} onPress={() => onOpenGroupInvitations?.()} />

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
                <Text style={styles.driverRequestsBannerSubtitle}>Depuis votre page publique</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}

        {/* Aujourd'hui - une ligne */}
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

        {/* CTA principal : accès au suivi / outils pro */}
        <TouchableOpacity style={styles.ctaPrimary} onPress={onNavigateToTools} activeOpacity={0.9}>
          <LinearGradient
            colors={['#0ea5e9', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaPrimaryGradient}
          >
            <Ionicons name="briefcase" size={24} color="#fff" />
            <View style={styles.ctaPrimaryTextBlock}>
              <Text style={styles.ctaPrimaryText}>Mes outils pro</Text>
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

        {/* Comment fonctionnent les crédits - compact et lisible */}
        <View style={styles.creditsBlock}>
          <Text style={styles.creditsBlockTitle}>Comment fonctionnent les crédits ?</Text>
          <View style={styles.creditsCard}>
            <View style={styles.creditsRow}>
              <View style={styles.creditsRowIconGreen}>
                <Ionicons name="add" size={16} color="#34d399" />
              </View>
              <Text style={styles.creditsRowText}>
                <Text style={styles.creditsRowBold}>+1</Text> à chaque course publiée
              </Text>
            </View>
            <View style={styles.creditsRow}>
              <View style={styles.creditsRowIconGreen}>
                <Ionicons name="gift" size={16} color="#34d399" />
              </View>
              <Text style={styles.creditsRowText}>
                <Text style={styles.creditsRowBold}>+1</Text> bonus si la course est terminée
              </Text>
            </View>
            <View style={[styles.creditsRow, { marginBottom: 0 }]}>
              <View style={styles.creditsRowIconOrange}>
                <Ionicons name="remove" size={16} color="#fb923c" />
              </View>
              <Text style={styles.creditsRowText}>
                <Text style={styles.creditsRowBoldOrange}>−1</Text> pour prendre une course parmi les annonces
              </Text>
            </View>
          </View>
        </View>

        {/* Courses EN COURS uniquement (priorité absolue) - affichage compact */}
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

      </ScrollView>

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
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 100,
  },
  hero: {
    marginBottom: theme.spacing.lg,
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
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  creditsPillIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsPillIconText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.warningOrange,
  },
  creditsPillValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  creditsPillLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  bannerWrap: {
    marginBottom: 8,
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
  creditsBlock: {
    marginBottom: theme.spacing.xl,
  },
  creditsBlockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  creditsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  creditsRowIconGreen: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsRowIconOrange: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsRowText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSoft,
  },
  creditsRowBold: {
    fontWeight: '700',
    color: theme.colors.successLight,
  },
  creditsRowBoldOrange: {
    fontWeight: '700',
    color: theme.colors.warningOrange,
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

