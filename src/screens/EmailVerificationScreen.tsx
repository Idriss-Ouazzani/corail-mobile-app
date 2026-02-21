/**
 * Écran de vérification d'email
 * Affiché après l'inscription en attendant que l'utilisateur confirme son email
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabaseAuth } from '../services/supabaseAuth';

interface EmailVerificationScreenProps {
  email: string;
  fullName: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function EmailVerificationScreen({
  email,
  fullName,
  onBack,
  onSuccess,
}: EmailVerificationScreenProps) {
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // 🔄 Polling automatique pour détecter la confirmation
  useEffect(() => {
    console.log('🔄 Démarrage polling automatique confirmation email...');
    
    const checkEmailConfirmed = async () => {
      try {
        const session = await supabaseAuth.getSession();
        if (session) {
          console.log('✅ Email confirmé automatiquement détecté !');
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
          onSuccess();
        }
      } catch (error) {
        // Ignorer les erreurs silencieusement
      }
    };

    // Vérifier immédiatement
    checkEmailConfirmed();

    // Puis vérifier toutes les 3 secondes
    pollingInterval.current = setInterval(checkEmailConfirmed, 3000);

    // Cleanup
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [onSuccess]);

  const handleResend = async () => {
    setResending(true);
    try {
      await supabaseAuth.resetPassword(email);
      Alert.alert('✅ Email renvoyé', 'Un nouvel email de confirmation a été envoyé.');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      // Tenter de se connecter pour vérifier si l'email est confirmé
      const session = await supabaseAuth.getSession();
      if (session) {
        Alert.alert('✅ Email confirmé !', 'Votre compte est maintenant actif.', [
          { text: 'Continuer', onPress: onSuccess },
        ]);
      } else {
        Alert.alert(
          'Email non confirmé',
          "Veuillez cliquer sur le lien dans l'email que nous vous avons envoyé."
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setChecking(false);
    }
  };

  // Extraire le prénom
  const firstName = fullName.split(' ')[0];

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#2d3748']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Icône email avec animation */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={64} color="#ff6b47" />
            </View>
          </View>

          {/* Message personnalisé */}
          <Text style={styles.greeting}>Bienvenue {firstName} ! 👋</Text>
          <Text style={styles.title}>Une dernière étape...</Text>

          {/* Message chaleureux */}
          <Text style={styles.message}>
            Avant d'accéder à tous les outils 100% gratuits pour votre activité de chauffeur privé, 
            confirmez votre adresse email.
          </Text>

          <View style={styles.emailBox}>
            <Ionicons name="mail" size={20} color="#ff6b47" />
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* Instructions simples */}
          <View style={styles.instructions}>
            <View style={styles.step}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="mail-open-outline" size={24} color="#ff6b47" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Ouvrez votre boîte mail</Text>
                <Text style={styles.stepSubtitle}>Nous venons de vous envoyer un email</Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.step}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="finger-print-outline" size={24} color="#ff6b47" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Cliquez sur "Confirmer"</Text>
                <Text style={styles.stepSubtitle}>
                  L'app se connectera automatiquement après
                </Text>
              </View>
            </View>
          </View>

          {/* Indicateur de chargement automatique */}
          <View style={styles.autoCheck}>
            <ActivityIndicator size="small" color="#ff6b47" />
            <Text style={styles.autoCheckText}>
              Vérification automatique en cours...
            </Text>
          </View>

          {/* Email non reçu ? */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous n'avez pas reçu l'email ?</Text>
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendLink}>
                {resending ? 'Envoi en cours...' : 'Renvoyer l\'email'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Astuce spam */}
          <View style={styles.tip}>
            <Ionicons name="alert-circle-outline" size={18} color="#64748b" />
            <Text style={styles.tipText}>
              💡 Pensez à vérifier vos spams et courriers indésirables
            </Text>
          </View>

          {/* Bouton retour discret */}
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.backText}>Utiliser un autre email</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 60,
  },
  container: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 71, 0.3)',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 24,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.3)',
    marginBottom: 40,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff6b47',
  },
  instructions: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 71, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  stepDivider: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(255, 107, 71, 0.3)',
    marginLeft: 23,
    marginVertical: 4,
  },
  autoCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  autoCheckText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buttonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  resendLink: {
    fontSize: 14,
    color: '#ff6b47',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
  },
  backText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 16,
    maxWidth: 400,
    width: '100%',
  },
  tipText: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 20,
  },
});

