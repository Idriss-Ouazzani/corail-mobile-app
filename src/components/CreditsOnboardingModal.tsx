/**
 * CreditsOnboardingModal - Onboarding élégant sur les crédits
 * Affiché au tap sur le badge crédits ou à la première visite Marketplace.
 * Visuels soignés pour expliquer le principe.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const HERO_HEIGHT = 160;

interface CreditsOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  /** Appelé quand l'utilisateur clique "Ne plus afficher" (persister le flag) */
  onDontShowAgain: () => void;
}

export function CreditsOnboardingModal({
  visible,
  onClose,
  onDontShowAgain,
}: CreditsOnboardingModalProps) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Bouton fermer */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={16}>
            <View style={styles.closeButtonBg}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </View>
          </TouchableOpacity>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Bandeau visuel (dégradé) */}
            <View style={styles.heroWrap}>
              <LinearGradient
                colors={['#0c4a6e', '#075985', '#0f172a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroIconCircle}>
                  <Text style={styles.heroIconText}>C</Text>
                </View>
                <Text style={styles.heroTitle}>Crédits Corail</Text>
                <Text style={styles.heroSubtitle}>
                  Donnez un peu, prenez un peu. Pas d'argent.
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>En bref</Text>

            {/* Règles : uniquement annonces publiques */}
            <View style={styles.bullets}>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletIconWrap, styles.bulletIconMinus]}>
                  <Ionicons name="remove" size={20} color={theme.colors.info} />
                </View>
                <View style={styles.bulletTextWrap}>
                  <Text style={styles.bulletLabel}>Je prends une course (annonces)</Text>
                  <Text style={styles.bulletDetail}><Text style={styles.bulletBold}>−1 crédit</Text>. Groupe ou demande client = 0.</Text>
                </View>
              </View>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletIconWrap, styles.bulletIconPlus]}>
                  <Ionicons name="add" size={20} color={theme.colors.success} />
                </View>
                <View style={styles.bulletTextWrap}>
                  <Text style={styles.bulletLabel}>Je publie une course en public</Text>
                  <Text style={styles.bulletDetail}><Text style={styles.bulletBold}>+1 crédit</Text>. Groupe = 0.</Text>
                </View>
              </View>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletIconWrap, styles.bulletIconCheck]}>
                  <Ionicons name="checkmark" size={20} color={theme.colors.success} />
                </View>
                <View style={styles.bulletTextWrap}>
                  <Text style={styles.bulletLabel}>Un collègue fait une course que j'ai publiée</Text>
                  <Text style={styles.bulletDetail}><Text style={styles.bulletBold}>+1 crédit</Text> pour moi.</Text>
                </View>
              </View>
            </View>

            <View style={styles.footerBox}>
              <Text style={styles.footer}>
                Crédits uniquement sur les annonces publiques. Groupe = pas de crédits. 100 % gratuit.
              </Text>
            </View>
          </ScrollView>

          {/* Boutons en bas */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.primaryButton} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>J'ai compris</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                onDontShowAgain();
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Ne plus afficher</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 20,
  },
  heroWrap: {
    height: HERO_HEIGHT,
    marginHorizontal: -24,
    marginBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(14, 165, 233, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(248,250,252,0.85)',
    lineHeight: 20,
  },
  bullets: {
    marginBottom: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14,
  },
  bulletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletIconMinus: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  bulletIconPlus: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  bulletIconCheck: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  bulletBold: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  footer: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 19,
  },
  buttons: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  primaryButton: {
    backgroundColor: theme.colors.info,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 24,
    zIndex: 10,
    padding: 4,
  },
  closeButtonBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  intro: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 21,
    marginBottom: 20,
  },
  bulletTextWrap: {
    flex: 1,
  },
  bulletLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  bulletDetail: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  footerBox: {
    marginTop: 8,
  },
});
