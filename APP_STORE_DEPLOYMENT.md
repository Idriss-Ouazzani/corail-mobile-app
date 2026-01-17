# 🍎 Guide Publication App Store - Corail App

Guide complet pour publier l'app Corail sur l'App Store (pour quelques personnes via TestFlight).

---

## 🎯 Objectif

Publier l'app sur l'App Store en **mode TestFlight** pour permettre à quelques personnes de l'installer directement depuis l'App Store ou TestFlight.

**Avantages :**
- ✅ Installation facile via App Store / TestFlight
- ✅ Mises à jour automatiques
- ✅ Distribution professionnelle
- ✅ Jusqu'à 10,000 testeurs externes sur TestFlight
- ✅ Pas de review Apple pour TestFlight (contrairement à la production)

---

## 📋 PRÉREQUIS

### 1. Compte Apple Developer
- [ ] Compte Apple Developer créé (99$/an)
- [ ] Paiement effectué et compte activé
- [ ] Accès à [developer.apple.com](https://developer.apple.com)

### 2. Configuration du projet
- [x] `eas.json` configuré
- [x] `app.config.js` avec `bundleIdentifier` iOS
- [x] EAS CLI installé et connecté
- [x] Credentials iOS configurés (EAS peut les gérer automatiquement)

### 3. Assets nécessaires
- [ ] Icône app (1024x1024px) - **obligatoire**
- [ ] Screenshots iPhone (plusieurs tailles) - **obligatoire pour production, optionnel pour TestFlight**
- [ ] Privacy Policy URL - **obligatoire**
- [ ] Description de l'app
- [ ] Keywords (mots-clés pour la recherche)

---

## 🚀 ÉTAPE 1 : Préparer le compte Apple Developer

### 1.1 Créer un compte Apple Developer

1. Va sur [developer.apple.com](https://developer.apple.com)
2. Clique sur **"Enroll"** ou **"Account"**
3. Connecte-toi avec ton Apple ID
4. Paye les **99$/an** (paiement annuel)
5. Attends la validation (peut prendre 24-48h)

### 1.2 Vérifier l'accès

Une fois validé, tu dois pouvoir accéder à :
- [App Store Connect](https://appstoreconnect.apple.com)
- [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources)

---

## 🔧 ÉTAPE 2 : Configurer les credentials iOS

### 2.1 Laisser EAS gérer les credentials (recommandé)

EAS peut créer et gérer automatiquement :
- Certificats de distribution
- Provisioning profiles
- App Store Connect API key (si nécessaire)

**Premier build :**
```bash
eas build --platform ios --profile production
```

EAS va te demander :
- Ton Apple ID
- Si tu veux qu'il crée les credentials automatiquement → **Oui**

### 2.2 Vérifier les credentials

```bash
eas credentials
```

Tu verras :
- Certificats iOS
- Provisioning profiles
- App Store Connect API key (si configuré)

---

## 📦 ÉTAPE 3 : Créer le build iOS

### 3.1 Vérifier la configuration

Assure-toi que `app.config.js` contient :
```javascript
ios: {
  bundleIdentifier: 'com.corail.vtcmarketplace',
  buildNumber: '1',
  // ...
}
```

### 3.2 Lancer le build

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
eas build --platform ios --profile production
```

**Durée :** 15-30 minutes (plus long qu'Android car build sur macOS)

**Ce qui se passe :**
1. Expo upload ton code
2. Build iOS dans le cloud (sur macOS)
3. Signature automatique avec les credentials
4. Tu reçois un lien de téléchargement

### 3.3 Télécharger l'IPA

Une fois le build terminé, tu recevras :
```
✔ Build finished

Build details: https://expo.dev/accounts/[...]/builds/[...]

IPA: https://expo.dev/artifacts/eas/[...].ipa
```

**Tu n'as pas besoin de télécharger l'IPA manuellement** - EAS peut l'uploader directement sur App Store Connect !

---

## 🏪 ÉTAPE 4 : Configurer App Store Connect

### 4.1 Créer l'application

1. Va sur [App Store Connect](https://appstoreconnect.apple.com)
2. Clique sur **"My Apps"**
3. Clique sur **"+"** puis **"New App"**
4. Remplis les informations :
   - **Platform :** iOS
   - **Name :** Corail
   - **Primary Language :** French
   - **Bundle ID :** com.corail.vtcmarketplace (doit correspondre à `app.config.js`)
   - **SKU :** corail-ios-001 (identifiant unique, pas visible par les utilisateurs)
   - **User Access :** Full Access (ou selon ton organisation)
5. Clique sur **"Create"**

### 4.2 Remplir les informations de base

Dans **"App Information"** :

1. **Name :** Corail
2. **Subtitle :** (optionnel, max 30 caractères)
   ```
   Marketplace VTC
   ```
3. **Category :**
   - Primary : Travel
   - Secondary : (optionnel) Business
4. **Privacy Policy URL :** (obligatoire)
   - Exemple : `https://corail.app/privacy-policy`
5. **Support URL :** (obligatoire)
   - Exemple : `https://corail.app/support`

### 4.3 Configurer les prix et disponibilité

Dans **"Pricing and Availability"** :

1. **Price :** Free (ou payant si tu veux)
2. **Availability :** Tous les pays (ou sélectionne)
3. **Save**

---

## 📤 ÉTAPE 5 : Uploader le build

### 5.1 Option A : Upload automatique avec EAS Submit (recommandé)

**Après le build :**
```bash
eas submit --platform ios --profile production
```

EAS va :
1. Télécharger l'IPA depuis le build
2. L'uploader sur App Store Connect
3. Le traiter automatiquement

**C'est la méthode la plus simple !**

### 5.2 Option B : Upload manuel via Transporter

Si tu préfères uploader manuellement :

1. **Télécharge l'IPA** depuis le lien Expo
2. **Installe Transporter** depuis le Mac App Store (gratuit)
3. **Ouvre Transporter**
4. **Glisse-dépose l'IPA** dans Transporter
5. **Clique sur "Deliver"**
6. Attends la fin de l'upload (5-10 min)

### 5.3 Vérifier l'upload

1. Va dans App Store Connect > **"My Apps"** > **"Corail"**
2. Clique sur **"TestFlight"** (onglet en haut)
3. Tu devrais voir ton build dans **"iOS Builds"**
4. Statut : **"Processing"** → puis **"Ready to Submit"** (10-30 min)

---

## 🧪 ÉTAPE 6 : Configurer TestFlight

### 6.1 Accéder à TestFlight

1. Dans App Store Connect, va dans **"TestFlight"**
2. Tu verras ton build une fois qu'il est prêt

### 6.2 Ajouter des testeurs internes

**Testeurs internes** (jusqu'à 100) :
- Membres de ton équipe Apple Developer
- Pas besoin de review Apple
- Accès immédiat

1. Va dans **"Internal Testing"**
2. Clique sur **"+"** pour créer un groupe
3. Nomme-le : **"Beta Testers"**
4. Ajoute les membres de ton équipe
5. Sélectionne le build
6. **"Start Testing"**

### 6.3 Ajouter des testeurs externes (recommandé pour quelques personnes)

**Testeurs externes** (jusqu'à 10,000) :
- N'importe qui avec un email
- **Première version :** Review Apple requise (24-48h)
- **Versions suivantes :** Pas de review si pas de changements majeurs

1. Va dans **"External Testing"**
2. Clique sur **"+"** pour créer un groupe
3. Nomme-le : **"Beta Testers"**
4. Clique sur **"Add Build"** et sélectionne ton build
5. Remplis les informations :
   - **What to Test :** Description de ce qu'il faut tester
   - **Feedback Email :** Ton email pour recevoir les retours
6. Clique sur **"Next"**
7. **Ajoute les emails des testeurs** (un par ligne)
8. Clique sur **"Add"**
9. Clique sur **"Submit for Review"**

**Première fois :** Apple va reviewer l'app (24-48h)
**Versions suivantes :** Généralement pas de review si pas de changements majeurs

---

## 📧 ÉTAPE 7 : Inviter les testeurs

### 7.1 Testeurs internes

Ils reçoivent automatiquement un email avec :
- Lien pour installer TestFlight
- Instructions d'installation

### 7.2 Testeurs externes

Une fois la review Apple approuvée :

1. Les testeurs reçoivent un email d'invitation
2. Ils doivent :
   - Installer **TestFlight** depuis l'App Store (gratuit)
   - Cliquer sur le lien dans l'email
   - Accepter l'invitation
   - Installer l'app depuis TestFlight

**Alternative :** Tu peux aussi partager un lien public (si activé) :
```
https://testflight.apple.com/join/[CODE]
```

---

## ✅ ÉTAPE 8 : Vérifier que tout fonctionne

### 8.1 Checklist

- [ ] Build iOS créé et uploadé
- [ ] Build visible dans TestFlight
- [ ] Groupe de testeurs créé
- [ ] Testeurs ajoutés
- [ ] Review Apple approuvée (pour testeurs externes)
- [ ] Testeurs ont reçu les invitations
- [ ] Tu peux installer l'app depuis TestFlight (en tant que testeur)

### 8.2 Tester toi-même

1. Installe **TestFlight** depuis l'App Store
2. Accepte ton invitation (si testeur externe) ou vérifie dans TestFlight (si testeur interne)
3. Installe l'app depuis TestFlight
4. Vérifie que tout fonctionne :
   - [ ] L'app se lance
   - [ ] Login fonctionne
   - [ ] Les données chargent
   - [ ] Pas de crash

---

## 🔄 ÉTAPE 9 : Mettre à jour l'app

Quand tu veux publier une nouvelle version :

### 9.1 Incrémenter la version

Dans `app.config.js` :
```javascript
version: '1.0.1',  // Version visible par l'utilisateur
ios: {
  buildNumber: '2',  // Version build (doit être +1)
}
```

### 9.2 Re-build

```bash
eas build --platform ios --profile production
```

### 9.3 Uploader et distribuer

```bash
eas submit --platform ios --profile production
```

Ou upload manuellement via Transporter.

### 9.4 Ajouter au groupe TestFlight

1. Va dans App Store Connect > TestFlight
2. Sélectionne ton groupe de testeurs
3. Clique sur **"Add Build"**
4. Sélectionne le nouveau build
5. **"Start Testing"** (pour testeurs internes)
6. Ou **"Submit for Review"** (pour testeurs externes, si nécessaire)

**Les testeurs recevront automatiquement la mise à jour via TestFlight !** 🎉

---

## 🚨 PROBLÈMES COURANTS

### 1. "No valid iOS Distribution certificate"

**Cause :** Credentials iOS manquants ou expirés.

**Solution :**
```bash
eas credentials
# Suis les instructions pour créer/renouveler les credentials
```

### 2. "Bundle identifier already exists"

**Cause :** Le `bundleIdentifier` est déjà utilisé par une autre app.

**Solution :**
- Change le `bundleIdentifier` dans `app.config.js`
- Ou supprime l'app existante dans App Store Connect

### 3. "Build processing failed"

**Cause :** Problème lors du build ou de l'upload.

**Solution :**
- Vérifie les logs : `eas build:view [BUILD_ID]`
- Re-build : `eas build --platform ios --profile production --clear-cache`

### 4. "Review rejected"

**Cause :** Apple a rejeté la review (violation des guidelines, etc.).

**Solution :**
- Vérifie les raisons dans App Store Connect > TestFlight > Review
- Corrige les problèmes
- Re-soumet

### 5. "TestFlight app not showing"

**Cause :** Build pas encore traité ou problème d'invitation.

**Solution :**
- Attends 10-30 min que le build soit traité
- Vérifie que les testeurs ont bien reçu l'email
- Vérifie que le groupe de testeurs est actif

### 6. "Missing compliance"

**Cause :** Apple demande des informations sur l'export compliance.

**Solution :**
Dans App Store Connect > TestFlight > Build :
- Réponds aux questions sur l'encryption
- Si tu utilises `usesNonExemptEncryption: false` dans `app.config.js`, tu peux répondre "No" aux questions d'export

---

## 📊 COMPARAISON : TestFlight vs Production

| Critère | TestFlight | Production |
|---------|------------|------------|
| **Review Apple** | Oui (première fois) | Oui (toujours) |
| **Temps de review** | 24-48h (première fois) | 1-7 jours |
| **Max testeurs** | 10,000 externes | Illimité |
| **Visible publiquement** | Non | Oui |
| **Installation** | Via TestFlight | Via App Store |
| **Pour qui ?** | Beta testeurs | Utilisateurs finaux |

**Recommandation :** Utilise **TestFlight** pour quelques personnes (c'est ton cas !)

---

## 🎯 CHECKLIST FINALE

### Avant le premier build
- [ ] Compte Apple Developer créé et payé (99$/an)
- [ ] `app.config.js` avec `bundleIdentifier` iOS
- [ ] `buildNumber` défini dans `app.config.js`
- [ ] EAS CLI installé et connecté (`eas login`)

### Build
- [ ] `eas build --platform ios --profile production` lancé
- [ ] Build réussi (15-30 min)
- [ ] Credentials iOS créés automatiquement par EAS

### App Store Connect
- [ ] Application créée dans App Store Connect
- [ ] Informations de base remplies
- [ ] Privacy Policy URL ajoutée
- [ ] Build uploadé (via `eas submit` ou Transporter)
- [ ] Build visible dans TestFlight

### TestFlight
- [ ] Groupe de testeurs créé (interne ou externe)
- [ ] Build ajouté au groupe
- [ ] Testeurs ajoutés (emails)
- [ ] Review Apple soumise (pour testeurs externes)
- [ ] Review approuvée (24-48h)

### Test
- [ ] TestFlight installé sur ton iPhone
- [ ] Invitation acceptée
- [ ] App installée depuis TestFlight
- [ ] App fonctionne correctement
- [ ] Invitations envoyées aux testeurs

---

## 🚀 COMMANDES RAPIDES

```bash
# Build iOS pour App Store
eas build --platform ios --profile production

# Upload automatique sur App Store Connect
eas submit --platform ios --profile production

# Voir les builds
eas build:list

# Voir les détails d'un build
eas build:view [BUILD_ID]

# Gérer les credentials iOS
eas credentials

# Re-build avec cache clear (si problème)
eas build --platform ios --profile production --clear-cache
```

---

## 📚 RESSOURCES

- [Documentation Expo - App Store](https://docs.expo.dev/submit/ios/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Apple Developer](https://developer.apple.com)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)

---

## 💡 CONSEILS

1. **Teste toi-même d'abord** avant de partager aux autres
2. **Garde le même `bundleIdentifier`** (com.corail.vtcmarketplace) - ne le change jamais !
3. **Incrémente toujours `buildNumber`** pour chaque nouvelle version
4. **Les mises à jour sont automatiques** - tes testeurs recevront les nouvelles versions via TestFlight
5. **TestFlight est parfait** pour quelques personnes - pas besoin de passer en production tout de suite
6. **La première review peut prendre 24-48h** - sois patient !
7. **Utilise `eas submit`** - c'est beaucoup plus simple que Transporter

---

## 💰 Coûts

- **Apple Developer Program :** 99$/an (obligatoire)
- **EAS Build :** Gratuit pour les premiers builds, puis payant selon l'usage
- **TestFlight :** Gratuit (inclus dans Apple Developer)

---

**🎉 Une fois que tout est configuré, tes testeurs pourront installer l'app directement depuis TestFlight comme une app normale !**

