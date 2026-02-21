# 📋 Scripts SQL à exécuter dans l'ordre

## 🎯 Problèmes résolus

1. ✅ Email not confirmed (bloque la connexion)
2. ✅ has_accepted_terms manquant (bloque le flux RGPD)
3. ✅ Récursion infinie RLS (bloque la soumission VTC)
4. ✅ Admins ne peuvent pas valider les profils

---

## 🚀 Exécuter dans cet ordre exact

Va sur [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**

### 1️⃣ `FIX_EMAIL_CONFIRMATION_REQUIRED.sql`
**But :** Auto-confirmer les emails pour permettre la connexion immédiate

**Copie et exécute le contenu de ce fichier**

**Résultat attendu :**
```
✅ Trigger auto_confirm_users_trigger créé
✅ Tous les users existants confirmés
```

---

### 2️⃣ `APPLY_HAS_ACCEPTED_TERMS.sql`
**But :** Ajouter la colonne `has_accepted_terms` pour le flux RGPD

**Copie et exécute le contenu de ce fichier**

**Résultat attendu :**
```
✅ Colonne has_accepted_terms créée
✅ Trigger handle_new_user mis à jour
```

---

### 3️⃣ `FIX_RLS_NO_RECURSION.sql`
**But :** Supprimer les policies RLS récursives

**Copie et exécute le contenu de ce fichier**

**Résultat attendu :**
```
✅ 3 policies créées (sans récursion)
```

---

### 4️⃣ `FIX_ADMIN_VALIDATION_POLICY.sql`
**But :** Permettre aux admins de valider les profils (SANS récursion)

**Copie et exécute le contenu de ce fichier**

**Résultat attendu :**
```
✅ Fonction is_current_user_admin créée
✅ 2 policies admin créées
```

---

### 5️⃣ `ADD_CLIENT_EMAIL_COMPLETE.sql` ⭐ NOUVEAU
**But :** Ajouter la colonne `client_email` aux tables rides ET personal_rides

**Copie et exécute le contenu de ce fichier**

**Résultat attendu :**
```
✅ Colonne client_email créée dans rides
✅ Colonne client_email créée dans personal_rides
✅ Index créés
```

**IMPORTANT :** Après ce script, **redémarre complètement l'app** pour que les changements soient pris en compte.

---

### 6️⃣ (Optionnel) `FIX_ADEMOLA_USER.sql`
**But :** Débloquer le user ademola@corail.com

**Copie et exécute le contenu de ce fichier SI tu veux débloquer ce user spécifique**

---

## ✅ Vérification finale

Exécute cette requête pour vérifier que tout est en place :

```sql
-- 1. Vérifier les triggers
SELECT 
  trigger_name
FROM information_schema.triggers
WHERE trigger_name IN ('auto_confirm_users_trigger', 'on_auth_user_created')
ORDER BY trigger_name;

-- 2. Vérifier la colonne has_accepted_terms
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'has_accepted_terms';

-- 3. Vérifier les policies RLS
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 4. Vérifier la fonction admin
SELECT 
  proname,
  prosecdef
FROM pg_proc
WHERE proname = 'is_current_user_admin';

-- 5. Vérifier que ton user est admin
SELECT 
  email,
  is_admin
FROM public.users
WHERE email = 'ton-email-admin@corail.com';
```

**Résultat attendu :**

**Triggers (2) :**
- `auto_confirm_users_trigger`
- `on_auth_user_created`

**Colonne has_accepted_terms :**
- `column_name`: `has_accepted_terms`
- `data_type`: `boolean`
- `column_default`: `false`

**Policies RLS (5) :**
1. `Admins can read all profiles` (SELECT)
2. `Admins can update all profiles` (UPDATE)
3. `Authenticated users can read basic profiles` (SELECT)
4. `Users can read own profile` (SELECT)
5. `Users can update own profile` (UPDATE)

**Fonction admin :**
- `proname`: `is_current_user_admin`
- `prosecdef`: `true` (SECURITY DEFINER)

**Ton user :**
- `is_admin`: `true` ✅

---

## 🔧 Si ton user n'est pas admin

Promeus-le avec cette requête :

```sql
UPDATE public.users
SET is_admin = true
WHERE email = 'ton-email-admin@corail.com';
```

---

## 🚀 Redémarrer l'app après les scripts

```bash
# Effacer le cache Metro
rm -rf /tmp/metro-* && rm -rf node_modules/.cache

# Redémarrer Expo
npx expo start --clear
```

---

## 🧪 Tests à effectuer après les scripts

### Test 1 : Inscription d'un nouveau user

1. Crée un nouveau compte
2. **Résultat attendu :**
   - ✅ Pas d'erreur "Email not confirmed"
   - ✅ Connexion immédiate
   - ✅ VerificationScreen s'affiche

### Test 2 : Soumission formulaire VTC

1. Remplis le formulaire VTC
2. Clique sur "Soumettre"
3. **Résultat attendu :**
   - ✅ Pas d'erreur RLS
   - ✅ Pas d'erreur "infinite recursion"
   - ✅ Message "Profil créé !"
   - ✅ ConsentScreen s'affiche

### Test 3 : Acceptation des termes

1. Accepte les termes RGPD
2. **Résultat attendu :**
   - ✅ App normale s'affiche
   - ✅ ValidationBanner "Validation en cours..." visible

### Test 4 : Validation admin

1. Connecte-toi avec ton compte admin
2. Va dans Profil → Admin Panel
3. Clique sur "Valider" pour un profil en attente
4. **Résultat attendu :**
   - ✅ Pas d'erreur "Cannot coerce"
   - ✅ Message "Profil validé avec succès !"
   - ✅ Le user passe à `VERIFIED` dans la DB

### Test 5 : Accès marketplace (user validé)

1. Déconnecte l'admin
2. Reconnecte avec le user validé
3. Va dans Courses → Marketplace
4. **Résultat attendu :**
   - ✅ Les courses marketplace sont visibles
   - ✅ Pas de message "Profil en cours de validation"

---

## 📊 Récapitulatif du flux complet

```
1. Inscription
   └─> Auto-confirmation email ✅
   └─> Connexion immédiate ✅
   
2. VerificationScreen
   └─> Formulaire VTC affiché ✅
   └─> Soumission réussie (pas d'erreur RLS) ✅
   
3. ConsentScreen
   └─> Acceptation des termes RGPD ✅
   
4. App normale
   └─> ValidationBanner visible ✅
   └─> Status = PENDING ✅
   
5. Admin valide
   └─> Pas d'erreur "Cannot coerce" ✅
   └─> Status = VERIFIED ✅
   
6. User validé
   └─> Accès marketplace débloqué ✅
```

---

## 🆘 Support

Si un problème persiste après avoir exécuté tous les scripts :

1. **Vérifie les logs Metro** : `npx expo start --clear`
2. **Vérifie la DB** : Exécute les requêtes de vérification ci-dessus
3. **Consulte les guides détaillés** :
   - `FIX_INSCRIPTION_COMPLETE.md` (flux complet)
   - `FIX_RLS_RECURSION_GUIDE.md` (récursion RLS)
   - `FIX_ADMIN_VALIDATION_ERROR.md` (validation admin)
   - `DISABLE_EMAIL_CONFIRMATION_GUIDE.md` (confirmation email)

---

**Bonne chance ! 🚀 Exécute les 4 scripts dans l'ordre et teste le flux complet.**

