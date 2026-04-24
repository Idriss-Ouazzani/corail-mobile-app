import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { formatPhoneInput, formatPhoneForSubmit } from '../utils/phoneFormat';

interface VerificationScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  user?: { email?: string } | null; // Supabase user from AuthContext
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({ onBack, onSuccess, user }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [professionalCard, setProfessionalCard] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }
    if (!professionalCard.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de carte professionnelle VTC');
      return;
    }

    try {
      setLoading(true);
      
      const email = user?.email || '';
      
      await apiClient.submitVerification({
        full_name: fullName,
        phone: formatPhoneForSubmit(phone),
        professional_card_number: professionalCard,
        // SIRET configuré plus tard sur vtc_profiles (infos légales)
        email,
      });

      Alert.alert(
        'Bienvenue !',
        'Votre profil est enregistré. Explorez l\'app et, quand vous serez prêt, complétez la vérification par documents pour débloquer le réseau public et les réservations directes.',
        [{ text: 'Découvrir', onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de soumettre la vérification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Dites-nous plus sur vous</Text>
          <Text style={styles.heroSubtitle}>
            Quelques infos pour personnaliser votre expérience et vous connecter à la communauté des chauffeurs Corail.
          </Text>
        </View>

        {/* Parcours */}
        <View style={styles.journeyCard}>
          <Text style={styles.journeyTitle}>Votre parcours</Text>
          <View style={styles.journeySteps}>
            <View style={styles.journeyStep}>
              <View style={styles.journeyStepNumber}>
                <Text style={styles.journeyStepNumberText}>1</Text>
              </View>
              <Text style={styles.journeyStepLabel}>Vos infos</Text>
              <Text style={styles.journeyStepDesc}>Nom, téléphone, carte pro — on en a besoin pour vous reconnaître.</Text>
            </View>
            <View style={styles.journeyStep}>
              <View style={[styles.journeyStepNumber, styles.journeyStepNumberNext]}>
                <Text style={styles.journeyStepNumberText}>2</Text>
              </View>
              <Text style={styles.journeyStepLabel}>Vérification documents</Text>
              <Text style={styles.journeyStepDesc}>Plus tard, vous déposerez carte pro, pièce d'identité et assurance pour débloquer le réseau public et les réservations directes.</Text>
            </View>
            <View style={styles.journeyStep}>
              <View style={[styles.journeyStepNumber, styles.journeyStepNumberNext]}>
                <Text style={styles.journeyStepNumberText}>3</Text>
              </View>
              <Text style={styles.journeyStepLabel}>Accès complet</Text>
              <Text style={styles.journeyStepDesc}>Profil vérifié = accès réseau, annonces et réservations getcorail.com.</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formSectionTitle}>Étape 1 — Vos infos</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom complet</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Jean Dupont"
              placeholderTextColor="#64748b"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 06 12 34 56 78"
              placeholderTextColor="#64748b"
              value={phone}
              onChangeText={(t) => setPhone(formatPhoneInput(t))}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Numéro de carte professionnelle VTC</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 0751234567"
              placeholderTextColor="#64748b"
              value={professionalCard}
              onChangeText={setProfessionalCard}
              autoCapitalize="characters"
            />
            <Text style={styles.inputHint}>
              Délivrée par la préfecture — 10 à 12 chiffres
            </Text>
          </View>
        </View>

        {/* Security */}
        <View style={styles.securityNotice}>
          <Ionicons name="lock-closed" size={18} color="#0ea5e9" />
          <Text style={styles.securityText}>
            Vos données sont sécurisées et utilisées uniquement pour votre profil et la vérification de votre activité.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#ff6b47', '#ff8a6d']} style={styles.submitButtonGradient}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  hero: {
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
  },
  journeyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  journeyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  journeySteps: {
  },
  journeyStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  journeyStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff6b47',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  journeyStepNumberNext: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  journeyStepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  journeyStepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    flex: 1,
    marginBottom: 4,
  },
  journeyStepDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
    marginLeft: 42,
  },
  form: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.3,
    marginBottom: 18,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 16,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 28,
    gap: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});

export default VerificationScreen;


