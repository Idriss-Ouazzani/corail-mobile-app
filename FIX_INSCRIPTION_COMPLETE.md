# 🚀 Guide Complet : Corriger le flux d'inscription

## 🚨 Problème identifié

Tu rencontres **2 problèmes distincts** lors de l'inscription :

1. ❌ **"Email not confirmed"** → Bloque la connexion après inscription
2. ❌ **Pas de VerificationScreen** → Formulaire VTC manquant

---

## ✅ Solution Complète (3 scripts SQL à exécuter)

Va sur [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor** et exécute **dans cet ordre** :

### 1️⃣ Désactiver la confirmation d'email (FIX URGENT)

Copie et exécute le contenu de : **`FIX_EMAIL_CONFIRMATION_REQUIRED.sql`**

✅ **Ce que ça fait :**
- Auto-confirme tous les nouveaux utilisateurs
- Permet la connexion immédiate sans email de confirmation
- Confirme tous les users existants

### 2️⃣ Ajouter le champ has_accepted_terms (RGPD)

Copie et exécute le contenu de : **`APPLY_HAS_ACCEPTED_TERMS.sql`**

✅ **Ce que ça fait :**
- Ajoute la colonne `has_accepted_terms` à la table `users`
- Met à jour le trigger `handle_new_user()` pour créer les nouveaux users avec :
  - `verification_status = 'UNVERIFIED'` → affiche VerificationScreen
  - `has_accepted_terms = FALSE` → affiche ConsentScreen après

### 3️⃣ Corriger le user ademola@corail.com (OPTIONNEL)

Si tu veux débloquer le user `ademola@corail.com` qui est déjà créé :

Copie et exécute le contenu de : **`FIX_ADEMOLA_USER.sql`**

✅ **Ce que ça fait :**
- Confirme l'email de ademola@corail.com
- Crée/met à jour son profil dans public.users
- Le met à l'état UNVERIFIED pour qu'il voie le VerificationScreen

---

## 🧪 Tester l'inscription (APRÈS avoir exécuté les scripts)

### Étape 1 : Redémarrer l'app

```bash
# Clear cache Metro
npx expo start --clear
```

### Étape 2 : Tester avec un NOUVEAU compte

1. **Déconnecte-toi** complètement (important !)
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
🔍 [AuthContext] Response complète: { verification_status: 'UNVERIFIED', has_accepted_terms: false, ... }
🔍 [AuthContext] verificationStatus: UNVERIFIED
🔍 [AuthContext] has_accepted_terms: false
🔍 [App.tsx] verificationStatus changé: UNVERIFIED
```

**❌ Tu ne devrais PLUS voir :**
```
ERROR Supabase signIn error: [AuthApiError: Email not confirmed]
```

### Étape 4 : Le VerificationScreen s'affiche ✅

Tu devrais maintenant voir le **formulaire de carte VTC** avec :
- Champ "Nom complet"
- Champ "Téléphone"
- Champ "Numéro de carte professionnelle VTC"
- Champ "Numéro SIREN" (optionnel)

### Étape 5 : Soumettre le formulaire VTC

1. Remplis tous les champs obligatoires
2. Clique sur **"Soumettre ma vérification"**
3. Tu devrais voir une alerte : **"Profil créé ! 🎉"**

### Étape 6 : Vérifier la bannière de validation ✅

Après soumission :
1. Le **ConsentScreen** s'affiche (acceptation des termes RGPD)
2. Après acceptation → L'**app normale** s'affiche
3. En haut de l'écran, tu devrais voir la **ValidationBanner** :
   ```
   🕐 Validation en cours...
   Votre profil est en cours de vérification.
   ```

---

## 🎯 Flux d'inscription complet (après les fixes)

```
1. Inscription
   ↓
2. ✅ Auto-confirmation email (nouveau)
   ↓
3. ✅ Connexion automatique
   ↓
4. ✅ VerificationScreen s'affiche (formulaire VTC)
   ↓
5. Soumission du formulaire VTC
   ↓
6. Statut passe à 'PENDING'
   ↓
7. ConsentScreen s'affiche (RGPD)
   ↓
8. Acceptation des termes
   ↓
9. ✅ App normale + ValidationBanner "En cours de validation..."
   ↓
10. Admin valide → statut 'VERIFIED'
   ↓
11. ✅ Accès marketplace débloqué
```

---

## 🔍 Vérification après les scripts SQL

Pour vérifier que tout fonctionne, exécute dans le SQL Editor :

```sql
-- 1. Vérifier le trigger de confirmation d'email
SELECT 
  trigger_name, 
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'auto_confirm_users_trigger';

-- 2. Vérifier que has_accepted_terms existe
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'has_accepted_terms';

-- 3. Vérifier les derniers users créés
SELECT 
  u.email,
  au.email_confirmed_at,
  u.verification_status,
  u.has_accepted_terms,
  u.created_at
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.supabase_auth_id
ORDER BY u.created_at DESC
LIMIT 5;
```

**Résultat attendu :**
- ✅ Trigger `auto_confirm_users_trigger` existe
- ✅ Colonne `has_accepted_terms` existe (type: `boolean`, default: `false`)
- ✅ Nouveaux users ont `email_confirmed_at` renseigné (pas NULL)
- ✅ Nouveaux users ont `verification_status = 'UNVERIFIED'`
- ✅ Nouveaux users ont `has_accepted_terms = FALSE`

---

## 🚨 Dépannage

### Problème 1 : "Email not confirmed" persiste

**Solution :** Exécute manuellement pour tous les users :

```sql
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

### Problème 2 : VerificationScreen ne s'affiche pas

**Cause possible :** Le user a `verification_status = 'PENDING'` ou `'VERIFIED'`

**Solution :** Remettre le user à 'UNVERIFIED' :

```sql
UPDATE public.users
SET verification_status = 'UNVERIFIED'
WHERE email = 'test@example.com';
```

Puis déconnecte-toi et reconnecte-toi.

### Problème 3 : "User not found in public.users"

**Cause :** Le trigger `handle_new_user()` n'a pas fonctionné

**Solution :** Créer manuellement le profil :

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
WHERE email = 'test@example.com'
ON CONFLICT (id) DO NOTHING;
```

---

## 📋 Checklist finale

- [ ] Script `FIX_EMAIL_CONFIRMATION_REQUIRED.sql` exécuté
- [ ] Script `APPLY_HAS_ACCEPTED_TERMS.sql` exécuté
- [ ] Script `FIX_ADEMOLA_USER.sql` exécuté (si besoin)
- [ ] Trigger `auto_confirm_users_trigger` existe
- [ ] Colonne `has_accepted_terms` existe dans `public.users`
- [ ] Tous les users ont `email_confirmed_at` renseigné
- [ ] App redémarrée avec cache cleared (`npx expo start --clear`)
- [ ] Nouveau compte de test créé avec succès
- [ ] VerificationScreen s'affiche avec formulaire VTC
- [ ] Après soumission → ValidationBanner "Validation en cours..."

---

## 🎉 Résultat final

Après avoir appliqué tous les fixes, tu auras un **flux d'inscription complet et fonctionnel** :

1. ✅ Inscription immédiate (sans email de confirmation)
2. ✅ VerificationScreen avec formulaire VTC
3. ✅ ConsentScreen pour accepter les termes RGPD
4. ✅ ValidationBanner "En cours de validation" dans l'app
5. ✅ Validation admin → accès marketplace

---

## 💡 Pour aller plus loin

### Configuration Dashboard Supabase (optionnel)

Tu peux aussi désactiver la confirmation d'email directement dans le Dashboard :

1. Va dans **Authentication** → **Settings**
2. Cherche **"Enable email confirmations"**
3. **Décoche** cette option
4. Clique sur **Save**

Cela rendra le trigger SQL redondant mais garantit que la confirmation d'email est bien désactivée.

---

**Bon courage ! 🚀 Dis-moi si tu as des questions ou si un des scripts ne fonctionne pas.**

