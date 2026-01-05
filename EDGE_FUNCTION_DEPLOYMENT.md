# 🚀 Guide de Déploiement - Edge Function send-push

Ce guide vous explique comment déployer et activer l'Edge Function Supabase pour automatiser l'envoi de notifications push.

---

## 📋 Prérequis

- ✅ Supabase CLI installé (déjà fait)
- ✅ Compte Supabase avec un projet actif
- ✅ Table `push_tokens` créée dans votre base de données
- ✅ Application mobile avec tokens push enregistrés

---

## 🔐 Étape 1 : Se connecter à Supabase

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
supabase login
```

Cela ouvrira votre navigateur pour vous authentifier.

---

## 🔗 Étape 2 : Lier votre projet Supabase

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

**Comment trouver votre Project ID ?**
1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet **Corail**
3. Allez dans **Project Settings** > **General**
4. Copiez le **Reference ID** (environ 20 caractères)

Exemple : `abcdefghijklmnop`

---

## 🚀 Étape 3 : Déployer l'Edge Function

```bash
supabase functions deploy send-push
```

Cette commande va :
- Compiler votre fonction TypeScript
- La déployer sur Supabase
- Générer une URL accessible : `https://[PROJECT_ID].supabase.co/functions/v1/send-push`

**Sortie attendue :**
```
Deploying send-push...
  Version: xxx
  Deployed: https://[PROJECT_ID].supabase.co/functions/v1/send-push
```

---

## 🔑 Étape 4 : Configurer les secrets

Les Edge Functions ont besoin de variables d'environnement pour fonctionner.

### Option A : Via le Dashboard Supabase (Recommandé)

1. Allez dans **Edge Functions** dans le menu
2. Cliquez sur votre fonction **send-push**
3. Onglet **Secrets**
4. Ajoutez :
   - `SUPABASE_URL` = `https://[PROJECT_ID].supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (copiez depuis **Project Settings** > **API** > **service_role key**)

⚠️ **Attention** : La `service_role` key est très sensible ! Ne la partagez jamais.

### Option B : Via CLI

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🧪 Étape 5 : Tester l'Edge Function

### Test 1 : Appel direct via curl

```bash
curl -X POST \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tokens": ["ExponentPushToken[YOUR_EXPO_TOKEN]"],
    "title": "Test",
    "body": "Ceci est un test de notification push"
  }'
```

**Sortie attendue :**
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "tickets": [
    { "status": "ok", "id": "xxx" }
  ]
}
```

### Test 2 : Appel depuis Supabase SQL Editor

```sql
-- Récupérer un token test
SELECT push_token FROM push_tokens WHERE is_active = true LIMIT 1;

-- Puis dans votre code client :
const { data, error } = await supabase.functions.invoke('send-push', {
  body: {
    tokens: ['ExponentPushToken[...]'],
    title: 'Test',
    body: 'Notification test depuis Supabase'
  }
});
```

---

## 🔗 Étape 6 : Activer les triggers SQL

Maintenant que l'Edge Function est déployée, activez les triggers automatiques.

### 1. Mettre à jour l'URL dans le SQL

Éditez le fichier `database/ACTIVATE_NOTIFICATION_TRIGGERS.sql` :

```sql
-- Ligne 52 : Remplacer YOUR_PROJECT_ID
v_supabase_url := 'https://YOUR_REAL_PROJECT_ID.supabase.co/functions/v1/send-push';
```

### 2. Configurer l'Anon Key

**Option A : Via ALTER DATABASE (Simple)**

Dans le SQL Editor de Supabase :

```sql
ALTER DATABASE postgres 
SET app.settings.supabase_anon_key = 'your-anon-key-here';
```

Votre `anon key` se trouve dans **Project Settings** > **API**.

**Option B : Via Vault (Production recommandée)**

```sql
-- Activer l'extension Vault
CREATE EXTENSION IF NOT EXISTS vault;

-- Stocker la clé de manière sécurisée
INSERT INTO vault.secrets (name, secret)
VALUES ('supabase_anon_key', 'your-anon-key-here');

-- Puis dans la fonction call_send_push_function, remplacer :
-- v_supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);
-- PAR :
-- v_supabase_anon_key := vault.decrypt_secret('supabase_anon_key');
```

### 3. Exécuter le script d'activation

Dans le SQL Editor de Supabase, exécutez :

```sql
-- Copier-coller tout le contenu de ACTIVATE_NOTIFICATION_TRIGGERS.sql
```

### 4. Vérifier que les triggers sont actifs

```sql
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname IN (
  'trigger_notify_ride_claimed',
  'trigger_notify_ride_completed',
  'trigger_notify_group_invitation'
);
```

**Sortie attendue :**
| trigger_name | table_name | enabled |
|--------------|------------|---------|
| trigger_notify_ride_claimed | rides | O |
| trigger_notify_ride_completed | rides | O |
| trigger_notify_group_invitation | group_invitations | O |

---

## ✅ Étape 7 : Test complet end-to-end

### Scénario 1 : Course prise

1. User A publie une course sur le marketplace
2. User B prend la course
3. ✅ User A reçoit automatiquement une notification "🎉 Course prise !"

**Vérification :**
- Ouvrez les logs de l'Edge Function : Dashboard > Edge Functions > send-push > Logs
- Vous devriez voir : `📱 Sending push to 1 device(s)`

### Scénario 2 : Invitation à un groupe

1. Admin invite quelqu'un à un groupe
2. ✅ L'invité reçoit automatiquement une notification "👥 Invitation groupe"

### Scénario 3 : Course terminée

1. VTC termine une course
2. ✅ Le créateur reçoit automatiquement "✅ Course terminée"

---

## 🐛 Dépannage

### Problème : "Error: function not found"

**Solution :** Vérifiez que la fonction est bien déployée :
```bash
supabase functions list
```

### Problème : "Authorization error"

**Solution :** Vérifiez que vous utilisez la bonne clé API (anon ou service_role).

### Problème : "No valid tokens"

**Solution :** 
1. Vérifiez que la table `push_tokens` contient des tokens actifs
2. Vérifiez le format des tokens : `ExponentPushToken[xxx]`

### Problème : Notifications ne partent pas

**Solution :**
1. Vérifiez les logs : Dashboard > Edge Functions > send-push > Logs
2. Vérifiez que `pg_net` est activé : `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
3. Vérifiez la configuration des secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

### Problème : "pg_net extension not found"

**Solution :** Activez l'extension dans SQL Editor :
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 📊 Monitoring

### Voir les logs en temps réel

```bash
supabase functions logs send-push --follow
```

### Dashboard Supabase

- **Edge Functions** > **send-push** > **Logs** : Logs de la fonction
- **Database** > **Logs** : Logs des triggers SQL
- **API** > **Logs** : Requêtes HTTP

---

## 🔄 Mise à jour de la fonction

Si vous modifiez le code de l'Edge Function :

```bash
# 1. Modifier le fichier
nano supabase/functions/send-push/index.ts

# 2. Redéployer
supabase functions deploy send-push

# 3. Vérifier
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-push \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"tokens":["test"], "title":"Test", "body":"Test"}'
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. ✅ **Ne jamais commit les secrets** dans git
   - Ajoutez `.env` à `.gitignore`
   - Utilisez `supabase secrets` pour les variables sensibles

2. ✅ **Utiliser RLS (Row Level Security)**
   - Les tokens push sont déjà protégés par RLS
   - Seuls les propriétaires peuvent voir/modifier leurs tokens

3. ✅ **Limiter l'accès à l'Edge Function**
   - L'Edge Function vérifie l'Authorization header
   - Seules les requêtes authentifiées peuvent envoyer des notifications

4. ✅ **Nettoyer les tokens invalides**
   - L'Edge Function désactive automatiquement les tokens invalides
   - Les appareils désinstallés/déconnectés sont marqués `is_active = false`

---

## 📈 Métriques

### Notifications envoyées

```sql
-- Voir les requêtes HTTP récentes (pg_net)
SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 10;
```

### Tokens actifs

```sql
SELECT 
  device_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active
FROM push_tokens
GROUP BY device_type;
```

### Taux de succès

Ajoutez une table de tracking :

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  notification_type TEXT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Prochaines étapes

### Améliorations possibles

1. **Notifications programmées** : Utiliser `pg_cron` pour envoyer des résumés quotidiens
2. **Rate limiting** : Limiter le nombre de notifications par utilisateur/heure
3. **Préférences avancées** : Laisser l'utilisateur choisir les types de notifications
4. **Analytics** : Tracker les taux d'ouverture des notifications
5. **A/B Testing** : Tester différents messages pour optimiser l'engagement

---

## ✅ Checklist finale

- [ ] Supabase CLI installé et authentifié
- [ ] Projet Supabase lié (`supabase link`)
- [ ] Edge Function déployée (`supabase functions deploy send-push`)
- [ ] Secrets configurés (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Anon Key stockée (via ALTER DATABASE ou Vault)
- [ ] URL mise à jour dans `ACTIVATE_NOTIFICATION_TRIGGERS.sql`
- [ ] Triggers SQL activés
- [ ] Extension `pg_net` activée
- [ ] Test manuel réussi (curl ou Supabase client)
- [ ] Test end-to-end réussi (course prise → notification reçue)
- [ ] Logs vérifiés (Edge Functions > Logs)

---

## 🆘 Support

**Ressources :**
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation pg_net](https://github.com/supabase/pg_net)
- [Documentation Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/)

**Besoin d'aide ?**
- Ouvrez un ticket dans le repo
- Consultez les logs de l'Edge Function
- Vérifiez la configuration des secrets

---

**🎉 Une fois tout configuré, votre système de notifications sera 100% automatique !**

Les utilisateurs recevront des notifications push en temps réel, même si l'application est fermée, sans aucune intervention manuelle.

