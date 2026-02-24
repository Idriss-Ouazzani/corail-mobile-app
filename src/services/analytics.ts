/**
 * Analytics Service (no-op)
 * Firebase a été retiré du projet. Les événements sont loggés en dev uniquement.
 * Tu peux brancher plus tard Sentry, Supabase Analytics ou un autre fournisseur.
 */

const ENABLED = false; // Pas de backend analytics pour l'instant

const noop = async () => {};

// ============================================================================
// ÉVÉNEMENTS BUSINESS - Rides
// ============================================================================

export const trackRidePublished = async (params: {
  rideId: string;
  visibility: 'PUBLIC' | 'GROUP' | 'PERSONAL';
  vehicleType: string;
  priceCents: number;
  distanceKm?: number;
  creditsEarned: number;
}) => {
  if (__DEV__) console.log('📊 [Analytics] ride_published:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackRideClaimed = async (params: {
  rideId: string;
  visibility: string;
  priceCents: number;
  creditsSpent: number;
  timeToClaimSeconds?: number;
}) => {
  if (__DEV__) console.log('📊 [Analytics] ride_claimed:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackRideCompleted = async (params: {
  rideId: string;
  priceCents: number;
  distanceKm?: number;
  durationMinutes?: number;
  bonusEarned: number;
}) => {
  if (__DEV__) console.log('📊 [Analytics] ride_completed:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackRideDeleted = async (params: {
  rideId: string;
  visibility: string;
  reason?: string;
}) => {
  if (__DEV__) console.log('📊 [Analytics] ride_deleted:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackPersonalRideCreated = async (params: {
  rideId: string;
  source: string;
  priceCents: number;
  hasQuote: boolean;
}) => {
  if (__DEV__) console.log('📊 [Analytics] personal_ride_created:', params);
  if (!ENABLED) return;
  await noop();
};

// ============================================================================
// ÉVÉNEMENTS BUSINESS - Devis
// ============================================================================

export const trackQuoteCreated = async (params: {
  quoteId: string;
  priceCents: number;
  distanceKm?: number;
}) => {
  if (__DEV__) console.log('📊 [Analytics] quote_created:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackQuoteSent = async (params: {
  quoteId: string;
  method: 'whatsapp' | 'sms' | 'email';
}) => {
  if (__DEV__) console.log('📊 [Analytics] quote_sent:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackQuoteAccepted = async (params: {
  quoteId: string;
  priceCents: number;
}) => {
  if (__DEV__) console.log('📊 [Analytics] quote_accepted:', params);
  if (!ENABLED) return;
  await noop();
};

// ============================================================================
// ÉVÉNEMENTS BUSINESS - Crédits & Badges
// ============================================================================

export const trackCreditEarned = async (params: {
  amount: number;
  reason: 'ride_published' | 'ride_completed' | 'bonus';
  newBalance: number;
}) => {
  if (__DEV__) console.log('📊 [Analytics] credit_earned:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackCreditSpent = async (params: {
  amount: number;
  reason: 'ride_claimed';
  newBalance: number;
}) => {
  if (__DEV__) console.log('📊 [Analytics] credit_spent:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackBadgeEarned = async (params: {
  badgeId: string;
  badgeName: string;
  rarity: string;
}) => {
  if (__DEV__) console.log('📊 [Analytics] badge_earned:', params);
  if (!ENABLED) return;
  await noop();
};

// ============================================================================
// ÉVÉNEMENTS BUSINESS - Groupes
// ============================================================================

export const trackGroupCreated = async (params: {
  groupId: string;
  groupName: string;
}) => {
  if (__DEV__) console.log('📊 [Analytics] group_created:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackInvitationSent = async (params: {
  groupId: string;
  method: 'email' | 'phone';
}) => {
  if (__DEV__) console.log('📊 [Analytics] invitation_sent:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackInvitationAccepted = async (params: { groupId: string }) => {
  if (__DEV__) console.log('📊 [Analytics] invitation_accepted:', params);
  if (!ENABLED) return;
  await noop();
};

// ============================================================================
// ÉVÉNEMENTS UX - Navigation
// ============================================================================

export const trackScreenView = async (screenName: string, screenClass?: string) => {
  if (__DEV__) console.log('📊 [Analytics] screen_view:', screenName);
  if (!ENABLED) return;
  await noop();
};

// ============================================================================
// ÉVÉNEMENTS UX - Actions
// ============================================================================

export const trackQRCodeShared = async () => {
  if (__DEV__) console.log('📊 [Analytics] qr_code_shared');
  if (!ENABLED) return;
  await noop();
};

// ============================================================================
// ÉVÉNEMENTS - Ma Page Pro (hub + wizard)
// ============================================================================

export const trackPageProOpened = async () => {
  if (__DEV__) console.log('📊 [Analytics] page_pro_opened');
  if (!ENABLED) return;
  await noop();
};

export const trackPageProStepCompleted = async (params: { step: number; stepName: string }) => {
  if (__DEV__) console.log('📊 [Analytics] page_pro_step_completed:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackPageProActivated = async () => {
  if (__DEV__) console.log('📊 [Analytics] page_pro_activated');
  if (!ENABLED) return;
  await noop();
};

export const trackPageProShared = async () => {
  if (__DEV__) console.log('📊 [Analytics] page_pro_shared');
  if (!ENABLED) return;
  await noop();
};

export const trackFiltersApplied = async (params: {
  vehicleTypes: string[];
  priceRange?: [number, number];
  dateRange?: [string, string];
}) => {
  if (__DEV__) console.log('📊 [Analytics] filters_applied:', params);
  if (!ENABLED) return;
  await noop();
};

export const trackSearch = async (params: {
  searchTerm: string;
  category: 'rides' | 'groups' | 'users';
  resultsCount: number;
}) => {
  if (__DEV__) console.log('📊 [Analytics] search:', params);
  if (!ENABLED) return;
  await noop();
};

// ============================================================================
// USER PROPERTIES
// ============================================================================

export const setUserProperties = async (params: {
  userId: string;
  isAdmin: boolean;
  verificationStatus: string;
  totalCredits: number;
}) => {
  if (__DEV__) console.log('📊 [Analytics] setUserProperties:', params);
  if (!ENABLED) return;
  await noop();
};

export const clearUserProperties = async () => {
  if (__DEV__) console.log('📊 [Analytics] clearUserProperties');
  await noop();
};

// ============================================================================
// ÉVÉNEMENTS SYSTÈME
// ============================================================================

export const trackAppOpened = async () => {
  if (__DEV__) console.log('📊 [Analytics] app_opened');
  if (!ENABLED) return;
  await noop();
};

export const trackError = async (params: {
  error: string;
  context: string;
  fatal: boolean;
}) => {
  if (__DEV__) console.log('📊 [Analytics] app_error:', params);
  if (!ENABLED) return;
  await noop();
};

// ============================================================================
// UTILS
// ============================================================================

export const setAnalyticsEnabled = async (_enabled: boolean) => {
  await noop();
};

export const resetAnalyticsData = async () => {
  await noop();
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  trackRidePublished,
  trackRideClaimed,
  trackRideCompleted,
  trackRideDeleted,
  trackPersonalRideCreated,
  trackQuoteCreated,
  trackQuoteSent,
  trackQuoteAccepted,
  trackCreditEarned,
  trackCreditSpent,
  trackBadgeEarned,
  trackGroupCreated,
  trackInvitationSent,
  trackInvitationAccepted,
  trackScreenView,
  trackQRCodeShared,
  trackFiltersApplied,
  trackSearch,
  setUserProperties,
  clearUserProperties,
  trackAppOpened,
  trackError,
  setAnalyticsEnabled,
  resetAnalyticsData,
};
