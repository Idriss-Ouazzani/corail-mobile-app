# 🧪 Guide de Test - Migration Supabase Auth

Checklist complète pour tester l'authentification après la migration.

---

## 📋 Pré-requis

### 1. Exécuter le SQL de setup

Dans **Supabase Dashboard → SQL Editor**, exécute :

```bash
supabase/migrations/020_setup_auth_policies.sql
```

✅ Vérifie que :
- Les policies RLS sont créées
- Le trigger `handle_new_user` est actif
- Les tables `auth.users` et `public.users` sont liées

### 2. Configurer l'URL de redirection (pour OAuth)

Dans **Supabase Dashboard → Authentication → URL Configuration** :

Ajoute les URLs de redirection :
```
http://localhost:8081
exp://localhost:19000
https://ton-domaine.com (production)
```

### 3. Désactiver la confirmation d'email (optionnel, pour le dev)

Dans **Supabase Dashboard → Authentication → Providers → Email** :

- ✅ Désactive "Confirm email" (dev seulement)
- ❌ Garde-le activé en production !

---

## 🧪 Tests à effectuer

### Test 1 : Inscription (Sign Up)

1. Lance l'app : `npx expo start`
2. Clique sur "S'inscrire"
3. Remplis :
   - Nom complet : `Test User`
   - Email : `test@corail.com`
   - Mot de passe : `test123456`
   - Confirmer mot de passe : `test123456`
4. Clique sur "Créer mon compte"

**✅ Résultat attendu :**
```
✅ Compte Supabase créé
✅ Compte créé avec succès
✅ Utilisateur Supabase connecté: test@corail.com
✅ Utilisateur créé/mis à jour dans Supabase (via trigger)
```

**Vérifications :**
- L'utilisateur apparaît dans **Supabase → Authentication → Users**
- L'utilisateur apparaît dans **Supabase → Table Editor → users**
- `verification_status` = `UNVERIFIED`

---

### Test 2 : Connexion (Sign In)

1. Déconnecte-toi
2. Clique sur "Se connecter"
3. Entre :
   - Email : `test@corail.com`
   - Mot de passe : `test123456`
4. Clique sur "Se connecter"

**✅ Résultat attendu :**
```
✅ Utilisateur Supabase connecté: test@corail.com
```

---

### Test 3 : Session persistante

1. Connecte-toi
2. Ferme l'app (CMD+Q)
3. Relance l'app

**✅ Résultat attendu :**
- Tu restes connecté automatiquement
- Pas besoin de re-saisir le mot de passe

---

### Test 4 : Déconnexion (Sign Out)

1. Connecté, va dans Profil
2. Clique sur "Se déconnecter"

**✅ Résultat attendu :**
```
✅ Déconnexion réussie
❌ Utilisateur Supabase déconnecté - Cache nettoyé
```

- Tu reviens à l'écran de connexion
- Les données utilisateur sont nettoyées

---

### Test 5 : Erreurs de connexion

**Mauvais mot de passe :**
- Email : `test@corail.com`
- Mot de passe : `wrongpassword`

**✅ Résultat attendu :**
```
❌ Email ou mot de passe incorrect
```

**Compte inexistant :**
- Email : `nonexistent@test.com`
- Mot de passe : `anything`

**✅ Résultat attendu :**
```
❌ Email ou mot de passe incorrect
```

---

### Test 6 : Real time fonctionne (avec auth!)

1. Connecte-toi avec un chauffeur vérifié (Device 1)
2. Depuis un autre compte, crée une course marketplace
3. **Vérifie que le modal apparaît** sur Device 1

**✅ Résultat attendu :**
```
📢 [REALTIME] Nouvelle course marketplace reçue: {...}
🔍 [REALTIME] creator_id: xxx | currentUserId: yyy
```

✅ **Le Realtime fonctionne maintenant car `auth.uid()` est défini !**

---

## 🔍 Debug

### Voir les logs Supabase Auth

Dans la console, tu devrais voir :

```javascript
// Connexion réussie
✅ Utilisateur Supabase connecté: email@example.com

// Token d'accès
console.log(await supabase.auth.getSession());
// { access_token: "eyJhbGc...", refresh_token: "..." }

// User actuel
console.log(await supabase.auth.getUser());
// { user: { id: "uuid", email: "...", user_metadata: {...} } }
```

### Vérifier les RLS Policies

```sql
-- Voir si l'auth fonctionne
SELECT auth.uid(); -- Doit retourner un UUID quand connecté

-- Tester la policy rides
SELECT * FROM public.rides
WHERE visibility = 'PUBLIC'
AND status = 'PUBLISHED';
-- Doit retourner les courses (pas d'erreur RLS)
```

---

## ❌ Problèmes courants

### Problème 1 : "JWT expired"

**Cause :** Le token a expiré (après 1h par défaut)

**Solution :** Relance l'app, le token devrait se rafraîchir automatiquement

### Problème 2 : "Row Level Security policy violation"

**Cause :** Les policies RLS bloquent l'accès

**Solution :**
1. Vérifie que le SQL de setup est bien exécuté
2. Vérifie que `auth.uid()` retourne un UUID :
   ```sql
   SELECT auth.uid();
   ```
3. Si NULL → l'utilisateur n'est pas authentifié côté Supabase

### Problème 3 : "Email rate limit exceeded"

**Cause :** Trop de tentatives d'inscription avec le même email

**Solution :** Attends 1 minute ou utilise un autre email

### Problème 4 : Realtime ne reçoit toujours pas les messages

**Cause :** Les policies RLS bloquent encore

**Solution :**
1. Vérifie que la policy "Authenticated users can read public rides" est active
2. Test manuel :
   ```sql
   -- Dans Supabase SQL Editor, en étant connecté
   SELECT * FROM public.rides WHERE visibility = 'PUBLIC';
   ```

---

## 📊 Métriques de succès

✅ Tous les tests passent
✅ Realtime fonctionne avec auth
✅ Les RLS policies protègent correctement les données
✅ La session persiste entre les relances
✅ Les erreurs sont bien gérées

---

## 🚀 Prochaine étape

Si tous les tests passent → **Prêt pour le déploiement !**

📝 Voir : `MIGRATION_USERS_FIREBASE_TO_SUPABASE.md` pour migrer les utilisateurs existants.

