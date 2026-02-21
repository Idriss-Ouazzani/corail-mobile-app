# 🔔 Guide de Test des Notifications

## ✅ Prérequis

Avant de tester, vérifie dans les logs que tu as :
```
✅ Système hybride initialisé
📡 Realtime marketplace status: SUBSCRIBED
📡 Realtime groupe status: SUBSCRIBED
```

---

## 🧪 Test 1 : Notifications Realtime (Marketplace)

### Matériel nécessaire :
- **2 devices** (ou 2 simulateurs)

### Étapes :

#### Device 1 (Marc - Créateur)
1. Connecte-toi avec ton compte : `mydrissouazzani@gmail.com`
2. Va dans **"Courses"** (onglet du milieu)
3. Crée une nouvelle course :
   - Départ : `10 Place du Capitole, Toulouse`
   - Arrivée : `Aéroport Toulouse-Blagnac`
   - Date : Demain
   - Prix : 50€
   - Visibilité : **PUBLIC** ← Important !
4. Clique sur **"Créer la course"**
5. Attends 2-3 secondes

#### Device 2 (Autre chauffeur)
1. Connecte-toi avec un **autre compte** (ou crée-en un nouveau)
2. Reste sur l'onglet **"Marketplace"** (dashboard)
3. **Tu devrais recevoir** :
   - 🔔 Une **notification push** (si l'app est en arrière-plan)
   - 📱 Une **notification in-app** (si l'app est ouverte)
   - 🆕 La course apparaît dans la liste **automatiquement**

### Logs attendus (Device 2) :
```
📢 [REALTIME] Nouvelle course marketplace reçue: {...}
🔍 [REALTIME] creator_id: db5f396a... | currentUserId: autre-id
🆕 Nouvelle course marketplace disponible !
```

---

## 🧪 Test 2 : Notifications de Groupe

### Matériel nécessaire :
- **2 devices** (ou 2 simulateurs)
- **1 groupe** avec les 2 utilisateurs

### Étapes :

#### Préparation : Créer un groupe
1. Device 1 : Va dans **"Groupes"** (via Profile → Groupes)
2. Crée un groupe : `Test Notifs`
3. Invite l'autre utilisateur (par email ou téléphone)
4. Device 2 : Accepte l'invitation

#### Test de la notification
1. **Device 1** : Crée une course avec visibilité **"GROUPE"**
   - Sélectionne le groupe `Test Notifs`
2. **Device 2** : Doit recevoir la notification !

### Logs attendus (Device 2) :
```
📢 [REALTIME] Nouvelle course groupe test-notifs reçue: {...}
🆕 Nouvelle course disponible dans ton groupe !
```

---

## 🧪 Test 3 : Push Notifications (App en arrière-plan)

### Étapes :

1. **Device 2** : Mets l'app en **arrière-plan** (Home button ou swipe)
2. **Device 1** : Crée une course PUBLIC
3. **Device 2** : Tu devrais voir une **notification native iOS/Android** :
   ```
   🆕 Nouvelle course disponible !
   De: 10 Place du Capitole
   Vers: Aéroport Toulouse-Blagnac
   Prix: 50€
   ```
4. **Tape sur la notification** → L'app s'ouvre sur la course

---

## 🧪 Test 4 : Vérifier le Token Push

### Vérifier dans Supabase :

1. Va sur **Supabase Dashboard → Table Editor → push_tokens**
2. Cherche ton `user_id` : `db5f396a-4c75-4792-a6ab-7f071d394bfd`
3. Tu dois voir :
   - `token` : `ExponentPushToken[...]`
   - `is_active` : `true`
   - `device_type` : `ios` ou `android`
   - `updated_at` : Date récente

---

## 🧪 Test 5 : Notification In-App (Modale)

### Étapes :

1. **Device 2** : Garde l'app **ouverte** sur le dashboard
2. **Device 1** : Crée une course PUBLIC
3. **Device 2** : Une **modale** doit apparaître au-dessus du dashboard :
   ```
   ╔═══════════════════════════════════╗
   ║  🆕 Nouvelle course disponible !  ║
   ║                                   ║
   ║  📍 10 Place du Capitole          ║
   ║  📍 Aéroport Toulouse-Blagnac     ║
   ║  💰 50€                           ║
   ║                                   ║
   ║  [Voir]  [Plus tard]             ║
   ╚═══════════════════════════════════╝
   ```
4. Clique sur **"Voir"** → Détails de la course

---

## 📊 Checklist de Test

Coche au fur et à mesure :

### Realtime
- [ ] ✅ Connexion Realtime marketplace (`SUBSCRIBED`)
- [ ] ✅ Connexion Realtime groupe (`SUBSCRIBED`)
- [ ] ✅ Réception d'une course PUBLIC en temps réel
- [ ] ✅ Réception d'une course GROUPE en temps réel

### Push Notifications
- [ ] ✅ Token enregistré dans Supabase
- [ ] ✅ Notification native reçue (app en arrière-plan)
- [ ] ✅ Tap sur notification → Ouvre l'app

### Notifications In-App
- [ ] ✅ Modale affichée (app au premier plan)
- [ ] ✅ Bouton "Voir" fonctionne
- [ ] ✅ Bouton "Plus tard" ferme la modale

### Filtres
- [ ] ✅ Course créée par moi → PAS de notification reçue ✅
- [ ] ✅ Course d'un autre → Notification reçue ✅

---

## 🐛 Déboguer si ça ne marche pas

### Problème 1 : Pas de notification reçue

**Vérifie les logs (Device 2)** :

```bash
# Si tu vois ça → OK, Realtime fonctionne
📢 [REALTIME] Nouvelle course marketplace reçue

# Si tu NE vois PAS ça → Problème
```

**Solutions** :
1. Vérifie que `verificationStatus = 'VERIFIED'` (sinon Realtime pas initialisé)
2. Redémarre l'app
3. Vérifie dans Supabase : **Database → Replication → rides** doit être activé

### Problème 2 : Notification reçue mais pour MES propres courses

**Normal si tu vois** :
```
⚠️ Course créée par moi-même, ignorée
```

C'est voulu ! Le système ignore tes propres courses.

### Problème 3 : Push notifications ne s'affichent pas

**Vérifie** :
1. Permissions accordées : `✅ Permissions notifications accordées`
2. Device physique (pas simulateur iOS pour les push notifs)
3. Token enregistré : Regarde dans Supabase `push_tokens` table

---

## 🎯 Scénarios de Test Avancés

### Scénario 1 : Course avec filtre de prix
1. Device 2 : Active un filtre prix max 40€
2. Device 1 : Crée une course à 50€
3. **Résultat attendu** : Pas de notification (filtré)

### Scénario 2 : Course en dehors de ma ville
1. Device 2 : Sélectionne ville "Paris"
2. Device 1 : Crée une course à Toulouse
3. **Résultat attendu** : Pas de notification (ville différente)

### Scénario 3 : Multiple courses rapidement
1. Device 1 : Crée 3 courses coup sur coup
2. Device 2 : Doit recevoir **3 notifications**

---

## 📱 Tester sur Device Physique (Recommandé)

### iOS :
1. Build l'app avec EAS Build ou Xcode
2. Installe sur ton iPhone
3. Autorise les notifications
4. Teste avec un 2ème device

### Android :
1. Build l'app avec EAS Build ou Android Studio
2. Installe l'APK
3. Autorise les notifications
4. Teste avec un 2ème device

**Note** : Les push notifications ne fonctionnent PAS sur simulateur iOS (limité par Apple).

---

## 🎉 Si tout fonctionne

Tu devrais avoir :
- ✅ Notifications Realtime instantanées
- ✅ Push notifications natives
- ✅ Modales in-app
- ✅ Filtres qui fonctionnent
- ✅ Groupes qui fonctionnent

**Ton système de notifications est 100% opérationnel ! 🚀**

---

## 📝 Commandes Utiles pour Déboguer

### Voir tous les logs Realtime
```javascript
// Dans App.tsx, cherche :
console.log('📢 [REALTIME]')
```

### Forcer un rechargement Realtime
1. Déconnecte-toi
2. Reconnecte-toi
3. Ça réinitialise le système

### Vérifier le statut Realtime en live
```sql
-- Dans Supabase SQL Editor
SELECT * FROM push_tokens 
WHERE user_id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd';
```

---

Bon test ! 🧪🔔

