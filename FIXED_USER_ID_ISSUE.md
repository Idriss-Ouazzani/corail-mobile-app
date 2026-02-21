# ✅ Correction du problème `userId: undefined`

## 🐛 Le Problème

Après la migration vers Supabase Auth, l'app utilisait encore `user.uid` (Firebase) au lieu de `user.id` (Supabase).

Cela causait :
- ❌ `userId: undefined` partout dans l'app
- ❌ `null value in column "user_id" violates not-null constraint` dans push_tokens
- ❌ Impossible d'enregistrer les push tokens
- ❌ Realtime ne fonctionnait pas

---

## ✅ Corrections Appliquées

### Fichiers modifiés :

1. **`App.tsx`** (ligne 240)
   ```typescript
   // AVANT
   const currentUserId = user?.uid || '';
   
   // APRÈS
   const currentUserId = user?.id || '';
   ```

2. **`src/components/ProfileTab.tsx`** (3 occurrences)
   ```typescript
   // AVANT
   user?.uid
   
   // APRÈS
   user?.id
   ```

3. **`src/contexts/AuthContext.tsx`** (ligne 106)
   ```typescript
   // AVANT
   userId: user.uid
   
   // APRÈS
   userId: user.id
   ```

4. **`src/hooks/useNotifications.ts`** (2 occurrences)
   ```typescript
   // AVANT
   await PushTokenService.registerPushToken(user.uid);
   
   // APRÈS
   await PushTokenService.registerPushToken(user.id);
   ```

5. **`src/screens/GroupDetailScreen.tsx`**
   ```typescript
   // AVANT
   import { firebaseAuth } from '../services/firebase';
   const currentUserId = firebaseAuth.currentUser?.uid;
   
   // APRÈS
   import { useAuth } from '../contexts/AuthContext';
   const { user } = useAuth();
   const currentUserId = user?.id;
   ```

---

## 🚀 Étapes pour Tester

### 1. Exécute le script SQL de correction

Ouvre **Supabase SQL Editor** et exécute **`FIX_ALL_USER_ISSUES.sql`** :
- Corrige la récursion infinie dans les RLS policies
- Valide ton compte et te rend admin
- Réactive le trigger pour les futurs users

⚠️ **N'oublie pas de remplacer `mydrissouazzani@gmail.com` par ton email !**

### 2. Redémarre l'app

```bash
# Si l'app tourne déjà
# Force quit l'app sur ton device/simulateur

# Relance Metro
npm start
# OU
npx expo start
```

### 3. Reconnecte-toi

- Déconnecte-toi si tu es déjà connecté
- Reconnecte-toi avec ton email validé
- L'app devrait maintenant fonctionner normalement

### 4. Vérifie les logs

Tu devrais voir :
```
✅ Expo Push Token obtenu: ExponentPushToken[...]
📱 Enregistrement token push: {"userId": "uuid-de-supabase", ...}
✅ Token push enregistré dans Supabase
```

Au lieu de :
```
❌ "userId": undefined
❌ null value in column "user_id"
```

---

## ✅ Résultats Attendus

Après ces corrections + le script SQL :

| Avant | Après |
|-------|-------|
| ❌ `userId: undefined` | ✅ `userId: "uuid-supabase"` |
| ❌ Push tokens non enregistrés | ✅ Push tokens OK |
| ❌ Realtime ne fonctionnait pas | ✅ Realtime actif |
| ❌ Récursion infinie RLS | ✅ RLS policies correctes |
| ❌ Compte non validé | ✅ Compte validé + admin |

---

## 📋 Checklist Finale

- [ ] Script SQL `FIX_ALL_USER_ISSUES.sql` exécuté dans Supabase
- [ ] App redémarrée (force quit + relance)
- [ ] Reconnexion effectuée
- [ ] Logs vérifiés (plus d'erreur `userId: undefined`)
- [ ] Push token enregistré avec succès
- [ ] Realtime fonctionne

---

## 🔍 Si ça ne marche toujours pas

### Vérifie dans Supabase SQL Editor :

```sql
-- 1. Ton compte est-il validé ?
SELECT 
  au.email,
  au.email_confirmed_at,
  pu.verification_status,
  pu.is_admin
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'ton-email@example.com';
-- Tu dois voir: email_confirmed_at = NOW, verification_status = 'VERIFIED', is_admin = true

-- 2. Le trigger est-il activé ?
SELECT 
  tgname,
  CASE WHEN tgenabled = 'O' THEN '✅ Activé' ELSE '❌ Désactivé' END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
-- Tu dois voir: status = '✅ Activé'

-- 3. Les policies sont-elles correctes ?
SELECT policyname FROM pg_policies WHERE tablename = 'users';
-- Tu NE dois PAS voir: "Admins can read all profiles" (récursive)
```

---

## 💡 Explication Technique

### Différence entre Firebase Auth et Supabase Auth :

| Firebase Auth | Supabase Auth |
|---------------|---------------|
| `user.uid` | `user.id` |
| String custom | UUID standard |
| `currentUser?.uid` | `user?.id` |

Supabase utilise des **UUIDs standards** pour les IDs utilisateurs, tandis que Firebase utilise des **strings custom**.

Après la migration, tous les appels à `user.uid` devaient être remplacés par `user.id`.

---

**Tout est corrigé ! L'app devrait maintenant fonctionner normalement.** 🎉

