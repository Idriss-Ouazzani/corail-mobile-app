# 🚀 Guide : Désactiver la confirmation d'email Supabase

## 🚨 Problème

```
ERROR Supabase signIn error: [AuthApiError: Email not confirmed]
LOG 📧 Email de confirmation requis: Veuillez confirmer votre email
```

Les nouveaux utilisateurs ne peuvent pas se connecter car Supabase exige la confirmation d'email.

---

## ✅ Solution 1 : Désactiver via le Dashboard (RECOMMANDÉ)

### Étape 1 : Aller dans les paramètres Auth

1. Ouvre [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet **Corail**
3. Va dans **Authentication** (menu gauche)
4. Clique sur **Settings** (onglet en haut)
5. Scroll jusqu'à **Email Settings**

### Étape 2 : Désactiver la confirmation d'email

Cherche l'option **"Enable email confirmations"** ou **"Confirm email"** et :
- **Décoche** cette option
- Ou mets-la sur **"Disabled"**

### Étape 3 : Sauvegarder

Clique sur **Save** en bas de la page.

---

## ✅ Solution 2 : Auto-confirmation via SQL (ALTERNATIVE)

Si tu ne trouves pas l'option dans le Dashboard, ou si tu veux forcer l'auto-confirmation :

### Étape 1 : Exécuter le script SQL

1. Va dans **SQL Editor** du Dashboard Supabase
2. Copie le contenu de **`FIX_EMAIL_CONFIRMATION_REQUIRED.sql`**
3. Exécute le script

Ce script fait 3 choses :
- ✅ Crée un trigger qui auto-confirme les nouveaux utilisateurs
- ✅ Confirme tous les utilisateurs existants
- ✅ Permet la connexion immédiate sans email de confirmation

### Étape 2 : Vérifier

Exécute cette requête pour vérifier :

```sql
-- Vérifier que tous les users sont confirmés
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

**Résultat attendu :**
- `email_confirmed_at` n'est **pas NULL**

---

## 🧪 Tester l'inscription

### Étape 1 : Redémarrer l'app

```bash
# Clear cache
npx expo start --clear
```

### Étape 2 : Créer un nouveau compte

1. Déconnecte-toi (si connecté)
2. Clique sur **"Créer un compte"**
3. Remplis le formulaire :
   - Nom : `Test User`
   - Email : `test@example.com`
   - Mot de passe : `Test123!`
4. Clique sur **"Créer mon compte"**

### Étape 3 : Vérifier les logs

Dans Metro, tu devrais voir :

```
✅ Compte Supabase créé: test@example.com
✅ Compte créé avec succès
🔄 Tentative de connexion automatique...
✅ Connexion réussie !
🔍 [AuthContext] Response complète: { verification_status: 'UNVERIFIED', ... }
🔍 [App.tsx] verificationStatus changé: UNVERIFIED
```

**Et surtout, tu ne devrais PLUS voir :**
```
❌ ERROR Supabase signIn error: [AuthApiError: Email not confirmed]
```

### Étape 4 : Le VerificationScreen devrait s'afficher

Tu devrais maintenant voir le **formulaire de carte VTC** ✅

---

## 🔍 Debug : Si ça ne marche toujours pas

### 1. Vérifier l'état de l'email dans auth.users

```sql
SELECT 
  email,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'ademola@corail.com';
```

**Si `email_confirmed_at` est NULL**, exécute manuellement :

```sql
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'ademola@corail.com';
```

### 2. Vérifier que le user existe dans public.users

```sql
SELECT 
  id,
  email,
  verification_status,
  has_accepted_terms
FROM public.users
WHERE email = 'ademola@corail.com';
```

**Si le user n'existe pas**, c'est que le trigger `handle_new_user()` n'a pas fonctionné.

Exécute :

```sql
-- Créer manuellement le user dans public.users
INSERT INTO public.users (
  id,
  supabase_auth_id,
  email,
  full_name,
  verification_status,
  has_accepted_terms,
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
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'ademola@corail.com'
ON CONFLICT (id) DO NOTHING;
```

### 3. Forcer la connexion dans l'app

Si l'email est confirmé mais que l'app ne te laisse toujours pas te connecter :

1. **Déconnecte-toi complètement**
2. **Ferme Expo Go**
3. **Redémarre Metro** : `npx expo start --clear`
4. **Réouvre Expo Go**
5. **Connecte-toi** avec `ademola@corail.com`

---

## 📋 Checklist de résolution

- [ ] Option "Enable email confirmations" désactivée dans Dashboard > Auth > Settings
- [ ] Script `FIX_EMAIL_CONFIRMATION_REQUIRED.sql` exécuté
- [ ] Trigger `auto_confirm_users_trigger` créé
- [ ] Tous les users ont `email_confirmed_at` renseigné (pas NULL)
- [ ] Le user `ademola@corail.com` existe dans `auth.users` ET `public.users`
- [ ] L'app a été redémarrée avec cache cleared
- [ ] La connexion fonctionne sans erreur "Email not confirmed"
- [ ] Le VerificationScreen s'affiche après connexion

---

## 🎯 Résultat attendu

Après avoir appliqué ces fixes :

1. ✅ Inscription immédiate sans email de confirmation
2. ✅ Connexion automatique après inscription
3. ✅ VerificationScreen s'affiche avec le formulaire VTC
4. ✅ Après soumission → ValidationBanner "En cours de validation"

---

## 💡 Note pour la production

⚠️ **Attention** : Pour la production, tu voudras peut-être **réactiver** la confirmation d'email pour plus de sécurité.

Pour réactiver :

1. **Dashboard** : Réactiver "Enable email confirmations"
2. **SQL** : Supprimer le trigger

```sql
DROP TRIGGER IF EXISTS auto_confirm_users_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user();
```

Mais pour le développement et les tests, c'est mieux de laisser l'auto-confirmation activée.

