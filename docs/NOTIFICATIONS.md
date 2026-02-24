# Notifications in-app (cloche)

## Comportement

- **Table** : `in_app_notifications` — chaque notification reçue (course réclamée, terminée, notation, profil soumis, profil vérifié, etc.) est enregistrée avec un `user_id`, `type`, `title`, `body`, et optionnellement `target_ride_id` / `target_screen`.
- **Statut consulté** : champ `read_at` (NULL = non consultée, timestamp = consultée).
- **Cloche** :
  - Pastille rouge avec le nombre de **non lues** (`read_at IS NULL`).
  - Au tap → écran liste des notifications.
- **Liste** :
  - Non consultée → mise en valeur (bordure bleutée, fond plus visible).
  - Consultée → grisée (`notifRowRead`).
  - Au tap sur une ligne → marquer comme lu (`read_at` mis à jour) puis navigation vers le détail (course ou écran cible).

## Enregistrer une notification

Pour qu'une notification apparaisse dans la cloche, elle **doit** être insérée dans `in_app_notifications` (par trigger ou par code). Les triggers couvrent :

- **rides** (055, 059) : course réclamée → créateur ; course terminée → créateur ; notation reçue → créateur ; course annulée → chauffeur (picker).
- **rides** (060) : nouvelle course en visibilité groupe → tous les membres du groupe sauf le créateur (`ride_in_group`, tap → Annonces filtrées par Groupes).
- **vtc_profiles** (056, 057, 059) : soumission documents → tous les admins ; statut `approved` → utilisateur (`verification_approved`) ; statut `rejected` → utilisateur (`verification_rejected`).
- **group_invitations** (059) : nouvelle invitation avec `invitee_id` renseigné → invité (`group_invitation`, ouvre l’écran des invitations).
- **quotes** (060) : devis accepté ou refusé → chauffeur (`quote_accepted` / `quote_refused`, tap → page de la course concernée, ride ou personal_ride).
- **driver_ride_requests** (061) : réservation directe depuis le site (demande adressée au chauffeur) → chauffeur (`ride_from_site`, tap → écran Demandes).

**Rappel quotidien 9h** (local, préférence « Résumé quotidien ») : à 9h, notification « Vous avez X courses prévues aujourd'hui. » Envoyée **uniquement** si l'utilisateur a au moins une course (personnelle) prévue ce jour-là. Planifié au chargement du tableau de bord (prochaine occurrence de 9h avec le nombre de courses ce jour-là).

Si tu envoies une push ou une notification locale côté app, pense à **aussi** créer la ligne en base (ou à avoir un trigger/backend qui le fasse) pour qu'elle soit visible dans la cloche et dans la liste (non lue puis grisée après consultation).

## RLS et RPC (migration 058)

La RLS accepte que `user_id` soit soit `auth.uid()::text`, soit l'`id` de la table `users` (legacy). Les RPC `list_my_in_app_notifications`, `get_my_unread_notifications_count` et `mark_all_my_notifications_read` utilisent cette logique pour que toutes « tes » notifications s'affichent et soient marquables comme lues, quel que soit l'identifiant stocké.

## Dépannage : rien dans la cloche

1. **Vérifier les lignes en base** (Supabase → SQL Editor) :
   ```sql
   SELECT id, user_id, type, title, read_at, created_at
   FROM in_app_notifications
   ORDER BY created_at DESC
   LIMIT 20;
   ```
   Vérifie que des lignes existent et note les valeurs de `user_id`.

2. **Vérifier ton identifiant côté app** : dans la console Metro (mode dev), au chargement tu devrais voir `[notifications] getUnreadNotificationsCount: X (raw: ...)`. Si tu vois une erreur RPC, le fallback (requête directe avec `currentUserId`) est utilisé. Ton `user_id` en base doit être soit ton UUID Supabase (Dashboard → Authentication → Users), soit ton `users.id` (table `users`).

3. **Cohérence** : les triggers (rides, vtc_profiles) insèrent `creator_id` ou `user_id` des tables métier. L’app utilise `supabaseUser.id` (UUID Supabase) partout. Si tes notifications ont été créées avec un autre id (ex. ancien `users.id`), la RPC 058 les inclut tant que la table `users` a une ligne avec `supabase_auth_id = auth.uid()` ou `id = auth.uid()::text`.

4. **Rafraîchir** : le compteur est rechargé au démarrage, à l’ouverture/fermeture de l’écran Notifications, et quand l’app repasse au premier plan.
