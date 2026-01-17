# 🧪 Guide de Tests - Notifications Push

Guide complet pour tester votre système de notifications, du plus simple au plus avancé.

---

## 📋 Vue d'ensemble

Nous allons tester dans cet ordre :
1. ✅ Notifications locales (app ouverte) - **5 min**
2. ✅ Enregistrement des tokens push - **2 min**
3. ✅ Edge Function manuellement - **3 min**
4. ✅ Notifications push end-to-end - **5 min**
5. ✅ Automatisation complète (triggers SQL) - **10 min**

---

## 🔧 Prérequis

- [ ] App mobile installée sur **appareil physique** (pas simulateur !)
- [ ] Compte créé et connecté dans l'app
- [ ] Table `push_tokens` créée dans Supabase
- [ ] Edge Function déployée (optionnel pour tests 1-2)

---

## ✅ Test 1 : Notifications locales (App ouverte)

### Objectif
Vérifier que les notifications locales fonctionnent quand l'app est ouverte.

### Étapes

1. **Ouvrir l'app sur votre téléphone**
2. **Se connecter avec un compte**
3. **Vérifier les permissions**
   - L'app devrait demander l'autorisation pour les notifications
   - Appuyez sur "Autoriser" / "Allow"

4. **Tester une notification test**

Ajoutez ce code temporairement dans votre écran de profil (`src/screens/ProfileTab.tsx`) :

```typescript
import * as NotificationService from '../services/notifications';

// Ajouter un bouton de test
<TouchableOpacity 
  style={styles.testButton}
  onPress={async () => {
    await NotificationService.sendTestNotification();
  }}
>
  <Text>🧪 Test Notification</Text>
</TouchableOpacity>
```

5. **Appuyer sur le bouton**
6. ✅ **Une notification devrait apparaître** : "🔔 Notification test"

### Résultat attendu
- Notification visible en haut de l'écran
- Son joué
- Badge sur l'icône de l'app (iOS)

### Si ça ne marche pas
```typescript
// Vérifier les permissions manuellement
import * as Notifications from 'expo-notifications';

const { status } = await Notifications.getPermissionsAsync();
console.log('Permission status:', status); // Devrait être "granted"
```

---

## ✅ Test 2 : Enregistrement du token push

### Objectif
Vérifier que les tokens push sont bien enregistrés dans Supabase.

### Étapes

1. **Se connecter dans l'app**
2. **Vérifier les logs dans Metro**

Vous devriez voir dans la console :
```
✅ Notifications activées
✅ Push token enregistré
```

3. **Vérifier dans Supabase**

Allez dans **Supabase Dashboard** > **Table Editor** > **push_tokens**

Exécutez cette requête SQL :
```sql
SELECT 
  id,
  user_id,
  push_token,
  device_type,
  is_active,
  created_at
FROM push_tokens
ORDER BY created_at DESC
LIMIT 5;
```

### Résultat attendu

| user_id | push_token | device_type | is_active |
|---------|------------|-------------|-----------|
| H2nya... | ExponentPushToken[xxx] | ios | true |

✅ Votre token devrait apparaître avec `is_active = true`

### Récupérer votre token pour les tests

```sql
-- Récupérer VOTRE token (remplacez USER_ID)
SELECT push_token 
FROM push_tokens 
WHERE user_id = 'YOUR_USER_ID' 
  AND is_active = true 
LIMIT 1;
```

**Copiez ce token**, vous en aurez besoin pour les prochains tests !

---

## ✅ Test 3 : Edge Function (Test manuel)

### Objectif
Tester l'Edge Function directement, sans passer par l'app.

### Prérequis
- [ ] Edge Function déployée
- [ ] Secrets configurés
- [ ] Token push récupéré (Test 2)

### Méthode 1 : Via script (Recommandé)

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp/supabase/functions/send-push

./test.sh YOUR_PROJECT_ID YOUR_ANON_KEY YOUR_EXPO_TOKEN
```

**Exemple :**
```bash
./test.sh abcdefg12345 eyJhbGciOiJIUzI1... ExponentPushToken[xxxxxx]
```

### Méthode 2 : Via curl

```bash
curl -X POST \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tokens": ["ExponentPushToken[YOUR_TOKEN]"],
    "title": "Test manuel 🧪",
    "body": "Ceci est un test de lEdge Function",
    "data": {"type": "test"}
  }'
```

**Trouver vos clés :**
- `PROJECT_ID` : Dashboard > Settings > General > Reference ID
- `ANON_KEY` : Dashboard > Settings > API > anon public

### Méthode 3 : Via Supabase Dashboard

1. Allez dans **Edge Functions** > **send-push**
2. Cliquez sur **Invoke**
3. Entrez ce JSON :

```json
{
  "tokens": ["ExponentPushToken[YOUR_TOKEN]"],
  "title": "Test Dashboard",
  "body": "Test depuis le dashboard Supabase"
}
```

4. Cliquez sur **Invoke Function**

### Résultat attendu

**Réponse de l'API :**
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "tickets": [
    {
      "status": "ok",
      "id": "abc123..."
    }
  ]
}
```

**Sur votre téléphone :**
- 📱 Notification reçue (même si l'app est fermée !)
- Titre : "Test manuel 🧪"
- Message : "Ceci est un test de l'Edge Function"

### Si ça ne marche pas

**Vérifier les logs :**
```bash
supabase functions logs send-push
```

**Erreurs courantes :**

| Erreur | Solution |
|--------|----------|
| `Function not found` | `supabase functions deploy send-push` |
| `Authorization error` | Vérifier l'Anon Key |
| `No valid tokens` | Vérifier le format du token |
| `Device not registered` | Token invalide, en récupérer un nouveau |

---

## ✅ Test 4 : Push notification end-to-end (App mobile)

### Objectif
Tester qu'une action dans l'app déclenche une notification push à un autre utilisateur.

### Prérequis
- [ ] 2 appareils avec l'app installée
- [ ] 2 comptes différents (User A et User B)
- [ ] Edge Function déployée (optionnel, marche aussi en local)

### Scénario 1 : Course prise

**Setup :**
1. **Appareil 1** : User A connecté
2. **Appareil 2** : User B connecté

**Actions :**

1. **Sur Appareil 1 (User A)** :
   - Aller dans l'onglet "Courses"
   - Cliquer sur "Publier une course"
   - Remplir :
     - Pickup : "Paris CDG"
     - Dropoff : "Paris centre"
     - Date : Demain 10h
     - Prix : 100€
   - Publier en mode "Marketplace"

2. **Sur Appareil 2 (User B)** :
   - Aller dans "Marketplace"
   - Voir la course de User A
   - **Fermer complètement l'app** (swiper pour quitter)
   - Cliquer sur "Prendre" (ou rouvrir l'app et prendre)

3. **Sur Appareil 1 (User A)** :
   - ✅ **Notification devrait apparaître** : "🎉 Course prise ! [Nom de B] a pris votre course (Paris CDG)"
   - Même si l'app est fermée !

### Scénario 2 : Invitation à un groupe

**Setup :**
1. User A est admin d'un groupe
2. User B n'est pas dans le groupe

**Actions :**

1. **Sur Appareil 1 (User A)** :
   - Aller dans "Groupes"
   - Sélectionner un groupe (ou en créer un)
   - Cliquer sur "Inviter"
   - Entrer l'email de User B
   - Envoyer l'invitation

2. **Sur Appareil 2 (User B)** :
   - **Fermer l'app**
   - ✅ **Notification push** : "👥 Invitation groupe : [Nom de A] vous a invité à rejoindre [Groupe]"

### Vérification des logs

**Dans Metro (développement) :**
```
📱 Sending push to 1 device(s)
✅ Notifications course réclamée envoyées (local + push)
```

**Dans Supabase Dashboard :**
- Edge Functions > send-push > Logs
- Vous devriez voir les appels HTTP

---

## ✅ Test 5 : Automatisation complète (Triggers SQL)

### Objectif
Vérifier que les triggers SQL déclenchent automatiquement les notifications, **sans intervention de l'app**.

### Prérequis
- [ ] Edge Function déployée
- [ ] Secrets configurés
- [ ] Triggers SQL activés (`ACTIVATE_NOTIFICATION_TRIGGERS.sql` exécuté)
- [ ] Extension `pg_net` activée

### Vérification préalable

```sql
-- 1. Vérifier que pg_net est activé
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 2. Vérifier que les triggers sont actifs
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

-- Résultat attendu : enabled = 'O' (Origin = actif)
```

### Test : Simuler une course prise (via SQL)

**Setup :**
1. Créez une course test
2. Récupérez 2 user_id différents

**Étape 1 : Créer une course test**

```sql
-- Insérer une course test (remplacez USER_A_ID par un vrai ID)
INSERT INTO rides (
  creator_id,
  pickup_address,
  dropoff_address,
  scheduled_at,
  price_cents,
  status,
  visibility
) VALUES (
  'USER_A_ID',  -- ← Remplacer
  'Paris CDG Terminal 2',
  'Paris Gare de Lyon',
  NOW() + INTERVAL '1 day',
  10000,
  'PUBLISHED',
  'PUBLIC'
) RETURNING id;

-- Notez l'ID de la course retournée
```

**Étape 2 : Simuler que User B prend la course**

```sql
-- Remplacer RIDE_ID et USER_B_ID
UPDATE rides
SET 
  status = 'CLAIMED',
  picker_id = 'USER_B_ID'  -- ← Remplacer
WHERE id = 'RIDE_ID'  -- ← Remplacer
  AND status = 'PUBLISHED';
```

**Étape 3 : Vérifier que la notification est partie**

```sql
-- Vérifier les requêtes HTTP envoyées par pg_net
SELECT 
  id,
  status_code,
  content::text,
  created_at
FROM net._http_response
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu :**

| status_code | content | created_at |
|-------------|---------|------------|
| 200 | {"success":true,"sent":1...} | 2026-01-04... |

**Étape 4 : Vérifier sur l'appareil de User A**

- ✅ User A devrait recevoir une notification push
- Même si son app est **complètement fermée**
- Message : "🎉 Course prise ! [Nom de B] a pris votre course (Paris CDG Terminal 2)"

### Test : Invitation groupe (via SQL)

```sql
-- Insérer une invitation test
INSERT INTO group_invitations (
  group_id,
  inviter_id,
  invitee_id,
  invitee_email,
  status
) VALUES (
  'GROUP_ID',    -- ← ID d'un groupe existant
  'USER_A_ID',   -- ← L'inviteur
  'USER_B_ID',   -- ← L'invité (doit être inscrit)
  'userb@email.com',
  'PENDING'
);

-- Vérifier dans net._http_response
SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 1;
```

✅ User B devrait recevoir la notification "👥 Invitation groupe"

---

## 📊 Tableau récapitulatif des tests

| # | Test | Durée | Difficulté | App nécessaire |
|---|------|-------|------------|----------------|
| 1 | Notifications locales | 5 min | ⭐ Facile | Oui |
| 2 | Token push enregistré | 2 min | ⭐ Facile | Oui |
| 3 | Edge Function manuelle | 3 min | ⭐⭐ Moyen | Non |
| 4 | Push end-to-end | 5 min | ⭐⭐ Moyen | Oui (2 appareils) |
| 5 | Automatisation SQL | 10 min | ⭐⭐⭐ Avancé | Non |

---

## 🐛 Debugging : Checklist complète

### Si aucune notification ne s'affiche

```
[ ] Permissions notifications accordées (Réglages > Corail > Notifications)
[ ] App installée sur appareil physique (pas simulateur)
[ ] Internet activé
[ ] Token enregistré dans Supabase (voir Test 2)
[ ] Token format valide (ExponentPushToken[xxx])
[ ] Edge Function déployée (pour tests 3-5)
[ ] Secrets configurés (SUPABASE_URL + SERVICE_ROLE_KEY)
```

### Vérifier les logs à chaque niveau

**1. Logs Metro (développement) :**
```
npx react-native log-ios  # iOS
npx react-native log-android  # Android
```

**2. Logs Edge Function :**
```bash
supabase functions logs send-push --follow
```

**3. Logs SQL (pg_net) :**
```sql
SELECT * FROM net._http_response ORDER BY created_at DESC LIMIT 10;
```

**4. Logs Expo Push (via Dashboard Expo) :**
- https://expo.dev/accounts/YOUR_ACCOUNT/projects/YOUR_PROJECT/push-notifications

---

## 🎯 Tests de charge (Optionnel)

### Test avec 10 tokens

```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tokens": [
      "ExponentPushToken[1]",
      "ExponentPushToken[2]",
      ...
      "ExponentPushToken[10]"
    ],
    "title": "Test charge",
    "body": "10 notifications en parallèle"
  }'
```

### Test avec 100+ tokens

```sql
-- Récupérer tous les tokens actifs
SELECT ARRAY_AGG(push_token) 
FROM push_tokens 
WHERE is_active = true;

-- Utiliser le résultat dans un appel à l'Edge Function
```

---

## ✅ Checklist de validation finale

Avant de passer en production, assurez-vous que :

### Tests unitaires
- [ ] Test 1 réussi (notifications locales)
- [ ] Test 2 réussi (token enregistré)
- [ ] Test 3 réussi (Edge Function)

### Tests d'intégration
- [ ] Test 4 réussi (push end-to-end)
- [ ] Test 5 réussi (automatisation SQL)

### Tests scénarios réels
- [ ] Course prise → notification reçue (app fermée)
- [ ] Course terminée → notification reçue
- [ ] Invitation groupe → notification reçue
- [ ] Rappel 1h avant course → notification reçue

### Tests multi-plateforme
- [ ] Testé sur iOS
- [ ] Testé sur Android
- [ ] Testé avec app fermée
- [ ] Testé avec app en background
- [ ] Testé avec app ouverte

### Performance
- [ ] Notification reçue en < 3 secondes
- [ ] Aucune erreur dans les logs
- [ ] Tokens invalides désactivés automatiquement

---

## 📈 Métriques à surveiller

```sql
-- Nombre de tokens actifs par plateforme
SELECT 
  device_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active,
  COUNT(*) FILTER (WHERE is_active = false) as inactive
FROM push_tokens
GROUP BY device_type;

-- Notifications envoyées aujourd'hui (via pg_net)
SELECT 
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status_code = 200) as success,
  COUNT(*) FILTER (WHERE status_code != 200) as failed
FROM net._http_response
WHERE created_at > CURRENT_DATE;

-- Tokens créés récemment
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_tokens
FROM push_tokens
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🎉 Si tous les tests passent...

**Félicitations ! 🚀** Votre système de notifications est **production-ready** !

Vous avez maintenant :
- ✅ Notifications locales fonctionnelles
- ✅ Tokens push enregistrés et sécurisés
- ✅ Edge Function opérationnelle
- ✅ Push notifications end-to-end
- ✅ Automatisation complète via triggers SQL

**Prochaines étapes :**
1. Surveiller les métriques pendant 1 semaine
2. Ajuster les messages si nécessaire
3. Ajouter des analytics (taux d'ouverture)
4. Implémenter le rate limiting si besoin

---

## 🆘 Besoin d'aide ?

**Problème lors des tests ?**
1. Consultez la section "Debugging" ci-dessus
2. Vérifiez les logs à tous les niveaux
3. Consultez `EDGE_FUNCTION_DEPLOYMENT.md` (section Dépannage)
4. Ouvrez une issue avec les logs d'erreur

**Ressources :**
- [Expo Push Notifications Troubleshooting](https://docs.expo.dev/push-notifications/troubleshooting/)
- [Supabase Edge Functions Logs](https://supabase.com/docs/guides/functions/debugging)



