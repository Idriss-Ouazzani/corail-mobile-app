/**
 * NavigationContext - Gestion centralisée de la navigation et des modales
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  
  // Filtres
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
  const [coursesTab, setCoursesTab] = useState<'marketplace' | 'myrides'>('myrides');
  const [myRidesTab, setMyRidesTab] = useState<'claimed' | 'published' | 'personal'>('claimed');
  
  // Sélections
  const [selectedCity, setSelectedCity] = useState('toulouse');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedPersonalRide, setSelectedPersonalRide] = useState<any | null>(null);
  
  // Filtres
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
  const [showCreditsInfo, setShowCreditsInfo] = useState(true);
  
  // Modales - Écrans spéciaux
  const [showPersonalRides, setShowPersonalRides] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showMyQuotes, setShowMyQuotes] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showVTCProfile, setShowVTCProfile] = useState(false);
  const [showDriverRequests, setShowDriverRequests] = useState(false);
  
  // Modales - Pages légales
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showLegalNotice, setShowLegalNotice] = useState(false);
  const [showPrivacyData, setShowPrivacyData] = useState(false);
  
  // ============================================================================
  // ACTIONS UTILITAIRES
  // ============================================================================
  
  const closeAllModals = () => {
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
    setShowPersonalRides(false);
    setShowPlanning(false);
    setShowMyQuotes(false);
    setShowAdminPanel(false);
    setShowQRCode(false);
    setShowVTCProfile(false);
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
  };
  
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

