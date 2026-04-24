# V2 — P0 : scénarios de test

Chaque P0 est traité **un par un** en code ; ce document sert de **checklist manuelle** (2 comptes / 2 téléphones idéal pour les notifs).

---

## P0-1 — Notifications (invitation groupe, cloche, push)

### Prérequis

- Appliquer la migration **`079_notify_group_invitation_user_id_prefer_auth.sql`** sur Supabase (`supabase db push` ou SQL Editor).
- **U1** = admin d’un groupe G, **U2** = autre chauffeur inscrit (email ou tel connu dans `users`).

### Scénario A — Seul l’invité reçoit la notif in-app

1. U1 ouvre le groupe G → invite U2 (email **ou** téléphone d’un compte existant).
2. **U2** ouvre la cloche : une ligne « Invitation à un groupe » avec le bon texte.
3. **U1** ouvre la cloche : **aucune** nouvelle ligne du type « X vous invite… » pour cette action.

**Attendu** : une seule ligne côté invité ; rien côté inviteur (sauf autres notifs non liées).

### Scénario B — Pastille cloche cohérente avec la liste

1. Avec U2, noter le nombre sur la cloche avant le test.
2. U1 envoie une invitation (ou une autre notif déjà couverte par les triggers).
3. U2 : la pastille augmente ; la liste affiche au moins une ligne non lue correspondante.
4. U2 ouvre la liste, tape une ligne → la ligne passe en « lu » / grisée et la pastille **diminue** (éventuel léger délai après retour).

**Attendu** : pas de pastille > 0 avec liste vide pour le même compte (hors pagination : utiliser « tirer pour rafraîchir » si besoin).

### Scénario C — Push invitation (U2 en arrière-plan)

1. U2 met l’app en arrière-plan (ou tuile fermée selon OS).
2. U1 invite U2.
3. **U2** reçoit une **push** ; **U1** ne reçoit pas la même push d’invitation.

**Attendu** : push adressée à l’appareil enregistré pour U2 (`push_tokens` résolu via `users.id` **ou** `auth.uid()`).

### Scénario D — Auto-invitation / même compte

1. U1 tente d’inviter **son propre** email ou téléphone (si l’UI le permet).

**Attendu** : pas de ligne in-app « invitation » pour cette auto-cas (trigger 079 court-circuite si invité = inviteur au sens canonique).

---

## P0-2 — Onboarding par compte

### Scénario

1. Compte **A** : terminer l’onboarding (dernier écran → Accueil).
2. Se déconnecter, connecter le compte **B** sur le **même téléphone**.
3. **Attendu** : l’onboarding se **réaffiche** pour B (première connexion de B sur l’appareil).
4. Terminer pour B, reconnecter A : **Attendu** : A ne revoit pas l’onboarding (déjà vu pour A).

Clé AsyncStorage : `@corail_onboarding_seen_<user.id>`.

---

## P0-3 — Réservations site (`driver_ride_requests`)

*À couvrir quand le lot sera implémenté.*

- Refus côté chauffeur → état à jour sans fantôme ; message clair si la course a déjà été prise ailleurs.
- Modal / compte à rebours cohérent après action depuis la liste ou la push.

---

## P0-4 — Courses perso vs onglet Courses

*À couvrir quand le lot sera implémenté.*

- Course perso visible depuis l’accueil / le planning : même donnée accessible depuis l’onglet Courses / Mes courses avec le même statut.

---

## P0-5 — Vérification profil après validation admin

*À couvrir quand le lot sera implémenté.*

- Après notif « profil validé » : statut marketplace / bannière à jour sans tuer l’app ; tap sur la notif ouvre le bon écran (Page Pro / vérif).

---

## Compte, profil `users`, RLS (migrations **080** + logique app)

**Prérequis** : migration **`080_users_rls_insert_own_profile.sql`** appliquée sur le projet Supabase utilisé par l’app.

### S1 — Nouvel utilisateur (email + mot de passe)

1. Créer un compte **jamais utilisé** (nouvel email).
2. Confirmer l’email si la confirmation est activée sur le projet, puis se connecter.
3. **Attendu** : pas d’erreur *« Erreur chargement statut vérification »* ; l’app arrive sur le flux normal (consentement si besoin → onboarding → accueil).
4. Dans Supabase → **Table Editor** → `users` : une ligne existe avec `email` correct, `id` = UUID auth (souvent égal à `auth.uid()`), `verification_status` cohérent.

### S2 — Crédits au premier chargement (plus de `PGRST116`)

1. Juste après S1 (ou compte test avec profil existant).
2. Ouvrir l’accueil / écran où les crédits s’affichent.
3. **Attendu** : pas d’erreur console du type *getCredits … PGRST116* ; solde affiché (éventuellement **0** si aucune ligne encore — acceptable ; après synchro, valeur réelle).

### S3 — Race trigger vs app (connexion immédiate après signup)

1. S’inscrire ; si l’app se connecte **tout de suite** (session sans attendre).
2. Observer 5–10 s max : l’écran ne doit pas rester bloqué sur une erreur profil.
3. **Attendu** : le statut de vérif se charge ; pas de *« Profil introuvable après création »* de façon systématique.

### S4 — Compte existant par email (même logique relecture)

1. Se connecter avec un compte **déjà** présent en base (staging / prod).
2. **Attendu** : chargement statut vérif OK ; crédits OK.

### S5 — Vérification SQL si échec persiste

1. SQL : `select id, email, supabase_auth_id from public.users where email = '<email du test>';`
2. Comparer avec `auth.uid()` (Authentication → Users) pour le même compte.
3. **Attendu** : soit `id` = `auth.uid()`, soit `supabase_auth_id` = `auth.uid()` ; sinon corriger les données ou les policies SELECT sur `users`.

---

## Push : enregistrement token (`push_tokens` + résolution `users.id`)

**Prérequis** : appli **build dev ou release** sur **appareil physique** (pas simulateur sans push).

### P1 — Nouveau compte après correctif FK

1. Se connecter avec un compte dont la ligne `users` existe (S1 ok).
2. Accepter les notifications si demandé.
3. **Attendu** : logs sans *« insert or update on table push_tokens violates foreign key »*.
4. Supabase → `push_tokens` : une ligne `is_active = true`, `user_id` = **`public.users.id`** (clé métier), pas un ID fantôme.

### P2 — Compte où `users.id` ≠ `auth.uid()` (si vous en avez un en staging)

1. Même scénario que P1.
2. **Attendu** : token enregistré ; push testables (invitation, course) pour ce compte.

---

## Push course : tap + retour au premier plan (app)

### T1 — Tap sur push `new_ride` / `ride_in_group`

1. Créer une course qui envoie une push à U2 ; U2 tape la notification.
2. **Attendu** : ouverture **Annonces** + filtre adapté + **fiche course** (modale détail), pas seulement la liste sans détail.

### T2 — App en arrière-plan puis retour

1. U2 : mettre l’app en arrière-plan ; côté serveur ou autre app, faire une action qui ajoute une course / notif.
2. Revenir sur l’app (sans tuer le process).
3. **Attendu** : pastille cloche et/ou liste annonces **à jour** après quelques secondes (refresh au `active`).

---

## Déploiement migrations (ordre)

Migrations utiles pour ces tests (selon ce que vous avez déjà appliqué) :

- **078** — Realtime `in_app_notifications` (pastille live).
- **079** — Invitation groupe, `user_id` in-app aligné auth.
- **080** — INSERT profil `users` par le compte lui-même (bootstrap + secours app).

```bash
cd /chemin/vers/Corail-mobileapp
supabase db push
```

Ou exécuter chaque fichier SQL dans le dashboard Supabase dans l’ordre des numéros.
