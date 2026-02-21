# 🔍 Diagnostic du flux de vérification

## 🚨 Problème rapporté
- ❌ Pas de formulaire VTC (VerificationScreen) à l'inscription
- ❌ Pas de bannière de validation en attente (ValidationBanner)

## 🎯 Flux d'inscription normal attendu

```
1. Inscription → auth.users créé via Supabase Auth
2. Trigger handle_new_user() → public.users créé avec verification_status='UNVERIFIED'
3. App.tsx détecte verificationStatus='UNVERIFIED' → affiche VerificationScreen
4. User soumet son code VTC → verification_status passe à 'PENDING'
5. App.tsx détecte verificationStatus='PENDING' → affiche app + ValidationBanner
6. Admin valide → verification_status passe à 'VERIFIED'
7. User peut accéder à la marketplace
```

## 🔍 Diagnostic étape par étape

### Étape 1: Vérifier que le trigger fonctionne

Exécuter dans le Dashboard Supabase (SQL Editor):

```sql
-- Vérifier que le trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Vérifier un utilisateur récent
SELECT 
  id,
  email,
  verification_status,
  has_accepted_terms,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu:**
- Le trigger `on_auth_user_created` existe
- Les nouveaux users ont `verification_status = 'UNVERIFIED'`
- Les nouveaux users ont `has_accepted_terms = FALSE`

### Étape 2: Appliquer le fix si has_accepted_terms manque

Si la colonne `has_accepted_terms` n'existe pas ou est NULL:

1. Ouvrir le Dashboard Supabase
2. Aller dans SQL Editor
3. Copier/coller le contenu de `APPLY_HAS_ACCEPTED_TERMS.sql`
4. Exécuter

### Étape 3: Tester l'inscription d'un nouveau user

1. Déconnecter l'app (si déjà connecté)
2. S'inscrire avec un nouveau compte
3. Observer les logs dans Metro:

```
🔍 [AuthContext] Response complète: { verification_status: 'UNVERIFIED', has_accepted_terms: false, ... }
🔍 [AuthContext] verificationStatus: UNVERIFIED
🔍 [AuthContext] has_accepted_terms: false
🔍 [App.tsx] verificationStatus changé: UNVERIFIED
```

4. **Résultat attendu:** Le `VerificationScreen` s'affiche avec le formulaire VTC

### Étape 4: Vérifier après soumission VTC

1. Remplir le formulaire VTC et soumettre
2. Observer les logs:

```
🔍 [AuthContext] Response complète: { verification_status: 'PENDING', has_accepted_terms: false, ... }
🔍 [AuthContext] verificationStatus: PENDING
🔍 [App.tsx] verificationStatus changé: PENDING
```

3. **Résultat attendu:**
   - Le `ConsentScreen` s'affiche (acceptation des termes RGPD)
   - Après acceptation des termes → App normale avec `ValidationBanner` en haut

## 🐛 Problèmes possibles et solutions

### Problème 1: verification_status est NULL ou autre chose

**Cause:** Le trigger `handle_new_user()` ne s'exécute pas correctement

**Solution:**
```sql
-- Réappliquer le trigger
-- Copier le contenu de APPLY_HAS_ACCEPTED_TERMS.sql
```

### Problème 2: has_accepted_terms n'existe pas

**Cause:** Colonne manquante dans la DB

**Solution:** Exécuter `APPLY_HAS_ACCEPTED_TERMS.sql`

### Problème 3: verificationStatus reste à 'UNVERIFIED' après soumission

**Cause:** `apiClient.submitVerification()` ne met pas à jour le statut

**Solution:** Vérifier dans `src/services/supabaseApi.ts` la fonction `submitVerification()`

### Problème 4: L'app ne détecte pas le changement de verificationStatus

**Cause:** `loadVerificationStatus()` n'est pas appelé après soumission

**Solution:** Vérifier que `VerificationScreen` appelle bien `onSuccess()` qui appelle `loadVerificationStatus()`

## 📝 Vérifier manuellement un user dans la DB

```sql
-- Remplacer 'user@example.com' par l'email du user à vérifier
SELECT 
  id,
  email,
  full_name,
  phone,
  professional_card_number,
  siren,
  verification_status,
  verification_submitted_at,
  has_accepted_terms,
  is_admin,
  created_at,
  updated_at
FROM public.users
WHERE email = 'user@example.com';
```

## 🚀 Recharger l'app après les changements

```bash
# Effacer le cache Metro
rm -rf /tmp/metro-* && rm -rf node_modules/.cache

# Redémarrer Expo
npx expo start --clear
```

## ✅ Checklist de validation

- [ ] La colonne `has_accepted_terms` existe dans `public.users`
- [ ] Le trigger `on_auth_user_created` existe et inclut `has_accepted_terms`
- [ ] Les nouveaux users ont `verification_status='UNVERIFIED'` et `has_accepted_terms=FALSE`
- [ ] Le `VerificationScreen` s'affiche à l'inscription
- [ ] Après soumission VTC, le statut passe à `PENDING`
- [ ] Le `ConsentScreen` s'affiche après le `VerificationScreen`
- [ ] Après acceptation des termes, la `ValidationBanner` s'affiche
- [ ] Les logs de debug s'affichent dans Metro

## 📞 Si le problème persiste

Envoyer les logs suivants:
1. Console Metro (tous les logs `🔍 [AuthContext]` et `🔍 [App.tsx]`)
2. Résultat de la query SQL:
```sql
SELECT id, email, verification_status, has_accepted_terms, created_at
FROM public.users
WHERE email = 'votre_email@exemple.com';
```

