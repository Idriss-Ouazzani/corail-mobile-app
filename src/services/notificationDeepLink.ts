/**
 * Routage unique au tap sur une notification push / locale (data payload).
 * Utilisé par App.tsx pour éviter plusieurs listeners et écrans incorrects (ex. toujours marketplace).
 */

export type NotificationNavHandlers = {
  setCurrentScreen: (s: 'dashboard' | 'courses' | 'tools' | 'profile') => void;
  setCoursesTab: (t: 'marketplace' | 'myrides') => void;
  setActiveFilter: (f: 'all' | 'public' | 'groups') => void;
  /** Tap push course : Annonces + ouverture fiche (rideId dans data) */
  openRideFromPush?: (rideId: string, filter: 'all' | 'public' | 'groups') => Promise<void>;
  setShowMyQuotes: (v: boolean) => void;
  setShowGroupInvitations: (v: boolean) => void;
  setShowGroups?: (v: boolean) => void;
  setShowDriverRequests: (v: boolean) => void;
  setShowVTCProfile: (v: boolean) => void;
  setShowVerificationProfile: (v: boolean) => void;
  setShowAdminPanel: (v: boolean) => void;
  setShowPlanning: (v: boolean) => void;
  loadUnreadNotificationsCount: () => void | Promise<void>;
  loadVerificationStatus?: () => Promise<void>;
  /** Ferme les modales courantes et mémorise l’état pour le restaurer au retour depuis l’écran ouvert par la push. */
  prepareForNotificationNavigation?: () => void;
};

const NOTIFICATION_NAV_TYPES = new Set([
  'new_ride',
  'client_devis',
  'ride_in_group',
  'quote_accepted',
  'quote_refused',
  'group_invitation',
  'group_member_joined',
  'ride_from_site',
  'driver_ride_request',
  'verification_approved',
  'verification_rejected',
  'driver_verification_submitted',
  'daily_summary',
  'ride_imminent',
]);

export function routeNotificationTapData(
  data: Record<string, unknown> | null | undefined,
  nav: NotificationNavHandlers
): boolean {
  if (!data || typeof data !== 'object') return false;
  const type = typeof data.type === 'string' ? data.type : '';

  const run = async () => {
    if (!type || !NOTIFICATION_NAV_TYPES.has(type)) return;
    nav.prepareForNotificationNavigation?.();
    switch (type) {
      case 'new_ride':
      case 'client_devis':
      case 'ride_in_group': {
        const raw = data.rideId;
        const rideId =
          typeof raw === 'string'
            ? raw
            : typeof raw === 'number' && Number.isFinite(raw)
              ? String(raw)
              : '';
        const filter: 'all' | 'public' | 'groups' = type === 'ride_in_group' ? 'groups' : 'all';
        if (rideId && nav.openRideFromPush) {
          await nav.openRideFromPush(rideId, filter);
        } else {
          nav.setCurrentScreen('courses');
          nav.setCoursesTab('marketplace');
          if (filter === 'groups') nav.setActiveFilter('groups');
          await Promise.resolve(nav.loadUnreadNotificationsCount());
        }
        return;
      }
      case 'quote_accepted':
      case 'quote_refused':
        nav.setShowMyQuotes(true);
        await Promise.resolve(nav.loadUnreadNotificationsCount());
        return;
      case 'group_invitation':
        nav.setShowGroupInvitations(true);
        await Promise.resolve(nav.loadUnreadNotificationsCount());
        return;
      case 'group_member_joined':
        nav.setShowGroups?.(true);
        await Promise.resolve(nav.loadUnreadNotificationsCount());
        return;
      case 'ride_from_site':
      case 'driver_ride_request':
        nav.setShowDriverRequests(true);
        await Promise.resolve(nav.loadUnreadNotificationsCount());
        return;
      case 'verification_approved':
        await nav.loadVerificationStatus?.();
        nav.setShowVTCProfile(true);
        await Promise.resolve(nav.loadUnreadNotificationsCount());
        return;
      case 'verification_rejected':
        nav.setShowVerificationProfile(true);
        await Promise.resolve(nav.loadUnreadNotificationsCount());
        return;
      case 'driver_verification_submitted':
        nav.setShowAdminPanel(true);
        await Promise.resolve(nav.loadUnreadNotificationsCount());
        return;
      case 'daily_summary':
      case 'ride_imminent':
        nav.setShowPlanning(true);
        await Promise.resolve(nav.loadUnreadNotificationsCount());
        return;
      default:
        return;
    }
  };

  void run();
  return type !== '';
}
