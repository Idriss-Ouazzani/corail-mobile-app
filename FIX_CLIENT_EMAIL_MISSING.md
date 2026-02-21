# 🔧 Fix: Colonne `client_email` manquante dans la table `rides`

## 🎯 Problème

L'erreur suivante apparaît lors de l'exécution de requêtes sur la table `rides` :

```
ERROR: 42703: column "client_email" does not exist
```

**Cause :** La colonne `client_email` existe dans la table `quotes` mais pas dans `rides`.

---

## ✅ Solution : Exécuter le script SQL

### Étape 1 : Ouvrir le SQL Editor

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet **Corail**
3. Clique sur **SQL Editor** dans la barre latérale

---

### Étape 2 : Copier et exécuter le script

**Copie le contenu du fichier `ADD_CLIENT_EMAIL_TO_RIDES.sql` et colle-le dans le SQL Editor :**

```sql
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 FIX: Ajouter la colonne client_email à la table rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Ajouter la colonne client_email
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_rides_client_email 
ON public.rides(client_email);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que la colonne est bien créée
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rides' 
  AND column_name = 'client_email';

-- Vérifier les colonnes client de la table rides
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rides' 
  AND column_name LIKE 'client%'
ORDER BY column_name;
```

---

### Étape 3 : Cliquer sur "Run" (ou Ctrl+Enter)

Le script va :
1. ✅ Ajouter la colonne `client_email` à la table `rides`
2. ✅ Créer un index pour améliorer les performances
3. ✅ Afficher les colonnes client pour vérifier

---

## 📊 Résultat attendu

Après exécution, tu devrais voir dans les résultats :

```
column_name   | data_type | is_nullable
--------------+-----------+-------------
client_email  | text      | YES

Colonnes client dans rides :
- client_name
- client_phone
- client_email ← NOUVEAU
```

---

## 🧪 Tester l'app

### Test 1 : Exécuter `CHECK_RIDE_CLIENT_INFO.sql`

Maintenant que `client_email` existe, exécute ce script pour voir les infos client des courses prises :

```sql
SELECT 
  id,
  status,
  creator_id,
  picker_id,
  client_name,
  client_phone,
  client_email, ← Maintenant disponible !
  pickup_address,
  dropoff_address,
  created_at
FROM rides
WHERE picker_id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd'
ORDER BY created_at DESC
LIMIT 5;
```

---

### Test 2 : Redémarrer l'app avec les nouveaux logs

```bash
npx expo start --clear
```

---

### Test 3 : Ouvrir une course prise

1. Va dans **Courses** → **Prises**
2. Clique sur une course
3. **Regarde les logs Metro** :

```
🔍 [RideDetailScreen] Client info: {
  "client_name": "...",
  "client_phone": "...",
  "client_email": "...", ← Maintenant visible !
  "canSeeClientInfo": true,
  "willShowClientSection": true,
}
```

---

## 🎯 Ce qui change après ce fix

### Avant :
- ❌ Impossible d'afficher `client_email` dans les détails de course
- ❌ Erreur SQL lors des requêtes sur `client_email`
- ❌ Pas de possibilité de contacter le client par email

### Après :
- ✅ `client_email` disponible dans la table `rides`
- ✅ Les drivers peuvent voir l'email du client (si renseigné)
- ✅ Bouton "Email" cliquable dans `RideDetailScreen`
- ✅ Cohérence avec la table `quotes` qui a déjà `client_email`

---

## 📋 Ordre des scripts SQL complets

Voir **`SCRIPTS_TO_RUN_IN_ORDER.md`** pour la liste complète des migrations à exécuter dans l'ordre.

---

## 🆘 Support

Si l'erreur persiste après avoir exécuté le script :

1. **Vérifie que le script s'est bien exécuté :**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'rides' AND column_name = 'client_email';
   ```
   **Résultat attendu :** `client_email`

2. **Rafraîchis le schema Supabase :**
   - Dans Supabase Dashboard → **Database** → **Tables**
   - Clique sur **"Refresh"** en haut à droite

3. **Redémarre complètement l'app :**
   ```bash
   # Effacer le cache Metro
   rm -rf /tmp/metro-* && rm -rf node_modules/.cache
   
   # Redémarrer Expo
   npx expo start --clear
   ```

---

**Bonne chance ! 🚀 Ce fix simple devrait résoudre l'erreur.**

