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
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { getInvoiceUrl, getInvoicePdfUrl } from '../constants/urls';

// Photo sympa : documents / facturation (représente l'outil Factures)
const HERO_IMAGE = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80';

interface Invoice {
  id: string;
  invoice_number: string;
  issued_at: string;
  status: 'ISSUED';
  total_amount_cents: number;
  client_name: string | null;
  client_phone: string | null;
  source_type: 'RIDE' | 'PERSONAL';
  source_id: string;
  public_token: string;
  pdf_path: string | null;
  created_at: string;
}

interface RideWithInvoice {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  completed_at: string;
  price_cents: number;
  client_name: string | null;
  client_phone: string | null;
  status: string;
  source_type: 'RIDE' | 'PERSONAL';
  invoice?: Invoice | null;
}

interface MyInvoicesScreenProps {
  onBack: () => void;
}

export const MyInvoicesScreen: React.FC<MyInvoicesScreenProps> = ({ onBack }) => {
  const [completedRides, setCompletedRides] = useState<RideWithInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'issued'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des courses terminées + factures...');

      // Charger toutes les factures existantes
      const invoicesResponse = await apiClient.listInvoices();
      const invoices = invoicesResponse.data || [];
      console.log('📦 Factures chargées:', invoices.length);

      // Charger les courses terminées de la marketplace (status = COMPLETED)
      const ridesResponse = await apiClient.getMyRides('claimed');
      const completedMarketplaceRides = ridesResponse
        .filter((ride: any) => ride.status === 'COMPLETED')
        .map((ride: any) => ({
          ...ride,
          source_type: 'RIDE' as const,
        }));
      console.log('📦 Courses marketplace terminées:', completedMarketplaceRides.length);

      // Charger TOUTES les courses personnelles (pas seulement COMPLETED)
      const personalRidesResponse = await apiClient.listPersonalRides();
      console.log('📦 Total courses perso chargées:', personalRidesResponse?.length || 0);
      
      const now = new Date();
      console.log('🕐 Date actuelle:', now.toISOString());
      
      // Filtrer les courses personnelles dont la date est dans le passé
      const completedPersonalRides = (personalRidesResponse || [])
        .filter((ride: any) => {
          console.log('🔍 Course perso:', {
            id: ride.id.substring(0, 8),
            status: ride.status,
            scheduled_at: ride.scheduled_at,
            completed_at: ride.completed_at,
          });
          
          // Si la course a une date de complétion, l'utiliser
          if (ride.completed_at) {
            const isInPast = new Date(ride.completed_at) < now;
            console.log('  → completed_at dans le passé?', isInPast);
            return isInPast;
          }
          // Sinon, vérifier si la date programmée est passée
          if (ride.scheduled_at) {
            const isInPast = new Date(ride.scheduled_at) < now;
            console.log('  → scheduled_at dans le passé?', isInPast);
            return isInPast;
          }
          // Si pas de date, ne pas l'afficher
          console.log('  → Pas de date, ignorée');
          return false;
        })
        .map((ride: any) => ({
          ...ride,
          source_type: 'PERSONAL' as const,
          // Utiliser completed_at ou scheduled_at pour le tri
          completed_at: ride.completed_at || ride.scheduled_at,
        }));
      console.log('✅ Courses perso passées filtrées:', completedPersonalRides.length);

      // Combiner toutes les courses
      const allCompletedRides = [...completedMarketplaceRides, ...completedPersonalRides];
      console.log('🚗 Total courses facturables:', allCompletedRides.length);

      // Associer les factures aux courses
      const ridesWithInvoices: RideWithInvoice[] = allCompletedRides
        .map((ride: any) => {
          const invoice = invoices.find(
            (inv: Invoice) => inv.source_type === ride.source_type && inv.source_id === ride.id
          );
          return {
            id: ride.id,
            pickup_address: ride.pickup_address,
            dropoff_address: ride.dropoff_address,
            completed_at: ride.completed_at,
            price_cents: ride.price_cents,
            client_name: ride.client_name,
            client_phone: ride.client_phone,
            status: ride.status,
            source_type: ride.source_type,
            invoice: invoice || null,
          };
        });

      // Ajouter aussi les factures qui n'ont pas de course associée (course supprimée ou autre)
      const invoicesWithoutRide = invoices.filter((inv: Invoice) => {
        return !ridesWithInvoices.find(r => r.id === inv.source_id && r.source_type === inv.source_type);
      }).map((inv: Invoice) => ({
        id: inv.source_id,
        pickup_address: 'Course supprimée',
        dropoff_address: '',
        completed_at: inv.issued_at,
        price_cents: inv.total_amount_cents,
        client_name: inv.client_name,
        client_phone: inv.client_phone,
        status: 'COMPLETED',
        source_type: inv.source_type,
        invoice: inv,
      }));

      console.log('📦 Factures sans course associée:', invoicesWithoutRide.length);

      const allRidesWithInvoices = [...ridesWithInvoices, ...invoicesWithoutRide]
        .sort((a, b) => {
          // Trier par date de complétion (plus récent en premier)
          const dateA = new Date(a.completed_at).getTime();
          const dateB = new Date(b.completed_at).getTime();
          return dateB - dateA;
        });

      setCompletedRides(allRidesWithInvoices);
      console.log('✅ Données chargées');
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleGenerateInvoice = async (ride: RideWithInvoice) => {
    try {
      setGeneratingInvoiceId(ride.id);
      console.log('🧾 Génération de facture...', { sourceType: ride.source_type, rideId: ride.id });

      const newInvoice = await apiClient.createInvoice(ride.source_type, ride.id);
      console.log('✅ Facture générée:', newInvoice);

      Alert.alert(
        'Facture générée',
        `Facture ${newInvoice.invoice_number} créée avec succès !`,
        [
          { text: 'OK', onPress: () => loadData() },
          {
            text: 'Télécharger PDF',
            onPress: () => {
              const pdfUrl = getInvoicePdfUrl(newInvoice.public_token);
              Linking.openURL(pdfUrl);
              loadData();
            },
          },
          {
            text: 'Partager WhatsApp',
            onPress: () => {
              const invoiceUrl = getInvoiceUrl(newInvoice.public_token);
              const clientName = ride.client_name || 'Client';
              const message = `Bonjour ${clientName},\n\nVoici votre facture ${newInvoice.invoice_number} :\n${invoiceUrl}\n\nVous pouvez télécharger le PDF directement depuis ce lien.\n\nCordialement`;
              
              // Utiliser https://wa.me qui fonctionne sur iOS, Android et web
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
              
              Linking.openURL(whatsappUrl).catch(err => {
                console.error('Erreur ouverture WhatsApp:', err);
                Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
              });
              loadData();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erreur génération facture:', error);
      Alert.alert('Erreur', error.message || 'Impossible de générer la facture');
    } finally {
      setGeneratingInvoiceId(null);
    }
  };

  const handleOpenInvoice = (invoice: Invoice) => {
    const pdfUrl = getInvoicePdfUrl(invoice.public_token);
    const htmlUrl = getInvoiceUrl(invoice.public_token);

    Alert.alert(
      'Facture ' + invoice.invoice_number,
      `Client: ${invoice.client_name || 'N/A'}\nMontant: ${(invoice.total_amount_cents / 100).toFixed(2)} €`,
      [
        {
          text: 'Télécharger PDF',
          onPress: () => Linking.openURL(pdfUrl),
        },
        {
          text: 'Voir en ligne',
          onPress: () => Linking.openURL(htmlUrl),
        },
        {
          text: 'Partager WhatsApp',
          onPress: () => {
            const clientName = invoice.client_name || 'Client';
            const message = `Bonjour ${clientName},\n\nVoici votre facture ${invoice.invoice_number} :\n${htmlUrl}\n\nVous pouvez télécharger le PDF directement depuis ce lien.\n\nCordialement`;
            
            // Utiliser https://wa.me qui fonctionne sur iOS, Android et web
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            
            Linking.openURL(whatsappUrl).catch(err => {
              console.error('Erreur ouverture WhatsApp:', err);
              Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
            });
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)} €`;

  // Filtrer les courses selon l'onglet
  const pendingRides = completedRides.filter(r => !r.invoice);
  const issuedRides = completedRides.filter(r => r.invoice);

  const displayedRides = activeTab === 'pending' ? pendingRides : issuedRides;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Factures</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Bandeau image + descriptif */}
      <View style={styles.heroWrap}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="receipt" size={26} color="#fff" />
          </View>
          <Text style={styles.heroText}>
            Gérez vos factures : à facturer, émises, PDF et partage WhatsApp ou email.
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            À facturer ({pendingRides.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'issued' && styles.tabActive]}
          onPress={() => setActiveTab('issued')}
        >
          <Text style={[styles.tabText, activeTab === 'issued' && styles.tabTextActive]}>
            Émises ({issuedRides.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && completedRides.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.emptyText}>Chargement...</Text>
          </View>
        ) : displayedRides.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={56} color="#64748b" />
            <Text style={styles.emptyText}>
              {activeTab === 'pending' ? 'Aucune course à facturer' : 'Aucune facture émise'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'pending'
                ? 'Les courses terminées apparaîtront ici. Générez ensuite la facture en un clic.'
                : 'Les factures que vous générez apparaîtront ici. Vous pourrez les télécharger ou les partager au client.'}
            </Text>
          </View>
        ) : (
          <View style={styles.ridesList}>
            {displayedRides.map((ride) => (
              <View key={ride.id} style={styles.rideCard}>
                {/* Header avec type de course */}
                <View style={styles.rideHeader}>
                  <View style={styles.rideTypeContainer}>
                    <Ionicons
                      name={ride.source_type === 'RIDE' ? 'people' : 'car'}
                      size={16}
                      color="#0ea5e9"
                    />
                    <Text style={styles.rideTypeText}>
                      {ride.source_type === 'RIDE' ? 'Marketplace' : 'Personnelle'}
                    </Text>
                  </View>
                  <Text style={styles.ridePrice}>{formatPrice(ride.price_cents)}</Text>
                </View>

                {/* Itinéraire */}
                <View style={styles.rideRoute}>
                  <View style={styles.routeRow}>
                    <Ionicons name="location" size={16} color="#10b981" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {ride.pickup_address}
                    </Text>
                  </View>
                  <View style={styles.routeRow}>
                    <Ionicons name="flag" size={16} color="#ef4444" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {ride.dropoff_address}
                    </Text>
                  </View>
                </View>

                {/* Infos client + date */}
                <View style={styles.rideInfo}>
                  {ride.client_name && (
                    <View style={styles.infoRow}>
                      <Ionicons name="person-outline" size={14} color="#94a3b8" />
                      <Text style={styles.infoText}>{ride.client_name}</Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                    <Text style={styles.infoText}>{formatDate(ride.completed_at)}</Text>
                  </View>
                </View>

                {/* Action */}
                {ride.invoice ? (
                  // Facture émise avec actions rapides
                  <View style={styles.invoiceIssuedContainer}>
                    <TouchableOpacity
                      style={styles.invoiceIssuedButton}
                      onPress={() => handleOpenInvoice(ride.invoice!)}
                    >
                      <View style={styles.invoiceIssuedContent}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text style={styles.invoiceIssuedText}>
                          {ride.invoice.invoice_number}
                        </Text>
                      </View>
                      <Ionicons name="download-outline" size={20} color="#10b981" />
                    </TouchableOpacity>
                    
                    {/* Actions rapides WhatsApp et Email */}
                    <View style={styles.quickActionsRow}>
                      <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => {
                          const invoiceUrl = getInvoiceUrl(ride.invoice!.public_token);
                          const clientName = ride.client_name || 'Client';
                          const message = `Bonjour ${clientName},\n\nVoici votre facture ${ride.invoice!.invoice_number} :\n${invoiceUrl}\n\nVous pouvez télécharger le PDF directement depuis ce lien.\n\nCordialement`;
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                          
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
                          const invoiceUrl = getInvoiceUrl(ride.invoice!.public_token);
                          const clientName = ride.client_name || 'Client';
                          const subject = `Facture ${ride.invoice!.invoice_number}`;
                          const body = `Bonjour ${clientName},\n\nVoici votre facture ${ride.invoice!.invoice_number} :\n${invoiceUrl}\n\nVous pouvez télécharger le PDF directement depuis ce lien.\n\nCordialement`;
                          const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          
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
                ) : (
                  // Générer facture
                  <TouchableOpacity
                    style={[
                      styles.generateButton,
                      generatingInvoiceId === ride.id && styles.generateButtonDisabled,
                    ]}
                    onPress={() => handleGenerateInvoice(ride)}
                    disabled={generatingInvoiceId === ride.id}
                  >
                    <LinearGradient colors={['#0ea5e9', '#06b6d4']} style={styles.generateGradient}>
                      {generatingInvoiceId === ride.id ? (
                        <>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={styles.generateText}>Génération...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="receipt-outline" size={20} color="#fff" />
                          <Text style={styles.generateText}>Générer la facture</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  headerRight: {
    width: 40,
  },
  heroWrap: {
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#0f172a',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  ridesList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  rideCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  rideTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rideTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  ridePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  rideRoute: {
    gap: 8,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#f1f5f9',
    flex: 1,
  },
  rideInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  generateButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  generateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  invoiceIssuedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10b98120',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  invoiceIssuedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceIssuedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  invoiceIssuedContainer: {
    gap: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  quickActionBtn: {
    backgroundColor: '#1e293b',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
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
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});

export default MyInvoicesScreen;
