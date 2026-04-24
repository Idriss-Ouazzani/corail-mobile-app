/**
 * Comparaison d’identité Corail : `public.users.id` peut différer de `auth.uid()`
 * (ex. ancien id Firebase + supabase_auth_id). Les rides peuvent référencer l’un ou l’autre.
 */
export function isSameCorailUser(
  remoteId: string | null | undefined,
  authUserId: string | null | undefined,
  usersTableId?: string | null
): boolean {
  if (remoteId == null || remoteId === '' || authUserId == null || authUserId === '') return false;
  const r = String(remoteId).trim();
  const a = String(authUserId).trim();
  if (r === a) return true;
  const t = usersTableId != null && String(usersTableId).trim() !== '' ? String(usersTableId).trim() : '';
  if (t && r === t) return true;
  return false;
}
