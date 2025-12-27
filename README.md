# 🪸 Corail - VTC Marketplace Mobile App

![Corail Logo](./docs/logo-banner.png)

**Corail** est une application mobile native React Native pour le marketplace VTC, permettant aux chauffeurs VTC professionnels de trouver, publier et gérer des courses.

---

## 🚀 Fonctionnalités

### ✨ Actuellement Implémentées

- 🏠 **Écran d'accueil** élégant avec statistiques et actions rapides
- 🔍 **Marketplace** - Parcourir les courses disponibles
  - Filtres (Toutes, Public, Groupes)
  - Refresh to reload
  - Mock data pour démo
- 🚗 **Mes Courses** - Gérer vos courses actives et historique
  - Filtres (En cours, Terminées, Toutes)
  - Stats clickables
- 👤 **Profil** - Informations utilisateur et paramètres
  - Abonnement (Gratuit, Premium, Platinum)
  - Statistiques (Note, Nombre de courses)
- 🪸 **Logo Corail élégant** en SVG
- 🎨 **Design moderne** avec glassmorphism et gradients

### 🔜 À Venir (Phase 2+)

- 🔐 **Firebase Authentication** (Email, Google, Apple Sign-In)
- 📍 **Intégration GPS** - Géolocalisation en temps réel
- 🗺️ **Navigation native** (Google Maps, Waze, Apple Plans)
- 🔔 **Push Notifications** (Nouvelles courses, rappels)
- 📤 **Partage de courses** (WhatsApp, Messenger, etc.)
- 👥 **Groupes** - Créer et gérer des groupes de "proches"
- 💰 **Paiement des commissions** (PayPal, Revolut, IBAN, Lydia)
- 📸 **Upload de documents** (Carte VTC, assurance, etc.)
- 🌐 **Multi-langues** (Français, Anglais)

---

## 🛠️ Stack Technique

- **Framework**: React Native + Expo
- **Langage**: TypeScript
- **Navigation**: React Navigation v6 (Bottom Tabs)
- **Styling**: NativeWind (Tailwind CSS pour React Native)
- **API Client**: Axios
- **Backend**: FastAPI (Python) → AWS Lambda/App Runner
- **Database**: Databricks SQL Warehouse / Lakebase
- **Auth** (À venir): Firebase Authentication
- **State Management**: React Hooks (Context API prévu)

---

## 📦 Installation

### Prérequis

- **Node.js** >= 16
- **npm** ou **yarn**
- **Expo Go app** sur votre téléphone:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/idrissouazzani-databricks/Corail-mobileapp.git
cd Corail-mobileapp

# 2. Installer les dépendances
npm install

# 3. Lancer l'app en mode développement
npm start
# ou
expo start

# 4. Scanner le QR code avec Expo Go sur votre téléphone
```

---

## 🏗️ Structure du Projet

```
Corail-mobileapp/
├── App.tsx                    # Point d'entrée principal
├── app.json                   # Configuration Expo
├── package.json
├── tsconfig.json
├── tailwind.config.js         # Configuration Tailwind/NativeWind
│
├── src/
│   ├── components/            # Composants réutilisables
│   │   ├── CoralLogo.tsx      # Logo Corail en SVG
│   │   └── RideCard.tsx       # Carte de course
│   │
│   ├── screens/               # Écrans de l'app
│   │   ├── SplashScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── MarketplaceScreen.tsx
│   │   ├── MyRidesScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── navigation/            # Configuration navigation
│   │   └── AppNavigator.tsx   # Bottom Tabs Navigator
│   │
│   ├── services/              # Services API
│   │   └── api.ts             # Client API (Axios)
│   │
│   ├── types/                 # Types TypeScript
│   │   └── index.ts           # Interfaces (Ride, User, etc.)
│   │
│   └── utils/                 # Utilitaires
│
└── assets/                    # Images, icônes, fonts
```

---

## 🌐 Backend & API

### Configuration

L'app communique avec un backend **FastAPI** hébergé sur AWS.

**Modifier l'URL de l'API** dans `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api/v1'     // Local dev
  : 'https://your-api.com/api/v1';     // Production (AWS)
```

### Endpoints Utilisés

- `GET /api/v1/rides/marketplace` - Liste des courses disponibles
- `GET /api/v1/rides/my-rides` - Mes courses
- `GET /api/v1/rides/{ride_id}` - Détail d'une course
- `POST /api/v1/rides` - Créer une course
- `POST /api/v1/rides/{ride_id}/claim` - Prendre une course
- `POST /api/v1/rides/{ride_id}/complete` - Terminer une course
- `POST /api/v1/rides/{ride_id}/cancel` - Annuler une course
- `GET /api/v1/groups/my-groups` - Mes groupes
- `GET /api/v1/users/{user_id}` - Profil utilisateur

---

## 🔐 Authentification (Prochaine Phase)

### Firebase Setup

```bash
# Installer Firebase
npm install firebase

# Installer react-native-firebase (pour features natives)
npm install @react-native-firebase/app @react-native-firebase/auth
```

### Configuration AWS Backend

Le backend FastAPI sera déployé sur **AWS Lambda** avec **API Gateway** ou **AWS App Runner**.

**CloudFormation template** fourni dans `infrastructure/aws-template.yaml` (à venir).

---

## 📱 Build & Déploiement

### Build Development

```bash
# iOS Simulator (Mac seulement)
npm run ios

# Android Emulator
npm run android

# Web (preview)
npm run web
```

### Build Production

```bash
# Créer un build Expo EAS
npx eas-cli build --platform ios
npx eas-cli build --platform android

# Publier sur Expo
npx eas-cli submit --platform ios
npx eas-cli submit --platform android
```

---

## 🎨 Design System

### Couleurs

```typescript
// Corail (Primary)
coral: {
  50: '#fff5f3',
  500: '#ff6b47',  // Main
  900: '#a02e1e',
}

// Ocean (Secondary)
ocean: {
  50: '#f0f9ff',
  500: '#0ea5e9',  // Main
  900: '#0c4a6e',
}
```

### Composants

- **CoralLogo** - Logo élégant avec SVG et gradients
- **RideCard** - Carte de course glassmorphism
- **Button** (à créer) - Boutons réutilisables
- **Input** (à créer) - Champs de formulaire

---

## 🧪 Tests

```bash
# Tests unitaires (à venir)
npm test

# Tests E2E (à venir)
npm run test:e2e
```

---

## 📊 Roadmap

### Phase 1 ✅ (Complétée)
- [x] Setup Expo + TypeScript
- [x] Logo Corail élégant
- [x] Screens de base (Home, Marketplace, My Rides, Profile)
- [x] Navigation Bottom Tabs
- [x] API Client
- [x] RideCard component
- [x] Mock data pour démo

### Phase 2 🚧 (En cours)
- [ ] Firebase Authentication
- [ ] Intégration GPS
- [ ] Navigation native (Google Maps, Waze)
- [ ] Push Notifications
- [ ] Partage de courses

### Phase 3 🔮 (Futur)
- [ ] Groupes de "proches"
- [ ] Paiement des commissions
- [ ] Upload de documents
- [ ] Multi-langues
- [ ] Mode offline
- [ ] Analytics

---

## 👥 Contributeurs

- **Idriss Ouazzani** - Product Owner & Developer
- **Hassan Al Masri** - Beta Tester

---

## 📄 Licence

© 2025 Corail - VTC Marketplace. Tous droits réservés.

---

## 🔗 Liens Utiles

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind](https://www.nativewind.dev/)
- [Firebase](https://firebase.google.com/)

---

## 📞 Support

Pour toute question ou problème :
- **Email**: support@corail-vtc.com
- **GitHub Issues**: [Créer une issue](https://github.com/idrissouazzani-databricks/Corail-mobileapp/issues)

---

**Fait avec 🪸 et ❤️ par l'équipe Corail**

