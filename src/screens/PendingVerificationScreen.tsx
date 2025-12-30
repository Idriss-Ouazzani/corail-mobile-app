import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CoralLogo from '../components/CoralLogo';

interface PendingVerificationScreenProps {
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  submittedAt?: string;
}

export const PendingVerificationScreen: React.FC<PendingVerificationScreenProps> = ({ 
  onLogout,
  onRefresh,
  submittedAt 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState(new Date());

  // 🔄 Polling automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('🔄 Vérification automatique du statut...');
      await handleRefresh();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh();
      setLastCheck(new Date());
      console.log('✅ Statut vérifié');
    } catch (error) {
      console.error('❌ Erreur refresh statut:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastCheck = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastCheck.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return 'À l\'instant';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHour = Math.floor(diffMin / 60);
    return `Il y a ${diffHour}h`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <CoralLogo size={80} />
          </View>

          {/* Animated Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#fbbf24', '#f59e0b']}
              style={styles.iconGradient}
            >
              <Ionicons name="hourglass-outline" size={64} color="#fff" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Vérification en cours</Text>
          <Text style={styles.subtitle}>
            Votre compte est en cours de validation par notre équipe
          </Text>

          {/* Timeline */}
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotCompleted]}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Inscription complétée</Text>
                <Text style={styles.timelineDate}>
                  {submittedAt ? formatDate(submittedAt) : 'Aujourd\'hui'}
                </Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]}>
                <View style={styles.timelineDotPulse} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Vérification admin</Text>
                <Text style={styles.timelineDate}>En cours...</Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot}>
                <Ionicons name="rocket" size={16} color="#64748b" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: '#64748b' }]}>
                  Compte activé
                </Text>
                <Text style={styles.timelineDate}>Sous 24-48h</Text>
              </View>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Ionicons name="time" size={24} color="#0ea5e9" />
              <Text style={styles.infoCardTitle}>Délai moyen</Text>
              <Text style={styles.infoCardValue}>24-48h</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              <Text style={styles.infoCardTitle}>Sécurisé</Text>
              <Text style={styles.infoCardValue}>100%</Text>
            </View>
          </View>

          {/* FAQ */}
          <View style={styles.faq}>
            <Text style={styles.faqTitle}>Questions fréquentes</Text>
            
            <View style={styles.faqItem}>
              <Ionicons name="help-circle" size={20} color="#0ea5e9" />
              <View style={styles.faqContent}>
                <Text style={styles.faqQuestion}>Combien de temps ça prend ?</Text>
                <Text style={styles.faqAnswer}>
                  La vérification prend généralement entre 24 et 48 heures ouvrées.
                </Text>
              </View>
            </View>

            <View style={styles.faqItem}>
              <Ionicons name="help-circle" size={20} color="#0ea5e9" />
              <View style={styles.faqContent}>
                <Text style={styles.faqQuestion}>Que vérifie-t-on ?</Text>
                <Text style={styles.faqAnswer}>
                  Nous vérifions votre carte professionnelle VTC et votre numéro SIREN auprès des autorités compétentes.
                </Text>
              </View>
            </View>

            <View style={styles.faqItem}>
              <Ionicons name="help-circle" size={20} color="#0ea5e9" />
              <View style={styles.faqContent}>
                <Text style={styles.faqQuestion}>Je serai notifié ?</Text>
                <Text style={styles.faqAnswer}>
                  Oui, vous recevrez un email dès que votre compte sera validé.
                </Text>
              </View>
            </View>
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={20} color="#fff" />
            )}
            <Text style={styles.refreshButtonText}>
              {isRefreshing ? 'Vérification...' : 'Actualiser le statut'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.lastCheckText}>
            Dernière vérification : {formatLastCheck()}
          </Text>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#94a3b8" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  timeline: {
    width: '100%',
    marginBottom: 40,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineDotCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  timelineDotActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
    position: 'relative',
  },
  timelineDotPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 19,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 13,
    color: '#64748b',
  },
  infoCards: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 40,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoCardTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  faq: {
    width: '100%',
    marginBottom: 32,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  faqContent: {
    flex: 1,
    marginLeft: 12,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#0ea5e9',
    marginBottom: 12,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  lastCheckText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginLeft: 8,
  },
});

export default PendingVerificationScreen;


