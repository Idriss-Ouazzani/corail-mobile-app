# 📱 Guide Déploiement Android - Corail App

Guide complet pour passer de Expo Go à une vraie app Android installable.

---

## 🎯 3 Options de déploiement

| Option | Durée | Difficulté | Pour qui ? |
|--------|-------|------------|------------|
| **1. APK Direct** | 30 min | ⭐ Facile | Tests / Beta privée (< 20 users) |
| **2. Google Play Internal** | 2h | ⭐⭐ Moyen | Beta fermée (< 100 users) |
| **3. Google Play Production** | 1 jour | ⭐⭐⭐ Avancé | Production publique (> 100 users) |

**On va commencer par l'option 1 (la plus simple) !**

---

## 🚀 OPTION 1 : APK Direct (Le plus rapide)

### **Avantages :**
- ✅ Pas besoin de compte Google Play
- ✅ Gratuit
- ✅ Rapide (30 min)
- ✅ Parfait pour tester avec quelques personnes

### **Inconvénients :**
- ❌ Pas dans le Play Store
- ❌ Installation manuelle (fichier APK)
- ❌ Pas de mises à jour automatiques

---

## 📋 ÉTAPE 1 : Prérequis

### **1.1 Vérifier Node & npm**

```bash
node --version  # Doit être >= 18
npm --version   # Doit être >= 9
```

### **1.2 Installer EAS CLI**

```bash
npm install -g eas-cli
```

### **1.3 Se connecter à Expo**

```bash
eas login
```

**Si tu n'as pas de compte Expo :**
```bash
eas register
```

### **1.4 Vérifier que tu as bien un `app.json`**

```bash
cat app.json | grep name
```

---

## 📦 ÉTAPE 2 : Configuration du projet

### **2.1 Initialiser EAS**

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
eas build:configure
```

**Questions qui vont apparaître :**
```
? Which platforms would you like to configure?
→ Choisis "Android" (flèche + Espace + Entrée)

? Generate a new Android Keystore?
→ Choisis "Yes" (laisse Expo gérer)
```

**Résultat :** Un fichier `eas.json` est créé

### **2.2 Vérifier la configuration**

```bash
cat eas.json
```

Tu devrais voir quelque chose comme :
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 🏗️ ÉTAPE 3 : Premier build Android

### **3.1 Lancer le build APK**

```bash
eas build --platform android --profile preview
```

**Ce qui va se passer :**

1. **Expo va uploader ton code** sur leurs serveurs
2. **Build Android dans le cloud** (durée : 5-15 min)
3. **Tu reçois un lien de téléchargement**

**Sortie attendue :**
```
✔ Build finished

Build details: https://expo.dev/accounts/[...]/builds/[...]

APK: https://expo.dev/artifacts/eas/[...].apk
```

### **3.2 Pendant le build (optionnel)**

Tu peux suivre en temps réel :

```bash
# Voir les logs
eas build:list

# Voir le build en cours
eas build:view [BUILD_ID]
```

---

## 📲 ÉTAPE 4 : Installer l'APK sur ton téléphone

### **Méthode 1 : Téléchargement direct (la plus simple)**

1. **Sur ton téléphone Android**, ouvre le lien APK envoyé par Expo
2. **Télécharge le fichier** (60-80 MB)
3. **Clique sur le fichier téléchargé**
4. **Autorise l'installation depuis sources inconnues** si demandé
5. **Installe l'app** ✅

### **Méthode 2 : Via USB (si problème)**

```bash
# 1. Télécharger l'APK sur ton Mac
curl -o corail.apk [LIEN_APK]

# 2. Connecter ton téléphone en USB (mode débogage activé)

# 3. Installer via adb
adb install corail.apk
```

### **Méthode 3 : QR Code (pour partager facilement)**

Le lien Expo contient un QR Code que tes testeurs peuvent scanner !

---

## ✅ ÉTAPE 5 : Tester l'app

### **5.1 Vérifier que tout marche**

- [ ] L'app se lance
- [ ] Firebase Auth fonctionne (login)
- [ ] Supabase fonctionne (données chargées)
- [ ] Notifications locales marchent
- [ ] Navigation fluide
- [ ] Pas de crash

### **5.2 Voir les logs (si problème)**

```bash
# Logs en temps réel
adb logcat | grep -i "corail"
```

---

## 🎨 ÉTAPE 6 : Personnaliser l'app (avant re-build)

### **6.1 Modifier `app.json`**

```json
{
  "expo": {
    "name": "Corail",
    "slug": "corail-mobileapp",
    "version": "1.0.0",
    "android": {
      "package": "com.corail.vtc",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      },
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED"
      ]
    }
  }
}
```

### **6.2 Changer l'icône (optionnel)**

1. Crée une icône 1024x1024px
2. Place-la dans `assets/icon.png`
3. Re-build

---

## 🔄 ÉTAPE 7 : Mettre à jour l'app

### **7.1 Incrémenter la version**

**Dans `app.json` :**
```json
{
  "version": "1.0.1",  // +1 pour version humaine
  "android": {
    "versionCode": 2   // +1 pour version système
  }
}
```

### **7.2 Re-build**

```bash
eas build --platform android --profile preview
```

### **7.3 Envoyer aux testeurs**

Envoie le nouveau lien APK → Ils réinstallent par-dessus

---

## 🔐 ÉTAPE 8 : Configuration production

### **8.1 Variables d'environnement**

**Créer `.env.production` :**
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### **8.2 Build production**

```bash
eas build --platform android --profile production
```

---

## 📊 OPTION 2 : Google Play Internal Testing

**Si tu veux un vrai beta test propre (recommandé pour > 20 users)**

### **Prérequis :**
- [ ] Compte Google Play Console (25$ one-time)
- [ ] App Bundle (AAB) au lieu d'APK
- [ ] Privacy Policy URL
- [ ] Screenshots de l'app

### **Étapes :**

#### **1. Créer un compte Google Play Console**

1. Va sur https://play.google.com/console
2. Paye les 25$ (one-time)
3. Accepte les conditions

#### **2. Créer une app**

1. Clique sur "Créer une application"
2. Nom : "Corail"
3. Langue : Français
4. Type : Application

#### **3. Build AAB (au lieu d'APK)**

```bash
eas build --platform android --profile production
```

**Résultat :** Un fichier `.aab` (App Bundle)

#### **4. Upload sur Play Console**

1. Va dans "Testing" > "Internal testing"
2. Crée une release
3. Upload le fichier `.aab`
4. Remplis les infos (changelog, etc.)

#### **5. Ajouter des testeurs**

1. Crée une liste de testeurs (emails)
2. Partage le lien de test
3. Les testeurs peuvent installer depuis Play Store

**Avantage :** Mises à jour automatiques via Play Store !

---

## 🚨 Problèmes courants

### **1. Build qui échoue : "Invalid credentials"**

```bash
# Re-login
eas logout
eas login
```

### **2. "Java heap space" error**

**Dans `eas.json` :**
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### **3. App plante au démarrage**

**Vérifier les permissions dans `app.json` :**
```json
{
  "android": {
    "permissions": [
      "INTERNET",
      "ACCESS_NETWORK_STATE"
    ]
  }
}
```

### **4. Firebase ne marche pas**

**Vérifier `google-services.json` :**
- Doit être à la racine du projet
- Doit contenir le bon `package_name`

### **5. Notifications ne marchent pas**

**Dans `app.json` :**
```json
{
  "android": {
    "useNextNotificationsApi": true,
    "googleServicesFile": "./google-services.json"
  }
}
```

---

## 📱 ÉTAPE 9 : Partager avec tes testeurs

### **Méthode 1 : Lien direct**

```
Salut !

Voici la beta de l'app Corail :
https://expo.dev/artifacts/eas/[...].apk

1. Clique sur le lien depuis ton téléphone Android
2. Télécharge le fichier
3. Autorise l'installation depuis sources inconnues si demandé
4. Installe et teste !

Feedback bienvenu 🙏
```

### **Méthode 2 : QR Code**

- Expo génère automatiquement un QR Code
- Les testeurs le scannent
- Installation directe

### **Méthode 3 : Google Drive**

1. Upload l'APK sur Google Drive
2. Partage le lien avec tes testeurs
3. Ils téléchargent et installent

---

## 🎯 Checklist complète

### **Avant premier build :**
- [ ] `eas-cli` installé
- [ ] Connecté à Expo (`eas login`)
- [ ] `app.json` configuré
- [ ] `eas.json` généré

### **Build :**
- [ ] `eas build --platform android --profile preview` lancé
- [ ] Build réussi (15 min d'attente)
- [ ] Lien APK reçu

### **Test :**
- [ ] APK téléchargé sur téléphone
- [ ] App installée
- [ ] Login fonctionne
- [ ] Données chargent
- [ ] Pas de crash

### **Distribution :**
- [ ] Lien APK partagé aux testeurs
- [ ] Feedback collecté
- [ ] Bugs corrigés

---

## 📊 Comparaison des options

| Critère | APK Direct | Play Internal | Play Production |
|---------|------------|---------------|-----------------|
| **Coût** | Gratuit | 25$ | 25$ |
| **Durée setup** | 30 min | 2h | 1 jour |
| **Mises à jour** | Manuelles | Auto | Auto |
| **Distribution** | Lien direct | Play Store | Play Store |
| **Max testeurs** | 20 | 100 | Illimité |
| **Review Google** | Non | Non | Oui (1-7 jours) |

---

## 🚀 COMMENCER MAINTENANT (Quick Start)

```bash
# 1. Installer EAS CLI
npm install -g eas-cli

# 2. Se connecter
eas login

# 3. Configurer le projet
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
eas build:configure

# 4. Lancer le build
eas build --platform android --profile preview

# 5. Attendre le lien APK (15 min) ☕

# 6. Télécharger et installer sur ton téléphone

# 7. Tester ! 🎉
```

---

## 💡 Conseil

**Pour démarrer :**
- ✅ Commence par APK Direct (option 1)
- ✅ Teste avec 5-10 personnes
- ✅ Corrige les bugs
- ✅ Puis passe à Play Internal (option 2)
- ✅ Beta test avec 50-100 personnes
- ✅ Enfin Play Production (option 3)

**Ne rush pas sur le Play Store, prends le temps de tester !**

---

## 🆘 Aide

**Problème de build ?**
```bash
eas build:list  # Voir tous les builds
eas build:view [BUILD_ID]  # Voir les détails/logs
```

**Besoin d'aide ?**
- [Expo Docs](https://docs.expo.dev/build/setup/)
- [EAS Build](https://expo.dev/eas)

---

**🎉 Prêt à builder ? Lance la commande Quick Start et c'est parti !**

