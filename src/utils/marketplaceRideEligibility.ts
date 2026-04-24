import { isSameCorailUser } from './isSameCorailUser';

/**
 * Règles alignées sur MarketplaceTab pour les annonces des **autres** (hors « mes courses ») :
 * - PUBLISHED, visibilité groupe + group_id
 * - pas le créateur courant (auth ou ligne users)
 * - si scheduled_at est défini et dans le passé → exclu (comme la liste Annonces)
 *
 * Les « mes courses » passent toujours dans la liste avant ce filtre ; le bandeau accueil ne compte que les autres.
 */
export function isOthersGroupPublishedFuture(
  ride: {
    status?: string;
    visibility?: string;
    group_id?: string | null;
    creator_id?: string | null;
    scheduled_at?: string | null;
  },
  authUserId: string | null,
  publicUsersRowId: string | null
): boolean {
  const status = (ride.status || '').toUpperCase();
  if (status !== 'PUBLISHED') return false;
  const vis = String(ride.visibility || '').toUpperCase();
  if (vis !== 'GROUP' || !ride.group_id) return false;
  if (!authUserId) return false;
  if (isSameCorailUser(ride.creator_id, authUserId, publicUsersRowId)) return false;
  const scheduledTime = ride.scheduled_at ? new Date(ride.scheduled_at).getTime() : NaN;
  if (!Number.isNaN(scheduledTime) && scheduledTime < Date.now()) return false;
  return true;
}
