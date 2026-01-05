/**
 * Firebase Analytics Service
 * Track événements métier et comportements utilisateurs
 * 100% GRATUIT et ILLIMITÉ ! 🎉
 */

// ⚠️ Safe import pour Expo Go (modules natifs non disponibles)
let analytics: any = null;
try {
  analytics = require('@react-native-firebase/analytics').default;
} catch (error) {
  console.log('⚠️ Firebase Analytics non disponible (mode Expo Go)');
  // Mock analytics pour éviter les erreurs
  analytics = () => ({
    logEvent: async () => {},
    logScreenView: async () => {},
    setUserId: async () => {},
    setUserProperty: async () => {},
    setAnalyticsCollectionEnabled: async () => {},
    resetAnalyticsData: async () => {},
  });
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// @ts-ignore - __DEV__ is a global variable in React Native
const ENABLED = !__DEV__; // Désactivé en dev (Expo Go ne supporte pas les modules natifs)
// ⚠️ Analytics sera actif en PRODUCTION après un build natif (npx expo prebuild)

// ============================================================================
// ÉVÉNEMENTS BUSINESS - Rides
// ============================================================================

/**
 * Track: Course publiée sur le marketplace
 */
export const trackRidePublished = async (params: {
  rideId: string;
  visibility: 'PUBLIC' | 'GROUP' | 'PERSONAL';
  vehicleType: string;
  priceCents: number;
  distanceKm?: number;
  creditsEarned: number;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] ride_published:', params);
    return;
  }

  await analytics().logEvent('ride_published', {
    ride_id: params.rideId,
    visibility: params.visibility,
    vehicle_type: params.vehicleType,
    price_cents: params.priceCents,
    price_eur: params.priceCents / 100,
    distance_km: params.distanceKm || 0,
    credits_earned: params.creditsEarned,
  });
};

/**
 * Track: Course réclamée (claimed)
 */
export const trackRideClaimed = async (params: {
  rideId: string;
  visibility: string;
  priceCents: number;
  creditsSpent: number;
  timeToClaimSeconds?: number;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] ride_claimed:', params);
    return;
  }

  await analytics().logEvent('ride_claimed', {
    ride_id: params.rideId,
    visibility: params.visibility,
    price_cents: params.priceCents,
    price_eur: params.priceCents / 100,
    credits_spent: params.creditsSpent,
    time_to_claim_seconds: params.timeToClaimSeconds || 0,
  });
};

/**
 * Track: Course terminée (completed)
 */
export const trackRideCompleted = async (params: {
  rideId: string;
  priceCents: number;
  distanceKm?: number;
  durationMinutes?: number;
  bonusEarned: number;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] ride_completed:', params);
    return;
  }

  await analytics().logEvent('ride_completed', {
    ride_id: params.rideId,
    price_cents: params.priceCents,
    price_eur: params.priceCents / 100,
    distance_km: params.distanceKm || 0,
    duration_minutes: params.durationMinutes || 0,
    bonus_earned: params.bonusEarned,
  });
};

/**
 * Track: Course supprimée
 */
export const trackRideDeleted = async (params: {
  rideId: string;
  visibility: string;
  reason?: string;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] ride_deleted:', params);
    return;
  }

  await analytics().logEvent('ride_deleted', {
    ride_id: params.rideId,
    visibility: params.visibility,
    reason: params.reason || 'user_action',
  });
};

/**
 * Track: Course personnelle créée
 */
export const trackPersonalRideCreated = async (params: {
  rideId: string;
  source: string;
  priceCents: number;
  hasQuote: boolean;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] personal_ride_created:', params);
    return;
  }

  await analytics().logEvent('personal_ride_created', {
    ride_id: params.rideId,
    source: params.source,
    price_cents: params.priceCents,
    price_eur: params.priceCents / 100,
    has_quote: params.hasQuote,
  });
};

// ============================================================================
// ÉVÉNEMENTS BUSINESS - Devis
// ============================================================================

/**
 * Track: Devis créé
 */
export const trackQuoteCreated = async (params: {
  quoteId: string;
  priceCents: number;
  distanceKm?: number;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] quote_created:', params);
    return;
  }

  await analytics().logEvent('quote_created', {
    quote_id: params.quoteId,
    price_cents: params.priceCents,
    price_eur: params.priceCents / 100,
    distance_km: params.distanceKm || 0,
  });
};

/**
 * Track: Devis envoyé au client
 */
export const trackQuoteSent = async (params: {
  quoteId: string;
  method: 'whatsapp' | 'sms' | 'email';
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] quote_sent:', params);
    return;
  }

  await analytics().logEvent('quote_sent', {
    quote_id: params.quoteId,
    method: params.method,
  });
};

/**
 * Track: Devis accepté par le client
 */
export const trackQuoteAccepted = async (params: {
  quoteId: string;
  priceCents: number;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] quote_accepted:', params);
    return;
  }

  await analytics().logEvent('quote_accepted', {
    quote_id: params.quoteId,
    price_cents: params.priceCents,
    price_eur: params.priceCents / 100,
  });
};

// ============================================================================
// ÉVÉNEMENTS BUSINESS - Crédits & Badges
// ============================================================================

/**
 * Track: Crédit gagné
 */
export const trackCreditEarned = async (params: {
  amount: number;
  reason: 'ride_published' | 'ride_completed' | 'bonus';
  newBalance: number;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] credit_earned:', params);
    return;
  }

  await analytics().logEvent('credit_earned', {
    amount: params.amount,
    reason: params.reason,
    new_balance: params.newBalance,
  });
};

/**
 * Track: Crédit dépensé
 */
export const trackCreditSpent = async (params: {
  amount: number;
  reason: 'ride_claimed';
  newBalance: number;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] credit_spent:', params);
    return;
  }

  await analytics().logEvent('credit_spent', {
    amount: params.amount,
    reason: params.reason,
    new_balance: params.newBalance,
  });
};

/**
 * Track: Badge débloqué
 */
export const trackBadgeEarned = async (params: {
  badgeId: string;
  badgeName: string;
  rarity: string;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] badge_earned:', params);
    return;
  }

  await analytics().logEvent('badge_earned', {
    badge_id: params.badgeId,
    badge_name: params.badgeName,
    rarity: params.rarity,
  });
};

// ============================================================================
// ÉVÉNEMENTS BUSINESS - Groupes
// ============================================================================

/**
 * Track: Groupe créé
 */
export const trackGroupCreated = async (params: {
  groupId: string;
  groupName: string;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] group_created:', params);
    return;
  }

  await analytics().logEvent('group_created', {
    group_id: params.groupId,
    group_name: params.groupName,
  });
};

/**
 * Track: Invitation envoyée
 */
export const trackInvitationSent = async (params: {
  groupId: string;
  method: 'email' | 'phone';
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] invitation_sent:', params);
    return;
  }

  await analytics().logEvent('invitation_sent', {
    group_id: params.groupId,
    method: params.method,
  });
};

/**
 * Track: Invitation acceptée
 */
export const trackInvitationAccepted = async (params: {
  groupId: string;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] invitation_accepted:', params);
    return;
  }

  await analytics().logEvent('invitation_accepted', {
    group_id: params.groupId,
  });
};

// ============================================================================
// ÉVÉNEMENTS UX - Navigation
// ============================================================================

/**
 * Track: Changement d'écran
 * Appelé automatiquement par le système de navigation
 */
export const trackScreenView = async (screenName: string, screenClass?: string) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] screen_view:', screenName);
    return;
  }

  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
};

// ============================================================================
// ÉVÉNEMENTS UX - Actions
// ============================================================================

/**
 * Track: QR Code partagé
 */
export const trackQRCodeShared = async () => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] qr_code_shared');
    return;
  }

  await analytics().logEvent('qr_code_shared', {});
};

/**
 * Track: Filtres utilisés
 */
export const trackFiltersApplied = async (params: {
  vehicleTypes: string[];
  priceRange?: [number, number];
  dateRange?: [string, string];
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] filters_applied:', params);
    return;
  }

  await analytics().logEvent('filters_applied', {
    vehicle_types_count: params.vehicleTypes.length,
    has_price_filter: !!params.priceRange,
    has_date_filter: !!params.dateRange,
  });
};

/**
 * Track: Recherche effectuée
 */
export const trackSearch = async (params: {
  searchTerm: string;
  category: 'rides' | 'groups' | 'users';
  resultsCount: number;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] search:', params);
    return;
  }

  await analytics().logEvent('search', {
    search_term: params.searchTerm,
    category: params.category,
    results_count: params.resultsCount,
  });
};

// ============================================================================
// USER PROPERTIES
// ============================================================================

/**
 * Définir les propriétés utilisateur (appelé au login)
 */
export const setUserProperties = async (params: {
  userId: string;
  isAdmin: boolean;
  verificationStatus: string;
  totalCredits: number;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] setUserProperties:', params);
    return;
  }

  // Set User ID
  await analytics().setUserId(params.userId);

  // Set User Properties
  await analytics().setUserProperty('is_admin', params.isAdmin ? 'true' : 'false');
  await analytics().setUserProperty('verification_status', params.verificationStatus);
  await analytics().setUserProperty('total_credits', params.totalCredits.toString());
};

/**
 * Clear user properties (appelé au logout)
 */
export const clearUserProperties = async () => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] clearUserProperties');
    return;
  }

  await analytics().setUserId(null);
};

// ============================================================================
// ÉVÉNEMENTS SYSTÈME
// ============================================================================

/**
 * Track: App ouverte (pour la première fois)
 * Note: `first_open` est automatique, mais on peut tracker des infos custom
 */
export const trackAppOpened = async () => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] app_opened');
    return;
  }

  await analytics().logEvent('app_opened', {
    timestamp: Date.now(),
  });
};

/**
 * Track: Erreur applicative (non-crash)
 */
export const trackError = async (params: {
  error: string;
  context: string;
  fatal: boolean;
}) => {
  if (!ENABLED) {
    console.log('📊 [Analytics/Dev] app_error:', params);
    return;
  }

  await analytics().logEvent('app_error', {
    error_message: params.error,
    error_context: params.context,
    is_fatal: params.fatal,
  });
};

// ============================================================================
// UTILS
// ============================================================================

/**
 * Enable/Disable Analytics (RGPD compliance)
 */
export const setAnalyticsEnabled = async (enabled: boolean) => {
  await analytics().setAnalyticsCollectionEnabled(enabled);
};

/**
 * Reset Analytics data (useful for testing)
 */
export const resetAnalyticsData = async () => {
  await analytics().resetAnalyticsData();
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Rides
  trackRidePublished,
  trackRideClaimed,
  trackRideCompleted,
  trackRideDeleted,
  trackPersonalRideCreated,
  
  // Devis
  trackQuoteCreated,
  trackQuoteSent,
  trackQuoteAccepted,
  
  // Crédits & Badges
  trackCreditEarned,
  trackCreditSpent,
  trackBadgeEarned,
  
  // Groupes
  trackGroupCreated,
  trackInvitationSent,
  trackInvitationAccepted,
  
  // Navigation
  trackScreenView,
  
  // Actions UX
  trackQRCodeShared,
  trackFiltersApplied,
  trackSearch,
  
  // User
  setUserProperties,
  clearUserProperties,
  
  // Système
  trackAppOpened,
  trackError,
  
  // Utils
  setAnalyticsEnabled,
  resetAnalyticsData,
};

