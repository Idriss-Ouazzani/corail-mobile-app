/**
 * Corail - Design proche de VTC Market Web 🪸
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Charger le DSN Sentry depuis expo-constants (fonctionne avec EAS Build)
const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 SENTRY INITIALIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sentry.init({
  dsn: SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% des transactions (ajuster en prod si besoin)
  
  // Enable automatic session tracking
  enableAutoSessionTracking: true,
  
  // Release tracking
  release: 'corail-app@1.0.0',
  dist: '1',
  
  // Development: désactiver Sentry
  enabled: !__DEV__, // Sentry actif uniquement en production
  
  // Options avancées
  beforeSend(event, hint) {
    // Filtrer les erreurs sensibles si nécessaire
    if (__DEV__) {
      console.log('📤 Sentry Event:', event);
    }
    return event;
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import RideCard from './src/components/RideCard';
import CitySelector from './src/components/CitySelector';
import CreditsBadge from './src/components/CreditsBadge';
import { BadgeCard } from './src/components/BadgeCard';
import MarketplaceFilters, { FilterOptions } from './src/components/MarketplaceFilters';
import RideDetailScreen from './src/screens/RideDetailScreen';
import CreateRideScreen from './src/screens/CreateRideScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import GroupInvitationsScreen from './src/screens/GroupInvitationsScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import LoginScreen from './src/screens/LoginScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import PendingVerificationScreen from './src/screens/PendingVerificationScreen';
import AdminPanelScreen from './src/screens/AdminPanelScreen';
import QRCodeScreen from './src/screens/QRCodeScreen';
import PersonalRidesScreen from './src/screens/PersonalRidesScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import ToolsScreen from './src/screens/ToolsScreen';
import PlanningScreen from './src/screens/PlanningScreen';
import CreateQuoteScreen from './src/screens/CreateQuoteScreen';
import MyQuotesScreen from './src/screens/MyQuotesScreen';
import GlobalCreditsBadge from './src/components/GlobalCreditsBadge';
import ActivityFeed from './src/components/ActivityFeed';
import MarketplaceTab from './src/components/MarketplaceTab';
import MyRidesTab from './src/components/MyRidesTab';
import ProfileTab from './src/components/ProfileTab';
import { CreditsModal } from './src/components/CreditsModal';
import { BottomNavigation } from './src/components/BottomNavigation';
import { PublishRideModal } from './src/components/PublishRideModal';
import { renderModalScreens } from './src/navigation/renderModalScreens';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AppDataProvider, useAppData } from './src/contexts/AppDataContext';
import { NavigationProvider, useNavigation } from './src/contexts/NavigationContext';
// 🎯 Custom Hooks - Logique métier extraite
import { useRides, usePersonalRides, useCredits, useBadges, useGroups, useRideActions, useNotifications, useScreenTracking } from './src/hooks';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/config/toastConfig';
import { apiClient } from './src/services/api';
import { haptic } from './src/services/haptic';
import { toast } from './src/services/toast';
import { logger } from './src/services/logger';
import { formatName } from './src/utils/formatName';
import LoadingScreen from './src/components/LoadingScreen';
import { appStyles } from './src/styles/App.styles';
import type { Ride } from './src/types';

const { width } = Dimensions.get('window');

// ============================================================================
// APP CONTENT (utilise useAuth)
// ============================================================================

function AppContent() {
  // État local pour les modales légales dans ConsentScreen
  const [consentShowPrivacyPolicy, setConsentShowPrivacyPolicy] = useState(false);
  const [consentShowTermsOfService, setConsentShowTermsOfService] = useState(false);

  // 🔐 Utiliser le contexte d'authentification
  const {
    user,
    authLoading,
    verificationStatus,
    verificationLoading,
    userFullName,
    userPhone,
    userSiren,
    userProfessionalCard,
    userPhotoUrl,
    verificationSubmittedAt,
    isAdmin,
    hasAcceptedTerms,
    loadVerificationStatus,
    signOut,
  } = useAuth();
  
  // 📦 Utiliser le contexte des données
  const {
    rides,
    personalRides,
    loadingRides,
    loadRides,
    loadPersonalRides,
    userCredits,
    loadCredits,
    userBadges,
    loadBadges,
    userGroups,
    loadGroups,
  } = useAppData();
  
  // 🧭 Utiliser le contexte de navigation
  const {
    currentScreen,
    setCurrentScreen,
    coursesTab,
    setCoursesTab,
    selectedCity,
    setSelectedCity,
    selectedRide,
    setSelectedRide,
    selectedGroup,
    setSelectedGroup,
    selectedPersonalRide,
    setSelectedPersonalRide,
    activeFilter,
    setActiveFilter,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    showCreateRide,
    setShowCreateRide,
    createRideMode,
    setCreateRideMode,
    showCreateQuote,
    setShowCreateQuote,
    showPublishModal,
    setShowPublishModal,
    publishVisibility,
    setPublishVisibility,
    showPersonalInfo,
    setShowPersonalInfo,
    showNotifications,
    setShowNotifications,
    showHelpSupport,
    setShowHelpSupport,
    showBadges,
    setShowBadges,
    showGroups,
    setShowGroups,
    showGroupInvitations,
    setShowGroupInvitations,
    showSubscription,
    setShowSubscription,
    showCreditsModal,
    setShowCreditsModal,
    showCreditsInfo,
    setShowCreditsInfo,
    showPersonalRides,
    setShowPersonalRides,
    showPlanning,
    setShowPlanning,
    showMyQuotes,
    setShowMyQuotes,
    showAdminPanel,
    setShowAdminPanel,
    showQRCode,
    setShowQRCode,
    showVTCProfile,
    setShowVTCProfile,
    showPrivacyPolicy,
    setShowPrivacyPolicy,
    showTermsOfService,
    setShowTermsOfService,
    showLegalNotice,
    setShowLegalNotice,
    showPrivacyData,
    setShowPrivacyData,
    myRidesTab,
    setMyRidesTab,
  } = useNavigation();
  
  // 🆔 ID de l'utilisateur courant (Firebase UID)
  const currentUserId = user?.uid || '';

  // 📨 État pour les invitations de groupe en attente
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // 📨 Charger le nombre d'invitations en attente
  const loadPendingInvitations = React.useCallback(async () => {
    if (!currentUserId) return;
    try {
      const invitations = await apiClient.getMyGroupInvitations();
      console.log('📨 Invitations en attente:', invitations.length);
      setPendingInvitationsCount(invitations.length);
    } catch (error) {
      console.error('❌ Erreur chargement invitations:', error);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);

  // 🎯 Hook pour les actions sur les courses
  const { handleDeleteRide, handleCompleteRide, handleClaimRide, handleCreateRide } = useRideActions({
    currentUserId,
    userName: userFullName,
    userCredits,
    loadRides,
    loadPersonalRides,
    loadCredits,
  });

  // 🔔 Hook pour les notifications (initialisation automatique)
  useNotifications({
    user,
    userCredits,
    verificationStatus,
  });

  // 📊 Hook pour le tracking des écrans (analytics automatique)
  useScreenTracking({
    currentScreen,
    user,
    verificationStatus,
  });

  // ✅ L'authentification, les données et la navigation sont gérées par les Contexts !
  
  // ✅ Les données (rides, credits, badges, groups) sont maintenant gérées par AppDataContext
  // Plus besoin de useState ici !

  // 🧹 Nettoyer les modales quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!user) {
      setShowPersonalRides(false);
      setShowPlanning(false);
      console.log('🧹 Modales fermées après déconnexion');
    }
  }, [user]);

  // ✅ Toutes les fonctions load* sont maintenant dans AppDataContext
  // Elles sont automatiquement appelées quand l'utilisateur se connecte !

  // 🔐 Afficher écran de chargement pendant l'initialisation
  if (authLoading) {
    return <LoadingScreen message="Chargement" />;
  }

  // 🔐 Afficher écran de connexion si pas authentifié
  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  // 🔄 Afficher écran de chargement pendant la vérification du statut
  if (verificationLoading || verificationStatus === null) {
    return <LoadingScreen message="Chargement" />;
  }

  // ✅ Afficher écran de vérification si pas vérifié
  if (verificationStatus === 'UNVERIFIED') {
    return (
      <VerificationScreen
        user={user}
        onBack={async () => {
          await signOut();
        }}
        onSuccess={async () => {
          // Attendre un court instant pour que la DB se mette à jour
          await new Promise(resolve => setTimeout(resolve, 500));
          // Recharger le statut après soumission
          await loadVerificationStatus();
        }}
      />
    );
  }

  // 🟠 Afficher écran d'attente si en cours de validation
  if (verificationStatus === 'PENDING') {
    return (
      <PendingVerificationScreen
        onLogout={async () => {
          await signOut();
        }}
        onRefresh={loadVerificationStatus}
        submittedAt={verificationSubmittedAt}
      />
    );
  }

  // 📜 Afficher écran de consentement si pas encore accepté les termes (RGPD)
  if (!hasAcceptedTerms) {
    // Si un modal légal est ouvert depuis le ConsentScreen, l'afficher
    if (consentShowPrivacyPolicy) {
      const PrivacyPolicyScreen = require('./src/screens/PrivacyPolicyScreen').default;
      return <PrivacyPolicyScreen onBack={() => setConsentShowPrivacyPolicy(false)} />;
    }
    
    if (consentShowTermsOfService) {
      const TermsOfServiceScreen = require('./src/screens/TermsOfServiceScreen').default;
      return <TermsOfServiceScreen onBack={() => setConsentShowTermsOfService(false)} />;
    }

    return (
      <ConsentScreen
        onAccept={async () => {
          try {
            await apiClient.acceptTerms();
            toast.success('Bienvenue !', 'Vous pouvez maintenant utiliser Corail VTC.');
            // Recharger le statut pour mettre à jour hasAcceptedTerms
            await loadVerificationStatus();
          } catch (error: any) {
            toast.error('Erreur', error.message || "Impossible d'enregistrer votre acceptation.");
            logger.error('Erreur acceptation termes', error, { action: 'acceptTerms' });
          }
        }}
        onShowPrivacyPolicy={() => setConsentShowPrivacyPolicy(true)}
        onShowTermsOfService={() => setConsentShowTermsOfService(true)}
      />
    );
  }

  // ✅ renderHome() supprimé - remplacé par DashboardScreen
  // ✅ renderMarketplace() supprimé - remplacé par MarketplaceTab
  // ✅ renderMyRides() supprimé - remplacé par MyRidesTab
  // ✅ renderProfile() supprimé - remplacé par ProfileTab

  // Subscription screen removed (app is 100% free)
  // if (showSubscription) {
  //   return <SubscriptionScreen onBack={() => setShowSubscription(false)} />;
  // }

  // 🧭 Routing des écrans modaux (baby step 5 FINAL: TOUS les écrans !)
  const modalScreen = renderModalScreens({
    user,
    userFullName,
    userEmail: user?.email || '',
    userPhone,
    userSiren,
    userProfessionalCard,
    currentUserId,
    showPersonalInfo,
    setShowPersonalInfo,
    showNotifications,
    setShowNotifications,
    showHelpSupport,
    setShowHelpSupport,
    showBadges,
    setShowBadges,
    showGroupInvitations,
    setShowGroupInvitations,
    loadGroups,
    loadPendingInvitations,
    showQRCode,
    setShowQRCode,
    showPersonalRides,
    setShowPersonalRides,
    showCreateQuote,
    setShowCreateQuote,
    showMyQuotes,
    setShowMyQuotes,
    showPlanning,
    setShowPlanning,
    showAdminPanel,
    setShowAdminPanel,
    showVTCProfile,
    setShowVTCProfile,
    showPrivacyPolicy,
    setShowPrivacyPolicy,
    showTermsOfService,
    setShowTermsOfService,
    showLegalNotice,
    setShowLegalNotice,
    showPrivacyData,
    setShowPrivacyData,
    showGroups,
    setShowGroups,
    selectedGroup,
    setSelectedGroup,
    showCreateRide,
    setShowCreateRide,
    createRideMode,
    handleCreateRide,
    selectedRide,
    setSelectedRide,
    selectedPersonalRide,
    setSelectedPersonalRide,
    showPublishModal,
    userCredits,
    handleClaimRide,
    handleDeleteRide,
    handleCompleteRide,
    loadPersonalRides,
    loadRides,
  });
  if (modalScreen !== null) return modalScreen;





  return (
    <View style={appStyles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={appStyles.gradient}>
        {/* Global Credits Badge - Affiché partout */}
        <GlobalCreditsBadge credits={userCredits} onPress={() => setShowCreditsModal(true)} />
        
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            userFullName={userFullName}
            userCredits={userCredits}
            userRides={rides}
            pendingInvitationsCount={pendingInvitationsCount}
            onNavigateToCourses={() => {
              setCoursesTab('myrides');
              setCurrentScreen('courses');
            }}
            onNavigateToTools={() => setCurrentScreen('tools')}
            onNavigateToActivity={() => {
              setCoursesTab('history');
              setCurrentScreen('courses');
            }}
            onNavigateToPlanning={() => setShowPlanning(true)}
            onOpenQRCode={() => setShowQRCode(true)}
            onCreateRide={() => {
              setCreateRideMode('create');
              setShowCreateRide(true);
            }}
            onRidePress={(ride) => {
              setSelectedRide(ride);
            }}
            onPersonalRidePress={(ride) => {
              setSelectedPersonalRide(ride);
            }}
            onOpenGroupInvitations={() => setShowGroupInvitations(true)}
          />
        )}
        {currentScreen === 'courses' && (
          <CoursesScreen
            activeTab={coursesTab}
            onTabChange={setCoursesTab}
            marketplaceContent={
              <MarketplaceTab
                rides={rides}
                currentUserId={currentUserId}
                loadingRides={loadingRides}
                selectedCity={selectedCity}
                activeFilter={activeFilter}
                filters={filters}
                showCreditsInfo={showCreditsInfo}
                onCityChange={setSelectedCity}
                onFilterChange={setActiveFilter}
                onShowFilters={() => setShowFilters(true)}
                onCreateRide={() => {
                  setCreateRideMode('publish');
                  setShowCreateRide(true);
                }}
                onRidePress={(ride) => {
                  console.log('Ride selected:', ride.id);
                  setSelectedRide(ride);
                }}
                onCloseCreditsInfo={() => setShowCreditsInfo(false)}
              />
            }
            myRidesContent={
              <MyRidesTab
                rides={rides}
                personalRides={personalRides}
                currentUserId={currentUserId}
                activeTab={myRidesTab}
                onTabChange={setMyRidesTab}
                onCreateRide={() => {
                  setCreateRideMode('create');
                  setShowCreateRide(true);
                }}
                onRidePress={(ride) => {
                  console.log('Ride selected:', ride.id);
                  setSelectedRide(ride);
                }}
                onPersonalRidePress={(ride) => {
                  console.log('Personal ride selected:', ride.id);
                  setSelectedPersonalRide(ride);
                }}
                onPublishPersonalRide={(ride) => {
                  console.log('Publishing personal ride:', ride.id);
                  setSelectedPersonalRide(ride);
                  setShowPublishModal(true);
                }}
              />
            }
            historyContent={<ActivityFeed limit={50} />}
          />
        )}
        {currentScreen === 'tools' && (
          <ToolsScreen
            onOpenQRCode={() => setShowQRCode(true)}
            onOpenPersonalRides={() => {
              // Naviguer vers Courses > Perso
              setCoursesTab('myrides');
              setMyRidesTab('personal');
              setCurrentScreen('courses');
            }}
            onOpenPlanning={() => setShowPlanning(true)}
            onOpenQuotes={() => setShowMyQuotes(true)}
            onOpenVTCProfile={() => setShowVTCProfile(true)}
          />
        )}
        {currentScreen === 'profile' && (
          <ProfileTab
            user={user}
            userFullName={userFullName}
            userPhotoUrl={userPhotoUrl}
            userCredits={userCredits}
            userBadges={userBadges}
            userGroups={userGroups}
            rides={rides}
            personalRides={personalRides}
            isAdmin={isAdmin}
            formatName={formatName}
            onShowPersonalInfo={() => setShowPersonalInfo(true)}
            onShowNotifications={() => setShowNotifications(true)}
            onShowHelpSupport={() => setShowHelpSupport(true)}
            onShowBadges={() => setShowBadges(true)}
            onShowGroups={() => setShowGroups(true)}
            onShowGroupInvitations={() => setShowGroupInvitations(true)}
            onShowAdminPanel={() => setShowAdminPanel(true)}
            onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)}
            onShowTermsOfService={() => setShowTermsOfService(true)}
            onShowLegalNotice={() => setShowLegalNotice(true)}
            onShowPrivacyData={() => setShowPrivacyData(true)}
            onSelectGroup={(group) => setSelectedGroup(group)}
            onSignOut={signOut}
          />
        )}

        {/* Marketplace Filters Modal */}
        <MarketplaceFilters
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={(newFilters) => setFilters(newFilters)}
          currentFilters={filters}
        />

        {/* Credits Info Modal */}
        <CreditsModal
          visible={showCreditsModal}
          onClose={() => setShowCreditsModal(false)}
        />

        {/* Bottom Navigation */}
        <BottomNavigation
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          onCreateRide={() => {
            setCreateRideMode('create');
            setShowCreateRide(true);
          }}
        />

        {/* Publish Ride Modal */}
        <PublishRideModal
          visible={showPublishModal}
          personalRide={selectedPersonalRide}
          onClose={() => {
            setShowPublishModal(false);
            setSelectedPersonalRide(null);
          }}
          onPublished={async () => {
            // Petit délai pour laisser la DB se mettre à jour
            console.log('⏳ [PublishModal] Attente 1000ms...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Recharger les données (rides + crédits)
            console.log('🔄 [PublishModal] Rechargement rides...');
            await loadRides();
            console.log('🔄 [PublishModal] Rechargement courses perso...');
            await loadPersonalRides();
            console.log('🔄 [PublishModal] Rechargement crédits...');
            await loadCredits();
            console.log('✅ [PublishModal] Tout rechargé !');
          }}
        />
      </LinearGradient>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
// ✅ Tous les styles ont été déplacés vers src/styles/App.styles.ts
// Utiliser `appStyles.XXX` au lieu de `styles.XXX`

// ============================================================================
// APP WRAPPER (avec tous les Providers)
// ============================================================================

function AppWithData() {
  const { user } = useAuth();
  
  return (
    <AppDataProvider userId={user?.uid || null}>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AppDataProvider>
  );
}

function App() {
  return (
    <>
      <AuthProvider>
        <AppWithData />
      </AuthProvider>
      <Toast config={toastConfig} />
    </>
  );
}

// Wrap with Sentry for error boundary
export default Sentry.wrap(App);
