/**
 * DashboardScreen - Vue d'ensemble Assistant VTC
 * Revenus, courses, statistiques, accès rapides
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import * as NotificationService from '../services/notifications';
import { DashboardSkeleton } from '../components/skeletons';
import { GroupInvitationsBanner } from '../components/GroupInvitationsBanner';

interface DashboardProps {
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
}

export default function DashboardScreen({
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
}: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [todayRides, setTodayRides] = useState(0);
  const [upcomingRides, setUpcomingRides] = useState<any[]>([]);

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

      // Charger les courses à venir (SCHEDULED)
      let upcomingRidesData: any[] = [];
      try {
        const ridesData = await apiClient.listPersonalRides({ status: 'SCHEDULED', limit: 5 });
        // Filtrer uniquement les courses futures
        upcomingRidesData = (ridesData || []).filter((ride: any) => 
          ride.scheduled_at && new Date(ride.scheduled_at).getTime() > Date.now()
        );
        setUpcomingRides(upcomingRidesData);
      } catch (error: any) {
        console.warn('No upcoming rides found');
        setUpcomingRides([]);
      }

      // 🔔 Planifier le résumé quotidien si des courses prévues aujourd'hui
      const today = new Date().toDateString();
      const todayRidesCount = upcomingRidesData.filter((ride: any) => {
        if (!ride.scheduled_at) return false;
        return new Date(ride.scheduled_at).toDateString() === today;
      }).length;
      
      if (todayRidesCount > 0) {
        await NotificationService.scheduleDailySummary(todayRidesCount);
      }

      // Calculer revenus du jour et de la semaine
      // Réutiliser la variable 'today' déjà déclarée plus haut
      const todayScheduledRides = upcomingRidesData.filter((ride: any) => {
        if (!ride.scheduled_at) return false;
        return new Date(ride.scheduled_at).toDateString() === today;
      });
      
      const todayRevenueCalc = todayScheduledRides.reduce((sum: number, ride: any) => 
        sum + (ride.price_cents || 0), 0) / 100;
      
      setTodayRevenue(todayRevenueCalc);
      setWeekRevenue(statsData?.totals?.total_revenue_eur || 0);
      setTodayRides(todayScheduledRides.length);
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

  if (loading && !refreshing) {
    return <DashboardSkeleton />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{userFullName}</Text>
          </View>
        </View>

        {/* Bannière invitations groupes */}
        <GroupInvitationsBanner 
          count={pendingInvitationsCount} 
          onPress={() => onOpenGroupInvitations?.()} 
        />

        {/* Revenus Cards */}
        <View style={styles.revenueSection}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <Ionicons name="today" size={20} color="#10b981" />
              <Text style={styles.revenueLabel}>Aujourd'hui</Text>
            </View>
            <Text style={styles.revenueValue}>{todayRevenue.toFixed(2)} €</Text>
            <Text style={styles.revenueSubtext}>{todayRides} courses</Text>
          </View>

          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <Ionicons name="calendar" size={20} color="#6366f1" />
              <Text style={styles.revenueLabel}>Cette semaine</Text>
            </View>
            <Text style={styles.revenueValue}>{weekRevenue.toFixed(2)} €</Text>
            <Text style={styles.revenueSubtext}>7 derniers jours</Text>
          </View>
        </View>

        {/* Prochaines courses (marketplace + personnelles) */}
        {(claimedRides.length > 0 || upcomingRides.length > 0) && (
          <View style={styles.upcomingCoursesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prochaines courses</Text>
              <TouchableOpacity onPress={onNavigateToPlanning} activeOpacity={0.7}>
                <Text style={styles.viewMoreText}>
                  Voir plus <Ionicons name="chevron-forward" size={14} color="#6366f1" />
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Courses marketplace réclamées */}
            {claimedRides.map((ride: any) => (
              <TouchableOpacity 
                key={ride.id} 
                style={styles.upcomingCourseCard}
                onPress={() => onRidePress(ride)}
                activeOpacity={0.7}
              >
                <View style={styles.upcomingCourseHeader}>
                  <Ionicons name="calendar" size={16} color="#6366f1" />
                  <Text style={styles.upcomingCourseTime}>
                    {new Date(ride.scheduled_at).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.upcomingCourseRoute}>
                  <Ionicons name="location" size={14} color="#64748b" />
                  <Text style={styles.upcomingCourseAddress} numberOfLines={1}>
                    {ride.pickup_address}
                  </Text>
                </View>
                <View style={styles.upcomingCourseRoute}>
                  <Ionicons name="flag" size={14} color="#64748b" />
                  <Text style={styles.upcomingCourseAddress} numberOfLines={1}>
                    {ride.dropoff_address}
                  </Text>
                </View>
                {ride.price_cents && (
                  <Text style={styles.upcomingCoursePrice}>
                    {(ride.price_cents / 100).toFixed(2)}€
                  </Text>
                )}
              </TouchableOpacity>
            ))}

            {/* Courses personnelles planifiées */}
            {upcomingRides.map((ride) => (
              <TouchableOpacity 
                key={ride.id} 
                style={styles.upcomingCourseCard}
                onPress={() => onPersonalRidePress(ride)}
                activeOpacity={0.7}
              >
                <View style={styles.upcomingCourseHeader}>
                  <Ionicons name="time" size={16} color="#6366f1" />
                  <Text style={styles.upcomingCourseTime}>
                    {new Date(ride.scheduled_at).toLocaleString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.upcomingCourseRoute}>
                  <Ionicons name="location" size={14} color="#64748b" />
                  <Text style={styles.upcomingCourseAddress}>{ride.pickup_address}</Text>
                </View>
                <View style={styles.upcomingCourseRoute}>
                  <Ionicons name="flag" size={14} color="#64748b" />
                  <Text style={styles.upcomingCourseAddress}>{ride.dropoff_address}</Text>
                </View>
                {ride.price_cents && (
                  <Text style={styles.upcomingCoursePrice}>
                    {(ride.price_cents / 100).toFixed(2)}€
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Accès rapides */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Accès rapides</Text>

          <TouchableOpacity
            style={styles.quickAccessButton}
            onPress={onOpenQRCode}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6b47', '#ff8a6d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quickAccessGradient}
            >
              <View style={styles.quickAccessLeft}>
                <Ionicons name="qr-code" size={24} color="#fff" />
                <Text style={styles.quickAccessText}>QR Code Pro</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessButton}
            onPress={onCreateRide}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quickAccessGradient}
            >
              <View style={styles.quickAccessLeft}>
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.quickAccessText}>Enregistrer une course</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Comment fonctionnent les crédits ? */}
        <View style={styles.creditsExplanationSection}>
          <View style={styles.creditsExplanationHeader}>
            <View style={styles.creditsIconLarge}>
              <Text style={styles.creditsIconText}>C</Text>
            </View>
            <Text style={styles.creditsExplanationTitle}>Comment fonctionnent les crédits ?</Text>
          </View>

          <View style={styles.creditsExplanationContent}>
            {/* Gagner des crédits */}
            <View style={styles.creditsSection}>
              <View style={styles.creditsSectionHeader}>
                <Ionicons name="add-circle" size={18} color="#10b981" />
                <Text style={styles.creditsSectionTitle}>Gagner des crédits</Text>
              </View>
              <View style={styles.creditItem}>
                <View style={styles.creditDot} />
                <View style={styles.creditBadgeInline}>
                  <Text style={styles.creditBadgeTextPositive}>+1</Text>
                  <View style={styles.creditIconSmallPositive}>
                    <Text style={styles.creditIconSmallTextPositive}>C</Text>
                  </View>
                  <Text style={styles.creditText}>à chaque course publiée</Text>
                </View>
              </View>
              <View style={styles.creditItem}>
                <View style={styles.creditDot} />
                <View style={styles.creditBadgeInline}>
                  <Text style={styles.creditBadgeTextPositive}>+1</Text>
                  <View style={styles.creditIconSmallPositive}>
                    <Text style={styles.creditIconSmallTextPositive}>C</Text>
                  </View>
                  <Text style={styles.creditBadgeTextPositive}>bonus</Text>
                  <Text style={styles.creditText}>si course terminée</Text>
                </View>
              </View>
            </View>

            {/* Dépenser des crédits */}
            <View style={styles.creditsSection}>
              <View style={styles.creditsSectionHeader}>
                <Ionicons name="remove-circle" size={18} color="#ff6b47" />
                <Text style={styles.creditsSectionTitle}>Utiliser des crédits</Text>
              </View>
              <View style={styles.creditItem}>
                <View style={styles.creditDot} />
                <View style={styles.creditBadgeInline}>
                  <Text style={styles.creditBadgeText}>-1</Text>
                  <View style={styles.creditIconSmall}>
                    <Text style={styles.creditIconSmallText}>C</Text>
                  </View>
                  <Text style={styles.creditText}>pour prendre une course</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  revenueSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  revenueLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  revenueSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  sourceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sourceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  sourceRides: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sourceRevenue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  upcomingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  upcomingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  upcomingTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  upcomingRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  upcomingAddress: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
  },
  quickAccessSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  upcomingCoursesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  upcomingCourseCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  upcomingCourseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  upcomingCourseTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginLeft: 8,
  },
  upcomingCourseRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  upcomingCourseAddress: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 8,
    flex: 1,
  },
  upcomingCoursePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 8,
  },
  quickAccessButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  quickAccessGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickAccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickAccessText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  creditsExplanationSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  creditsExplanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  creditsIconLarge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 71, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsIconText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ff6b47',
  },
  creditsExplanationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  creditsExplanationContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  creditsSection: {
    marginBottom: 14,
  },
  creditsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  creditsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  creditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 6,
  },
  creditDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#64748b',
    marginRight: 8,
  },
  creditBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  creditBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff6b47',
  },
  creditBadgeTextPositive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  creditIconSmall: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditIconSmallPositive: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditIconSmallText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ff6b47',
  },
  creditIconSmallTextPositive: {
    fontSize: 8,
    fontWeight: '800',
    color: '#10b981',
  },
  creditText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
});

