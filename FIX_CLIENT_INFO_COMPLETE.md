# 🔧 Fix Complet: Affichage des infos client

## 🎯 Problème

Quand tu prends une course de la marketplace, tu ne vois **pas les informations du client** (nom, téléphone, email), seulement l'apporteur d'affaires.

---

## 🔍 Analyse : 5 bugs trouvés !

### Bug 1 : Colonne `client_email` manquante dans `rides`
**Fichier :** Base de données (table `rides`)  
**Problème :** La colonne n'existe pas → Erreur SQL  
**Fix :** Migration `028_add_client_email_to_rides.sql` créée

### Bug 2 : Colonne `client_email` manquante dans `personal_rides`
**Fichier :** Base de données (table `personal_rides`)  
**Problème :** La colonne n'existe pas  
**Fix :** Migration `029_add_client_email_to_personal_rides.sql` créée

### Bug 3 : `client_email` non transmis lors de la publication (course perso → marketplace)
**Fichier :** `src/services/supabaseApi.ts` (fonction `publishPersonalRide`)  
**Problème :** On met à jour `client_name` et `client_phone`, mais pas `client_email`  
**Fix :** ✅ Ajouté `client_email: options.client_email || null`

### Bug 4 : `client_email` non transmis lors de la création de course (CreateRideScreen)
**Fichiers :**
- `src/screens/CreateRideScreen.tsx` (rideData)
- `src/hooks/useRideActions.ts` (handleCreateRide)
- `src/services/supabaseApi.ts` (createRide signature + createPersonalRide signature)

**Problème :** On envoie `client_name` et `client_phone`, mais pas `client_email`  
**Fix :** ✅ Ajouté `client_email` dans :
- Le `rideData` de `CreateRideScreen`
- Les appels API dans `useRideActions`
- Les signatures TypeScript des fonctions API

### Bug 5 : Type TypeScript `Ride` manquant `client_email`
**Fichier :** `src/types/index.ts`  
**Problème :** Le type `Ride` n'a pas de champ `client_email`  
**Fix :** ✅ Ajouté `client_email?: string`

---

## ✅ Corrections appliquées

### 1️⃣ Database (à exécuter dans Supabase)

**Exécute `ADD_CLIENT_EMAIL_COMPLETE.sql` dans le SQL Editor :**

```sql
-- Ajoute client_email à rides et personal_rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.personal_rides ADD COLUMN IF NOT EXISTS client_email TEXT;
```

---

### 2️⃣ Code TypeScript (déjà corrigé ✅)

**Fichiers modifiés :**

1. **`src/types/index.ts`**
   - ✅ Ajouté `client_email?: string` au type `Ride`

2. **`src/services/supabaseApi.ts`**
   - ✅ Ajouté `client_email` à la signature de `createRide`
   - ✅ Ajouté `client_email` à la signature de `createPersonalRide`
   - ✅ Ajouté `client_email: options.client_email || null` dans `publishPersonalRide` (update personal_rides)
   - ✅ Ajouté `client_email: options.client_email || null` dans `publishPersonalRide` (insert rides)

3. **`src/screens/CreateRideScreen.tsx`**
   - ✅ Ajouté `client_email: clientEmail || undefined` dans `rideData`

4. **`src/hooks/useRideActions.ts`**
   - ✅ Ajouté `client_email: ride.client_email` dans `createPersonalRide` call
   - ✅ Ajouté `client_email: ride.client_email` dans `createRide` call

---

## 🚀 Actions à faire (dans l'ordre)

### Étape 1 : Exécuter le script SQL

1. **Ouvre [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor**
2. **Copie et exécute `ADD_CLIENT_EMAIL_COMPLETE.sql`**
3. **Vérifie le résultat** :

```sql
-- Tu devrais voir client_email dans les deux tables
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'rides' AND column_name LIKE 'client%';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'personal_rides' AND column_name LIKE 'client%';
```

**Résultat attendu :**
```
client_email ✅
client_name
client_phone
```

---

### Étape 2 : Redémarrer l'app

```bash
npx expo start --clear
```

---

### Étape 3 : Tester le flux complet

#### Test 1 : Créer une course marketplace avec infos client

1. Va dans **Courses** → **+** (Créer une course)
2. Remplis **tous les champs** :
   - ✅ Départ / Arrivée
   - ✅ Date / Heure
   - ✅ Prix
   - ✅ **Nom du client**
   - ✅ **Téléphone OU Email du client** (ou les deux)
3. Clique sur **Publier**
4. **Résultat attendu :** Course créée avec succès

---

#### Test 2 : Prendre une course marketplace et vérifier les infos client

1. **Depuis un autre compte** (ou depuis le même si tu as des courses publiées), va dans **Marketplace**
2. Clique sur une course **qui a des infos client**
3. Clique sur **Prendre cette course**
4. **Résultat attendu :** Course prise avec succès
5. Va dans **Courses** → **Prises**
6. Clique sur la course que tu viens de prendre
7. **Résultat attendu :** Tu dois voir **2 sections** :

```
┌─────────────────────────────────────────┐
│ 💼 Apporteur d'affaires                 │
│ Sabrine Arouf                           │
│ [📞 Appeler] [💬 WhatsApp]              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 👤 Client                               │
│ Inès Bensousou                          │
│ [📞 Appeler] [💬 WhatsApp] [📧 Email]   │
└─────────────────────────────────────────┘
```

---

#### Test 3 : Publier une course perso vers marketplace avec infos client

1. Va dans **Courses** → **Mes Courses**
2. Crée une course personnelle avec infos client
3. Clique sur la course → **Publier sur la Marketplace**
4. **Remplis les infos client** dans le modal :
   - ✅ Nom du client
   - ✅ Téléphone OU Email
5. Clique sur **Publier**
6. **Résultat attendu :** Course publiée avec +1 crédit
7. **Depuis un autre compte**, prends cette course
8. **Résultat attendu :** Les infos client sont visibles

---

## 🐛 Debug si ça ne marche toujours pas

### Vérifier la DB

Exécute `DEBUG_CLIENT_INFO_ISSUE.sql` pour voir l'état des courses :

```sql
-- Voir les courses que TU as prises
SELECT id, client_name, client_phone, client_email
FROM rides
WHERE picker_id = 'TON-USER-ID'
ORDER BY created_at DESC
LIMIT 10;
```

**Si client_name, client_phone ET client_email sont tous NULL :**
→ La course a été créée sans infos client (ancien système ou bug)

**Solution temporaire :** Ajoute manuellement les infos client :

```sql
UPDATE rides
SET 
  client_name = 'Client Test',
  client_phone = '0612345678',
  client_email = 'client@example.com'
WHERE id = 'ride-XXX'; -- Remplace par l'ID de la course
```

---

### Vérifier les logs Metro

Regarde les logs quand tu ouvres le détail d'une course :

```
🔍 [RideDetailScreen] Client info: {
  "client_name": "...",
  "client_phone": "...",
  "client_email": "...",
  "canSeeClientInfo": true,
  "willShowClientSection": true/false,
}
```

**Si `willShowClientSection: false` :**
→ Aucune info client dans la DB pour cette course

**Si `canSeeClientInfo: false` :**
→ Tu n'es ni le créateur, ni le picker de cette course

---

## 📋 Récapitulatif des changements

### Base de données (SQL)
- ✅ `rides.client_email` ajouté
- ✅ `personal_rides.client_email` ajouté

### Code (TypeScript)
- ✅ Type `Ride` mis à jour
- ✅ API `createRide` signature mise à jour
- ✅ API `createPersonalRide` signature mise à jour
- ✅ API `publishPersonalRide` envoie maintenant `client_email`
- ✅ `CreateRideScreen` transmet maintenant `client_email`
- ✅ `useRideActions` transmet maintenant `client_email`

### UI
- ✅ `RideDetailScreen` affiche déjà l'email client (si disponible)
- ✅ Bouton "Email" cliquable pour ouvrir l'app mail

---

## 🎉 Résultat final

Après ces corrections :

✅ Les courses marketplace auront les infos client (nom + téléphone OU email)  
✅ Les drivers qui prennent une course voient les infos client ET l'apporteur d'affaires  
✅ Les boutons "Appeler", "WhatsApp", "Email" fonctionnent  
✅ Cohérence entre `quotes`, `rides` et `personal_rides` (tous ont `client_email`)  

---

## 🆘 Support

Si le problème persiste :

1. **Envoie-moi les résultats de `DEBUG_CLIENT_INFO_ISSUE.sql`**
2. **Envoie-moi les logs Metro** quand tu ouvres une course prise
3. **Vérifie que le script SQL s'est bien exécuté** :
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'rides' AND column_name = 'client_email';
   ```

---

**Bonne chance ! 🚀 Exécute le script SQL et redémarre l'app.**

