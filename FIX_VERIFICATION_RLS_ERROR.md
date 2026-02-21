# 🚀 Fix : Erreur RLS lors de la soumission de vérification VTC

## 🚨 Problème

Après avoir rempli le formulaire de vérification VTC, l'erreur suivante apparaît :

```
ERROR Error submitting verification: [Error: new row violates row-level security policy for table "users"]
```

## 🔍 Cause du problème

Le problème vient de **2 sources** :

### 1. `submitVerification()` utilisait `upsert` au lieu de `update`

**Avant :**
```typescript
const { data, error } = await supabase
  .from('users')
  .upsert({
    id: currentUserId,
    ...verificationData,
    verification_status: 'PENDING',
  })
```

**Problème :** `upsert` essaie de faire un `INSERT` si le row n'existe pas, ce qui échoue avec les politiques RLS car :
- Le user existe déjà (créé par le trigger `handle_new_user()`)
- Il n'y a pas de policy `INSERT` pour les utilisateurs normaux
- `upsert` peut causer des conflits avec RLS même si le row existe

**Solution :** Utiliser `update` car le user existe toujours déjà.

### 2. Politiques RLS manquantes ou incorrectes

Si la policy `"Users can update own profile"` n'existe pas ou est mal configurée, l'UPDATE échoue.

---

## ✅ Solution Complète

### Étape 1 : Code corrigé (déjà fait ✅)

La fonction `submitVerification()` dans `src/services/supabaseApi.ts` a été corrigée pour utiliser `update` :

```typescript
// ✅ Utiliser UPDATE au lieu de UPSERT
const { data, error } = await supabase
  .from('users')
  .update({
    full_name: verificationData.full_name,
    phone: verificationData.phone,
    siren: verificationData.siren,
    professional_card_number: verificationData.professional_card_number,
    verification_status: 'PENDING',
    verification_submitted_at: new Date().toISOString(),
  })
  .eq('id', currentUserId)
  .select()
  .single();
```

### Étape 2 : Vérifier/Corriger les politiques RLS dans Supabase

Exécute le script **`FIX_USERS_RLS_POLICIES.sql`** dans le **SQL Editor** de Supabase.

Ce script :
- ✅ S'assure que RLS est activé sur `public.users`
- ✅ Crée/recrée la policy `"Users can update own profile"` (CRITIQUE)
- ✅ Crée les autres policies nécessaires (lecture, admins)

### Étape 3 : Redémarrer l'app

```bash
# Effacer le cache Metro
npx expo start --clear
```

### Étape 4 : Retester la soumission VTC

1. **Déconnecte-toi** (si déjà connecté)
2. **Connecte-toi** avec le compte qui a eu l'erreur (ou crée un nouveau compte)
3. **Remplis le formulaire de vérification VTC** :
   - Nom complet
   - Téléphone
   - Numéro de carte professionnelle VTC
   - Numéro SIREN (optionnel)
4. **Clique sur "Soumettre ma vérification"**

**Résultat attendu :**
```
✅ Vérification soumise pour: [email ou userId]
🎉 Profil créé !
Vous pouvez maintenant utiliser l'application. Votre profil sera validé sous 24-48h...
```

---

## 🔍 Vérification post-fix

### Dans le SQL Editor, vérifie que les policies existent :

```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

**Résultat attendu :**
```
| policyname                              | cmd    |
|-----------------------------------------|--------|
| Admins can read all profiles            | SELECT |
| Authenticated users can read basic profiles | SELECT |
| Users can read own profile              | SELECT |
| Users can update own profile            | UPDATE | ← CRITIQUE
```

### Vérifie qu'un user peut se mettre à jour :

```sql
-- Remplace l'ID par celui de ton user de test
SELECT 
  id,
  email,
  full_name,
  phone,
  professional_card_number,
  verification_status
FROM public.users
WHERE id = 'ton-user-id-ici';
```

Après soumission du formulaire, tu devrais voir :
- `full_name`, `phone`, `professional_card_number` renseignés
- `verification_status` = `'PENDING'`
- `verification_submitted_at` renseigné

---

## 🧪 Test complet du flux d'inscription

### 1. Inscription
```
✅ Compte créé avec succès
✅ Connexion réussie !
🔍 verificationStatus: UNVERIFIED
```

### 2. VerificationScreen s'affiche
- Formulaire avec champs VTC ✅

### 3. Soumission du formulaire
```
📱 Enregistrement token push...
✅ Token push enregistré
✅ Vérification soumise pour: [email]
🎉 Profil créé !
```

### 4. ConsentScreen s'affiche
- Acceptation des termes RGPD ✅

### 5. App normale + ValidationBanner
```
🕐 Validation en cours...
Votre profil est en cours de vérification.
```

---

## 🚨 Dépannage

### Erreur persiste après le fix

**Cause possible 1 :** Les politiques RLS ne sont pas correctement créées

**Solution :**
```sql
-- Vérifier que la policy UPDATE existe
SELECT * FROM pg_policies 
WHERE tablename = 'users' 
AND cmd = 'UPDATE';
```

Si elle n'existe pas, réexécute `FIX_USERS_RLS_POLICIES.sql`.

---

**Cause possible 2 :** Le user n'existe pas dans `public.users`

**Solution :**
```sql
-- Vérifier que le user existe
SELECT id, email, verification_status 
FROM public.users 
WHERE email = 'ton-email@exemple.com';
```

Si le user n'existe pas, c'est que le trigger `handle_new_user()` n'a pas fonctionné.

Crée le user manuellement :
```sql
INSERT INTO public.users (
  id,
  supabase_auth_id,
  email,
  full_name,
  verification_status,
  has_accepted_terms,
  credits,
  created_at,
  updated_at
)
SELECT 
  id::text,
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  'UNVERIFIED',
  FALSE,
  2,
  created_at,
  NOW()
FROM auth.users
WHERE email = 'ton-email@exemple.com'
ON CONFLICT (id) DO NOTHING;
```

---

**Cause possible 3 :** L'app utilise encore l'ancien code avec `upsert`

**Solution :** Redémarrer l'app avec cache cleared :
```bash
rm -rf /tmp/metro-* && rm -rf node_modules/.cache
npx expo start --clear
```

---

## 📋 Checklist de résolution

- [ ] Script `FIX_USERS_RLS_POLICIES.sql` exécuté dans Supabase
- [ ] Policy `"Users can update own profile"` existe (commande `UPDATE`)
- [ ] Code `submitVerification` utilise `update` au lieu de `upsert`
- [ ] App redémarrée avec cache cleared
- [ ] Nouveau test de soumission VTC effectué
- [ ] Aucune erreur RLS
- [ ] `verification_status` passe à `'PENDING'` dans la DB
- [ ] ConsentScreen s'affiche après soumission
- [ ] ValidationBanner visible dans l'app

---

## 🎉 Résultat final

Après avoir appliqué ce fix, le flux complet d'inscription fonctionne :

1. ✅ Inscription sans confirmation d'email
2. ✅ VerificationScreen avec formulaire VTC
3. ✅ Soumission réussie (plus d'erreur RLS)
4. ✅ ConsentScreen pour RGPD
5. ✅ App normale + ValidationBanner
6. ✅ Admin valide → accès marketplace

---

**Bon courage ! 🚀 Dis-moi si l'erreur persiste après avoir exécuté `FIX_USERS_RLS_POLICIES.sql`.**

