# 🚀 Fix : Récursion infinie dans les politiques RLS

## 🚨 Problème

```
ERROR ❌ Erreur submitVerification: {"code": "42P17", "message": "infinite recursion detected in policy for relation \"users\""}
ERROR Error submitting verification: [Error: infinite recursion detected in policy for relation "users"]
```

## 🔍 Cause

Une politique RLS (Row-Level Security) sur la table `users` fait référence à la table `users` elle-même dans une sous-requête, créant une **boucle infinie**.

**Exemple de policy problématique :**
```sql
CREATE POLICY "Admins can read all profiles"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users  -- ❌ Récursion !
    WHERE id = auth.uid()::text
    AND is_admin = true
  )
);
```

**Pourquoi ça crée une récursion ?**
1. User essaie de lire `public.users`
2. La policy vérifie si le user est admin
3. Pour vérifier, elle doit lire `public.users` (pour voir `is_admin`)
4. Ce qui re-déclenche la policy
5. **Boucle infinie** 🔁

---

## ✅ Solution

Exécute le script **`FIX_RLS_NO_RECURSION.sql`** dans le **SQL Editor** de Supabase.

Ce script :
- ✅ Supprime TOUTES les policies existantes
- ✅ Recrée uniquement **3 policies essentielles** SANS récursion :
  1. `"Users can read own profile"` (SELECT)
  2. `"Users can update own profile"` (UPDATE) ← **CRITIQUE pour submitVerification**
  3. `"Authenticated users can read basic profiles"` (SELECT)
- ❌ **Ne recrée PAS** la policy `"Admins can read all profiles"` (cause de la récursion)

---

## 🚀 Marche à suivre

### Étape 1 : Exécuter le script SQL

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**
2. Copie le contenu de **`FIX_RLS_NO_RECURSION.sql`**
3. Exécute le script

**Tu devrais voir :**
```
✅ 3 policies créées
✅ Toutes avec status "✅ OK"
```

### Étape 2 : Redémarrer l'app

```bash
npx expo start --clear
```

### Étape 3 : Retester la soumission VTC

1. **Connecte-toi** avec le compte qui a eu l'erreur
2. **Va dans le VerificationScreen**
3. **Remplis le formulaire de vérification VTC**
4. **Clique sur "Soumettre ma vérification"**

**Résultat attendu :**
```
✅ Token push enregistré
✅ Vérification soumise pour: [email]
🎉 Profil créé !
```

**Plus d'erreur de récursion** ✅

---

## 🔍 Vérification

Après avoir exécuté le script, vérifie dans le SQL Editor :

```sql
-- Vérifier les policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

**Résultat attendu (3 policies exactement) :**
```
| policyname                              | cmd    |
|-----------------------------------------|--------|
| Authenticated users can read basic profiles | SELECT |
| Users can read own profile              | SELECT |
| Users can update own profile            | UPDATE |
```

**Important :** Aucune policy avec "admin" dans le nom (elles causent la récursion).

---

## 💡 Et les admins ?

Les admins n'ont plus de policy spéciale pour lire tous les profils. **C'est normal et volontaire** pour éviter la récursion.

**Solutions pour les admins :**
1. **Dashboard Supabase** : Les admins utilisent le Dashboard pour voir tous les profils
2. **Service Role Key** : Bypass RLS côté backend si nécessaire
3. **Fonction RPC** : Créer une fonction sécurisée pour vérifier `is_admin` (si vraiment nécessaire)

Pour l'instant, **la solution 1 (Dashboard)** est suffisante.

---

## 🧪 Test complet du flux

### 1. Inscription
```
✅ Compte créé
✅ Auto-confirmation email
✅ Connexion automatique
```

### 2. VerificationScreen
```
✅ Formulaire VTC affiché
```

### 3. Soumission VTC
```
✅ Token push enregistré
✅ Vérification soumise (plus d'erreur RLS !)
🎉 Profil créé !
```

### 4. ConsentScreen
```
✅ Acceptation des termes RGPD
```

### 5. App + ValidationBanner
```
✅ "Validation en cours..." visible
```

### 6. Vérification dans la DB

```sql
SELECT 
  id,
  email,
  full_name,
  phone,
  professional_card_number,
  verification_status,
  verification_submitted_at
FROM public.users
WHERE email = 'ton-email@exemple.com';
```

**Tu devrais voir :**
- `full_name`, `phone`, `professional_card_number` renseignés
- `verification_status` = `'PENDING'`
- `verification_submitted_at` renseigné (pas NULL)

---

## 🚨 Dépannage

### Erreur persiste après le script

**Cause possible :** Les policies n'ont pas été correctement supprimées

**Solution :**
```sql
-- Forcer la suppression de TOUTES les policies
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
  END LOOP;
END $$;
```

Puis réexécute `FIX_RLS_NO_RECURSION.sql`.

---

### L'app dit toujours "RLS error"

**Cause possible :** L'app utilise encore l'ancien code avec `upsert`

**Solution :** Le code a déjà été corrigé pour utiliser `update`. Assure-toi que l'app a bien redémarré avec cache cleared :

```bash
rm -rf /tmp/metro-* && rm -rf node_modules/.cache
npx expo start --clear
```

---

## 📋 Checklist de résolution

- [ ] Script `FIX_RLS_NO_RECURSION.sql` exécuté dans Supabase
- [ ] Exactement 3 policies visibles (aucune avec "admin")
- [ ] Code `submitVerification` utilise `update` (déjà fait ✅)
- [ ] App redémarrée avec cache cleared
- [ ] Test de soumission VTC effectué
- [ ] Aucune erreur "infinite recursion"
- [ ] `verification_status` passe à `'PENDING'` dans la DB
- [ ] ConsentScreen s'affiche après soumission

---

## 🎉 Résultat final

Après ce fix, tout le flux d'inscription fonctionne :

1. ✅ Inscription sans confirmation d'email
2. ✅ VerificationScreen avec formulaire VTC
3. ✅ Soumission réussie (plus d'erreur RLS ni récursion)
4. ✅ ConsentScreen pour RGPD
5. ✅ App normale + ValidationBanner
6. ✅ Admin valide → accès marketplace

---

**Dis-moi quand tu as exécuté le script et on teste ensemble ! 🚀**

