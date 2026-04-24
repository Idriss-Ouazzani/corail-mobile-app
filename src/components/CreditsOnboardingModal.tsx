/**
 * CreditsOnboardingModal - Équilibre : bottom-sheet ultra premium
 * Hero photo + tagline "Publiez. Prenez. Le réseau s'équilibre." + 3 règles (Publier +1, Prendre -1, Groupe & client 0).
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const HERO_HEIGHT = 200;

// Photo élégante : équilibre / échange (remplaçable par un asset local)
const EQUILIBRE_HERO_IMAGE =
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=90';

interface CreditsOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
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
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet} pointerEvents="box-none">
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero : photo élégante */}
          <View style={styles.hero}>
            <Image
              source={{ uri: EQUILIBRE_HERO_IMAGE }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(15, 23, 42, 0.85)', 'rgba(15, 23, 42, 0.98)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Équilibre du réseau</Text>
              <Text style={styles.heroTagline}>
                Publiez. Prenez. Le réseau s'équilibre.
              </Text>
            </View>
          </View>

          {/* Corps : principe + règles */}
          <View style={styles.body}>
            <Text style={styles.intro}>
              Le réseau public repose sur un principe d'équité :{' '}
              <Text style={styles.introHighlight}>chaque chauffeur contribue au bon fonctionnement du réseau.</Text>
              {'\n\n'}
              Cela permet d'éviter que certains ne prennent des courses sans jamais en partager.
            </Text>

            <View style={styles.rulesCard}>
              <Text style={styles.ruleLine}>Vous publiez une course → +1</Text>
              <Text style={styles.ruleLine}>Vous prenez une course → −1</Text>
              <Text style={[styles.ruleLine, styles.ruleLineLast]}>Si un collègue réalise la course que vous avez publiée → +1 pour vous.</Text>
            </View>

            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                Uniquement sur les annonces publiques.{'\n'}
                Les réservations directes et les groupes ne sont pas concernés.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dontShowAgainButton}
            onPress={() => {
              onDontShowAgain();
              onClose();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.dontShowAgainText}>Ne plus afficher</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  hero: {
    height: HERO_HEIGHT,
    marginHorizontal: -1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingBottom: 22,
    paddingTop: 40,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroTagline: {
    fontSize: 15,
    color: theme.colors.textSoft,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  intro: {
    fontSize: 15,
    color: theme.colors.textSoft,
    lineHeight: 23,
    marginBottom: 18,
    letterSpacing: 0.1,
  },
  introHighlight: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  rulesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  ruleLine: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 28,
    letterSpacing: 0.15,
  },
  ruleLineLast: {
    marginTop: 8,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footerNoteText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  actions: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMuted,
    letterSpacing: 0.2,
  },
  dontShowAgainButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dontShowAgainText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
});
