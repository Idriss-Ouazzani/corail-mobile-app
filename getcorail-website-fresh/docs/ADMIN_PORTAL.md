# Portail Admin getcorail.com/admin

Dashboard analytique protégé par mot de passe pour suivre l’usage de l’app Corail.

## Configuration

Dans `.env.local` (ou variables d’environnement du déploiement) :

```env
ADMIN_PASSWORD=ton_mot_de_passe_secret
```

- **Sans `ADMIN_PASSWORD`** : la page de login renverra une erreur « Admin non configuré ».
- Utilise un mot de passe fort et ne le commite pas.
- **`SUPABASE_SERVICE_ROLE_KEY`** (ainsi que `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`) : obligatoire côté serveur pour lire le bucket `driver-verification` (prévisualisation des justificatifs, même flux que côté base). Aucun compte Supabase Auth n’est requis pour le portail : la session = cookie `admin` + clé service sur le serveur.

## Accès

- **URL** : `https://getcorail.com/admin` (ou `http://localhost:3000/admin` en dev)
- **Login** : ouvrir `/admin` → redirection vers `/admin/login` si non connecté → saisir le mot de passe → accès au dashboard.

## Contenu

1. **Dashboard** (`/admin`)
   - Chauffeurs total
   - Chauffeurs vérifiés
   - Actifs 7j (utilisateurs ayant créé ou pris une course dans les 7 derniers jours)
   - Annonces publiées 7j
   - Annonces prises 7j
   - Demandes site 7j (demandes depuis getcorail.com vers les chauffeurs)

2. **Chauffeurs** (`/admin/chauffeurs`)
   - Tableau avec email, nom, slug, statut vérification, ville, date de création
   - Recherche en temps réel (email, nom, slug, ville)
   - Bouton **Export CSV** pour télécharger la liste (filtrée si recherche active)

3. **Demandes en cours** (`/admin/demandes-certif`)
   - **Vérification de profil** (documents) : file des `vtc_profiles` en `driver_verification_status = pending` (même principe que l’app admin). Approbation document par document ou rejet global du dossier.
   - **Changements tél. / n° VTC / SIRET** : demandes de changement (chauffeur·e·s **déjà vérifié·e·s** côté documents) avec justificatif ; la base `users` / `vtc_profiles` est mise à jour au moment de l’approbation.
   - La migration `082_profile_credential_change_requests.sql` doit être appliquée sur le projet Supabase.

## Sécurité

- Session stockée dans un cookie `admin_session` (httpOnly, 7 jours).
- Le cookie est un hash du mot de passe (HMAC), pas le mot de passe en clair.
- Toutes les données sont lues via Supabase avec la clé **service role** (côté serveur uniquement).
