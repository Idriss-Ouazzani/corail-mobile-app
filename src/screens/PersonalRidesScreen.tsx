/**
 * PersonalRidesScreen - Enregistrement et historique des courses externes
 * (Uber, Bolt, Direct Client, etc.)
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

      Alert.alert('✅ Course enregistrée', 'La course a été ajoutée à votre historique');

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

  const renderAddForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* Source */}
        <Text style={styles.label}>Plateforme / Source *</Text>
        <View style={styles.sourceButtons}>
          {(['UBER', 'BOLT', 'DIRECT_CLIENT', 'OTHER'] as const).map((src) => (
            <TouchableOpacity
              key={src}
              style={[styles.sourceButton, source === src && styles.sourceButtonActive]}
              onPress={() => setSource(src)}
            >
              <Text
                style={[styles.sourceButtonText, source === src && styles.sourceButtonTextActive]}
              >
                {src === 'UBER' && '🚗 Uber'}
                {src === 'BOLT' && '⚡ Bolt'}
                {src === 'DIRECT_CLIENT' && '👤 Client Direct'}
                {src === 'OTHER' && '📋 Autre'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Adresses */}
        <Text style={styles.label}>Adresse de départ *</Text>
        <TextInput
          style={styles.input}
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Ex: Gare Toulouse-Matabiau"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Adresse d'arrivée *</Text>
        <TextInput
          style={styles.input}
          value={dropoffAddress}
          onChangeText={setDropoffAddress}
          placeholder="Ex: Aéroport Toulouse-Blagnac"
          placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Téléphone du client</Text>
            <TextInput
              style={styles.input}
              value={clientPhone}
              onChangeText={setClientPhone}
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
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
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>✅ Enregistrer la course</Text>
          )}
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
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 40 }} />
      ) : rides.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🚗</Text>
          <Text style={styles.emptyStateText}>Aucune course enregistrée</Text>
          <Text style={styles.emptyStateSubtext}>Enregistrez votre première course !</Text>
        </View>
      ) : (
        rides.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <Text style={styles.rideSource}>
                {ride.source === 'UBER' && '🚗 Uber'}
                {ride.source === 'BOLT' && '⚡ Bolt'}
                {ride.source === 'DIRECT_CLIENT' && '👤 Client Direct'}
                {ride.source === 'MARKETPLACE' && '🏪 Marketplace'}
                {ride.source === 'OTHER' && '📋 Autre'}
              </Text>
              <Text style={styles.ridePrice}>
                {ride.price_cents ? `${(ride.price_cents / 100).toFixed(2)} €` : '—'}
              </Text>
            </View>

            <Text style={styles.rideRoute}>
              📍 {ride.pickup_address}
            </Text>
            <Text style={styles.rideRoute}>
              🎯 {ride.dropoff_address}
            </Text>

            {(ride.distance_km || ride.duration_minutes) && (
              <View style={styles.rideDetails}>
                {ride.distance_km && (
                  <Text style={styles.rideDetailText}>📏 {ride.distance_km} km</Text>
                )}
                {ride.duration_minutes && (
                  <Text style={styles.rideDetailText}>⏱️ {ride.duration_minutes} min</Text>
                )}
              </View>
            )}

            {ride.client_name && (
              <Text style={styles.rideClientName}>👤 {ride.client_name}</Text>
            )}

            {ride.notes && <Text style={styles.rideNotes}>💭 {ride.notes}</Text>}

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
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 40 }} />
      ) : stats ? (
        <>
          {/* Totaux globaux */}
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>📊 Vue d'ensemble</Text>
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
              <Text style={styles.statsCardTitle}>
                {sourceStats.source === 'UBER' && '🚗 Uber'}
                {sourceStats.source === 'BOLT' && '⚡ Bolt'}
                {sourceStats.source === 'DIRECT_CLIENT' && '👤 Client Direct'}
                {sourceStats.source === 'MARKETPLACE' && '🏪 Marketplace'}
                {sourceStats.source === 'OTHER' && '📋 Autre'}
              </Text>
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
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateText}>Aucune statistique disponible</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#FFA07A']} style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 Mes Courses</Text>
        <Text style={styles.headerSubtitle}>
          Enregistrez toutes vos courses (Uber, Bolt, Direct...)
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'add' && styles.tabActive]}
          onPress={() => setTab('add')}
        >
          <Text style={[styles.tabText, tab === 'add' && styles.tabTextActive]}>
            ➕ Ajouter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            📚 Historique
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'stats' && styles.tabActive]}
          onPress={() => setTab('stats')}
        >
          <Text style={[styles.tabText, tab === 'stats' && styles.tabTextActive]}>
            📊 Stats
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 55,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  sourceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  sourceButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 10,
    marginBottom: 10,
  },
  sourceButtonActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  sourceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sourceButtonTextActive: {
    color: '#FF6B6B',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideSource: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  ridePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  rideRoute: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  rideDetails: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  rideDetailText: {
    fontSize: 13,
    color: '#888',
    marginRight: 16,
  },
  rideClientName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  rideNotes: {
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  rideDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 15,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statValueHighlight: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
});

