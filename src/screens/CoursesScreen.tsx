/**
 * CoursesScreen - Annonces + Mes courses (2 onglets)
 * UI lisible et soignée pour conducteurs.
 */

import React from 'react';
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
import { theme } from '../theme';

interface CoursesScreenProps {
  verificationStatus: string | null;
  onRefreshVerification: () => Promise<void>;
  activeTab: 'marketplace' | 'myrides';
  onTabChange: (tab: 'marketplace' | 'myrides') => void;
  marketplaceContent: React.ReactNode;
  myRidesContent: React.ReactNode;
}

export default function CoursesScreen({
  verificationStatus,
  onRefreshVerification,
  activeTab,
  onTabChange,
  marketplaceContent,
  myRidesContent,
}: CoursesScreenProps) {
  const isVerified = verificationStatus === 'VERIFIED';
  const showAnnoncesLock = activeTab === 'marketplace' && !isVerified;

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
                    Vous pourrez accéder à l'ensemble des annonces une fois votre profil validé.
                  </Text>
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
                  <Text style={styles.annoncesOverlayText}>
                    Vous pourrez accéder à l'ensemble des annonces une fois votre profil validé.
                  </Text>
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
        <Text style={styles.headerTitle}>Courses</Text>
        <Text style={styles.headerSubtitle}>Annonces et suivi de vos courses</Text>
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
});
