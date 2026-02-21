# 🚀 Fix : Statut VERIFIED non mis à jour dans l'app

## 🚨 Problème

L'utilisateur `mydrissouazzani@gmail.com` :
- ✅ Est `VERIFIED` dans la DB
- ✅ Est `admin` dans la DB
- ❌ Ne peut pas prendre de courses sur la marketplace
- ❌ Voit le message "Votre profil doit être vérifié"

## 🔍 Cause du problème

Le `verificationStatus` dans l'app est **chargé une seule fois au démarrage** (dans `AuthContext`).

Quand un admin valide un profil :
1. ✅ Le statut change dans la DB (`VERIFIED`)
2. ❌ L'app ne recharge PAS automatiquement le statut
3. ❌ L'utilisateur voit toujours `verificationStatus = 'PENDING'` en local

**Code responsable** (`src/hooks/useRideActions.ts` ligne 133) :
```typescript
if (verificationStatus !== 'VERIFIED') {
  toast.warning(
    '⏳ Vérification en cours',
    'Votre profil doit être vérifié...'
  );
  return null;
}
```

---

## ✅ Solution immédiate : Se déconnecter/reconnecter

La solution la plus simple est de **se déconnecter et se reconnecter** :

1. Dans l'app, va dans **Profil**
2. Scroll tout en bas
3. Clique sur **"Se déconnecter"**
4. **Reconnecte-toi** avec le même compte

**Résultat :** Le statut `VERIFIED` sera rechargé depuis la DB ✅

---

## 🔍 Vérification 1 : État dans la DB

Avant de faire quoi que ce soit, **vérifie l'état réel dans la DB** :

### Dans le SQL Editor de Supabase, exécute :

Copie le contenu de **`CHECK_USER_VERIFICATION_STATUS.sql`** ou exécute directement :

```sql
SELECT 
  id,
  email,
  verification_status,
  is_admin,
  has_accepted_terms
FROM public.users
WHERE email = 'mydrissouazzani@gmail.com';
```

### Résultat attendu :

```
| email                      | verification_status | is_admin | has_accepted_terms |
|----------------------------|---------------------|----------|-------------------|
| mydrissouazzani@gmail.com  | VERIFIED            | true     | true              |
```

### Si verification_status n'est PAS 'VERIFIED' :

```sql
UPDATE public.users
SET 
  verification_status = 'VERIFIED',
  is_admin = true,
  has_accepted_terms = true
WHERE email = 'mydrissouazzani@gmail.com';
```

Puis **se déconnecter/reconnecter** dans l'app.

---

## 🔍 Vérification 2 : État dans l'app

Pour voir le statut actuellement chargé dans l'app, regarde les logs Metro quand tu te connectes :

```
🔍 [AuthContext] Response complète: { verification_status: 'VERIFIED', ... }
🔍 [AuthContext] verificationStatus: VERIFIED
```

**Si tu vois `'PENDING'` ou `'UNVERIFIED'` au lieu de `'VERIFIED'`** :
- C'est que l'app a un ancien statut en cache
- **Solution** : Se déconnecter/reconnecter

---

## ✅ Solution permanente : Ajouter un bouton "Rafraîchir"

Pour éviter de devoir se déconnecter/reconnecter à chaque fois, on peut **ajouter un bouton dans la ValidationBanner** qui recharge le statut.

**Bonne nouvelle** : Ce bouton existe déjà ! 🎉

Dans la `ValidationBanner`, il y a un bouton "Actualiser" qui appelle `onRefresh()`, qui appelle `loadVerificationStatus()`.

### Pour recharger le statut :

1. **Si tu vois la ValidationBanner** "Validation en cours..."
2. **Clique sur le bouton "Actualiser"**
3. Le statut sera rechargé depuis la DB

### Si la banner n'est plus visible (car tu es VERIFIED) :

Deux options :
- **Option A** : Se déconnecter/reconnecter (solution rapide)
- **Option B** : Fermer complètement l'app et la relancer (peut ne pas suffire)

---

## 🔧 Solution technique : Realtime (pour plus tard)

Pour que le statut se mette à jour **automatiquement** sans déconnexion, on peut utiliser Supabase Realtime.

Créons un hook qui écoute les changements sur `public.users` :

```typescript
// src/hooks/useVerificationStatusRealtime.ts (à créer)
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useVerificationStatusRealtime(userId: string, onStatusChanged: (newStatus: string) => void) {
  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Écoute des changements de verification_status...');

    const channel = supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Changement détecté:', payload);
          const newStatus = payload.new.verification_status;
          if (newStatus) {
            console.log('✅ Nouveau statut:', newStatus);
            onStatusChanged(newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Arrêt écoute verification_status');
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
```

Puis dans `AuthContext.tsx`, ajouter :

```typescript
// Dans AuthProvider
useVerificationStatusRealtime(user?.id || '', (newStatus) => {
  console.log('🔔 Statut mis à jour en temps réel:', newStatus);
  setVerificationStatus(newStatus);
});
```

**Mais pour l'instant, la solution la plus simple est de se déconnecter/reconnecter.**

---

## 📋 Checklist de résolution

- [ ] Exécuter `CHECK_USER_VERIFICATION_STATUS.sql` pour vérifier la DB
- [ ] Confirmer que `verification_status = 'VERIFIED'` dans la DB
- [ ] Si non VERIFIED : exécuter l'UPDATE pour corriger
- [ ] Se déconnecter de l'app
- [ ] Se reconnecter avec le même compte
- [ ] Vérifier les logs : `verificationStatus: VERIFIED`
- [ ] Essayer de prendre une course sur la marketplace
- [ ] ✅ Ça devrait fonctionner !

---

## 🧪 Test après reconnexion

1. **Connecte-toi** avec `mydrissouazzani@gmail.com`
2. **Va dans Courses** → **Marketplace**
3. **Clique sur une course**
4. **Clique sur "Prendre la course"**

**Résultat attendu :**
```
✅ Course réclamée avec succès
(pas de message "Votre profil doit être vérifié")
```

---

## 💡 Pourquoi ce problème arrive

Le `AuthContext` charge le `verificationStatus` dans un `useEffect` qui ne se déclenche que quand `user` change :

```typescript
useEffect(() => {
  if (user) {
    loadVerificationStatus(); // ← Chargé une seule fois
  }
}, [user]);
```

Quand un admin valide un profil :
- `user` ne change pas (toujours le même user connecté)
- Le `useEffect` ne se déclenche pas
- `loadVerificationStatus()` n'est pas rappelé
- Le statut reste `'PENDING'` en local

**Solution temporaire** : Se déconnecter/reconnecter (force le rechargement)

**Solution permanente** : Realtime (écoute automatique des changements)

---

## 🎯 Action immédiate

1. **Exécute le script SQL** : `CHECK_USER_VERIFICATION_STATUS.sql`
2. **Vérifie que `verification_status = 'VERIFIED'`**
3. **Déconnecte-toi de l'app**
4. **Reconnecte-toi**
5. **Essaye de prendre une course**

Si ça ne marche toujours pas après reconnexion, envoie-moi :
- Le résultat du script SQL
- Les logs Metro au moment de la connexion

---

**Dis-moi ce que donne le script SQL ! 🚀**

