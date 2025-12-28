# 🔵 Authentification Google - Guide d'installation

## 📋 Vue d'ensemble

Le bouton "Continuer avec Google" a été ajouté à l'écran de connexion. Il fonctionne uniquement sur **Web** avec Expo Go.

---

## 🚀 Installation des dépendances

### 1️⃣ Installer les packages nécessaires

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npx expo install expo-auth-session expo-web-browser
```

### 2️⃣ Vérifier l'installation

```bash
npm list expo-auth-session expo-web-browser
```

---

## ⚙️ Configuration Firebase

### 1️⃣ Activer Google Sign-In dans Firebase Console

1. Va sur https://console.firebase.google.com
2. Sélectionne ton projet **corail-vtc**
3. Va dans **Authentication** → **Sign-in method**
4. Active **Google** (tu l'as déjà fait ✅)
5. Configure le **Support Email** si demandé

### 2️⃣ Configurer les domaines autorisés

Dans **Authentication** → **Settings** → **Authorized domains**, assure-toi que :
- `localhost` est autorisé (pour développement)
- Ton domaine de production (si déployé)

---

## 🧪 Test

### Test sur Web (Expo Go)

```bash
npm start
# Puis appuie sur 'w' pour ouvrir dans le navigateur
```

1. **Clique sur "Continuer avec Google"**
2. **Une popup Google s'ouvre**
3. **Sélectionne ton compte Google**
4. **Tu es connecté ! 🎉**

### Test sur Mobile (Expo Go)

⚠️ **Limitation** : L'authentification Google ne fonctionne **pas** sur mobile avec Expo Go sans configuration native.

Pour tester sur mobile, tu dois :
1. **Compiler l'app en standalone** avec EAS Build, OU
2. **Utiliser email/mot de passe** pour tester

---

## 📱 Pour déploiement mobile natif (optionnel)

Si tu veux que Google Auth fonctionne sur mobile natif, il faut :

### 1️⃣ Obtenir les Client IDs

#### Android
```bash
npx expo prebuild
cd android
./gradlew signingReport
# Récupère le SHA-1
```

Puis dans Firebase Console :
- **Project Settings** → **Add app** → **Android**
- Entre le SHA-1
- Télécharge `google-services.json`

#### iOS
Dans Firebase Console :
- **Project Settings** → **Add app** → **iOS**
- Entre le Bundle ID
- Télécharge `GoogleService-Info.plist`

### 2️⃣ Configurer expo-auth-session

Modifie `src/services/firebase.ts` pour utiliser les Client IDs :

```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'VOTRE_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'VOTRE_IOS_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'VOTRE_WEB_CLIENT_ID.apps.googleusercontent.com',
});
```

---

## 🎨 Interface utilisateur

### Bouton Google ajouté

- **Position** : Après le bouton de connexion principal
- **Séparateur** : "OU" élégant
- **Design** : Fond blanc, icône Google colorée, texte noir
- **Comportement** : Ouvre une popup Google (web) ou affiche un message d'erreur (mobile Expo Go)

---

## 🐛 Résolution de problèmes

### Erreur : "Connexion Google non disponible sur mobile"

**Cause** : Tu testes sur mobile avec Expo Go.

**Solutions** :
1. Teste sur **web** (appuie sur 'w' dans le terminal)
2. Utilise **email/mot de passe** pour mobile
3. Compile l'app en standalone si tu as besoin de Google Auth sur mobile

### Erreur : "popup-closed-by-user"

**Cause** : L'utilisateur a fermé la popup Google.

**Solution** : Normal, réessaye.

### Erreur : "account-exists-with-different-credential"

**Cause** : L'email Google est déjà utilisé avec email/mot de passe.

**Solution** : Connecte-toi avec email/mot de passe, ou utilise un autre email Google.

---

## 📊 Flux d'authentification

### Web
```
[Clique "Continuer avec Google"]
    ↓
[Popup Google s'ouvre]
    ↓
[Sélectionne compte Google]
    ↓
[Firebase crée/connecte le compte]
    ↓
[Utilisateur connecté ! ✅]
```

### Mobile (Expo Go)
```
[Clique "Continuer avec Google"]
    ↓
[Message d'erreur]
    ↓
["Utilisez email/mot de passe"]
```

### Mobile (Standalone App)
```
[Clique "Continuer avec Google"]
    ↓
[expo-auth-session ouvre navigateur]
    ↓
[Sélectionne compte Google]
    ↓
[Retour à l'app]
    ↓
[Firebase crée/connecte le compte]
    ↓
[Utilisateur connecté ! ✅]
```

---

## ✅ Checklist

- [x] Code ajouté dans `firebase.ts`
- [x] Bouton Google ajouté dans `LoginScreen.tsx`
- [x] Styles élégants pour le bouton
- [x] Séparateur "OU"
- [ ] Installer `expo-auth-session` et `expo-web-browser`
- [ ] Tester sur web
- [ ] (Optionnel) Configurer pour mobile natif

---

## 🎉 Résumé

Le bouton Google est prêt ! Il fonctionne sur **web** dès maintenant. Pour mobile, il nécessite une compilation standalone.

**Commande d'installation** :
```bash
npx expo install expo-auth-session expo-web-browser
```

**Test** :
```bash
npm start
# Appuie sur 'w' pour web
```

🚀 **Enjoy !**

