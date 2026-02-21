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

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { RideCard } from './src/components/RideCard';
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
import { ValidationBanner } from './src/components/ValidationBanner';
import ActivityFeed from './src/components/ActivityFeed';
import MarketplaceTab from './src/components/MarketplaceTab';
import MyRidesTab from './src/components/MyRidesTab';
import ProfileTab from './src/components/ProfileTab';
import { CreditsModal } from './src/components/CreditsModal';
import { BottomNavigation } from './src/components/BottomNavigation';
import { PublishRideModal } from './src/components/PublishRideModal';
import { IncomingRideModal } from './src/components/IncomingRideModal';
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
import * as IncomingRidesService from './src/services/incomingRidesHybridService';
import { setupNotificationListeners } from './src/services/pushNotifications';
import { logger } from './src/services/logger';
import { formatName } from './src/utils/formatName';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from './src/components/LoadingScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { appStyles } from './src/styles/App.styles';
import type { Ride } from './src/types';

const ONBOARDING_SEEN_KEY = '@corail_onboarding_seen';

const { width } = Dimensions.get('window');

// ============================================================================
// APP CONTENT (utilise useAuth)
// ============================================================================

function AppContent() {
  // État local pour les modales légales dans ConsentScreen
  const [consentShowPrivacyPolicy, setConsentShowPrivacyPolicy] = useState(false);
  const [consentShowTermsOfService, setConsentShowTermsOfService] = useState(false);
  // Onboarding : affiché une fois au premier lancement (après consentement)
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

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
  
  // 🔍 DEBUG : Logger le verificationStatus à chaque changement
  useEffect(() => {
    console.log('🔍 [App.tsx] verificationStatus changé:', verificationStatus);
  }, [verificationStatus]);
  
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

  // 🔍 Debug: Tracer les changements de crédits
  React.useEffect(() => {
    console.log('🎯 [App.tsx] userCredits a changé:', userCredits);
  }, [userCredits]);
  
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
    showMyInvoices,
    setShowMyInvoices,
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
    showDriverRequests,
    setShowDriverRequests,
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
  
  // 🆔 ID de l'utilisateur courant (Supabase Auth ID)
  const currentUserId = user?.id || '';
  
  // 🔍 DEBUG : Logger currentUserId à chaque changement
  useEffect(() => {
    console.log('🔍 [App.tsx] currentUserId changé:', currentUserId, 'user:', !!user);
  }, [currentUserId, user]);

  // 📨 État pour les invitations de groupe en attente
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // 🚗 États pour le système de notifications de courses entrantes
  const [incomingRide, setIncomingRide] = useState<any | null>(null);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const appState = useRef(AppState.currentState);
  
  // ✅ Ref pour loadRides (éviter les réinitialisations Realtime)
  const loadRidesRef = useRef(loadRides);
  useEffect(() => {
    loadRidesRef.current = loadRides;
  }, [loadRides]);

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

  // 🚗 Handlers pour les courses entrantes
  const handleAcceptRide = async () => {
    if (!incomingRide) return;
    
    try {
      console.log('✅ Acceptation de la course:', incomingRide.id);
      
      // Claim la course via l'API
      await apiClient.claimRide(incomingRide.id);
      
      // Fermer le modal
      setShowIncomingModal(false);
      setIncomingRide(null);
      
      // Toast de succès
      toast.success('Course acceptée !');
      
      // Recharger les courses
      await loadRides();
      await loadPersonalRides();
      
      console.log('✅ Course acceptée et données rafraîchies');
    } catch (error: any) {
      console.error('❌ Erreur acceptation course:', error);
      toast.error('Erreur lors de l\'acceptation');
      setShowIncomingModal(false);
    }
  };

  const handleDeclineRide = () => {
    console.log('❌ Course refusée');
    setShowIncomingModal(false);
    setIncomingRide(null);
    toast.info('Course refusée');
  };

  const handleTimeoutRide = () => {
    console.log('⏱️ Course expirée');
    setShowIncomingModal(false);
    setIncomingRide(null);
    toast.info('Demande expirée');
  };

  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);

  // 🎯 Hook pour les actions sur les courses
  const { handleDeleteRide, handleCompleteRide, handleClaimRide, handleCreateRide } = useRideActions({
    currentUserId,
    userName: userFullName,
    userCredits,
    verificationStatus,
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

  // 📬 Au tap sur une notification (ex. devis accepté/refusé), ouvrir l'écran concerné
  useEffect(() => {
    if (!user) return;
    const unsubscribe = setupNotificationListeners(undefined, (response) => {
      const data = response?.notification?.request?.content?.data;
      if (!data) return;
      if (data.type === 'quote_accepted' || data.type === 'quote_refused') {
        setShowMyQuotes(true);
      }
    });
    return unsubscribe;
  }, [user]);

  // 📊 Hook pour le tracking des écrans (analytics automatique)
  useScreenTracking({
    currentScreen,
    user,
    verificationStatus,
  });

  // 🚗 Système hybride de notifications de courses entrantes (Realtime + Push)
  useEffect(() => {
    console.log('🔍 useEffect Realtime déclenché. Conditions:', {
      currentUserId: !!currentUserId,
      user: !!user,
      verificationStatus,
    });
    
    // Vérifier que l'utilisateur est authentifié et vérifié
    if (!currentUserId || !user || verificationStatus !== 'VERIFIED') {
      console.log('⚠️ Conditions non remplies pour le système Realtime');
      return;
    }

    console.log('🚀 Initialisation du système de notifications hybride');

    // Initialiser le système hybride (Realtime + Push)
    IncomingRidesService.initializeHybridSystem(
      currentUserId,
      (ride) => {
        console.log('📢 Nouvelle course détectée:', ride);
        
        // Vérifier que ce n'est pas une course créée par l'utilisateur lui-même
        if (ride.creator_id === currentUserId) {
          console.log('⚠️ Course créée par moi-même, ignorée');
          return;
        }
        
        // 🔄 Recharger les courses pour mettre à jour la liste
        console.log('🔄 Rechargement des courses après détection Realtime...');
        loadRidesRef.current().catch(err => console.error('❌ Erreur rechargement:', err));
        
        // Déterminer si l'app est au premier plan
        const isAppActive = AppState.currentState === 'active';
        
        if (isAppActive) {
          // App au premier plan → Modal plein écran
          console.log('📱 App active → Affichage modal');
          setIncomingRide(ride);
          setShowIncomingModal(true);
        } else {
          // App en arrière-plan ou fermée → Notification locale
          console.log('🔕 App en arrière-plan → Notification');
          IncomingRidesService.sendLocalNotification(ride);
        }
      }
    );

    // Écouter les clics sur les notifications
    const unsubscribeNotifications = IncomingRidesService.setupNotificationListener((rideId) => {
      console.log('📱 Notification tapée, rideId:', rideId);
      
      // Ouvrir l'app sur l'onglet Courses / Marketplace
      setCurrentScreen('courses');
      setCoursesTab('marketplace');
    });

    // Écouter les changements d'état de l'app
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('📱 AppState change:', appState.current, '→', nextAppState);
      appState.current = nextAppState;
    });

    // Cleanup
    return () => {
      console.log('🔕 Nettoyage du système de notifications');
      IncomingRidesService.stopHybridSystem();
      unsubscribeNotifications();
      appStateSubscription.remove();
    };
  }, [currentUserId, user, verificationStatus]);

  // ✅ L'authentification, les données et la navigation sont gérées par les Contexts !
  
  // ✅ Les données (rides, credits, badges, groups) sont maintenant gérées par AppDataContext
  // Plus besoin de useState ici !

  // Charger la préférence onboarding (affiché une seule fois)
  useEffect(() => {
    if (!user || !hasAcceptedTerms) return;
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY).then((v) => {
      setOnboardingSeen(v === 'true');
    });
  }, [user, hasAcceptedTerms]);

  // 🧹 Nettoyer les modales quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!user) {
      setShowPersonalRides(false);
      setShowPlanning(false);
      setOnboardingSeen(null);
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

  // 🟠 Si PENDING ou REJECTED : accès à l'app avec bannière de validation
  // (plus de blocage, l'utilisateur peut utiliser l'app sauf la marketplace)

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

  // 📱 Onboarding au premier lancement (après consentement, une seule fois)
  if (hasAcceptedTerms && onboardingSeen === null) {
    return <LoadingScreen message="Chargement" />;
  }
  if (hasAcceptedTerms && onboardingSeen === false) {
    return (
      <OnboardingScreen
        onComplete={async () => {
          await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
          setOnboardingSeen(true);
        }}
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
    userPhotoUrl,
    userSiren,
    userProfessionalCard,
    currentUserId,
    verificationStatus,
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
    showMyInvoices,
    setShowMyInvoices,
    showMyQuotes,
    setShowMyQuotes,
    showPlanning,
    setShowPlanning,
    showAdminPanel,
    setShowAdminPanel,
    showVTCProfile,
    setShowVTCProfile,
    showDriverRequests,
    setShowDriverRequests,
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
    setShowPublishModal,
    userCredits,
    handleClaimRide,
    handleDeleteRide,
    handleCompleteRide,
    loadPersonalRides,
    loadRides,
    loadCredits,
  });
  if (modalScreen !== null) return modalScreen;





  return (
    <View style={appStyles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={appStyles.gradient}>
        {/* Global Credits Badge - Affiché partout */}
        <GlobalCreditsBadge credits={userCredits} onPress={() => setShowCreditsModal(true)} />
        
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            verificationStatus={verificationStatus}
            onRefreshVerification={loadVerificationStatus}
            userFullName={userFullName}
            userCredits={userCredits}
            userRides={rides}
            pendingInvitationsCount={pendingInvitationsCount}
            onNavigateToCourses={() => {
              setCoursesTab('marketplace');
              setCurrentScreen('courses');
            }}
            onNavigateToTools={() => setCurrentScreen('tools')}
            onNavigateToActivity={() => {
              setCoursesTab('myrides');
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
            onNavigateToDriverRequests={() => setShowDriverRequests(true)}
          />
        )}
        {currentScreen === 'courses' && (
          <CoursesScreen
            activeTab={coursesTab}
            onTabChange={setCoursesTab}
            verificationStatus={verificationStatus}
            onRefreshVerification={loadVerificationStatus}
            marketplaceContent={
              <MarketplaceTab
                verificationStatus={verificationStatus}
                onRefreshVerification={loadVerificationStatus}
                rides={rides}
                currentUserId={currentUserId}
                loadingRides={loadingRides}
                selectedCity={selectedCity}
                activeFilter={activeFilter}
                filters={filters}
                onCityChange={setSelectedCity}
                onFilterChange={setActiveFilter}
                onShowFilters={() => setShowFilters(true)}
                onCreateRide={() => {
                  // Vérifier le statut de vérification avant de publier
                  if (verificationStatus !== 'VERIFIED') {
                    haptic.warning();
                    toast.warning(
                      '⏳ Vérification en cours',
                      'Votre profil doit être vérifié pour publier des courses sur la marketplace'
                    );
                    return;
                  }
                  setCreateRideMode('publish');
                  setShowCreateRide(true);
                }}
                onRidePress={(ride) => {
                  console.log('Ride selected:', ride.id);
                  setSelectedRide(ride as Ride);
                }}
              />
            }
            myRidesContent={
              <MyRidesTab
                verificationStatus={verificationStatus}
                onRefreshVerification={loadVerificationStatus}
                rides={rides}
                personalRides={personalRides}
                currentUserId={currentUserId}
                activeTab={myRidesTab}
                onTabChange={setMyRidesTab}
                onCreateRide={() => {
                  setCreateRideMode('create');
                  setShowCreateRide(true);
                }}
                onRidePress={async (ride) => {
                  console.log('Ride selected:', ride.id);
                  try {
                    const fullRide = await apiClient.getRide(ride.id);
                    setSelectedRide(fullRide as Ride);
                  } catch (_e) {
                    setSelectedRide(ride as Ride);
                  }
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
          />
        )}
        {currentScreen === 'tools' && (
          <ToolsScreen
            verificationStatus={verificationStatus}
            onRefreshVerification={loadVerificationStatus}
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
            onOpenInvoices={() => setShowMyInvoices(true)}
          />
        )}
        {currentScreen === 'profile' && (
          <ProfileTab
            verificationStatus={verificationStatus}
            onRefreshVerification={loadVerificationStatus}
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
          verificationStatus={verificationStatus}
          onClose={() => {
            setShowPublishModal(false);
            setSelectedPersonalRide(null);
          }}
          onPublished={async () => {
            // Délai pour laisser l'Edge Function terminer ET la DB se propager
            console.log('⏳ [PublishModal] Attente 1500ms...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Recharger les données (rides + crédits) - FORCE REFRESH
            console.log('🔄 [PublishModal] Rechargement rides...');
            await loadRides();
            console.log('🔄 [PublishModal] Rechargement courses perso...');
            await loadPersonalRides();
            console.log('🔄 [PublishModal] Rechargement crédits...');
            await loadCredits();
            console.log('✅ [PublishModal] Tout rechargé !');
          }}
        />

        {/* 🚗 Incoming Ride Modal - Système "À la Uber" */}
        <IncomingRideModal
          visible={showIncomingModal}
          ride={incomingRide}
          onAccept={handleAcceptRide}
          onDecline={handleDeclineRide}
          onTimeout={handleTimeoutRide}
          timeoutSeconds={20}
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
    <AppDataProvider userId={user?.id || null}>
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
