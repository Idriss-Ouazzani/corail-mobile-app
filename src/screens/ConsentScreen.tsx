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
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import CoralLogo from '../components/CoralLogo';
import { theme } from '../theme';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero : image + logo + titre */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.logoWrap}>
              <CoralLogo size={44} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>Bienvenue sur Corail</Text>
              <Text style={styles.heroSubtitle}>Acceptez nos conditions pour continuer</Text>
            </View>
          </View>
        </View>

        {/* Carte : protection des données */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="shield-checkmark" size={22} color={theme.colors.accent} />
            </View>
            <Text style={styles.cardTitle}>Protection de vos données</Text>
          </View>
          <Text style={styles.cardText}>
            Corail respecte votre vie privée et protège vos données conformément au RGPD.
          </Text>
        </View>

        {/* Carte : ce que nous collectons */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Ce que nous collectons</Text>
          <BulletPoint icon="person-outline">Identité (nom, email, téléphone, carte VTC)</BulletPoint>
          <BulletPoint icon="car-outline">Courses et activités sur la plateforme</BulletPoint>
          <BulletPoint icon="stats-chart-outline">Données d'utilisation pour améliorer le service</BulletPoint>
        </View>

        {/* Carte : vos droits */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Vos droits</Text>
          <BulletPoint icon="eye-outline">Accéder à vos données à tout moment</BulletPoint>
          <BulletPoint icon="download-outline">Exporter vos données (JSON)</BulletPoint>
          <BulletPoint icon="trash-outline">Supprimer votre compte</BulletPoint>
        </View>

        {/* Liens CGU / Confidentialité */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.linkButton} onPress={onShowPrivacyPolicy} activeOpacity={0.7}>
            <Ionicons name="document-text" size={20} color={theme.colors.accentLight} />
            <Text style={styles.linkText}>Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.accentLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkButton, styles.linkButtonLast]} onPress={onShowTermsOfService} activeOpacity={0.7}>
            <Ionicons name="reader" size={20} color={theme.colors.accentLight} />
            <Text style={styles.linkText}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.accentLight} />
          </TouchableOpacity>
        </View>

        {/* Checkbox + bouton */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.checkboxContainer} onPress={toggleAcceptance} activeOpacity={0.7}>
            <View style={[styles.checkbox, isAccepted && styles.checkboxChecked]}>
              {isAccepted && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
            <Text style={styles.checkboxText}>
              J'accepte les{' '}
              <Text style={styles.checkboxLink} onPress={onShowTermsOfService}>CGU</Text>
              {' '}et la{' '}
              <Text style={styles.checkboxLink} onPress={onShowPrivacyPolicy}>Politique de confidentialité</Text>
              {' '}de Corail.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAccept}
            activeOpacity={0.8}
            disabled={!isAccepted || isLoading}
            style={[styles.buttonContainer, (!isAccepted || isLoading) && styles.buttonDisabled]}
          >
            <LinearGradient
              colors={!isAccepted || isLoading ? ['#64748b', '#475569'] : ['#6366f1', '#4f46e5']}
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
        </View>

        <Text style={styles.footer}>
          En continuant, vous confirmez avoir pris connaissance de nos engagements.
        </Text>
      </ScrollView>
    </View>
  );
}

function BulletPoint({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.bulletPoint}>
      <Ionicons name={icon as any} size={18} color={theme.colors.accent} style={styles.bulletIcon} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingTop: Platform.OS === 'ios' ? 50 : 24, paddingBottom: 60 },
  heroWrap: {
    height: 120,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlayLight },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 14,
  },
  logoWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  heroTextBlock: { flex: 1, minWidth: 0 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: theme.colors.textMuted },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.accentBgStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textSecondary, flex: 1 },
  cardText: { fontSize: 14, lineHeight: 20, color: theme.colors.textMuted },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textMutedDark, marginBottom: theme.spacing.sm, letterSpacing: 0.3 },
  bulletPoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bulletIcon: { marginRight: 10, marginTop: 2 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20, color: theme.colors.textSoft },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.accentBg,
    borderWidth: 1,
    borderColor: theme.colors.accentBgStrong,
    marginBottom: 10,
    gap: 10,
  },
  linkButtonLast: { marginBottom: 0 },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.accentLight },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.md },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.textMutedDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  checkboxText: { flex: 1, fontSize: 14, lineHeight: 20, color: theme.colors.textSoft },
  checkboxLink: { color: theme.colors.accentLight, fontWeight: '600', textDecorationLine: 'underline' },
  buttonContainer: { borderRadius: theme.radii.sm, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.5 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.md },
  buttonIcon: { marginRight: theme.spacing.xs },
  buttonText: { fontSize: 16, fontWeight: '700', color: theme.colors.white },
  footer: { fontSize: 12, lineHeight: 18, color: theme.colors.textMutedDark, textAlign: 'center', fontStyle: 'italic', marginTop: theme.spacing.xs },
});



