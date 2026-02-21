# ✅ Solution : Affichage des infos client

## 🎯 Problème résolu

**Avant :** Quand tu prenais une course marketplace, tu voyais seulement l'apporteur d'affaires, mais pas les infos du client.

**Maintenant :** Tu verras **2 sections** :
1. 💼 **Apporteur d'affaires** (créateur de la course)
2. 👤 **Client** (nom + téléphone/email)

---

## 🔧 Ce qui a été corrigé

### 1. Base de données
- ✅ Colonne `client_email` ajoutée à la table `rides`
- ✅ Colonne `client_email` ajoutée à la table `personal_rides`

### 2. API (supabaseApi.ts)
- ✅ `createRide` : Signature mise à jour pour accepter `client_email`
- ✅ `createPersonalRide` : Signature mise à jour pour accepter `client_email`
- ✅ `publishPersonalRide` : Transmet maintenant `client_email` lors de la publication

### 3. UI (CreateRideScreen.tsx)
- ✅ `rideData` inclut maintenant `client_email`

### 4. Hook (useRideActions.ts)
- ✅ `handleCreateRide` transmet `client_email` pour les courses marketplace
- ✅ `handleCreateRide` transmet `client_email` pour les courses personnelles

### 5. Types (types/index.ts)
- ✅ Type `Ride` inclut maintenant `client_email?: string`

---

## 🚀 Action immédiate : Exécute le script SQL

### Étape 1 : Ouvrir Supabase

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet **Corail**
3. Clique sur **SQL Editor** dans la barre latérale

---

### Étape 2 : Exécuter le script

**Copie et exécute le contenu de `ADD_CLIENT_EMAIL_COMPLETE.sql` :**

```sql
-- Ajoute client_email à rides
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS client_email TEXT;

CREATE INDEX IF NOT EXISTS idx_rides_client_email 
ON public.rides(client_email);

-- Ajoute client_email à personal_rides
ALTER TABLE public.personal_rides
ADD COLUMN IF NOT EXISTS client_email TEXT;

CREATE INDEX IF NOT EXISTS idx_personal_rides_client_email 
ON public.personal_rides(client_email);
```

**Clique sur "Run" (ou Ctrl+Enter)**

**Résultat attendu :**
```
Success. No rows returned.
```

---

### Étape 3 : Vérifier que ça a marché

Dans le même SQL Editor, exécute :

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rides' AND column_name LIKE 'client%'
ORDER BY column_name;
```

**Résultat attendu :**
```
client_email ← NOUVEAU !
client_name
client_phone
```

---

### Étape 4 : Redémarrer l'app

```bash
# Effacer le cache et redémarrer
npx expo start --clear
```

---

## 🧪 Test : Vérifier que les infos client s'affichent

### Scénario 1 : Créer une course marketplace avec client

1. Va dans **Courses** → **+** (Créer)
2. Remplis tous les champs **incluant** :
   - ✅ Nom du client
   - ✅ Téléphone OU Email du client
3. Publie la course
4. **Depuis un autre compte**, prends cette course
5. Va dans **Courses** → **Prises**
6. Ouvre la course
7. **Tu dois voir** :
   - 💼 Section "Apporteur d'affaires" avec boutons Appeler/WhatsApp
   - 👤 Section "Client" avec nom + boutons Appeler/WhatsApp/Email

---

### Scénario 2 : Publier une course perso vers marketplace

1. Va dans **Courses** → **Mes Courses**
2. Crée une course personnelle
3. Clique sur la course → **Publier sur la Marketplace**
4. **Dans le modal**, remplis les infos client :
   - ✅ Nom du client
   - ✅ Téléphone OU Email
5. Publie
6. **Depuis un autre compte**, prends cette course
7. **Les infos client doivent être visibles**

---

## 🐛 Si les infos client ne s'affichent toujours pas

### Cas 1 : Les anciennes courses n'ont pas d'infos client

**Normal !** Les courses créées **avant** ce fix n'ont pas d'infos client dans la DB.

**Solution :**
- Les **nouvelles** courses auront les infos client
- Pour les anciennes courses, tu peux les ajouter manuellement :

```sql
UPDATE rides
SET 
  client_name = 'Nom du client',
  client_phone = '0612345678',
  client_email = 'client@example.com'
WHERE id = 'ride-XXX'; -- Remplace par l'ID de la course
```

---

### Cas 2 : Tu ne vois aucune section client

**Cause :** Tu n'es ni le créateur, ni le picker de cette course.

**Solution :** Vérifie que tu as bien **pris** la course (statut = "Prises", pas "Marketplace").

---

### Cas 3 : La section client est vide

**Cause :** La course a été créée sans renseigner les infos client.

**Solution :** Demande au créateur de la course de re-publier avec les infos client, ou ajoute-les manuellement dans la DB (voir Cas 1).

---

## 📊 Vérifier l'état de la DB

Exécute `DEBUG_CLIENT_INFO_ISSUE.sql` pour voir l'état des courses :

```sql
-- Remplace 'TON-USER-ID' par ton ID
SELECT 
  id,
  status,
  client_name,
  client_phone,
  client_email,
  CASE 
    WHEN client_name IS NULL AND client_phone IS NULL AND client_email IS NULL 
      THEN '❌ AUCUNE INFO CLIENT'
    ELSE '✅ INFO CLIENT PRÉSENTE'
  END AS diagnostic
FROM rides
WHERE picker_id = 'TON-USER-ID'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📁 Fichiers créés pour t'aider

1. **`ADD_CLIENT_EMAIL_COMPLETE.sql`** ← Script SQL principal (à exécuter)
2. **`FIX_CLIENT_INFO_COMPLETE.md`** ← Guide détaillé avec tous les bugs trouvés
3. **`DEBUG_CLIENT_INFO_ISSUE.sql`** ← Script de diagnostic
4. **`SOLUTION_CLIENT_INFO.md`** ← Ce fichier (résumé)
5. **Migrations :**
   - `supabase/migrations/028_add_client_email_to_rides.sql`
   - `supabase/migrations/029_add_client_email_to_personal_rides.sql`

---

## 🎉 Résultat final

Après avoir exécuté le script SQL et redémarré l'app :

✅ Les courses marketplace ont les infos client  
✅ Quand tu prends une course, tu vois le client ET l'apporteur d'affaires  
✅ Tu peux appeler, WhatsApp ou envoyer un email au client  
✅ Les boutons de contact fonctionnent (téléphone, WhatsApp, email)  
✅ Cohérence totale : `quotes`, `rides` et `personal_rides` ont tous `client_email`  

---

## 🆘 Support

Si ça ne fonctionne toujours pas après avoir suivi toutes les étapes :

1. **Envoie-moi les résultats de `DEBUG_CLIENT_INFO_ISSUE.sql`**
2. **Envoie-moi les logs Metro** quand tu ouvres une course prise
3. **Vérifie que le script SQL s'est bien exécuté** (étape 3 ci-dessus)

---

**🚀 Exécute le script SQL maintenant et teste !**

