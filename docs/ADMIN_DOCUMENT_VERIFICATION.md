# Panel Admin – Vérification documents (URLs signées)

## Problème

Les documents de vérification chauffeur (carte pro, pièce d’identité, assurance) sont dans le bucket Storage **privé** `driver-verification`. L’admin doit pouvoir les consulter sans dépendre des RLS Storage (souvent bloquantes).

## Solution : Edge Function avec service role

Une **Edge Function** `admin-create-signed-url` génère les URLs signées côté serveur avec la **clé service role**, ce qui contourne les RLS.

### Déploiement

1. **Déployer la fonction**
   ```bash
   supabase functions deploy admin-create-signed-url
   ```

2. **Configurer le secret** (si pas déjà fait pour une autre fonction)
   - Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Ajouter : **Name** `SERVICE_ROLE_KEY`, **Value** = ta clé service role (Project Settings → API → `service_role` secret)

### Comportement

- L’app envoie en POST le **path** du fichier et le **JWT utilisateur** (header `x-user-token`).
- La fonction vérifie que l’utilisateur est admin (`users.is_admin = true`), puis appelle Storage avec la clé service role pour `createSignedUrl(path)`.
- Elle renvoie `{ url: "https://..." }`. L’app affiche l’aperçu et « Ouvrir le document » ouvre cette URL.

### Données déjà en base

- Si la colonne contient déjà une **URL** (commence par `http`), l’app l’utilise telle quelle (ex. après un upload récent qui stocke l’URL signée).
- Si la colonne contient encore un **path** (ancien format), l’app appelle cette Edge Function pour obtenir l’URL signée.
