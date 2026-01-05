# 🚀 Démarrage Rapide - Push Notifications

## ✅ Tout est déjà codé et configuré !

### 🎯 Ce qui fonctionne maintenant :

1. **Page web des devis (Vercel)** ✅
   - Les boutons "Accepter" et "Refuser" fonctionnent
   - Envoi automatique de push notifications

2. **App mobile** ✅
   - Enregistrement automatique du push token
   - Réception des notifications
   - Navigation automatique vers "Mes Devis" au clic

---

## 🔥 3 ÉTAPES POUR ACTIVER

### Étape 1 : Migration SQL (2 min)

1. Ouvrez **Supabase Dashboard** : https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de : `supabase/migrations/011_add_push_token.sql`
4. Cliquez sur **"Run"**

```sql
-- Le script ajoutera automatiquement :
-- ✅ Colonne push_token à la table users
-- ✅ Index pour optimiser les recherches
```

### Étape 2 : Installer expo-device (1 min)

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npx expo install expo-device
```

### Étape 3 : Configurer le Project ID Expo (2 min)

**Option A : Créer un nouveau projet Expo**
```bash
# Dans le dossier de l'app
npx expo login
npx eas init
# Notez le Project ID qui s'affiche
```

**Option B : Utiliser un projet existant**
1. Allez sur https://expo.dev/
2. Connectez-vous
3. Sélectionnez votre projet
4. Notez le Project ID dans les settings

**Puis :**
Ouvrez `src/services/pushNotifications.ts` (ligne 32) et remplacez :
```typescript
projectId: 'your-project-id',
```
par votre vrai ID :
```typescript
projectId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
```

---

## 🧪 TEST (5 min)

### 1. Déployer la page web

```bash
cd /Users/idriss.ouazzani/Cursor/corail-quotes-web
vercel --prod
```

### 2. Lancer l'app sur un APPAREIL PHYSIQUE

⚠️ **IMPORTANT : Pas de simulateur, les push ne marchent pas dessus !**

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npm start
```

Scannez le QR code avec votre téléphone.

### 3. Vérifier les logs

Dans la console Expo, vous devriez voir :
```
✅ Push token obtenu: ExponentPushToken[xxxxx]
✅ Push token enregistré dans Supabase
✅ Push notifications configurées
```

### 4. Tester un devis

1. Dans l'app : **Suivi > Mes Devis > Créer un nouveau devis**
2. Remplissez le formulaire
3. Envoyez via WhatsApp (ou copiez le lien)
4. Ouvrez le lien dans un navigateur
5. Cliquez sur **"Accepter le devis"**
6. 🎉 **Vous recevez une notification sur votre téléphone !**

---

## 🐛 Problèmes courants

### "Permission refusée"
```
Paramètres > Notifications > Expo Go (ou Corail) > Autoriser
```

### "Push token non enregistré"
Vérifiez dans **Supabase > Table Editor > users** que votre ligne contient un `push_token`.

### "Pas de notification reçue"
1. Vérifiez que vous êtes sur un appareil physique (pas simulateur)
2. Vérifiez les logs Vercel : https://vercel.com/dashboard
3. Vérifiez que le Project ID est correct

---

## 📖 Documentation complète

Pour plus de détails, consultez :
- `PUSH_NOTIFICATIONS_GUIDE.md` - Guide complet avec debugging
- `supabase/migrations/011_add_push_token.sql` - Migration SQL

---

## 🎯 Résumé des fichiers créés/modifiés

### Vercel (corail-quotes-web)
- ✅ `app/api/quotes/[token]/accept/route.ts` - API acceptation
- ✅ `app/api/quotes/[token]/refuse/route.ts` - API refus
- ✅ `app/q/[token]/QuoteActions.tsx` - Composant boutons
- ✅ `app/q/[token]/page.tsx` - Page modifiée

### Mobile App (Corail-mobileapp)
- ✅ `src/services/pushNotifications.ts` - Service principal
- ✅ `App.tsx` - Intégration des notifications
- ✅ `app.json` - Configuration Expo
- ✅ `supabase/migrations/011_add_push_token.sql` - Migration

---

**🚀 C'est tout ! Après ces 3 étapes, tout fonctionnera.**

**Temps estimé : 10 minutes**  
**Niveau : Facile** 😊

