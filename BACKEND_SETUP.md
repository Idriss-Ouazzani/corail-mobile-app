# 🔧 Configuration Backend pour Notifications "À la Uber"

## Table des matières
1. [Prérequis](#prérequis)
2. [Option A : Supabase Realtime (Recommandé)](#option-a--supabase-realtime-recommandé)
3. [Option B : Edge Function + Push Notifications](#option-b--edge-function--push-notifications)
4. [Configuration des permissions](#configuration-des-permissions)
5. [Tests](#tests)

---

## Prérequis

- [ ] Projet Supabase actif
- [ ] Supabase CLI installé (`npm i -g supabase`)
- [ ] Compte Expo avec push notifications activées

---

## Option A : Supabase Realtime (Recommandé)

### Étape 1 : Activer Realtime sur la table `rides`

Dans votre dashboard Supabase → Database → Replication :

1. Sélectionnez la table `rides`
2. Activez "Realtime"
3. Configurez les événements : `INSERT`, `UPDATE`, `DELETE`

**Via SQL :**

```sql
-- Activer Realtime pour la table rides
ALTER PUBLICATION supabase_realtime ADD TABLE rides;

-- Vérifier que c'est activé
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### Étape 2 : RLS (Row Level Security) pour Realtime

Les utilisateurs doivent pouvoir **lire** les nouvelles courses, mais pas modifier :

```sql
-- Politique : Les chauffeurs vérifiés peuvent voir les courses disponibles
CREATE POLICY "Chauffeurs can view available rides"
  ON public.rides
  FOR SELECT
  USING (
    status = 'AVAILABLE' 
    AND (
      visibility = 'PUBLIC' 
      OR (
        visibility = 'GROUP' 
        AND group_id IN (
          SELECT group_id 
          FROM group_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );
```

### Étape 3 : Test Realtime

Testez depuis la console Supabase :

```javascript
// Dans la console JavaScript du navigateur
const { createClient } = supabase
const supabase = createClient('YOUR_URL', 'YOUR_ANON_KEY')

const channel = supabase
  .channel('test-rides')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'rides' },
    (payload) => console.log('Nouvelle course:', payload)
  )
  .subscribe()

// Créez une course depuis l'app → vous devriez voir le log
```

---

## Option B : Edge Function + Push Notifications

### Étape 1 : Déployer l'Edge Function

```bash
# Se placer dans le dossier du projet
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# Login Supabase
supabase login

# Link au projet
supabase link --project-ref YOUR_PROJECT_REF

# Déployer la fonction
supabase functions deploy send-ride-notification --no-verify-jwt
```

### Étape 2 : Configurer les secrets

```bash
# Service Role Key (pour accès admin)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# URL Supabase (généralement auto-configurée)
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
```

### Étape 3 : Créer le trigger PostgreSQL

Appliquez la migration `create_ride_notification_trigger.sql` :

```bash
# Appliquer la migration
supabase db push

# OU manuellement dans le SQL Editor :
# Copiez le contenu de supabase/migrations/create_ride_notification_trigger.sql
```

⚠️ **Important** : Configurez l'URL de l'Edge Function dans PostgreSQL :

```sql
-- Remplacez YOUR_PROJECT_REF par votre référence projet
ALTER DATABASE postgres 
SET app.settings.supabase_functions_url TO 
'https://YOUR_PROJECT_REF.supabase.co/functions/v1';

-- Pas besoin de stocker la service_role_key (géré par Supabase)
```

### Étape 4 : Tester l'Edge Function

```bash
# Test local
supabase functions serve send-ride-notification

# Dans un autre terminal, envoyer une requête test :
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-ride-notification' \
  --header 'Content-Type: application/json' \
  --data '{
    "rideId": "test-123",
    "visibility": "PUBLIC"
  }'
```

---

## Configuration des permissions

### 1. Tokens Push Expo

Stockez les tokens dans la table `users` :

```sql
-- Ajouter une colonne pour les tokens push (si pas déjà fait)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS expo_push_token text;

CREATE INDEX IF NOT EXISTS idx_users_expo_push_token 
ON public.users(expo_push_token);

-- Politique RLS : Les utilisateurs peuvent mettre à jour leur propre token
CREATE POLICY "Users can update their own push token"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### 2. Enregistrer le token depuis l'app

Ajoutez dans votre code d'initialisation (App.tsx) :

```typescript
import * as Notifications from 'expo-notifications';

// Enregistrer le token push
const registerPushToken = async (userId: string) => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Permission notifications refusée');
      return;
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('📱 Expo Push Token:', token);
    
    // Sauvegarder dans Supabase
    await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', userId);
      
    console.log('✅ Token push enregistré');
  } catch (error) {
    console.error('❌ Erreur enregistrement push token:', error);
  }
};

// Appeler au login/startup
useEffect(() => {
  if (currentUserId && isAuthenticated) {
    registerPushToken(currentUserId);
  }
}, [currentUserId, isAuthenticated]);
```

---

## Tests

### Test 1 : Realtime (app ouverte)

1. Ouvrez l'app sur un device A (compte chauffeur)
2. Créez une course depuis un device B (compte client)
3. Le modal devrait apparaître immédiatement sur device A

### Test 2 : Push notification (app fermée)

1. Fermez complètement l'app sur device A
2. Créez une course depuis device B
3. Une notification devrait apparaître sur device A

### Test 3 : Notifications de groupe

1. Créez un groupe avec 2 chauffeurs
2. Créez une course visible uniquement pour ce groupe
3. Les 2 chauffeurs devraient recevoir la notification

### Test 4 : Exclusion du créateur

1. Créez une course depuis votre compte
2. Vous ne devriez **pas** recevoir de notification pour votre propre course

---

## Monitoring et Analytics

### Logs des notifications

Consultez les logs dans Supabase :

```sql
-- Voir les dernières notifications envoyées
SELECT 
  nl.*,
  u.full_name,
  r.pickup_address,
  r.dropoff_address
FROM notification_logs nl
JOIN users u ON nl.user_id = u.id
LEFT JOIN rides r ON nl.ride_id = r.id
ORDER BY nl.sent_at DESC
LIMIT 50;

-- Statistiques par utilisateur
SELECT 
  user_id,
  u.full_name,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN delivered THEN 1 END) as delivered,
  COUNT(CASE WHEN opened THEN 1 END) as opened
FROM notification_logs nl
JOIN users u ON nl.user_id = u.id
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, u.full_name
ORDER BY total_notifications DESC;
```

### Edge Function Logs

```bash
# Voir les logs en temps réel
supabase functions logs send-ride-notification --follow

# Voir les derniers logs
supabase functions logs send-ride-notification --tail 100
```

---

## Dépannage

### Problème : Realtime ne fonctionne pas

1. Vérifiez que Realtime est activé pour la table `rides`
2. Vérifiez les politiques RLS
3. Testez la connexion depuis la console Supabase

```sql
-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'rides';

-- Vérifier les publications Realtime
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Problème : Notifications push ne sont pas reçues

1. Vérifiez que le token Expo est bien enregistré :
```sql
SELECT id, full_name, expo_push_token FROM users WHERE expo_push_token IS NOT NULL;
```

2. Testez manuellement l'envoi via Expo :
```bash
curl -H "Content-Type: application/json" \
     -X POST "https://exp.host/--/api/v2/push/send" \
     -d '{
       "to": "ExponentPushToken[YOUR_TOKEN]",
       "title": "Test",
       "body": "Test notification"
     }'
```

3. Vérifiez les permissions dans `app.json`

### Problème : Edge Function timeout

1. Vérifiez les logs : `supabase functions logs send-ride-notification`
2. Testez localement avec `supabase functions serve`
3. Augmentez le timeout si nécessaire (max 60s sur Supabase)

---

## ✅ Checklist Backend

- [ ] Realtime activé sur table `rides`
- [ ] Politiques RLS configurées
- [ ] Edge Function déployée (si Option B)
- [ ] Trigger PostgreSQL créé (si Option B)
- [ ] Table `notification_logs` créée
- [ ] Colonne `expo_push_token` ajoutée à `users`
- [ ] Tokens push enregistrés depuis l'app
- [ ] Tests réalisés (Realtime + Push)
- [ ] Monitoring configuré

---

**Backend prêt ! 🚀**

