# 🚀 Edge Functions Supabase - Notifications Push Automatiques

Ce dossier contient tout le nécessaire pour déployer et activer les **notifications push automatiques** via Supabase Edge Functions.

---

## 📂 Structure des fichiers

```
Corail-mobileapp/
├── supabase/
│   └── functions/
│       └── send-push/
│           ├── index.ts          # Code de l'Edge Function
│           └── test.sh           # Script de test
├── database/
│   ├── CREATE_PUSH_TOKENS_TABLE.sql          # Table pour stocker les tokens
│   ├── CREATE_NOTIFICATION_TRIGGERS.sql      # Triggers SQL (commentés)
│   └── ACTIVATE_NOTIFICATION_TRIGGERS.sql    # Triggers SQL activés (avec pg_net)
├── deploy-edge-functions.sh                   # Script de déploiement
├── EDGE_FUNCTION_DEPLOYMENT.md                # Guide de déploiement détaillé
└── EDGE_FUNCTIONS_README.md                   # Ce fichier
```

---

## ⚡ Déploiement rapide (5 minutes)

### Étape 1 : Déployer l'Edge Function

```bash
./deploy-edge-functions.sh YOUR_PROJECT_ID
```

ou manuellement :

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy send-push
```

### Étape 2 : Configurer les secrets

**Via Dashboard Supabase :**
1. Allez dans **Edge Functions** > **send-push** > **Secrets**
2. Ajoutez :
   - `SUPABASE_URL` = `https://YOUR_PROJECT_ID.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (depuis **Project Settings** > **API**)

**Via CLI :**

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Étape 3 : Activer les triggers SQL

1. Ouvrez `database/ACTIVATE_NOTIFICATION_TRIGGERS.sql`
2. Remplacez `YOUR_PROJECT_ID` par votre vrai Project ID (ligne 52)
3. Dans le SQL Editor de Supabase, exécutez :

```sql
-- Configuration de l'Anon Key
ALTER DATABASE postgres 
SET app.settings.supabase_anon_key = 'your-anon-key-here';

-- Puis exécutez tout le contenu de ACTIVATE_NOTIFICATION_TRIGGERS.sql
```

### Étape 4 : Tester

```bash
cd supabase/functions/send-push
./test.sh YOUR_PROJECT_ID YOUR_ANON_KEY YOUR_EXPO_TOKEN
```

---

## 🔧 Comment ça marche ?

### Architecture

```
┌─────────────────┐
│   PostgreSQL    │
│   (Supabase)    │
│                 │
│  Trigger SQL    │ ──────> INSERT/UPDATE sur rides ou group_invitations
│                 │
└────────┬────────┘
         │
         │ pg_net HTTP POST
         │
         ▼
┌─────────────────┐
│  Edge Function  │
│   send-push     │
│                 │
│  1. Get tokens  │ ──────> SELECT * FROM push_tokens
│  2. Call Expo   │ ──────> POST https://exp.host/--/api/v2/push/send
│  3. Clean up    │ ──────> UPDATE push_tokens (désactiver tokens invalides)
│                 │
└─────────────────┘
         │
         │ Expo Push API
         │
         ▼
┌─────────────────┐
│  User Device    │
│                 │
│  📱 iOS         │
│  📱 Android     │
│                 │
└─────────────────┘
```

### Flux de notification

1. **Un événement se produit** (ex: course prise)
2. **Trigger SQL s'active** automatiquement
3. **Fonction appelle l'Edge Function** via `pg_net.http_post()`
4. **Edge Function récupère les tokens** depuis `push_tokens` table
5. **Appel à l'API Expo Push** avec les tokens
6. **Expo livre la notification** aux appareils
7. **Nettoyage automatique** des tokens invalides

---

## 🎯 Notifications automatisées

| Événement | Trigger | Destinataire | Message |
|-----------|---------|--------------|---------|
| Course prise | `UPDATE rides SET status='CLAIMED'` | Créateur | 🎉 Course prise ! |
| Course terminée | `UPDATE rides SET status='COMPLETED'` | Créateur | ✅ Course terminée |
| Invitation groupe | `INSERT INTO group_invitations` | Invité | 👥 Invitation groupe |

---

## 🧪 Tests

### Test 1 : Edge Function seule

```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tokens": ["ExponentPushToken[xxx]"],
    "title": "Test",
    "body": "Test notification"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "sent": 1,
  "failed": 0
}
```

### Test 2 : Via SQL (avec triggers activés)

```sql
-- Simuler une course prise
UPDATE rides 
SET status = 'CLAIMED', picker_id = 'USER_B_ID'
WHERE id = 'RIDE_ID' AND status = 'PUBLISHED';

-- Vérifier les logs
SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 1;
```

### Test 3 : End-to-end

1. Ouvrez l'app mobile sur 2 appareils
2. User A publie une course
3. User B prend la course
4. ✅ User A reçoit une notification instantanée

---

## 📊 Monitoring

### Logs en temps réel

```bash
supabase functions logs send-push --follow
```

### Dashboard Supabase

- **Edge Functions** > **send-push** > **Logs**
- **Database** > **Logs** (pour les triggers)

### Métriques

```sql
-- Tokens actifs par plateforme
SELECT device_type, COUNT(*) as total, 
       COUNT(*) FILTER (WHERE is_active = true) as active
FROM push_tokens
GROUP BY device_type;

-- Requêtes HTTP récentes (pg_net)
SELECT * FROM net._http_response 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🐛 Dépannage

### Problème : "Function not found"

```bash
# Vérifier que la fonction est déployée
supabase functions list

# Redéployer
supabase functions deploy send-push
```

### Problème : "Extension pg_net not found"

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Problème : Notifications ne partent pas

1. Vérifier les logs : `supabase functions logs send-push`
2. Vérifier la config des secrets : Dashboard > Edge Functions > Secrets
3. Vérifier les tokens : `SELECT * FROM push_tokens WHERE is_active = true`
4. Tester manuellement avec curl

### Problème : "Authorization error"

- Vérifiez que l'Anon Key est correctement configurée
- Vérifiez que la requête inclut le header `Authorization: Bearer [key]`

---

## 🔒 Sécurité

### ✅ Bonnes pratiques implémentées

1. **RLS (Row Level Security)** sur `push_tokens`
2. **Validation des tokens** Expo avant envoi
3. **Nettoyage automatique** des tokens invalides
4. **CORS configuré** pour limiter les origines
5. **Secrets sécurisés** via Supabase Secrets ou Vault

### ⚠️ À ne JAMAIS faire

- ❌ Commit les secrets (.env) dans git
- ❌ Partager la `service_role` key publiquement
- ❌ Envoyer trop de notifications (spam)
- ❌ Stocker des données sensibles dans les notifications

---

## 📈 Performance

### Limites Expo Push

- **100 notifications par batch** (géré automatiquement par l'Edge Function)
- **~1000 notifications/seconde** (limite Expo)
- **Retry automatique** en cas d'erreur temporaire

### Optimisations

- Les tokens sont récupérés en **une seule requête SQL**
- Les notifications sont **envoyées en batches** pour maximiser le débit
- Les tokens invalides sont **désactivés automatiquement** pour éviter les erreurs

---

## 🚀 Améliorations futures

### Priorité 1
- [ ] Ajouter des logs de notifications dans une table dédiée
- [ ] Implémenter le rate limiting (max X notifications/heure/user)
- [ ] Ajouter des métriques d'engagement (taux d'ouverture)

### Priorité 2
- [ ] Utiliser `pg_cron` pour les résumés quotidiens automatiques
- [ ] Ajouter A/B testing sur les messages
- [ ] Implémenter des templates de notifications

### Priorité 3
- [ ] Multi-langue (français/anglais)
- [ ] Rich notifications (images, actions)
- [ ] Grouping de notifications

---

## 📚 Ressources

- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation pg_net](https://github.com/supabase/pg_net)
- [Documentation Expo Push](https://docs.expo.dev/push-notifications/sending-notifications/)
- [API Expo Push](https://docs.expo.dev/push-notifications/sending-notifications/#http2-api)

---

## ✅ Checklist de déploiement

- [ ] Supabase CLI installé (`brew install supabase/tap/supabase`)
- [ ] Authentifié (`supabase login`)
- [ ] Projet lié (`supabase link --project-ref XXX`)
- [ ] Edge Function déployée (`supabase functions deploy send-push`)
- [ ] Secrets configurés (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Anon Key configurée (ALTER DATABASE ou Vault)
- [ ] Extension pg_net activée (`CREATE EXTENSION pg_net`)
- [ ] Triggers SQL activés (ACTIVATE_NOTIFICATION_TRIGGERS.sql)
- [ ] Project ID mis à jour dans les SQL
- [ ] Test manuel réussi (curl)
- [ ] Test end-to-end réussi (app mobile)

---

## 🆘 Support

**Problème rencontré ?**

1. Consultez les logs : `supabase functions logs send-push`
2. Vérifiez la checklist ci-dessus
3. Consultez `EDGE_FUNCTION_DEPLOYMENT.md` pour le guide détaillé
4. Ouvrez une issue dans le repo

---

**🎉 Une fois configuré, votre système de notifications sera 100% automatique et scalable !**

Les utilisateurs recevront des notifications push en temps réel, même si l'application est complètement fermée, sans aucune intervention manuelle de votre part.

