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
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../services/api';
import { theme } from '../theme';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80';

type DriverRequest = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  price_cents: number | null;
  indicative_low_cents?: number | null;
  indicative_high_cents?: number | null;
  active_quote_id?: string | null;
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
  /** Après refus (ou autre mutation sans fermer l’écran) : rafraîchir badge accueil */
  onRequestsUpdated?: () => void;
};

export default function DriverRequestsScreen({ onBack, onRequestAccepted, onRequestsUpdated }: Props) {
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<DriverRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [quotePriceInput, setQuotePriceInput] = useState('');

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

  useEffect(() => {
    if (!selected) {
      setQuotePriceInput('');
      return;
    }
    if (selected.active_quote_id) return;
    const existingPriceCents = Number(selected.price_cents ?? 0);
    if (existingPriceCents > 0) {
      setQuotePriceInput((existingPriceCents / 100).toFixed(2).replace('.', ','));
      return;
    }
    setQuotePriceInput('');
  }, [selected]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleSendQuote = async () => {
    if (!selected) return;
    const raw = quotePriceInput.replace(',', '.').trim();
    const eur = parseFloat(raw);
    if (!Number.isFinite(eur) || eur < 1) {
      Alert.alert('Montant', 'Indiquez un tarif en euros (ex. 45 ou 45,50).');
      return;
    }
    const cents = Math.round(eur * 100);
    setActionLoading(true);
    try {
      await apiClient.submitDriverRequestQuote(selected.id, cents);
      Alert.alert(
        'Devis envoyé',
        selected.client_email
          ? 'Un email avec le lien de validation a été envoyé au client.'
          : 'Devis enregistré. Partagez le lien depuis l’onglet Devis si besoin.',
      );
      setQuotePriceInput('');
      setSelected(null);
      await load();
      onRequestAccepted?.();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Envoi impossible.');
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
      await load();
      onRequestsUpdated?.();
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
            <Ionicons name="arrow-back" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Détails de la demande</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailHeroWrap}>
            <Image source={{ uri: HERO_IMAGE }} style={styles.detailHeroImage} resizeMode="cover" />
            <View style={styles.detailHeroOverlay} />
            <View style={styles.detailHeroContent}>
              <View style={styles.detailHeroIconWrap}>
                <Ionicons name="document-text" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.detailHeroTitle}>Demande de course</Text>
              <Text style={styles.detailHeroSubtitle}>Vérifiez les informations avant d'accepter</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Trajet</Text>
            <View style={styles.detailBlock}>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconWrap, { backgroundColor: theme.colors.successBg }]}>
                  <Ionicons name="location" size={18} color={theme.colors.success} />
                </View>
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailLabel}>Départ</Text>
                  <Text style={styles.detailValue}>{selected.pickup_address}</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={[styles.detailIconWrap, { backgroundColor: theme.colors.errorBg }]}>
                  <Ionicons name="flag" size={18} color={theme.colors.errorLight} />
                </View>
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailLabel}>Arrivée</Text>
                  <Text style={styles.detailValue}>{selected.dropoff_address}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Date & heure</Text>
            <View style={styles.detailBlock}>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconWrap, { backgroundColor: theme.colors.infoBgSoft }]}>
                  <Ionicons name="calendar" size={18} color={theme.colors.info} />
                </View>
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailValue}>{dateStr}</Text>
                  <Text style={styles.detailLabel}>{timeStr}</Text>
                </View>
              </View>
            </View>
          </View>

          {(selected.indicative_low_cents != null && selected.indicative_high_cents != null) ? (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Estimation indicative</Text>
              <View style={styles.detailBlock}>
                <Text style={styles.detailValue}>
                  {(selected.indicative_low_cents / 100).toFixed(0)} € – {(selected.indicative_high_cents / 100).toFixed(0)} € (non contractuel)
                </Text>
              </View>
            </View>
          ) : null}

          {selected.price_cents != null && selected.price_cents > 0 ? (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Montant indicatif client</Text>
              <View style={styles.detailBlock}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
                    <Ionicons name="cash" size={18} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.detailValue, styles.price]}>{(selected.price_cents / 100).toFixed(2)} €</Text>
                </View>
                <Text style={{ color: theme.colors.textMuted, marginTop: 8, fontSize: 12 }}>
                  Ce montant est informatif. Le client validera uniquement votre devis.
                </Text>
              </View>
            </View>
          ) : null}

          {selected.active_quote_id ? (
            <View style={[styles.detailBlock, { marginHorizontal: 20, backgroundColor: 'rgba(14, 165, 233, 0.12)', borderColor: 'rgba(14, 165, 233, 0.35)', borderWidth: 1, borderRadius: 12, padding: 14 }]}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Devis envoyé</Text>
              <Text style={{ color: theme.colors.textMuted, marginTop: 6, fontSize: 13 }}>
                En attente de validation ou de refus par le client (email).
              </Text>
            </View>
          ) : null}

          {(selected.client_name || selected.client_phone || selected.client_email) && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Client</Text>
              <View style={styles.detailBlock}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: theme.colors.accentBg }]}>
                    <Ionicons name="person" size={18} color={theme.colors.accent} />
                  </View>
                  <View style={styles.detailRowContent}>
                    <Text style={styles.detailValue}>
                      {[selected.client_name, selected.client_phone, selected.client_email].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {selected.notes && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.detailBlock}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconWrap, { backgroundColor: theme.colors.warningBg }]}>
                    <Ionicons name="chatbubble-ellipses" size={18} color={theme.colors.warning} />
                  </View>
                  <View style={styles.detailRowContent}>
                    <Text style={styles.detailValue}>{selected.notes}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {selected.fallback_to_marketplace && (
            <View style={styles.fallbackBanner}>
              <Ionicons name="megaphone" size={20} color={theme.colors.textMuted} />
              <Text style={styles.fallbackNote}>Si vous refusez, la course sera publiée dans les Annonces.</Text>
            </View>
          )}

          {!selected.active_quote_id && selected.status === 'PENDING' ? (
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Votre tarif (€)</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="ex. 45,00"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="decimal-pad"
                value={quotePriceInput}
                onChangeText={setQuotePriceInput}
              />
              <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 6 }}>
                Un devis sera envoyé au client par email (lien accepter / refuser).
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {!selected.active_quote_id && selected.status === 'PENDING' ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={handleSendQuote}
                disabled={actionLoading}
              >
                <LinearGradient colors={['#10b981', '#059669']} style={StyleSheet.absoluteFill} />
                <Ionicons name="paper-plane" size={22} color="#fff" style={styles.actionBtnIcon} />
                <Text style={styles.actionBtnText}>Envoyer le devis</Text>
              </TouchableOpacity>
            ) : null}
            {selected.status === 'PENDING' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.refuseBtn]}
                onPress={handleRefuse}
                disabled={actionLoading}
              >
                <Ionicons name="close-circle" size={22} color={theme.colors.textMuted} style={styles.actionBtnIcon} />
                <Text style={styles.refuseBtnText}>
                  {selected.active_quote_id ? 'Refuser (contact client)' : 'Refuser la demande'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Demandes reçues</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.info} />
        </View>
      ) : pending.length === 0 ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.emptyContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Demandes reçues</Text>
              <Text style={styles.heroSubtitle}>Les demandes du site apparaîtront ici</Text>
            </View>
          </View>
          <View style={styles.centered}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="mail-open-outline" size={48} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>Aucune demande en attente</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.info} />}
        >
          <View style={styles.heroWrap}>
            <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{pending.length} demande{pending.length > 1 ? 's' : ''}</Text>
              </View>
              <Text style={styles.heroTitle}>Demandes reçues</Text>
              <Text style={styles.heroSubtitle}>Depuis le site / Page Pro</Text>
            </View>
          </View>

          <Text style={styles.listSectionTitle}>En attente</Text>
          {pending.map((req) => {
            const d = new Date(req.scheduled_at);
            const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            return (
              <TouchableOpacity
                key={req.id}
                style={styles.requestCard}
                onPress={() => setSelected(req)}
                activeOpacity={0.85}
              >
                <View style={styles.requestCardLeft}>
                  <View style={styles.requestRoute}>
                    <View style={[styles.requestDot, styles.requestDotStart]} />
                    <View style={styles.requestLine} />
                    <View style={[styles.requestDot, styles.requestDotEnd]} />
                  </View>
                  <View style={styles.requestCardBody}>
                    <Text style={styles.requestFrom} numberOfLines={1}>{req.pickup_address}</Text>
                    <Text style={styles.requestTo} numberOfLines={1}>{req.dropoff_address}</Text>
                    <View style={styles.requestMeta}>
                      <View style={styles.requestMetaItem}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                        <Text style={styles.requestDate}>{dateStr} · {timeStr}</Text>
                      </View>
                      <Text style={styles.requestPrice}>
                        {req.active_quote_id
                          ? 'Devis envoyé'
                          : req.price_cents != null && req.price_cents > 0
                            ? `${(req.price_cents / 100).toFixed(2)} €`
                            : 'Devis demandé'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color={theme.colors.textMuted} />
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
  headerTitleWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSpacer: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  scroll: { flex: 1 },
  listContent: { paddingBottom: 40 },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroWrap: {
    height: 160,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlayLight },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  emptyContent: { flexGrow: 1 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: theme.colors.textMuted, textAlign: 'center' },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  requestCardLeft: { flex: 1, flexDirection: 'row' },
  requestRoute: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  requestDot: { width: 10, height: 10, borderRadius: 5 },
  requestDotStart: { backgroundColor: theme.colors.success },
  requestDotEnd: { backgroundColor: theme.colors.errorLight },
  requestLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 2,
    minHeight: 16,
  },
  requestCardBody: { flex: 1 },
  requestFrom: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 2 },
  requestTo: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
  requestMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  requestDate: { fontSize: 13, color: theme.colors.textMuted },
  requestPrice: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  detailContent: { paddingBottom: 40 },
  detailHeroWrap: {
    height: 140,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailHeroImage: { ...StyleSheet.absoluteFillObject },
  detailHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlayLight },
  detailHeroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  detailHeroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  detailHeroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  detailHeroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  detailSection: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailBlock: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailRowContent: { flex: 1 },
  detailDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
    marginLeft: 48,
  },
  detailLabel: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 15, color: theme.colors.text },
  price: { fontWeight: '700', fontSize: 18, color: theme.colors.primary },
  fallbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  fallbackNote: { flex: 1, fontSize: 13, color: theme.colors.textMuted, fontStyle: 'italic' },
  actions: { marginHorizontal: 16, gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {},
  actionBtnIcon: { marginRight: 8 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  refuseBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  refuseBtnText: { color: theme.colors.text, fontWeight: '600', fontSize: 16 },
  priceInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
});
