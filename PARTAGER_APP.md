# 📱 Partager l'App Corail avec des Testeurs

## 🚀 Option 1 : Expo Go (Le plus simple)

### Pour vous (développeur) :
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npx expo start
```

Ensuite :
1. Scannez le **QR Code** qui s'affiche dans le terminal
2. Ou appuyez sur `s` pour partager via lien

### Pour les testeurs :
1. **Installer Expo Go** :
   - iOS : https://apps.apple.com/app/expo-go/id982107779
   - Android : https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Scanner le QR code** ou ouvrir le lien partagé

3. L'app se lance dans Expo Go ! ✅

**⚠️ Limitations** :
- Vous devez être sur le **même réseau WiFi**
- Ou utiliser un tunnel (voir ci-dessous)

---

## 🌐 Option 2 : Expo Go avec Tunnel (Partage à distance)

Si les testeurs ne sont **pas sur le même réseau** :

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npx expo start --tunnel
```

**Avantages** :
- ✅ Fonctionne à distance (n'importe où dans le monde)
- ✅ Pas besoin d'être sur le même WiFi

**Inconvénients** :
- ❌ Plus lent
- ❌ Nécessite un compte Expo

---

## 📦 Option 3 : Build Development (App standalone)

Pour créer une **vraie app** installable (sans Expo Go) :

### 1. Installer EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 2. Configurer le projet
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
eas build:configure
```

### 3. Build pour iOS (TestFlight)
```bash
eas build --profile development --platform ios
```

### 4. Build pour Android (APK)
```bash
eas build --profile development --platform android
```

Une fois le build terminé (10-20 min), vous recevrez :
- **iOS** : Un lien pour ajouter à TestFlight
- **Android** : Un lien pour télécharger l'APK

**Partagez ces liens** avec vos testeurs !

---

## 📲 Option 4 : Publication sur Expo (Recommandé pour tests)

La méthode la **plus professionnelle** pour tester :

### 1. Publier sur Expo
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npx expo publish
```

### 2. Partager le lien
Vous recevrez un lien comme :
```
exp://exp.host/@votre-username/corail-mobileapp
```

### 3. Les testeurs peuvent :
- Ouvrir le lien dans **Expo Go**
- Ou scanner un QR code

**Avantages** :
- ✅ Fonctionne partout dans le monde
- ✅ Mises à jour instantanées (republier = tous les testeurs reçoivent la nouvelle version)
- ✅ Pas besoin de rebuild

---

## 🎯 Recommandation pour commencer

### Pour 1-5 testeurs proches :
→ **Option 1** (Expo Go local) ou **Option 2** (Tunnel)

### Pour > 5 testeurs ou testeurs à distance :
→ **Option 4** (Expo Publish)

### Pour distribution beta plus large :
→ **Option 3** (EAS Build + TestFlight/Google Play)

---

## 📝 Commandes utiles

```bash
# Démarrer l'app en local
npx expo start

# Démarrer avec tunnel (partage distant)
npx expo start --tunnel

# Publier sur Expo
npx expo publish

# Build iOS
eas build --profile development --platform ios

# Build Android
eas build --profile development --platform android

# Vérifier le statut des builds
eas build:list
```

---

## 🔑 Credentials nécessaires

Pour **Option 3** (Builds), vous aurez besoin de :

### iOS :
- Compte Apple Developer (99$/an)
- Certificat de distribution
- Provisioning profile

### Android :
- Compte Google Play (25$ une fois)
- Keystore (généré automatiquement par EAS)

**Pour tester gratuitement**, utilisez **Option 1, 2 ou 4** ! ✅

---

## 💡 Conseil

Commencez par **Option 2** (Tunnel) :

```bash
npx expo start --tunnel
```

Partagez le QR code ou le lien `exp://...` avec vos testeurs.

Ils installent **Expo Go** et c'est parti ! 🚀

