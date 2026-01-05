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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../services/api';
import { toast } from '../services/toast';
import { logger } from '../services/logger';

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité et données</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro RGPD */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={32} color="#6366f1" />
          <Text style={styles.infoTitle}>Vos droits RGPD</Text>
          <Text style={styles.infoText}>
            Conformément au Règlement Général sur la Protection des Données (RGPD), 
            vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement 
            de vos données personnelles.
          </Text>
        </View>

        {/* Export des données */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="download-outline" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Exporter mes données</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Téléchargez une copie complète de toutes vos données (profil, courses, crédits, activités) 
            au format JSON. Vous recevrez un email avec un lien de téléchargement.
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

        {/* Divider */}
        <View style={styles.divider} />

        {/* Suppression du compte */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
            <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Supprimer mon compte</Text>
          </View>
          <Text style={styles.sectionDescription}>
            <Text style={styles.warningText}>⚠️ Action irréversible !</Text>
            {'\n\n'}
            La suppression de votre compte entraînera :
          </Text>
          <View style={styles.warningList}>
            <WarningItem>Suppression définitive de votre profil</WarningItem>
            <WarningItem>Perte de tous vos crédits restants</WarningItem>
            <WarningItem>Effacement de toutes vos courses (historique)</WarningItem>
            <WarningItem>Suppression de vos groupes et invitations</WarningItem>
            <WarningItem>Impossible de récupérer votre compte</WarningItem>
          </View>
          <Text style={styles.sectionDescription}>
            Vos données seront anonymisées sous 30 jours (sauf obligations légales comptables).
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Des questions ? Contactez notre DPO : <Text style={styles.footerLink}>dpo@corail.app</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function WarningItem({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.warningItem}>
      <Ionicons name="close-circle" size={16} color="#ef4444" style={styles.warningIcon} />
      <Text style={styles.warningItemText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerRight: {
    width: 40,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#cbd5e1',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fbbf24',
  },
  warningList: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    marginBottom: 12,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningItemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#fca5a5',
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 32,
  },
  footer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  footerLink: {
    color: '#6366f1',
    textDecorationLine: 'underline',
  },
});

