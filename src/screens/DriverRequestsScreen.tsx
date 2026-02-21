import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../services/api';
import { theme } from '../theme';

type DriverRequest = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  price_cents: number;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  notes: string | null;
  fallback_to_marketplace: boolean;
  status: string;
  created_at: string;
};

type Props = {
  onBack: () => void;
  onRequestAccepted?: () => void;
};

export default function DriverRequestsScreen({ onBack, onRequestAccepted }: Props) {
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<DriverRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.getDriverRideRequests();
      setRequests((data as DriverRequest[]) || []);
    } catch (e) {
      console.warn('load driver requests:', e);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleAccept = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await apiClient.acceptDriverRideRequest(selected.id);
      Alert.alert('Demande acceptée', 'La course a été ajoutée à vos courses personnelles.');
      setSelected(null);
      load();
      onRequestAccepted?.();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible d\'accepter la demande.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuse = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await apiClient.refuseDriverRideRequest(selected.id);
      if (selected.fallback_to_marketplace) {
        Alert.alert('Demande refusée', 'La course a été publiée dans les Annonces pour les autres chauffeurs.');
      } else {
        Alert.alert('Demande refusée', 'Le client a été informé.');
      }
      setSelected(null);
      load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de refuser la demande.');
    } finally {
      setActionLoading(false);
    }
  };

  const pending = requests.filter((r) => r.status === 'PENDING');

  if (selected) {
    const d = new Date(selected.scheduled_at);
    const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détail de la demande</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.detailContent}>
          <View style={styles.card}>
            <Text style={styles.detailLabel}>Départ</Text>
            <Text style={styles.detailValue}>{selected.pickup_address}</Text>
            <Text style={styles.detailLabel}>Arrivée</Text>
            <Text style={styles.detailValue}>{selected.dropoff_address}</Text>
            <Text style={styles.detailLabel}>Date et heure</Text>
            <Text style={styles.detailValue}>{dateStr} à {timeStr}</Text>
            <Text style={styles.detailLabel}>Montant</Text>
            <Text style={[styles.detailValue, styles.price]}>{((selected.price_cents || 0) / 100).toFixed(2)} €</Text>
            {(selected.client_name || selected.client_phone || selected.client_email) && (
              <>
                <Text style={styles.detailLabel}>Client</Text>
                <Text style={styles.detailValue}>
                  {[selected.client_name, selected.client_phone, selected.client_email].filter(Boolean).join(' · ')}
                </Text>
              </>
            )}
            {selected.notes && (
              <>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{selected.notes}</Text>
              </>
            )}
            {selected.fallback_to_marketplace && (
              <Text style={styles.fallbackNote}>Si vous refusez, la course sera publiée dans les Annonces.</Text>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={handleAccept}
              disabled={actionLoading}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={StyleSheet.absoluteFill} />
              <Text style={styles.actionBtnText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.refuseBtn]}
              onPress={handleRefuse}
              disabled={actionLoading}
            >
              <Text style={styles.refuseBtnText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demandes reçues</Text>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.info} />
        </View>
      ) : pending.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="mail-open-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>Aucune demande en attente</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.info} />}
        >
          {pending.map((req) => {
            const d = new Date(req.scheduled_at);
            const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            return (
              <TouchableOpacity
                key={req.id}
                style={styles.requestCard}
                onPress={() => setSelected(req)}
                activeOpacity={0.8}
              >
                <Text style={styles.requestFrom} numberOfLines={1}>{req.pickup_address}</Text>
                <Text style={styles.requestTo} numberOfLines={1}>{req.dropoff_address}</Text>
                <View style={styles.requestMeta}>
                  <Text style={styles.requestDate}>{dateStr} {timeStr}</Text>
                  <Text style={styles.requestPrice}>{((req.price_cents || 0) / 100).toFixed(2)} €</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text, marginLeft: 8 },
  scroll: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 40 },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  requestFrom: { fontSize: 14, color: theme.colors.textMuted, marginBottom: 4 },
  requestTo: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
  requestMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  requestDate: { fontSize: 13, color: theme.colors.textMuted },
  requestPrice: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 12, fontSize: 15, color: theme.colors.textMuted },
  detailContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailLabel: { fontSize: 12, color: theme.colors.textMuted, marginTop: 12, marginBottom: 4 },
  detailValue: { fontSize: 15, color: theme.colors.text },
  price: { fontWeight: '700', fontSize: 18, color: theme.colors.primary },
  fallbackNote: { marginTop: 12, fontSize: 13, color: theme.colors.textMuted, fontStyle: 'italic' },
  actions: { gap: 12 },
  actionBtn: { height: 52, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  acceptBtn: {},
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  refuseBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  refuseBtnText: { color: theme.colors.text, fontWeight: '600', fontSize: 16 },
});
