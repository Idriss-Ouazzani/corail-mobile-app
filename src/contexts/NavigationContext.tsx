/**
 * NavigationContext - Gestion centralisée de la navigation et des modales
 */

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import type { Ride } from '../types';
import type { FilterOptions } from '../components/MarketplaceFilters';

// ============================================================================
// TYPES
// ============================================================================

interface NavigationContextType {
  // Navigation principale
  currentScreen: 'dashboard' | 'courses' | 'tools' | 'profile';
  setCurrentScreen: (screen: 'dashboard' | 'courses' | 'tools' | 'profile') => void;
  
  // Onglets courses
  coursesTab: 'marketplace' | 'myrides';
  setCoursesTab: (tab: 'marketplace' | 'myrides') => void;
  myRidesTab: 'claimed' | 'published' | 'personal';
  setMyRidesTab: (tab: 'claimed' | 'published' | 'personal') => void;
  
  // Sélections
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedRide: Ride | null;
  setSelectedRide: (ride: Ride | null) => void;
  selectedGroup: any;
  setSelectedGroup: (group: any) => void;
  selectedPersonalRide: any | null;
  setSelectedPersonalRide: (ride: any | null) => void;
  
  // Filtres Annonces (visibilité : Public / Groupes)
  activeFilter: 'all' | 'public' | 'groups';
  setActiveFilter: (filter: 'all' | 'public' | 'groups') => void;
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  
  // Modales - Création
  showCreateRide: boolean;
  setShowCreateRide: (show: boolean) => void;
  createRideMode: 'create' | 'publish';
  setCreateRideMode: (mode: 'create' | 'publish') => void;
  showCreateQuote: boolean;
  setShowCreateQuote: (show: boolean) => void;
  showMyInvoices: boolean;
  setShowMyInvoices: (show: boolean) => void;
  
  // Modales - Publication
  showPublishModal: boolean;
  setShowPublishModal: (show: boolean) => void;
  publishVisibility: 'PUBLIC' | 'GROUP';
  setPublishVisibility: (visibility: 'PUBLIC' | 'GROUP') => void;
  
  // Modales - Profil & Paramètres
  showPersonalInfo: boolean;
  setShowPersonalInfo: (show: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  showHelpSupport: boolean;
  setShowHelpSupport: (show: boolean) => void;
  showBadges: boolean;
  setShowBadges: (show: boolean) => void;
  showGroups: boolean;
  setShowGroups: (show: boolean) => void;
  showGroupInvitations: boolean;
  setShowGroupInvitations: (show: boolean) => void;
  
  // Modales - Abonnement & Crédits
  showSubscription: boolean;
  setShowSubscription: (show: boolean) => void;
  showCreditsModal: boolean;
  setShowCreditsModal: (show: boolean) => void;
  showCreditsOnboarding: boolean;
  setShowCreditsOnboarding: (show: boolean) => void;
  /** True si l'utilisateur a fermé le pop-up Équilibre cette session (sans "Ne plus afficher"). Réinitialisé au redémarrage. */
  equilibreDismissedThisSession: boolean;
  setEquilibreDismissedThisSession: (v: boolean) => void;
  showCreditsInfo: boolean;
  setShowCreditsInfo: (show: boolean) => void;
  
  // Modales - Écrans spéciaux
  showPersonalRides: boolean;
  setShowPersonalRides: (show: boolean) => void;
  showPlanning: boolean;
  setShowPlanning: (show: boolean) => void;
  showMyQuotes: boolean;
  setShowMyQuotes: (show: boolean) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (show: boolean) => void;
  showQRCode: boolean;
  setShowQRCode: (show: boolean) => void;
  showVTCProfile: boolean;
  setShowVTCProfile: (show: boolean) => void;
  showVerificationProfile: boolean;
  setShowVerificationProfile: (show: boolean) => void;
  showDriverRequests: boolean;
  setShowDriverRequests: (show: boolean) => void;
  
  // Modales - Pages légales
  showPrivacyPolicy: boolean;
  setShowPrivacyPolicy: (show: boolean) => void;
  showTermsOfService: boolean;
  setShowTermsOfService: (show: boolean) => void;
  showLegalNotice: boolean;
  setShowLegalNotice: (show: boolean) => void;
  showPrivacyData: boolean;
  setShowPrivacyData: (show: boolean) => void;
  
  // Actions utilitaires
  closeAllModals: () => void;
  /**
   * Avant routage depuis une push / tap notification OS : mémorise l’écran courant puis ferme les modales
   * pour que la cible (ex. invitations groupe) passe au premier plan.
   */
  prepareForNotificationNavigation: () => void;
  /** Au retour (bouton retour) depuis un écran ouvert par une push : restaurer l’état mémorisé si besoin. */
  restoreAfterNotificationModalCloseIfNeeded: () => void;
  /** Forcer l'affichage de l'onboarding (ex. pour test depuis Aide & Support) */
  forceShowOnboarding: boolean;
  setForceShowOnboarding: (v: boolean) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  // Navigation principale
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'courses' | 'tools' | 'profile'>('dashboard');
  const [coursesTab, setCoursesTab] = useState<'marketplace' | 'myrides'>('marketplace');
  const [myRidesTab, setMyRidesTab] = useState<'claimed' | 'published' | 'personal'>('claimed');
  
  // Sélections
  const [selectedCity, setSelectedCity] = useState('toulouse');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedPersonalRide, setSelectedPersonalRide] = useState<any | null>(null);
  
  // Filtres Annonces
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'groups'>('all');
  const [filters, setFilters] = useState<FilterOptions>({
    vehicleTypes: [],
    sortBy: null,
    radiusKm: 100, // Rayon par défaut: 100km
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Modales - Création
  const [showCreateRide, setShowCreateRide] = useState(false);
  const [createRideMode, setCreateRideMode] = useState<'create' | 'publish'>('publish');
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showMyInvoices, setShowMyInvoices] = useState(false);
  
  // Modales - Publication
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishVisibility, setPublishVisibility] = useState<'PUBLIC' | 'GROUP'>('PUBLIC');
  
  // Modales - Profil & Paramètres
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showGroupInvitations, setShowGroupInvitations] = useState(false);
  
  // Modales - Abonnement & Crédits
  const [showSubscription, setShowSubscription] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showCreditsOnboarding, setShowCreditsOnboarding] = useState(false);
  const [equilibreDismissedThisSession, setEquilibreDismissedThisSession] = useState(false);
  const [showCreditsInfo, setShowCreditsInfo] = useState(true);
  
  // Modales - Écrans spéciaux
  const [showPersonalRides, setShowPersonalRides] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showMyQuotes, setShowMyQuotes] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showVTCProfile, setShowVTCProfile] = useState(false);
  const [showVerificationProfile, setShowVerificationProfile] = useState(false);
  const [showDriverRequests, setShowDriverRequests] = useState(false);
  
  // Modales - Pages légales
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showLegalNotice, setShowLegalNotice] = useState(false);
  const [showPrivacyData, setShowPrivacyData] = useState(false);
  const [forceShowOnboarding, setForceShowOnboarding] = useState(false);

  const notificationNavSnapshotRef = useRef<{
    currentScreen: 'dashboard' | 'courses' | 'tools' | 'profile';
    coursesTab: 'marketplace' | 'myrides';
    myRidesTab: 'claimed' | 'published' | 'personal';
    activeFilter: 'all' | 'public' | 'groups';
    filters: FilterOptions;
    selectedRide: Ride | null;
    selectedPersonalRide: any | null;
    selectedGroup: any | null;
    publishVisibility: 'PUBLIC' | 'GROUP';
    createRideMode: 'create' | 'publish';
      modals: {
        showPersonalInfo: boolean;
        showNotifications: boolean;
      showHelpSupport: boolean;
      showBadges: boolean;
      showGroups: boolean;
      showGroupInvitations: boolean;
      showCreateRide: boolean;
      showCreateQuote: boolean;
      showMyInvoices: boolean;
      showPublishModal: boolean;
      showPersonalRides: boolean;
      showPlanning: boolean;
      showMyQuotes: boolean;
      showAdminPanel: boolean;
      showQRCode: boolean;
      showVTCProfile: boolean;
      showVerificationProfile: boolean;
      showDriverRequests: boolean;
      showCreditsModal: boolean;
      showCreditsOnboarding: boolean;
      showSubscription: boolean;
      showPrivacyPolicy: boolean;
      showTermsOfService: boolean;
      showLegalNotice: boolean;
      showPrivacyData: boolean;
    };
  } | null>(null);
  const openedFromNotificationTapRef = useRef(false);
  
  // ============================================================================
  // ACTIONS UTILITAIRES
  // ============================================================================
  
  const closeAllModals = useCallback(() => {
    setShowCreateRide(false);
    setShowCreateQuote(false);
    setShowMyInvoices(false);
    setShowPublishModal(false);
    setShowPersonalInfo(false);
    setShowNotifications(false);
    setShowHelpSupport(false);
    setShowBadges(false);
    setShowGroups(false);
    setShowGroupInvitations(false);
    setShowSubscription(false);
    setShowCreditsModal(false);
    setShowCreditsOnboarding(false);
    setShowPersonalRides(false);
    setShowPlanning(false);
    setShowMyQuotes(false);
    setShowAdminPanel(false);
    setShowQRCode(false);
    setShowVTCProfile(false);
    setShowVerificationProfile(false);
    setShowDriverRequests(false);
    setShowPrivacyPolicy(false);
    setShowTermsOfService(false);
    setShowLegalNotice(false);
    setShowPrivacyData(false);
    setShowFilters(false);
    setSelectedRide(null);
    setSelectedGroup(null);
    setSelectedPersonalRide(null);
    console.log('🧹 NavigationContext - Toutes les modales fermées');
  }, []);

  const prepareForNotificationNavigation = useCallback(() => {
    notificationNavSnapshotRef.current = {
      currentScreen,
      coursesTab,
      myRidesTab,
      activeFilter,
      filters: {
        ...filters,
        vehicleTypes: [...(filters.vehicleTypes || [])],
      },
      selectedRide: selectedRide ? { ...selectedRide } : null,
      selectedPersonalRide: selectedPersonalRide ? { ...selectedPersonalRide } : null,
      selectedGroup: selectedGroup ? { ...selectedGroup } : null,
      publishVisibility,
      createRideMode,
      modals: {
        showPersonalInfo,
        showNotifications,
        showHelpSupport,
        showBadges,
        showGroups,
        showGroupInvitations,
        showCreateRide,
        showCreateQuote,
        showMyInvoices,
        showPublishModal,
        showPersonalRides,
        showPlanning,
        showMyQuotes,
        showAdminPanel,
        showQRCode,
        showVTCProfile,
        showVerificationProfile,
        showDriverRequests,
        showCreditsModal,
        showCreditsOnboarding,
        showSubscription,
        showPrivacyPolicy,
        showTermsOfService,
        showLegalNotice,
        showPrivacyData,
      },
    };
    openedFromNotificationTapRef.current = true;
    closeAllModals();
  }, [
    currentScreen,
    coursesTab,
    myRidesTab,
    activeFilter,
    filters,
    selectedRide,
    selectedPersonalRide,
    selectedGroup,
    publishVisibility,
    createRideMode,
    showPersonalInfo,
    showNotifications,
    showHelpSupport,
    showBadges,
    showGroups,
    showGroupInvitations,
    showCreateRide,
    showCreateQuote,
    showMyInvoices,
    showPublishModal,
    showPersonalRides,
    showPlanning,
    showMyQuotes,
    showAdminPanel,
    showQRCode,
    showVTCProfile,
    showVerificationProfile,
    showDriverRequests,
    showCreditsModal,
    showCreditsOnboarding,
    showSubscription,
    showPrivacyPolicy,
    showTermsOfService,
    showLegalNotice,
    showPrivacyData,
    closeAllModals,
  ]);

  const restoreAfterNotificationModalCloseIfNeeded = useCallback(() => {
    if (!openedFromNotificationTapRef.current) return;
    openedFromNotificationTapRef.current = false;
    const snap = notificationNavSnapshotRef.current;
    notificationNavSnapshotRef.current = null;
    if (!snap) return;

    setCurrentScreen(snap.currentScreen);
    setCoursesTab(snap.coursesTab);
    setMyRidesTab(snap.myRidesTab);
    setActiveFilter(snap.activeFilter);
    setFilters(snap.filters);
    setPublishVisibility(snap.publishVisibility);
    setCreateRideMode(snap.createRideMode);

    if (snap.selectedRide) setSelectedRide(snap.selectedRide);
    else setSelectedRide(null);
    if (snap.selectedPersonalRide) setSelectedPersonalRide(snap.selectedPersonalRide);
    else setSelectedPersonalRide(null);
    if (snap.selectedGroup) setSelectedGroup(snap.selectedGroup);
    else setSelectedGroup(null);

    const m = snap.modals;
    if (m.showPersonalInfo) setShowPersonalInfo(true);
    if (m.showNotifications) setShowNotifications(true);
    if (m.showHelpSupport) setShowHelpSupport(true);
    if (m.showBadges) setShowBadges(true);
    if (m.showGroups) setShowGroups(true);
    if (m.showGroupInvitations) setShowGroupInvitations(true);
    if (m.showCreateRide) setShowCreateRide(true);
    if (m.showCreateQuote) setShowCreateQuote(true);
    if (m.showMyInvoices) setShowMyInvoices(true);
    if (m.showPublishModal) setShowPublishModal(true);
    if (m.showPersonalRides) setShowPersonalRides(true);
    if (m.showPlanning) setShowPlanning(true);
    if (m.showMyQuotes) setShowMyQuotes(true);
    if (m.showAdminPanel) setShowAdminPanel(true);
    if (m.showQRCode) setShowQRCode(true);
    if (m.showVTCProfile) setShowVTCProfile(true);
    if (m.showVerificationProfile) setShowVerificationProfile(true);
    if (m.showDriverRequests) setShowDriverRequests(true);
    if (m.showCreditsModal) setShowCreditsModal(true);
    if (m.showCreditsOnboarding) setShowCreditsOnboarding(true);
    if (m.showSubscription) setShowSubscription(true);
    if (m.showPrivacyPolicy) setShowPrivacyPolicy(true);
    if (m.showTermsOfService) setShowTermsOfService(true);
    if (m.showLegalNotice) setShowLegalNotice(true);
    if (m.showPrivacyData) setShowPrivacyData(true);
  }, []);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  const value: NavigationContextType = {
    currentScreen,
    setCurrentScreen,
    coursesTab,
    setCoursesTab,
    myRidesTab,
    setMyRidesTab,
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
    showCreditsOnboarding,
    setShowCreditsOnboarding,
    equilibreDismissedThisSession,
    setEquilibreDismissedThisSession,
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
    showVerificationProfile,
    setShowVerificationProfile,
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
    closeAllModals,
    prepareForNotificationNavigation,
    restoreAfterNotificationModalCloseIfNeeded,
    forceShowOnboarding,
    setForceShowOnboarding,
  };
  
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour accéder à la navigation
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export default NavigationContext;

