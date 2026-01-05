/**
 * ConsentScreen - Écran de consentement initial (RGPD)
 * Affiché à la première connexion pour accepter les CGU et la politique de confidentialité
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface ConsentScreenProps {
  onAccept: () => Promise<void>;
  onShowPrivacyPolicy: () => void;
  onShowTermsOfService: () => void;
}

export default function ConsentScreen({
  onAccept,
  onShowPrivacyPolicy,
  onShowTermsOfService,
}: ConsentScreenProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    if (!isAccepted) return;
    
    try {
      setIsLoading(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onAccept();
    } catch (error) {
      console.error('Erreur consentement:', error);
      setIsLoading(false);
    }
  };

  const toggleAcceptance = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAccepted(!isAccepted);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={60} color="#6366f1" />
        <Text style={styles.headerTitle}>Bienvenue sur Corail VTC</Text>
        <Text style={styles.headerSubtitle}>
          Avant de commencer, veuillez accepter nos conditions d'utilisation
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#6366f1" />
          <Text style={styles.infoTitle}>Protection de vos données</Text>
          <Text style={styles.infoText}>
            Corail VTC respecte votre vie privée et protège vos données personnelles 
            conformément au RGPD (Règlement Général sur la Protection des Données).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ce que nous collectons :</Text>
          <BulletPoint icon="person-outline">
            Vos informations d'identification (nom, email, téléphone, carte VTC)
          </BulletPoint>
          <BulletPoint icon="car-outline">
            Vos courses et activités sur la plateforme
          </BulletPoint>
          <BulletPoint icon="stats-chart-outline">
            Des données d'utilisation pour améliorer nos services
          </BulletPoint>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos droits :</Text>
          <BulletPoint icon="eye-outline">
            Accéder à vos données à tout moment
          </BulletPoint>
          <BulletPoint icon="download-outline">
            Exporter vos données au format JSON
          </BulletPoint>
          <BulletPoint icon="trash-outline">
            Supprimer votre compte définitivement
          </BulletPoint>
        </View>

        <View style={styles.linksSection}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={onShowPrivacyPolicy}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text" size={20} color="#6366f1" />
            <Text style={styles.linkText}>Lire la Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color="#6366f1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={onShowTermsOfService}
            activeOpacity={0.7}
          >
            <Ionicons name="reader" size={20} color="#6366f1" />
            <Text style={styles.linkText}>Lire les Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Checkbox de consentement */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={toggleAcceptance}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isAccepted && styles.checkboxChecked]}>
            {isAccepted && <Ionicons name="checkmark" size={20} color="#fff" />}
          </View>
          <Text style={styles.checkboxText}>
            J'ai lu et j'accepte les{' '}
            <Text style={styles.checkboxLink} onPress={onShowTermsOfService}>
              Conditions d'utilisation
            </Text>
            {' '}et la{' '}
            <Text style={styles.checkboxLink} onPress={onShowPrivacyPolicy}>
              Politique de confidentialité
            </Text>
            {' '}de Corail VTC.
          </Text>
        </TouchableOpacity>

        {/* Bouton de validation */}
        <TouchableOpacity
          onPress={handleAccept}
          activeOpacity={0.8}
          disabled={!isAccepted || isLoading}
          style={[styles.buttonContainer, (!isAccepted || isLoading) && styles.buttonDisabled]}
        >
          <LinearGradient
            colors={
              !isAccepted || isLoading
                ? ['#64748b', '#475569']
                : ['#6366f1', '#4f46e5']
            }
            style={styles.buttonGradient}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Validation...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Accepter et continuer</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>
          En continuant, vous confirmez avoir pris connaissance de nos engagements 
          en matière de protection des données.
        </Text>
      </ScrollView>
    </View>
  );
}

function BulletPoint({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.bulletPoint}>
      <Ionicons name={icon as any} size={18} color="#6366f1" style={styles.bulletIcon} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  infoCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#cbd5e1',
  },
  linksSection: {
    marginBottom: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#cbd5e1',
  },
  checkboxLink: {
    color: '#6366f1',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

