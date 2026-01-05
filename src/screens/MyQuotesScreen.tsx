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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

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
    const url = `https://corail-quotes-web.vercel.app/q/${quote.token}`;
    
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
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Devis</Text>
        <TouchableOpacity onPress={onCreateQuote} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#ff6b47" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.accepted}</Text>
            <Text style={styles.statLabel}>Acceptés</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.refused}</Text>
            <Text style={styles.statLabel}>Refusés</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(100, 116, 139, 0.1)' }]}>
            <Text style={[styles.statValue, { color: '#64748b' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>

        {/* Liste des devis */}
        {loading && quotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>Chargement...</Text>
          </View>
        ) : quotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>Aucun devis pour l'instant</Text>
            <TouchableOpacity style={styles.createButton} onPress={onCreateQuote}>
              <Text style={styles.createButtonText}>Créer un devis</Text>
            </TouchableOpacity>
          </View>
        ) : (
          quotes.map((quote) => (
            <TouchableOpacity
              key={quote.id}
              style={styles.quoteCard}
              onPress={() => handleOpenQuote(quote)}
              activeOpacity={0.7}
            >
              <View style={styles.quoteHeader}>
                <View style={styles.quoteHeaderLeft}>
                  <Ionicons name="person" size={20} color="#ff6b47" />
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
                  <Ionicons name="flag" size={16} color="#ff6b47" />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#ff6b47',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#ff6b47',
  },
});

export default MyQuotesScreen;
