/**
 * PrivacyDataScreen - Gestion RGPD : Export et suppression des données
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../services/api';
import { toast } from '../services/toast';
import { logger } from '../services/logger';
import { theme } from '../theme';

interface PrivacyDataScreenProps {
  onBack: () => void;
  currentUserId: string;
  currentUserEmail: string;
}

export default function PrivacyDataScreen({
  onBack,
  currentUserId,
  currentUserEmail,
}: PrivacyDataScreenProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export des données (RGPD Article 20)
  const handleExportData = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert(
        'Exporter mes données',
        'Vous allez recevoir un email avec toutes vos données au format JSON (profil, courses, crédits, activités).\n\nCela peut prendre quelques minutes.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            style: 'default',
            onPress: async () => {
              setIsExporting(true);
              try {
                await apiClient.requestDataExport();
                toast.success(
                  'Export lancé !',
                  `Un email a été envoyé à ${currentUserEmail}. Vérifiez vos spams.`
                );
              } catch (error: any) {
                toast.error('Erreur', error.message || "Impossible d'exporter vos données.");
                logger.error('Erreur export données', error, { action: 'exportData' });
              } finally {
                setIsExporting(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      logger.error('Erreur export données', error, { action: 'exportData' });
    }
  };

  // Suppression du compte (RGPD Article 17)
  const handleDeleteAccount = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      Alert.alert(
        '⚠️ Supprimer mon compte',
        'ATTENTION : Cette action est IRRÉVERSIBLE.\n\n' +
        '✓ Votre compte sera supprimé définitivement\n' +
        '✓ Toutes vos données seront effacées (profil, courses, crédits, groupes)\n' +
        '✓ Vos crédits restants seront perdus\n' +
        '✓ Vous ne pourrez plus vous reconnecter\n\n' +
        'Êtes-vous ABSOLUMENT SÛR(E) ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer définitivement',
            style: 'destructive',
            onPress: () => confirmDeleteAccount(),
          },
        ]
      );
    } catch (error: any) {
      logger.error('Erreur suppression compte', error, { action: 'deleteAccount' });
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Dernière confirmation',
      'Tapez "SUPPRIMER" pour confirmer la suppression définitive de votre compte.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Je confirme',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.deleteAccount();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              Alert.alert(
                'Compte supprimé',
                'Votre compte a été supprimé avec succès. Nous sommes désolés de vous voir partir. Au revoir !',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // L'app va se déconnecter automatiquement
                      onBack();
                    },
                  },
                ]
              );
            } catch (error: any) {
              toast.error('Erreur', error.message || 'Impossible de supprimer votre compte.');
              logger.error('Erreur suppression compte', error, { action: 'deleteAccount' });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité et données</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="shield-checkmark" size={28} color={theme.colors.accentIcon} />
            </View>
            <Text style={styles.heroTitle}>Confidentialité et données</Text>
            <Text style={styles.heroSubtitle}>Vos droits RGPD</Text>
          </View>
        </View>

        {/* Intro RGPD - carte */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vos droits</Text>
          <Text style={styles.cardText}>
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, 
            de portabilité et d'effacement de vos données personnelles.
          </Text>
        </View>

        {/* Export - carte */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: theme.colors.successIconBg }]}>
              <Ionicons name="download-outline" size={22} color={theme.colors.success} />
            </View>
            <Text style={styles.cardSectionTitle}>Exporter mes données</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Copie complète de vos données (profil, courses, crédits) au format JSON. 
            Vous recevrez un email avec un lien de téléchargement.
          </Text>
          <TouchableOpacity
            onPress={handleExportData}
            activeOpacity={0.8}
            disabled={isExporting}
            style={styles.buttonContainer}
          >
            <LinearGradient
              colors={isExporting ? ['#64748b', '#475569'] : ['#10b981', '#059669']}
              style={styles.buttonGradient}
            >
              {isExporting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Export en cours...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-download-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Exporter mes données</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Suppression - carte */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: theme.colors.errorBg }]}>
              <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
            </View>
            <Text style={[styles.cardSectionTitle, { color: theme.colors.errorLight }]}>Supprimer mon compte</Text>
          </View>
          <Text style={styles.sectionDescription}>
            <Text style={styles.warningText}>⚠️ Action irréversible.</Text>
            {'\n'}La suppression entraînera :
          </Text>
          <View style={styles.warningList}>
            <WarningItem>Suppression définitive du profil</WarningItem>
            <WarningItem>Perte des crédits restants</WarningItem>
            <WarningItem>Effacement de l'historique des courses</WarningItem>
            <WarningItem>Suppression des groupes et invitations</WarningItem>
          </View>
          <Text style={styles.sectionDescription}>
            Vos données seront anonymisées sous 30 jours (sauf obligations légales).
          </Text>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
            disabled={isDeleting}
            style={styles.buttonContainer}
          >
            <LinearGradient
              colors={isDeleting ? ['#64748b', '#475569'] : ['#ef4444', '#dc2626']}
              style={styles.buttonGradient}
            >
              {isDeleting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Suppression...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="warning-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Supprimer définitivement mon compte</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions ? DPO : <Text style={styles.footerLink}>dpo@corail.app</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function WarningItem({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.warningItem}>
      <Ionicons name="close-circle" size={16} color={theme.colors.error} style={styles.warningIcon} />
      <Text style={styles.warningItemText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.colors.text, marginHorizontal: theme.spacing.sm, textAlign: 'center' },
  headerRight: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 40 },
  heroWrap: {
    height: 100,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlayStrong },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.accentBgHero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  heroSubtitle: { fontSize: 13, color: theme.colors.textMuted },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textMutedDark, marginBottom: 10, letterSpacing: 0.3 },
  cardText: { fontSize: 14, lineHeight: 20, color: theme.colors.textSoft },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, gap: 10 },
  sectionIconWrap: { width: 40, height: 40, borderRadius: theme.radii.sm, alignItems: 'center', justifyContent: 'center' },
  cardSectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textSecondary, flex: 1 },
  sectionDescription: { fontSize: 14, lineHeight: 20, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  warningText: { fontSize: 14, fontWeight: '700', color: theme.colors.warning },
  warningList: {
    backgroundColor: theme.colors.errorBg,
    borderRadius: 10,
    padding: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  warningItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  warningIcon: { marginRight: theme.spacing.xs },
  warningItemText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#fca5a5' },
  buttonContainer: { borderRadius: theme.radii.sm, overflow: 'hidden', marginTop: 4 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  buttonIcon: { marginRight: theme.spacing.xs },
  buttonText: { fontSize: 16, fontWeight: '700', color: theme.colors.white },
  footer: { marginTop: theme.spacing.xs, paddingTop: theme.spacing.md, alignItems: 'center' },
  footerText: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center' },
  footerLink: { color: theme.colors.accent, textDecorationLine: 'underline' },
});

