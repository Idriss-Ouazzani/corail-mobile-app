# 📱 Guide Publication Play Store - Corail App

Guide complet pour publier l'app Corail sur le Play Store en mode fermé (pour quelques personnes).

---

## 🎯 Objectif

Publier l'app sur le Play Store en **mode fermé (Closed Testing)** pour permettre à quelques personnes de l'installer directement depuis le Play Store.

**Avantages :**
- ✅ Installation facile via Play Store
- ✅ Mises à jour automatiques
- ✅ Distribution professionnelle
- ✅ Pas de limite de testeurs (contrairement à Internal Testing)

---

## 📋 PRÉREQUIS

### 1. Compte Google Play Developer
- [ ] Compte Google Play Console créé (25$ one-time)
- [ ] Paiement effectué et compte activé

### 2. Configuration du projet
- [x] `eas.json` configuré avec build AAB
- [x] `app.config.js` avec `versionCode` et permissions
- [x] EAS CLI installé et connecté

### 3. Assets nécessaires
- [ ] Icône app (512x512px minimum)
- [ ] Feature graphic (1024x500px) - optionnel mais recommandé
- [ ] Screenshots (au moins 2) - optionnel pour closed testing
- [ ] Privacy Policy URL (obligatoire)

---

## 🚀 ÉTAPE 1 : Créer le build AAB

### 1.1 Vérifier la configuration

Assure-toi que `eas.json` contient bien :
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 1.2 Lancer le build

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
eas build --platform android --profile production
```

**Durée :** 10-20 minutes

**Ce qui se passe :**
1. Expo upload ton code
2. Build de l'AAB (Android App Bundle) dans le cloud
3. Signature automatique avec les credentials EAS
4. Tu reçois un lien de téléchargement

### 1.3 Télécharger l'AAB

Une fois le build terminé, tu recevras :
```
✔ Build finished

Build details: https://expo.dev/accounts/[...]/builds/[...]

AAB: https://expo.dev/artifacts/eas/[...].aab
```

**Télécharge le fichier `.aab`** - tu en auras besoin pour l'uploader sur Play Console.

---

## 🏪 ÉTAPE 2 : Configurer Google Play Console

### 2.1 Créer l'application

1. Va sur https://play.google.com/console
2. Clique sur **"Créer une application"**
3. Remplis les informations :
   - **Nom de l'application :** Corail
   - **Langue par défaut :** Français
   - **Type d'application :** Application
   - **Gratuit ou payant :** Gratuit
4. Clique sur **"Créer"**

### 2.2 Remplir les informations de base

Dans **"Présentation de l'application"** :

1. **Nom de l'application :** Corail
2. **Description courte :** (max 80 caractères)
   ```
   Marketplace VTC pour conducteurs et passagers
   ```
3. **Description complète :** (max 4000 caractères)
   ```
   Corail est une plateforme de mise en relation entre conducteurs VTC et passagers.
   Réservez vos trajets en toute simplicité.
   ```
4. **Icône de l'application :** Upload ton icône (512x512px)
5. **Graphique de présentation :** (optionnel, 1024x500px)

### 2.3 Configurer le contenu de l'application

Dans **"Contenu de l'application"** :

1. **Politique de confidentialité :**
   - Tu dois avoir une URL de politique de confidentialité
   - Si tu n'en as pas, crée-en une rapidement (ex: sur GitHub Pages, Netlify, etc.)
   - Exemple : `https://corail.app/privacy-policy`

2. **Catégorie :** Transport / Voyage

3. **Cible d'âge :** Sélectionne selon ton app

---

## 📦 ÉTAPE 3 : Créer une version de test fermée

### 3.1 Accéder à Closed Testing

1. Dans Play Console, va dans **"Testing"** (menu de gauche)
2. Clique sur **"Closed testing"**
3. Clique sur **"Créer une piste de test"**
4. Nomme-la : **"Beta Test"** ou **"Test fermé"**

### 3.2 Créer une release

1. Dans ta piste de test, clique sur **"Créer une release"**
2. Tu vas devoir :
   - **Uploader l'AAB** que tu as téléchargé
   - **Remplir les notes de version** (changelog)

### 3.3 Uploader l'AAB

1. Clique sur **"Téléverser"** dans la section "Fichiers de version"
2. Sélectionne le fichier `.aab` téléchargé depuis Expo
3. Attends que l'upload soit terminé (peut prendre quelques minutes)

**Important :** La première fois, Google va analyser l'app (5-10 minutes).

### 3.4 Remplir les notes de version

Dans "Notes de version" :
```
Version 1.0.0 - Première version

- Mise en relation conducteurs VTC / passagers
- Réservation de trajets
- Système de notifications
- Profils utilisateurs
```

### 3.5 Enregistrer la release

1. Clique sur **"Enregistrer"**
2. Puis **"Examiner la release"**
3. Vérifie que tout est correct
4. Clique sur **"Démarrer le déploiement vers Closed testing"**

---

## 👥 ÉTAPE 4 : Ajouter des testeurs

### 4.1 Créer une liste de testeurs

1. Dans ta piste de test "Closed testing", va dans **"Testeurs"**
2. Clique sur **"Créer une liste"**
3. Nomme-la : **"Beta Testers"**

### 4.2 Ajouter des emails

Tu as 2 options :

**Option A : Liste d'emails**
1. Clique sur **"Ajouter des adresses e-mail"**
2. Entre les emails des testeurs (un par ligne)
3. Clique sur **"Ajouter"**

**Option B : Groupe Google**
1. Crée un groupe Google (ex: corail-beta-testers@googlegroups.com)
2. Ajoute ce groupe dans la liste de testeurs
3. Ajoute les emails dans le groupe Google

**Limite :** Closed testing peut avoir jusqu'à 100,000 testeurs (largement suffisant !)

### 4.3 Activer la liste

1. Coche la case à côté de ta liste de testeurs
2. Clique sur **"Enregistrer les modifications"**

---

## 🔗 ÉTAPE 5 : Partager le lien de test

### 5.1 Obtenir le lien

1. Dans ta piste de test, va dans **"Comment les testeurs rejoignent votre test"**
2. Tu verras un lien comme :
   ```
   https://play.google.com/apps/internaltest/[CODE]
   ```

### 5.2 Partager avec tes testeurs

Envoie ce message à tes testeurs :

```
Salut !

J'ai publié l'app Corail sur le Play Store en mode test fermé.

Pour l'installer :
1. Clique sur ce lien : https://play.google.com/apps/internaltest/[CODE]
2. Accepte de devenir testeur
3. Installe l'app depuis le Play Store (comme une app normale)

L'app apparaîtra dans le Play Store comme une app normale, mais seuls les testeurs peuvent la voir.

Merci pour ton aide ! 🙏
```

**Important :** Les testeurs doivent :
- Avoir un compte Google
- Accepter de devenir testeur (un clic)
- Installer depuis le Play Store (pas d'APK manuel)

---

## ✅ ÉTAPE 6 : Vérifier que tout fonctionne

### 6.1 Checklist

- [ ] L'app est visible dans Play Console
- [ ] L'AAB est uploadé et analysé
- [ ] La release est déployée
- [ ] Les testeurs sont ajoutés
- [ ] Le lien de test fonctionne
- [ ] Tu peux installer l'app depuis le Play Store (en tant que testeur)

### 6.2 Tester toi-même

1. Clique sur ton propre lien de test
2. Accepte de devenir testeur
3. Installe l'app depuis le Play Store
4. Vérifie que tout fonctionne :
   - [ ] L'app se lance
   - [ ] Login fonctionne
   - [ ] Les données chargent
   - [ ] Pas de crash

---

## 🔄 ÉTAPE 7 : Mettre à jour l'app

Quand tu veux publier une nouvelle version :

### 7.1 Incrémenter la version

Dans `app.config.js` :
```javascript
version: '1.0.1',  // Version visible par l'utilisateur
android: {
  versionCode: 2,  // Version système (doit être +1)
}
```

### 7.2 Re-build

```bash
eas build --platform android --profile production
```

### 7.3 Uploader la nouvelle version

1. Va dans Play Console > Testing > Closed testing
2. Clique sur **"Créer une release"**
3. Upload le nouveau `.aab`
4. Remplis les notes de version :
   ```
   Version 1.0.1

   - Correction de bugs
   - Amélioration des performances
   - Nouvelle fonctionnalité X
   ```
5. **Enregistrer** et **Démarrer le déploiement**

**Les testeurs recevront automatiquement la mise à jour via le Play Store !** 🎉

---

## 🚨 PROBLÈMES COURANTS

### 1. "Failed to analyse the package"

**Cause :** Tu as peut-être uploadé un APK au lieu d'un AAB, ou l'AAB n'est pas signé correctement.

**Solution :**
- Vérifie que tu utilises `--profile production` (génère un AAB signé)
- Ne télécharge pas l'APK, télécharge l'AAB
- Vérifie que `eas.json` contient `"buildType": "app-bundle"`

### 2. "Upload failed" ou "Invalid AAB"

**Cause :** L'AAB est corrompu ou mal formé.

**Solution :**
- Re-build : `eas build --platform android --profile production --clear-cache`
- Vérifie que le build s'est bien terminé
- Télécharge à nouveau l'AAB

### 3. Les testeurs ne voient pas l'app

**Cause :** Ils n'ont pas accepté de devenir testeur, ou le lien est incorrect.

**Solution :**
- Vérifie qu'ils ont bien cliqué sur le lien et accepté
- Vérifie que la liste de testeurs est activée
- Vérifie que la release est bien déployée (statut "Disponible")

### 4. "Version code already used"

**Cause :** Tu as déjà uploadé une version avec ce `versionCode`.

**Solution :**
- Incrémente `versionCode` dans `app.config.js`
- Re-build et re-upload

### 5. Build échoue avec "Invalid credentials"

**Cause :** Problème de connexion EAS ou credentials expirés.

**Solution :**
```bash
eas logout
eas login
eas build:configure  # Re-configurer si nécessaire
```

---

## 📊 COMPARAISON : Internal vs Closed Testing

| Critère | Internal Testing | Closed Testing |
|---------|------------------|----------------|
| **Max testeurs** | 100 | 100,000 |
| **Review Google** | Non | Non |
| **Lien public** | Non | Oui (mais limité) |
| **Temps de déploiement** | Immédiat | 5-10 min |
| **Pour qui ?** | Équipe interne | Beta testeurs |

**Recommandation :** Utilise **Closed Testing** pour quelques personnes (c'est ton cas !)

---

## 🎯 CHECKLIST FINALE

### Avant le premier build
- [ ] `eas.json` configuré avec `"buildType": "app-bundle"`
- [ ] `app.config.js` avec `versionCode: 1`
- [ ] EAS CLI installé et connecté (`eas login`)

### Build
- [ ] `eas build --platform android --profile production` lancé
- [ ] Build réussi (15-20 min)
- [ ] AAB téléchargé

### Play Console
- [ ] Application créée
- [ ] Informations de base remplies
- [ ] Privacy Policy URL ajoutée
- [ ] Piste de test "Closed testing" créée
- [ ] AAB uploadé
- [ ] Release créée et déployée
- [ ] Liste de testeurs créée et activée

### Test
- [ ] Lien de test obtenu
- [ ] Testé toi-même (installation depuis Play Store)
- [ ] App fonctionne correctement
- [ ] Lien partagé aux testeurs

---

## 🚀 COMMANDES RAPIDES

```bash
# Build AAB pour Play Store
eas build --platform android --profile production

# Voir les builds
eas build:list

# Voir les détails d'un build
eas build:view [BUILD_ID]

# Re-build avec cache clear (si problème)
eas build --platform android --profile production --clear-cache
```

---

## 📚 RESSOURCES

- [Documentation Expo - Play Store](https://docs.expo.dev/submit/android/)
- [Google Play Console](https://play.google.com/console)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

---

## 💡 CONSEILS

1. **Teste toi-même d'abord** avant de partager aux autres
2. **Garde le même `package`** (com.corail.vtcmarketplace) - ne le change jamais !
3. **Incrémente toujours `versionCode`** pour chaque nouvelle version
4. **Les mises à jour sont automatiques** - tes testeurs recevront les nouvelles versions via le Play Store
5. **Closed Testing est parfait** pour quelques personnes - pas besoin de passer en production tout de suite

---

**🎉 Une fois que tout est configuré, tes testeurs pourront installer l'app directement depuis le Play Store comme une app normale !**

