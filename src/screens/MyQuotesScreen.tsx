import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Clipboard,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { getQuoteUrl } from '../constants/urls';

// Photo sympa : documents / proposition (représente l'outil Devis)
const HERO_IMAGE = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80';

interface Quote {
  id: string;
  client_name: string;
  client_phone: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_date: string;
  scheduled_time: string;
  price_cents: number;
  status: 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REFUSED';
  token: string;
  created_at: string;
  viewed_at?: string | null;
  accepted_at?: string | null;
}

interface MyQuotesScreenProps {
  onBack: () => void;
  onCreateQuote: () => void;
}

export const MyQuotesScreen: React.FC<MyQuotesScreenProps> = ({ onBack, onCreateQuote }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des devis...');
      const response = await apiClient.listQuotes();
      console.log('📦 Réponse listQuotes:', response);
      console.log('📊 Nombre de devis:', response.data?.length || 0);
      console.log('📝 Devis:', JSON.stringify(response.data, null, 2));
      setQuotes(response.data || []);
    } catch (error: any) {
      console.error('❌ Error loading quotes:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('Erreur', 'Impossible de charger les devis: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuotes();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return '#10b981';
      case 'REFUSED': return '#ef4444';
      case 'VIEWED': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'Accepté';
      case 'REFUSED': return 'Refusé';
      case 'VIEWED': return 'Consulté';
      default: return 'En attente';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'checkmark-circle';
      case 'REFUSED': return 'close-circle';
      case 'VIEWED': return 'eye';
      default: return 'time';
    }
  };

  const handleOpenQuote = async (quote: Quote) => {
    const url = getQuoteUrl(quote.token);
    
    Alert.alert(
      'Devis',
      `Client: ${quote.client_name}\nStatut: ${getStatusLabel(quote.status)}`,
      [
        {
          text: 'Copier le lien',
          onPress: () => {
            Clipboard.setString(url);
            Alert.alert('Lien copié', 'Le lien du devis a été copié');
          },
        },
        {
          text: 'Ouvrir',
          onPress: () => Linking.openURL(url),
        },
        {
          text: 'WhatsApp',
          onPress: () => {
            const dateFormatted = new Date(quote.scheduled_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'numeric',
            });
            const timeFormatted = quote.scheduled_time.slice(0, 5);
            const price = (quote.price_cents / 100).toFixed(2);
            const message = `Bonjour,\n\nVoici votre devis VTC pour le ${dateFormatted} à ${timeFormatted}.\nMontant : ${price} €.\n\n👉 Consulter et valider :\n${url}`;
            const cleanPhone = quote.client_phone.replace(/[\s\-\(\)]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
            
            Linking.openURL(whatsappUrl).catch(err => {
              console.error('Erreur ouverture WhatsApp:', err);
              Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
            });
          },
        },
        {
          text: 'Email',
          onPress: () => {
            const dateFormatted = new Date(quote.scheduled_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'numeric',
            });
            const timeFormatted = quote.scheduled_time.slice(0, 5);
            const price = (quote.price_cents / 100).toFixed(2);
            const message = `Bonjour,\n\nVoici votre devis VTC pour le ${dateFormatted} à ${timeFormatted}.\nMontant : ${price} €.\n\n👉 Consulter et valider :\n${url}`;
            const subject = `Devis VTC - ${dateFormatted} à ${timeFormatted}`;
            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            
            Linking.openURL(mailtoUrl).catch(err => {
              console.error('Erreur ouverture email:', err);
              Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application mail');
            });
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  // Statistiques
  const stats = {
    total: quotes.length,
    accepted: quotes.filter(q => q.status === 'ACCEPTED').length,
    refused: quotes.filter(q => q.status === 'REFUSED').length,
    pending: quotes.filter(q => q.status === 'SENT' || q.status === 'VIEWED').length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Devis</Text>
        <TouchableOpacity onPress={onCreateQuote} style={styles.addButton}>
          <Ionicons name="add-circle" size={26} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Bandeau image + descriptif */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="document-text" size={26} color="#fff" />
            </View>
            <Text style={styles.heroText}>
              Créez des devis, envoyez le lien au client et suivez les statuts en temps réel.
            </Text>
          </View>
        </View>

        {/* Statistiques */}
        {quotes.length > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValueAccepted]}>{stats.accepted}</Text>
              <Text style={styles.statLabel}>Acceptés</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValueRefused]}>{stats.refused}</Text>
              <Text style={styles.statLabel}>Refusés</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValuePending]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>En attente</Text>
            </View>
          </View>
        )}

        {/* Liste des devis */}
        {loading && quotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color="#64748b" />
            <Text style={styles.emptyText}>Chargement...</Text>
          </View>
        ) : quotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color="#64748b" />
            <Text style={styles.emptyText}>Aucun devis pour l'instant</Text>
            <Text style={styles.emptySubtext}>
              Créez un devis depuis l'écran de création de course (option « Générer un devis ») ou depuis l'outil dédié. Le client pourra consulter et accepter le devis en ligne.
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={onCreateQuote} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Créer un devis</Text>
            </TouchableOpacity>
          </View>
        ) : (
          quotes.map((quote) => (
            <View key={quote.id} style={styles.quoteCard}>
              <TouchableOpacity
                onPress={() => handleOpenQuote(quote)}
                activeOpacity={0.7}
              >
                <View style={styles.quoteHeader}>
                  <View style={styles.quoteHeaderLeft}>
                    <Ionicons name="person" size={20} color="#0ea5e9" />
                    <Text style={styles.clientName}>{quote.client_name}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quote.status) }]}>
                    <Ionicons name={getStatusIcon(quote.status) as any} size={14} color="#fff" />
                    <Text style={styles.statusText}>{getStatusLabel(quote.status)}</Text>
                  </View>
                </View>

                <View style={styles.quoteRoute}>
                  <View style={styles.routePoint}>
                    <Ionicons name="location" size={16} color="#10b981" />
                    <Text style={styles.routeText} numberOfLines={1}>{quote.pickup_address}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#64748b" />
                  <View style={styles.routePoint}>
                    <Ionicons name="flag" size={16} color="#0ea5e9" />
                    <Text style={styles.routeText} numberOfLines={1}>{quote.dropoff_address}</Text>
                  </View>
                </View>

                <View style={styles.quoteFooter}>
                  <View style={styles.quoteInfo}>
                    <Ionicons name="calendar" size={14} color="#64748b" />
                    <Text style={styles.quoteInfoText}>
                      {new Date(quote.scheduled_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                    <Ionicons name="time" size={14} color="#64748b" style={{ marginLeft: 8 }} />
                    <Text style={styles.quoteInfoText}>{quote.scheduled_time.slice(0, 5)}</Text>
                  </View>
                  <Text style={styles.quotePrice}>{(quote.price_cents / 100).toFixed(2)} €</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.separator} />

              {/* Actions rapides WhatsApp et Email */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    const url = getQuoteUrl(quote.token);
                    const dateFormatted = new Date(quote.scheduled_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'numeric',
                    });
                    const timeFormatted = quote.scheduled_time.slice(0, 5);
                    const price = (quote.price_cents / 100).toFixed(2);
                    const message = `Bonjour,\n\nVoici votre devis VTC pour le ${dateFormatted} à ${timeFormatted}.\nMontant : ${price} €.\n\n👉 Consulter et valider :\n${url}`;
                    const cleanPhone = quote.client_phone.replace(/[\s\-\(\)]/g, '');
                    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                    
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
                  style={styles.quickActionBtn}
                  onPress={() => {
                    const url = getQuoteUrl(quote.token);
                    const dateFormatted = new Date(quote.scheduled_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'numeric',
                    });
                    const timeFormatted = quote.scheduled_time.slice(0, 5);
                    const price = (quote.price_cents / 100).toFixed(2);
                    const message = `Bonjour,\n\nVoici votre devis VTC pour le ${dateFormatted} à ${timeFormatted}.\nMontant : ${price} €.\n\n👉 Consulter et valider :\n${url}`;
                    const subject = `Devis VTC - ${dateFormatted} à ${timeFormatted}`;
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
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroWrap: {
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#1e293b',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  statValueAccepted: { color: '#10b981' },
  statValueRefused: { color: '#ef4444' },
  statValuePending: { color: '#64748b' },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#334155',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#e2e8f0',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 18,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: '#1e293b',
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  quoteRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quoteInfoText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  quotePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  quickActionBtn: {
    backgroundColor: '#0f172a',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
});

export default MyQuotesScreen;
