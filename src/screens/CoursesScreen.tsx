/**
 * CoursesScreen - Annonces + Mes courses (2 onglets)
 * UI lisible et soignée pour conducteurs.
 * Badge crédits visible dans le header (tous onglets).
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';

const CREDITS_ONBOARDING_SEEN_KEY = '@corail_credits_onboarding_seen';

interface CoursesScreenProps {
  verificationStatus: string | null;
  /** Accès réseau / marketplace (profil chauffeur vérifié) */
  isDriverVerified?: boolean;
  onRefreshVerification: () => Promise<void>;
  activeTab: 'marketplace' | 'myrides';
  onTabChange: (tab: 'marketplace' | 'myrides') => void;
  userCredits?: number;
  onShowCreditsOnboarding?: () => void;
  onOpenVerificationProfile?: () => void;
  marketplaceContent: React.ReactNode;
  myRidesContent: React.ReactNode;
}

export default function CoursesScreen({
  verificationStatus,
  isDriverVerified = false,
  onRefreshVerification,
  activeTab,
  onTabChange,
  userCredits = 0,
  onShowCreditsOnboarding,
  onOpenVerificationProfile,
  marketplaceContent,
  myRidesContent,
}: CoursesScreenProps) {
  const showAnnoncesLock = activeTab === 'marketplace' && !isDriverVerified;
  const hasTriggeredOnboardingRef = useRef(false);

  // Afficher l'onboarding crédits une seule fois à la première arrivée sur Marketplace (si pas déjà "Ne plus afficher")
  useEffect(() => {
    if (activeTab !== 'marketplace' || hasTriggeredOnboardingRef.current) return;
    AsyncStorage.getItem(CREDITS_ONBOARDING_SEEN_KEY).then((seen) => {
      if (seen === 'true') return;
      hasTriggeredOnboardingRef.current = true;
      onShowCreditsOnboarding?.();
    });
  }, [activeTab, onShowCreditsOnboarding]);

  const renderContent = () => {
    switch (activeTab) {
      case 'marketplace':
        return (
          <View style={styles.contentInner}>
            {marketplaceContent}
            {showAnnoncesLock && (
              <View style={styles.annoncesOverlay} pointerEvents="box-none">
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.annoncesOverlayMessage}>
                  <Ionicons name="lock-closed" size={32} color={theme.colors.textMuted} />
                  <Text style={styles.annoncesOverlayText}>
                    Débloquez l'accès au réseau
                  </Text>
                  <Text style={[styles.annoncesOverlayText, { fontSize: 13, marginTop: 6 }]}>
                    Votre profil doit être vérifié pour voir les annonces et publier.
                  </Text>
                  {onOpenVerificationProfile && (
                    <TouchableOpacity style={styles.annoncesOverlayCta} onPress={onOpenVerificationProfile}>
                      <Text style={styles.annoncesOverlayCtaText}>Vérifier mon profil</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        );
      case 'myrides':
        return myRidesContent;
      default:
        return (
          <View style={styles.contentInner}>
            {marketplaceContent}
            {showAnnoncesLock && (
              <View style={styles.annoncesOverlay} pointerEvents="box-none">
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.annoncesOverlayMessage}>
                  <Ionicons name="lock-closed" size={32} color={theme.colors.textMuted} />
                  <Text style={styles.annoncesOverlayText}>Débloquez l'accès au réseau</Text>
                  <Text style={[styles.annoncesOverlayText, { fontSize: 13, marginTop: 6 }]}>
                    Votre profil doit être vérifié pour voir les annonces et publier.
                  </Text>
                  {onOpenVerificationProfile && (
                    <TouchableOpacity style={styles.annoncesOverlayCta} onPress={onOpenVerificationProfile}>
                      <Text style={styles.annoncesOverlayCtaText}>Vérifier mon profil</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Courses</Text>
            <Text style={styles.headerSubtitle}>Annonces et suivi de vos courses</Text>
          </View>
          <TouchableOpacity
            style={styles.creditsBadge}
            onPress={() => onShowCreditsOnboarding?.()}
            activeOpacity={0.8}
          >
            <Text style={styles.creditsBadgeValue}>{userCredits}</Text>
            <Text style={styles.creditsBadgeLabel}>crédits</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsWrapper}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={styles.tabTouchable}
            onPress={() => onTabChange('marketplace')}
            activeOpacity={0.85}
          >
            {activeTab === 'marketplace' ? (
              <LinearGradient
                colors={['#0ea5e9', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabInner}
              >
                <Ionicons name="storefront" size={20} color="#fff" />
                <Text style={styles.tabTextActive}>Annonces</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInner}>
                <Ionicons name="storefront-outline" size={20} color="#94a3b8" />
                <Text style={styles.tabText}>Annonces</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabTouchable}
            onPress={() => onTabChange('myrides')}
            activeOpacity={0.85}
          >
            {activeTab === 'myrides' ? (
              <LinearGradient
                colors={['#0ea5e9', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabInner}
              >
                <Ionicons name="person" size={20} color="#fff" />
                <Text style={styles.tabTextActive}>Mes courses</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInner}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" />
                <Text style={styles.tabText}>Mes courses</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1222',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  creditsBadge: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.6)',
    alignItems: 'center',
    minWidth: 44,
  },
  creditsBadgeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  creditsBadgeLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  tabsWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 14,
    padding: 5,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  tabTouchable: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    flex: 1,
    position: 'relative',
  },
  annoncesOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  annoncesOverlayMessage: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  annoncesOverlayText: {
    marginTop: 12,
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  annoncesOverlayCta: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
  },
  annoncesOverlayCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
