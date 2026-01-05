# 🔔 Guide d'implémentation des Push Notifications

## ✅ Ce qui a été implémenté

### 1. **Backend (Next.js/Vercel)** ✅
- ✅ API Route `/api/quotes/[token]/accept` - Accepter un devis
- ✅ API Route `/api/quotes/[token]/refuse` - Refuser un devis
- ✅ Envoi automatique de push notifications via Expo Push API
- ✅ Composant client `QuoteActions` pour les boutons interactifs

### 2. **Base de données** ✅
- ✅ Migration `011_add_push_token.sql` - Ajoute le champ `push_token` à la table `users`
- ✅ Index pour recherches rapides

### 3. **Application Mobile** ✅
- ✅ Service `pushNotifications.ts` - Gestion complète des push notifications
- ✅ Enregistrement automatique du push token au démarrage
- ✅ Listeners pour recevoir et gérer les notifications
- ✅ Navigation automatique vers "Mes Devis" lors du clic

---

## 🚀 Étapes de déploiement

### Étape 1 : Installer les dépendances manquantes

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# Installer expo-device
npx expo install expo-device

# Vérifier que expo-notifications est installé
npm list expo-notifications
```

### Étape 2 : Obtenir votre Expo Project ID

1. Créez ou connectez-vous à votre compte Expo : https://expo.dev/
2. Créez un nouveau projet ou utilisez un projet existant
3. Notez le **Project ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Étape 3 : Configurer le Project ID

Ouvrez `src/services/pushNotifications.ts` et remplacez :

```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-project-id', // ⬅️ REMPLACER ICI
});
```

Par votre vrai Project ID :

```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
});
```

### Étape 4 : Appliquer la migration SQL

1. Ouvrez **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Créez une nouvelle query
4. Copiez le contenu de `supabase/migrations/011_add_push_token.sql`
5. Cliquez sur **"Run"**

Vous devriez voir :
```
✅ Column push_token added
✅ Index created
```

### Étape 5 : Déployer la page web Vercel

```bash
cd /Users/idriss.ouazzani/Cursor/corail-quotes-web

# Installer les dépendances si nécessaire
npm install

# Déployer sur Vercel
vercel --prod
```

### Étape 6 : Tester sur un appareil physique

**⚠️ IMPORTANT : Les push notifications ne fonctionnent PAS sur les simulateurs/émulateurs.**

1. **Connectez un appareil physique** (iPhone ou Android)

2. **Lancez l'app avec Expo Go :**
   ```bash
   cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
   npm start
   ```

3. **Scannez le QR code** avec :
   - iPhone : Appareil photo natif
   - Android : App Expo Go

4. **Vérifiez les logs :**
   ```
   ✅ Push token obtenu: ExponentPushToken[xxxxx]
   ✅ Push token enregistré dans Supabase
   ✅ Push notifications configurées
   ```

### Étape 7 : Tester les notifications

#### Test 1 : Créer et accepter un devis

1. **Dans l'app mobile :**
   - Créez un devis pour un client
   - Notez le token/lien du devis

2. **Sur le téléphone du client (ou un autre navigateur) :**
   - Ouvrez le lien du devis
   - Cliquez sur **"Accepter le devis"**

3. **Dans l'app mobile :**
   - Vous devriez recevoir une notification :
     ```
     ✅ Devis accepté !
     [Nom du client] a accepté votre devis de XX€
     ```

#### Test 2 : Notification locale de test

Dans l'app, vous pouvez appeler la fonction de test :

```typescript
import { sendTestNotification } from './src/services/pushNotifications';

// Quelque part dans votre code (par exemple, un bouton de debug)
await sendTestNotification();
```

---

## 🔍 Debugging

### Problème 1 : "Push notifications ne fonctionnent pas"

**Vérifications :**
```bash
# 1. Vérifier que expo-device est installé
npm list expo-device

# 2. Vérifier que vous êtes sur un appareil physique
# Regardez les logs : "⚠️ Les push notifications ne fonctionnent pas sur un simulateur"
```

### Problème 2 : "Push token non enregistré"

**Vérifications dans Supabase :**
1. Table Editor > `users`
2. Cherchez votre ligne (par votre user ID)
3. Vérifiez la colonne `push_token`
4. Elle devrait contenir : `ExponentPushToken[xxxxxxxxx]`

### Problème 3 : "Notification non reçue"

**Checklist :**
- [ ] Permissions accordées sur l'appareil
- [ ] Push token enregistré dans Supabase
- [ ] L'app est sur un appareil physique
- [ ] L'appareil est connecté à Internet
- [ ] Le devis est bien accepté/refusé (vérifier dans Table Editor > quotes)

**Logs à vérifier côté Vercel :**
1. Allez sur vercel.com
2. Votre projet > Deployments > Latest
3. Cliquez sur "Functions"
4. Cherchez les logs de `/api/quotes/[token]/accept`
5. Vous devriez voir : `✅ Push notification envoyée`

### Problème 4 : "Erreur 403 ou 404 lors de l'envoi"

**Solution :** Vérifiez le Project ID dans `pushNotifications.ts`

---

## 📱 Fonctionnalités des notifications

### Ce qui est implémenté :

1. **Notification d'acceptation de devis** ✅
   - Titre : "✅ Devis accepté !"
   - Message : "[Client] a accepté votre devis de XX€"
   - Action : Ouvre "Mes Devis"

2. **Notification de refus de devis** ✅
   - Titre : "❌ Devis refusé"
   - Message : "[Client] a refusé le devis de XX€"
   - Action : Ouvre "Mes Devis"

3. **Badge et son** ✅
   - Badge sur l'icône de l'app
   - Son de notification personnalisé
   - Vibration (Android)

### Améliorations futures possibles :

- 🔜 Notification quand un client consulte le devis (status VIEWED)
- 🔜 Rappel si le client n'a pas répondu après X heures
- 🔜 Notification quand une course est réclamée
- 🔜 Notification pour les nouveaux messages

---

## 🧪 Tests recommandés

### Test 1 : Acceptation
1. Créer un devis
2. L'accepter depuis le lien web
3. Vérifier la notification reçue
4. Cliquer sur la notification
5. Vérifier que l'écran "Mes Devis" s'ouvre
6. Vérifier que le statut est "ACCEPTÉ"

### Test 2 : Refus
1. Créer un devis
2. Le refuser depuis le lien web
3. Vérifier la notification reçue
4. Vérifier que le statut est "REFUSÉ"

### Test 3 : App en arrière-plan
1. Créer un devis
2. Mettre l'app en arrière-plan
3. Accepter le devis depuis le web
4. Vérifier que la notification apparaît
5. Cliquer dessus
6. Vérifier que l'app s'ouvre sur "Mes Devis"

### Test 4 : App fermée
1. Créer un devis
2. Fermer complètement l'app
3. Accepter le devis depuis le web
4. Vérifier que la notification apparaît
5. Cliquer dessus
6. Vérifier que l'app s'ouvre

---

## 📊 Monitoring

### Logs à surveiller :

**Dans l'app mobile (Expo) :**
```
✅ Push token obtenu: ExponentPushToken[xxxxx]
✅ Push token enregistré dans Supabase
✅ Push notifications configurées
📬 Notification reçue dans l'app: [...]
👆 Clic sur notification: [...]
```

**Dans Vercel (Logs des API Routes) :**
```
✅ Acceptation du devis: [token]
✅ Push notification envoyée
```

**Dans Supabase (Table Editor > quotes) :**
- Vérifier que le statut change (SENT → ACCEPTED/REFUSED)
- Vérifier que `accepted_at` est rempli
- Vérifier que `acceptance_ip` et `acceptance_user_agent` sont enregistrés

---

## 🔐 Sécurité

✅ **Implémenté :**
- RLS sur la table `quotes` pour contrôler l'accès
- Enregistrement de l'IP et user-agent lors de l'acceptation
- Token unique pour chaque devis (non prévisible)
- Vérification que le devis existe avant mise à jour

⚠️ **À considérer (production) :**
- Rate limiting sur les API routes (éviter spam)
- Expiration des devis après X jours
- Email de confirmation en plus de la notification
- Signature des liens de devis

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** dans l'ordre :
   - Logs Expo (mobile)
   - Logs Vercel (API)
   - Table Editor Supabase

2. **Testez sur un appareil physique** (pas de simulateur)

3. **Vérifiez les permissions** :
   ```
   Paramètres > Notifications > [Votre App] > Autoriser les notifications
   ```

4. **Envoyez-moi** :
   - Logs complets de l'app
   - Screenshot de Supabase (table users, colonne push_token)
   - Logs Vercel de l'API route

---

**Version :** 1.0.0  
**Date :** 2 janvier 2026  
**Statut :** ✅ Prêt pour les tests

