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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

interface DashboardProps {
  userFullName: string;
  userCredits: number;
  onNavigateToCourses: () => void;
  onNavigateToTools: () => void;
  onOpenQRCode: () => void;
}

export default function DashboardScreen({
  userFullName,
  userCredits,
  onNavigateToCourses,
  onNavigateToTools,
  onOpenQRCode,
}: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
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
      const statsData = await apiClient.getPersonalRidesStats();
      setStats(statsData);

      // Charger les courses à venir (SCHEDULED)
      const ridesData = await apiClient.listPersonalRides({ status: 'SCHEDULED', limit: 5 });
      setUpcomingRides(ridesData);

      // Calculer revenus du jour et de la semaine
      // TODO: Améliorer avec des filtres backend par date
      const today = new Date().toDateString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Pour l'instant, on utilise les totaux
      setTodayRevenue(statsData?.totals?.total_revenue_eur || 0);
      setWeekRevenue(statsData?.totals?.total_revenue_eur || 0);
      setTodayRides(statsData?.totals?.completed_rides || 0);
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
      case 'UBER': return 'Uber';
      case 'BOLT': return 'Bolt';
      case 'DIRECT_CLIENT': return 'Direct';
      case 'MARKETPLACE': return 'Corail';
      default: return 'Autre';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
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

        {/* Statistiques rapides */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Aperçu rapide</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="car" size={24} color="#6366f1" />
                <Text style={styles.statValue}>{stats.totals?.completed_rides || 0}</Text>
                <Text style={styles.statLabel}>Courses</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="speedometer" size={24} color="#10b981" />
                <Text style={styles.statValue}>
                  {stats.totals?.total_distance_km?.toFixed(0) || 0}
                </Text>
                <Text style={styles.statLabel}>km parcourus</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={24} color="#f59e0b" />
                <Text style={styles.statValue}>
                  {((stats.totals?.total_revenue_eur || 0) / (stats.totals?.completed_rides || 1)).toFixed(0)} €
                </Text>
                <Text style={styles.statLabel}>Prix moyen</Text>
              </View>
            </View>
          </View>
        )}

        {/* Revenus par source */}
        {stats?.by_source && stats.by_source.length > 0 && (
          <View style={styles.sourceSection}>
            <Text style={styles.sectionTitle}>Revenus par source</Text>
            {stats.by_source.map((source: any) => (
              <View key={source.source} style={styles.sourceCard}>
                <View style={styles.sourceLeft}>
                  <View style={styles.sourceIconContainer}>
                    <Ionicons name={getSourceIcon(source.source) as any} size={20} color="#6366f1" />
                  </View>
                  <View>
                    <Text style={styles.sourceName}>{getSourceLabel(source.source)}</Text>
                    <Text style={styles.sourceRides}>{source.completed_rides} courses</Text>
                  </View>
                </View>
                <Text style={styles.sourceRevenue}>{source.revenue_eur.toFixed(2)} €</Text>
              </View>
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
            onPress={onNavigateToTools}
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

        {/* Activité récente */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Dernière course complétée</Text>
                <Text style={styles.activitySubtext}>
                  {stats?.totals?.completed_rides > 0 ? 'Il y a 2 heures' : 'Aucune course complétée'}
                </Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Ionicons name="calendar" size={20} color="#6366f1" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Courses cette semaine</Text>
                <Text style={styles.activitySubtext}>
                  {stats?.totals?.completed_rides || 0} courses complétées
                </Text>
              </View>
            </View>
          </View>
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
                  <Text style={styles.creditBadgeText}>+1</Text>
                  <View style={styles.creditIconSmall}>
                    <Text style={styles.creditIconSmallText}>C</Text>
                  </View>
                  <Text style={styles.creditText}>à chaque course publiée</Text>
                </View>
              </View>
              <View style={styles.creditItem}>
                <View style={styles.creditDot} />
                <View style={styles.creditBadgeInline}>
                  <Text style={styles.creditBadgeText}>+1</Text>
                  <View style={styles.creditIconSmall}>
                    <Text style={styles.creditIconSmallText}>C</Text>
                  </View>
                  <Text style={styles.creditBadgeText}>bonus</Text>
                  <Text style={styles.creditText}>si course terminée</Text>
                </View>
              </View>
              <View style={styles.creditItem}>
                <View style={styles.creditDot} />
                <View style={styles.creditBadgeInline}>
                  <Text style={styles.creditBadgeText}>5-10</Text>
                  <View style={styles.creditIconSmall}>
                    <Text style={styles.creditIconSmallText}>C</Text>
                  </View>
                  <Text style={styles.creditBadgeText}>/mois</Text>
                  <Text style={styles.creditText}>avec Premium/Platinum</Text>
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

        {/* Prochaines courses */}
        {upcomingRides.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>Prochaines courses planifiées</Text>
            {upcomingRides.map((ride) => (
              <View key={ride.id} style={styles.upcomingCard}>
                <View style={styles.upcomingHeader}>
                  <Ionicons name="time" size={16} color="#6366f1" />
                  <Text style={styles.upcomingTime}>
                    {new Date(ride.scheduled_at).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.upcomingRoute}>
                  <Ionicons name="location" size={14} color="#64748b" />
                  <Text style={styles.upcomingAddress}>{ride.pickup_address}</Text>
                </View>
                <View style={styles.upcomingRoute}>
                  <Ionicons name="flag" size={14} color="#64748b" />
                  <Text style={styles.upcomingAddress}>{ride.dropoff_address}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
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
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  activitySubtext: {
    fontSize: 12,
    color: '#64748b',
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
  creditIconSmallText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ff6b47',
  },
  creditText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
});

