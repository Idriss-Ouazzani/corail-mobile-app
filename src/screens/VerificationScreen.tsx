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

interface VerificationScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({ onBack, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [professionalCard, setProfessionalCard] = useState('');
  const [siren, setSiren] = useState('');
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
    if (!siren.trim() || siren.length !== 9) {
      Alert.alert('Erreur', 'Le numéro SIREN doit contenir 9 chiffres');
      return;
    }

    try {
      setLoading(true);
      await apiClient.submitVerification({
        full_name: fullName,
        phone,
        professional_card_number: professionalCard,
        siren,
      });

      Alert.alert(
        'Vérification soumise ! 🎉',
        'Votre demande a été envoyée. Vous recevrez une notification une fois votre compte validé (24-48h).',
        [{ text: 'OK', onPress: onSuccess }]
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
        <Text style={styles.headerTitle}>Vérification VTC</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={32} color="#10b981" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.infoBannerTitle}>Vérification professionnelle</Text>
            <Text style={styles.infoBannerText}>
              Pour garantir la sécurité de notre plateforme, nous vérifions l'identité de tous les chauffeurs VTC.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="person" size={16} color="#f1f5f9" /> Nom complet *
            </Text>
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
            <Text style={styles.inputLabel}>
              <Ionicons name="call" size={16} color="#f1f5f9" /> Téléphone *
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 06 12 34 56 78"
              placeholderTextColor="#64748b"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="card" size={16} color="#f1f5f9" /> Numéro de carte professionnelle VTC *
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: VTC-075-123456789"
              placeholderTextColor="#64748b"
              value={professionalCard}
              onChangeText={setProfessionalCard}
              autoCapitalize="characters"
            />
            <Text style={styles.inputHint}>
              Délivrée par la préfecture, format: VTC-XXX-XXXXXXXXX
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="business" size={16} color="#f1f5f9" /> Numéro SIREN *
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 123456789"
              placeholderTextColor="#64748b"
              value={siren}
              onChangeText={setSiren}
              keyboardType="number-pad"
              maxLength={9}
            />
            <Text style={styles.inputHint}>
              9 chiffres, trouvable sur votre extrait Kbis
            </Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="lock-closed" size={20} color="#0ea5e9" />
          <Text style={styles.securityText}>
            Vos données sont sécurisées et ne seront utilisées que pour la vérification de votre identité professionnelle.
          </Text>
        </View>

        {/* Submit Button */}
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
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>Soumettre ma vérification</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

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
    paddingTop: 50,
    paddingBottom: 20,
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 6,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 12,
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
});

export default VerificationScreen;

