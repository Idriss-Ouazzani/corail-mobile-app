# 🚨 URGENT: Fix statut VERIFIED de mydrissouazzani@gmail.com

## 🎯 Problème

Ton compte `mydrissouazzani@gmail.com` n'est plus VERIFIED après avoir fait les modifications.

---

## ✅ Solution RAPIDE (2 minutes)

### Étape 1 : Exécute le script SQL

**Ouvre [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor**

**Copie et exécute le contenu de `FIX_MYDRISS_VERIFIED_NOW.sql` :**

```sql
-- Remettre à VERIFIED + ADMIN
UPDATE public.users
SET 
  verification_status = 'VERIFIED',
  is_admin = TRUE,
  siren = COALESCE(siren, '123456789'),
  professional_card_number = COALESCE(professional_card_number, 'VTC000001'),
  verification_submitted_at = COALESCE(verification_submitted_at, NOW()),
  updated_at = NOW()
WHERE email = 'mydrissouazzani@gmail.com';

-- Vérifier
SELECT 
  email,
  verification_status,
  is_admin
FROM public.users
WHERE email = 'mydrissouazzani@gmail.com';
```

**Tu devrais voir :**
```
email                    | verification_status | is_admin
-------------------------+---------------------+----------
mydrissouazzani@gmail.com| VERIFIED            | true
```

---

### Étape 2 : Déconnexion + Reconnexion

**IMPORTANT :** Il faut forcer le rechargement de l'état dans l'app.

#### Option A : Déconnexion/Reconnexion (recommandé)

1. Dans l'app, va dans **Profil**
2. Clique sur **Déconnexion** (en bas)
3. **Reconnecte-toi** avec `mydrissouazzani@gmail.com`
4. ✅ Ton statut devrait être **VERIFIED**

#### Option B : Redémarrage complet (si Option A ne marche pas)

1. **Force quit Expo Go** (swipe up sur iOS, fermer app sur Android)
2. Dans le terminal :
   ```bash
   # Tuer Metro Bundler
   killall node
   
   # Redémarrer avec cache clear
   npx expo start --clear
   ```
3. Rouvre l'app et reconnecte-toi
4. ✅ Ton statut devrait être **VERIFIED**

---

## 🔍 Pourquoi ça s'est produit ?

### Hypothèses possibles :

1. **Cache de l'app :** L'AuthContext garde l'ancien statut en mémoire
2. **Script SQL précédent :** Un script a pu modifier le statut par erreur
3. **Trigger DB :** Le trigger `handle_new_user` a pu reset le statut

### Ce qui est corrigé maintenant :

✅ Le script SQL remet le statut à `VERIFIED`  
✅ Le script s'assure que tu es `is_admin = TRUE`  
✅ Le script ajoute les infos VTC si manquantes (SIREN, carte pro)  

---

## 🧪 Vérifier que c'est corrigé

Après déconnexion/reconnexion :

1. **Dashboard :** Tu devrais voir tes statistiques (pas de bannière "Validation en cours")
2. **Profil :** Tu devrais voir "👑 Admin" ou un badge admin
3. **Marketplace :** Tu devrais pouvoir **prendre** des courses (pas de message "Profil en cours de validation")

---

## 📊 Debug : Vérifier l'état dans l'app

Si après reconnexion tu vois toujours "Non vérifié", regarde les logs Metro :

```
🔍 [AuthContext] Response complète: {...}
🔍 [AuthContext] verificationStatus: VERIFIED  ← Devrait être VERIFIED
```

Si tu vois `UNVERIFIED` dans les logs :
→ Le statut dans la DB n'a pas été mis à jour
→ Ré-exécute `FIX_MYDRISS_VERIFIED_NOW.sql`

Si tu vois `VERIFIED` dans les logs mais l'app dit "Non vérifié" :
→ Problème de logique dans l'app
→ Envoie-moi les logs complets

---

## 🆘 Si ça ne marche toujours pas

1. **Exécute `CHECK_AND_FIX_MYDRISS_STATUS.sql`** pour voir l'état complet
2. **Envoie-moi les résultats** de cette requête :
   ```sql
   SELECT id, email, verification_status, is_admin, siren, professional_card_number
   FROM public.users
   WHERE email = 'mydrissouazzani@gmail.com';
   ```
3. **Envoie-moi les logs Metro** après reconnexion

---

## 📋 Récapitulatif

| Étape | Action | Temps |
|-------|--------|-------|
| 1️⃣ | Exécute `FIX_MYDRISS_VERIFIED_NOW.sql` | 30 sec |
| 2️⃣ | Déconnexion + Reconnexion | 30 sec |
| 3️⃣ | Vérifier que c'est corrigé | 30 sec |

**Total : 2 minutes** ⏱️

---

**🚀 Exécute le script SQL maintenant et reconnecte-toi !**

