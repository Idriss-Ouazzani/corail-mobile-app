# 🚀 Fix : Erreur validation profil admin

## 🚨 Problème

Quand un admin essaie de valider un profil :

```
LOG ✅ Vérifications en attente: 3
ERROR ❌ Erreur validation: [Error: Cannot coerce the result to a single JSON object]
```

## 🔍 Cause du problème

L'erreur "Cannot coerce the result to a single JSON object" dans une requête Supabase avec `.single()` se produit quand :
- **0 lignes** sont retournées (le UPDATE ne trouve/modifie aucune ligne)
- **Plus d'1 ligne** est retournée (peu probable avec `.eq('id', userId)`)

**Cause principale :** Les admins n'ont **plus de policy RLS** leur permettant de modifier les profils des autres utilisateurs depuis qu'on a supprimé les policies récursives.

---

## ✅ Solution

Exécute le script **`FIX_ADMIN_VALIDATION_POLICY.sql`** dans le **SQL Editor** de Supabase.

Ce script :
1. ✅ Crée une fonction `is_current_user_admin()` avec `SECURITY DEFINER`
   - Bypass RLS pour vérifier si l'utilisateur est admin
   - **Pas de récursion** car elle utilise des droits élevés
   
2. ✅ Crée 2 nouvelles policies pour les admins :
   - `"Admins can read all profiles"` (SELECT)
   - `"Admins can update all profiles"` (UPDATE) ← **CRITIQUE pour la validation**

---

## 🚀 Marche à suivre

### Étape 1 : Exécuter le script SQL

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**
2. Copie le contenu de **`FIX_ADMIN_VALIDATION_POLICY.sql`**
3. Exécute le script

**Tu devrais voir :**
```
✅ Fonction is_current_user_admin créée
✅ 2 policies admin créées
```

### Étape 2 : Vérifier que ton user est bien admin

Dans le SQL Editor, exécute :

```sql
-- Remplace par ton email admin
SELECT 
  id,
  email,
  is_admin,
  verification_status
FROM public.users
WHERE email = 'ton-email-admin@corail.com';
```

**Résultat attendu :**
- `is_admin` = `true` ✅

**Si `is_admin` est `false` ou `NULL` :**

```sql
-- Promouvoir ton user en admin
UPDATE public.users
SET is_admin = true
WHERE email = 'ton-email-admin@corail.com';
```

### Étape 3 : Redémarrer l'app

```bash
npx expo start --clear
```

### Étape 4 : Retester la validation admin

1. **Connecte-toi** avec ton compte admin
2. **Va dans le panneau admin** (depuis ton profil)
3. **Tu devrais voir les vérifications en attente**
4. **Clique sur "Valider" ou "Rejeter"** pour un profil

**Résultat attendu :**
```
✅ Vérification VERIFIED pour: [userId]
🎉 Profil validé avec succès !
```

**Plus d'erreur "Cannot coerce"** ✅

---

## 🔍 Vérification

### 1. Vérifier que la fonction existe

```sql
SELECT 
  proname,
  prosecdef,
  provolatile
FROM pg_proc
WHERE proname = 'is_current_user_admin';
```

**Résultat attendu :**
```
| proname                | prosecdef | provolatile |
|------------------------|-----------|-------------|
| is_current_user_admin  | true      | s           |
```

- `prosecdef = true` : SECURITY DEFINER activé (bypass RLS)
- `provolatile = s` : STABLE (résultat identique pour les mêmes inputs)

### 2. Vérifier que les policies admin existent

```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
AND policyname LIKE '%Admin%'
ORDER BY policyname;
```

**Résultat attendu (2 policies admin) :**
```
| policyname                    | cmd    |
|-------------------------------|--------|
| Admins can read all profiles  | SELECT |
| Admins can update all profiles| UPDATE |
```

### 3. Tester la fonction is_current_user_admin()

**En étant connecté en tant qu'admin dans l'app**, exécute dans le SQL Editor :

```sql
SELECT public.is_current_user_admin() AS am_i_admin;
```

**Résultat attendu :**
```
| am_i_admin |
|------------|
| true       |
```

Si tu obtiens `false`, c'est que ton user n'est pas admin. Promeus-le :

```sql
UPDATE public.users
SET is_admin = true
WHERE email = 'ton-email@corail.com';
```

---

## 🧪 Test complet de validation admin

### 1. Créer un user de test à valider

1. Déconnecte-toi de ton compte admin
2. Crée un nouveau compte de test
3. Soumets le formulaire VTC
4. Note l'email du user de test

### 2. Se reconnecter en admin

1. Déconnecte-toi du compte de test
2. Reconnecte-toi avec ton compte admin

### 3. Valider le profil

1. Va dans **Profil** → **Admin Panel**
2. Tu devrais voir le user de test dans "Vérifications en attente"
3. Clique sur **"Valider"**

**Résultat attendu :**
```
✅ Vérification VERIFIED pour: [userId]
```

### 4. Vérifier dans la DB

```sql
SELECT 
  email,
  verification_status,
  full_name,
  phone,
  professional_card_number
FROM public.users
WHERE email = 'email-du-test@exemple.com';
```

**Tu devrais voir :**
- `verification_status` = `'VERIFIED'` ✅

### 5. Le user validé peut accéder à la marketplace

1. Déconnecte l'admin
2. Reconnecte-toi avec le user de test
3. Va dans **Courses** → **Marketplace**
4. Tu devrais voir les courses disponibles ✅

---

## 🚨 Dépannage

### Erreur persiste après le script

**Cause possible 1 :** Le user à valider n'existe pas dans la DB

**Solution :**
```sql
-- Vérifier que le user existe
SELECT id, email, verification_status
FROM public.users
WHERE id = 'user-id-qui-ne-se-valide-pas';
```

Si le user n'existe pas, il y a un problème avec le trigger `handle_new_user()`.

---

**Cause possible 2 :** L'admin n'est pas vraiment admin

**Solution :**
```sql
-- Vérifier le statut admin
SELECT id, email, is_admin
FROM public.users
WHERE email = 'ton-email-admin@corail.com';

-- Promouvoir en admin si nécessaire
UPDATE public.users
SET is_admin = true
WHERE email = 'ton-email-admin@corail.com';
```

---

**Cause possible 3 :** La fonction `is_current_user_admin()` n'existe pas

**Solution :** Réexécute `FIX_ADMIN_VALIDATION_POLICY.sql`.

---

**Cause possible 4 :** L'app utilise encore l'ancien code

**Solution :** Redémarrer l'app avec cache cleared :
```bash
rm -rf /tmp/metro-* && rm -rf node_modules/.cache
npx expo start --clear
```

---

## 📋 Checklist de résolution

- [ ] Script `FIX_ADMIN_VALIDATION_POLICY.sql` exécuté
- [ ] Fonction `is_current_user_admin` créée
- [ ] 2 policies admin créées (read + update)
- [ ] Ton user a `is_admin = true` dans la DB
- [ ] `SELECT is_current_user_admin()` retourne `true` quand connecté en admin
- [ ] App redémarrée avec cache cleared
- [ ] Test de validation admin effectué
- [ ] Aucune erreur "Cannot coerce"
- [ ] Le user validé a `verification_status = 'VERIFIED'`
- [ ] Le user validé peut accéder à la marketplace

---

## 🎉 Résultat final

Après ce fix, les admins peuvent :

1. ✅ Voir tous les profils en attente de validation
2. ✅ Valider un profil (passe à `VERIFIED`)
3. ✅ Rejeter un profil (passe à `REJECTED`)
4. ✅ Les users validés peuvent accéder à la marketplace

**Pas de récursion infinie** car la fonction utilise `SECURITY DEFINER` ✅

---

## 💡 Pourquoi cette approche fonctionne

**Sans récursion :**
```
1. Admin clique sur "Valider"
2. Supabase vérifie la policy "Admins can update all profiles"
3. La policy appelle is_current_user_admin()
4. La fonction utilise SECURITY DEFINER (bypass RLS) ← Pas de récursion !
5. Elle vérifie directement if user.is_admin = true
6. Retourne true
7. L'UPDATE est autorisé ✅
```

**Avec récursion (ancien code) :**
```
1. Admin clique sur "Valider"
2. Supabase vérifie la policy "Admins can read all profiles"
3. La policy fait une sous-requête SELECT sur users
4. Cette sous-requête déclenche les policies RLS sur users
5. Qui font elles-mêmes une sous-requête SELECT sur users
6. Boucle infinie 🔁
```

---

**Dis-moi quand tu as exécuté le script et on teste la validation ! 🚀**

