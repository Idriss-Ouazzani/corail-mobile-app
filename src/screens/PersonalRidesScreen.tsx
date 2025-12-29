/**
 * PersonalRidesScreen - Enregistrement et historique des courses externes
 * Design cohérent avec le reste de l'app, élégant et raffiné
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

interface PersonalRide {
  id: string;
  driver_id: string;
  source: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at?: string;
  completed_at?: string;
  price_cents?: number;
  distance_km?: number;
  duration_minutes?: number;
  client_name?: string;
  client_phone?: string;
  notes?: string;
  status: string;
  created_at: string;
}

interface Stats {
  by_source: Array<{
    source: string;
    total_rides: number;
    completed_rides: number;
    revenue_eur: number;
    total_distance_km: number;
    avg_price_eur: number;
  }>;
  totals: {
    total_rides: number;
    completed_rides: number;
    total_revenue_eur: number;
    total_distance_km: number;
  };
}

export default function PersonalRidesScreen({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'add' | 'history' | 'stats'>('add');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<PersonalRide[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Form state
  const [source, setSource] = useState<'UBER' | 'BOLT' | 'DIRECT_CLIENT' | 'OTHER'>('UBER');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [price, setPrice] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (tab === 'history') {
      loadRides();
    } else if (tab === 'stats') {
      loadStats();
    }
  }, [tab]);

  const loadRides = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listPersonalRides({ limit: 100 });
      setRides(data);
    } catch (error) {
      console.error('Error loading rides:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPersonalRidesStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      Alert.alert('Erreur', 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (tab === 'history') {
      await loadRides();
    } else if (tab === 'stats') {
      await loadStats();
    }
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner les adresses de départ et d\'arrivée');
      return;
    }

    try {
      setLoading(true);

      const rideData = {
        source,
        pickup_address: pickupAddress.trim(),
        dropoff_address: dropoffAddress.trim(),
        price_cents: price ? Math.round(parseFloat(price) * 100) : undefined,
        distance_km: distance ? parseFloat(distance) : undefined,
        duration_minutes: duration ? parseInt(duration, 10) : undefined,
        client_name: clientName.trim() || undefined,
        client_phone: clientPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'COMPLETED' as const,
      };

      await apiClient.createPersonalRide(rideData);

      Alert.alert('Succès', 'Course enregistrée avec succès');

      // Reset form
      setPickupAddress('');
      setDropoffAddress('');
      setPrice('');
      setDistance('');
      setDuration('');
      setClientName('');
      setClientPhone('');
      setNotes('');

      // Charger l'historique pour voir la nouvelle course
      setTab('history');
    } catch (error: any) {
      console.error('Error creating ride:', error);
      Alert.alert(
        'Erreur',
        error?.response?.data?.detail || 'Impossible d\'enregistrer la course'
      );
    } finally {
      setLoading(false);
    }
  };

  const getSourceLabel = (src: string) => {
    switch (src) {
      case 'UBER': return 'Uber';
      case 'BOLT': return 'Bolt';
      case 'DIRECT_CLIENT': return 'Client Direct';
      case 'MARKETPLACE': return 'Marketplace';
      case 'OTHER': return 'Autre';
      default: return src;
    }
  };

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'UBER': return 'car';
      case 'BOLT': return 'flash';
      case 'DIRECT_CLIENT': return 'person';
      case 'MARKETPLACE': return 'storefront';
      case 'OTHER': return 'document-text';
      default: return 'help-circle';
    }
  };

  const renderAddForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* Source */}
        <Text style={styles.label}>Plateforme</Text>
        <View style={styles.sourceButtons}>
          {(['UBER', 'BOLT', 'DIRECT_CLIENT', 'OTHER'] as const).map((src) => (
            <TouchableOpacity
              key={src}
              style={[styles.sourceButton, source === src && styles.sourceButtonActive]}
              onPress={() => setSource(src)}
            >
              <Ionicons 
                name={getSourceIcon(src) as any} 
                size={16} 
                color={source === src ? '#6366f1' : '#64748b'} 
                style={{ marginRight: 6 }}
              />
              <Text
                style={[styles.sourceButtonText, source === src && styles.sourceButtonTextActive]}
              >
                {getSourceLabel(src)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Adresses */}
        <Text style={styles.label}>Adresse de départ</Text>
        <TextInput
          style={styles.input}
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Ex: Gare Toulouse-Matabiau"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>Adresse d'arrivée</Text>
        <TextInput
          style={styles.input}
          value={dropoffAddress}
          onChangeText={setDropoffAddress}
          placeholder="Ex: Aéroport Toulouse-Blagnac"
          placeholderTextColor="#64748b"
        />

        {/* Informations financières et trajet */}
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Prix (€)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="28.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label}>Distance (km)</Text>
            <TextInput
              style={styles.input}
              value={distance}
              onChangeText={setDistance}
              placeholder="12.5"
              keyboardType="decimal-pad"
              placeholderTextColor="#64748b"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Durée (min)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="25"
              keyboardType="number-pad"
              placeholderTextColor="#64748b"
            />
          </View>
        </View>

        {/* Infos client (si Direct) */}
        {source === 'DIRECT_CLIENT' && (
          <>
            <Text style={styles.label}>Nom du client</Text>
            <TextInput
              style={styles.input}
              value={clientName}
              onChangeText={setClientName}
              placeholder="Jean Dupont"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Téléphone du client</Text>
            <TextInput
              style={styles.input}
              value={clientPhone}
              onChangeText={setClientPhone}
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
              placeholderTextColor="#64748b"
            />
          </>
        )}

        {/* Notes */}
        <Text style={styles.label}>Notes (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes personnelles..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={3}
        />

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Enregistrer la course</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderHistory = () => (
    <ScrollView
      style={styles.historyContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : rides.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color="#475569" />
          <Text style={styles.emptyStateText}>Aucune course enregistrée</Text>
          <Text style={styles.emptyStateSubtext}>Enregistrez votre première course !</Text>
        </View>
      ) : (
        rides.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <View style={styles.rideSourceBadge}>
                <Ionicons name={getSourceIcon(ride.source) as any} size={14} color="#6366f1" />
                <Text style={styles.rideSource}>{getSourceLabel(ride.source)}</Text>
              </View>
              <Text style={styles.ridePrice}>
                {ride.price_cents ? `${(ride.price_cents / 100).toFixed(2)} €` : '—'}
              </Text>
            </View>

            <View style={styles.rideRouteContainer}>
              <Ionicons name="location" size={16} color="#64748b" />
              <Text style={styles.rideRoute}>{ride.pickup_address}</Text>
            </View>
            <View style={styles.rideRouteContainer}>
              <Ionicons name="flag" size={16} color="#64748b" />
              <Text style={styles.rideRoute}>{ride.dropoff_address}</Text>
            </View>

            {(ride.distance_km || ride.duration_minutes) && (
              <View style={styles.rideDetails}>
                {ride.distance_km && (
                  <View style={styles.rideDetailItem}>
                    <Ionicons name="resize" size={14} color="#94a3b8" />
                    <Text style={styles.rideDetailText}>{ride.distance_km} km</Text>
                  </View>
                )}
                {ride.duration_minutes && (
                  <View style={styles.rideDetailItem}>
                    <Ionicons name="time" size={14} color="#94a3b8" />
                    <Text style={styles.rideDetailText}>{ride.duration_minutes} min</Text>
                  </View>
                )}
              </View>
            )}

            {ride.client_name && (
              <View style={styles.rideClientContainer}>
                <Ionicons name="person" size={14} color="#94a3b8" />
                <Text style={styles.rideClientName}>{ride.client_name}</Text>
              </View>
            )}

            {ride.notes && (
              <Text style={styles.rideNotes}>{ride.notes}</Text>
            )}

            <Text style={styles.rideDate}>
              {new Date(ride.completed_at || ride.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStats = () => (
    <ScrollView
      style={styles.statsContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : stats ? (
        <>
          {/* Totaux globaux */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardHeader}>
              <Ionicons name="analytics" size={20} color="#6366f1" />
              <Text style={styles.statsCardTitle}>Vue d'ensemble</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total courses</Text>
              <Text style={styles.statValue}>{stats.totals.total_rides || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Courses complétées</Text>
              <Text style={styles.statValue}>{stats.totals.completed_rides || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Revenu total</Text>
              <Text style={[styles.statValue, styles.statValueHighlight]}>
                {(stats.totals.total_revenue_eur || 0).toFixed(2)} €
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Distance totale</Text>
              <Text style={styles.statValue}>
                {(stats.totals.total_distance_km || 0).toFixed(1)} km
              </Text>
            </View>
          </View>

          {/* Par source */}
          {stats.by_source.map((sourceStats) => (
            <View key={sourceStats.source} style={styles.statsCard}>
              <View style={styles.statsCardHeader}>
                <Ionicons name={getSourceIcon(sourceStats.source) as any} size={20} color="#6366f1" />
                <Text style={styles.statsCardTitle}>{getSourceLabel(sourceStats.source)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Courses complétées</Text>
                <Text style={styles.statValue}>{sourceStats.completed_rides}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Revenu</Text>
                <Text style={[styles.statValue, styles.statValueHighlight]}>
                  {sourceStats.revenue_eur.toFixed(2)} €
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{sourceStats.total_distance_km.toFixed(1)} km</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Prix moyen</Text>
                <Text style={styles.statValue}>
                  {sourceStats.avg_price_eur ? sourceStats.avg_price_eur.toFixed(2) + ' €' : '—'}
                </Text>
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="stats-chart-outline" size={64} color="#475569" />
          <Text style={styles.emptyStateText}>Aucune statistique disponible</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header - Style cohérent avec le reste de l'app */}
      <LinearGradient 
        colors={['#0f172a', '#1e293b']} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Mes Courses</Text>
              <Text style={styles.headerSubtitle}>Enregistrez toutes vos courses</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs - Style cohérent */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'add' && styles.tabActive]}
          onPress={() => setTab('add')}
        >
          <Ionicons name="add-circle-outline" size={18} color={tab === 'add' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, tab === 'add' && styles.tabTextActive]}>
            Ajouter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Ionicons name="list" size={18} color={tab === 'history' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            Historique
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'stats' && styles.tabActive]}
          onPress={() => setTab('stats')}
        >
          <Ionicons name="bar-chart" size={18} color={tab === 'stats' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, tab === 'stats' && styles.tabTextActive]}>
            Statistiques
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === 'add' && renderAddForm()}
      {tab === 'history' && renderHistory()}
      {tab === 'stats' && renderStats()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  sourceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sourceButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  sourceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  sourceButtonTextActive: {
    color: '#6366f1',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rideCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  rideSource: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
  },
  ridePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  rideRouteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  rideRoute: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
  },
  rideDetails: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  rideDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rideDetailText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  rideClientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  rideClientName: {
    fontSize: 13,
    color: '#94a3b8',
  },
  rideNotes: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  rideDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  statsCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  statValueHighlight: {
    color: '#6366f1',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
});
