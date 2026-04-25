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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';

/** Clé utilisée uniquement quand l'utilisateur clique "Ne plus afficher" (pas à la simple fermeture). */
const EQUILIBRE_DONT_SHOW_AGAIN_KEY = '@corail_equilibre_dont_show_again';

interface CoursesScreenProps {
  verificationStatus: string | null;
  /** Accès réseau / marketplace (profil chauffeur vérifié) */
  isDriverVerified?: boolean;
  onRefreshVerification: () => Promise<void>;
  activeTab: 'marketplace' | 'myrides';
  onTabChange: (tab: 'marketplace' | 'myrides') => void;
  userCredits?: number;
  /** True si l'utilisateur a fermé le pop-up Équilibre cette session → ne pas réafficher avant redémarrage */
  equilibreDismissedThisSession?: boolean;
  onShowCreditsOnboarding?: () => void;
  onOpenVerificationProfile?: () => void;
  marketplaceContent: React.ReactNode;
  myRidesContent: React.ReactNode;
  marketplaceAvailableCount?: number;
}

export default function CoursesScreen({
  verificationStatus,
  isDriverVerified = false,
  onRefreshVerification,
  activeTab,
  onTabChange,
  userCredits = 0,
  equilibreDismissedThisSession = false,
  onShowCreditsOnboarding,
  onOpenVerificationProfile,
  marketplaceContent,
  myRidesContent,
  marketplaceAvailableCount = 0,
}: CoursesScreenProps) {
  const showAnnoncesLock = activeTab === 'marketplace' && !isDriverVerified;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(marketplaceAvailableCount);

  // À chaque visite sur Annonces : afficher le pop-up Équilibre 1 fois par session (ou si "Ne plus afficher" pas coché)
  useEffect(() => {
    if (activeTab !== 'marketplace') return;
    if (equilibreDismissedThisSession) return;
    const timer = setTimeout(() => {
      AsyncStorage.getItem(EQUILIBRE_DONT_SHOW_AGAIN_KEY).then((dontShow) => {
        if (dontShow === 'true') return;
        onShowCreditsOnboarding?.();
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [activeTab, equilibreDismissedThisSession, onShowCreditsOnboarding]);

  useEffect(() => {
    const prev = prevCountRef.current;
    if (marketplaceAvailableCount > prev) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.16,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevCountRef.current = marketplaceAvailableCount;
  }, [marketplaceAvailableCount, pulseAnim]);

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
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Courses</Text>
            <Text style={styles.headerSubtitle}>Réseau public & réservations directes</Text>
          </View>
          <View style={styles.headerRight}>
            {activeTab === 'marketplace' && (
              <TouchableOpacity
                style={styles.equilibreInfoButton}
                onPress={() => onShowCreditsOnboarding?.()}
                activeOpacity={0.7}
                accessibilityLabel="À propos de l'équilibre du réseau"
              >
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.creditsBadge, activeTab !== 'marketplace' && styles.creditsBadgeMuted]}
              onPress={() => onShowCreditsOnboarding?.()}
              activeOpacity={0.8}
            >
              <Text style={[styles.creditsBadgeValue, activeTab !== 'marketplace' && styles.creditsBadgeValueMuted]}>{userCredits}</Text>
            </TouchableOpacity>
          </View>
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
                {marketplaceAvailableCount > 0 && (
                  <Animated.View style={[styles.marketBadge, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.marketBadgeText}>{marketplaceAvailableCount > 99 ? '99+' : marketplaceAvailableCount}</Text>
                  </Animated.View>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.tabInner}>
                <Ionicons name="storefront-outline" size={20} color="#94a3b8" />
                <Text style={styles.tabText}>Annonces</Text>
                {marketplaceAvailableCount > 0 && (
                  <Animated.View style={[styles.marketBadge, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.marketBadgeText}>{marketplaceAvailableCount > 99 ? '99+' : marketplaceAvailableCount}</Text>
                  </Animated.View>
                )}
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
  headerTitleBlock: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equilibreInfoButton: {
    padding: 4,
  },
  creditsBadge: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  creditsBadgeMuted: {
    opacity: 0.7,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  creditsBadgeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  creditsBadgeValueMuted: {
    color: '#94a3b8',
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
    position: 'relative',
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
  marketBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  marketBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
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
