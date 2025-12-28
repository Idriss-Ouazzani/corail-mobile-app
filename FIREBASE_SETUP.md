# 🔥 Setup Firebase pour Corail Mobile App

Guide complet pour intégrer Firebase Authentication dans l'app React Native.

---

## 📋 Étape 1 : Créer le projet Firebase (5 min)

### 1.1 Console Firebase

1. Aller sur https://console.firebase.google.com
2. Cliquer "Add project"
3. Nom du projet : **"Corail VTC"**
4. Désactiver Google Analytics (optionnel)
5. Créer le projet → Attendre ~30 secondes

### 1.2 Activer Authentication

1. Dans le menu → **Build** → **Authentication**
2. Cliquer **"Get Started"**
3. Activer les providers :
   - ✅ **Email/Password** (obligatoire)
   - ✅ **Google** (optionnel, recommandé)
   - ⚠️ **Phone** (optionnel, nécessite upgrade mais gratuit jusqu'à 10K/mois)

### 1.3 Créer un utilisateur de test

1. Dans Authentication → Users → Add user
2. Email : `test@corail.com`
3. Password : `test123456`
4. Créer

---

## 🔑 Étape 2 : Télécharger les clés

### 2.1 Pour le Backend (FastAPI)

1. **Project Settings** (⚙️ en haut à gauche) → **Service Accounts**
2. Cliquer **"Generate new private key"**
3. Télécharger le fichier JSON
4. Le sauvegarder comme **`firebase-key.json`** dans `/backend/`
5. ⚠️ Ne JAMAIS commit ce fichier !

### 2.2 Pour l'App Mobile (Expo)

#### ✅ Avec Expo (notre cas) - Simple !

1. **Project Settings** (⚙️) → **General**
2. Scroll vers **"Your apps"**
3. Ajouter une app **Web** (oui, Web !)
4. Copier la configuration JavaScript :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "corail-vtc.firebaseapp.com",
  projectId: "corail-vtc",
  storageBucket: "corail-vtc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**C'est tout ! Pas besoin de fichiers natifs avec Expo ! 🎉**

---

<details>
<summary>📱 <strong>Optionnel : Build natif (EAS Build)</strong></summary>

Si plus tard tu fais un build natif avec `eas build`, tu auras besoin de :

#### Pour Android :
1. Project Settings → Ajouter app **Android**
2. Package name : `com.corail.vtc`
3. Télécharger `google-services.json`
4. Placer dans `/Corail-mobileapp/google-services.json` (racine du projet mobile)

#### Pour iOS :
1. Project Settings → Ajouter app **iOS**
2. Bundle ID : `com.corail.vtc`
3. Télécharger `GoogleService-Info.plist`
4. Placer dans `/Corail-mobileapp/GoogleService-Info.plist` (racine du projet mobile)

**Note :** Ces fichiers vont à la **racine de l'app mobile**, pas dans `/backend/` !

</details>

---

### 2.3 Configuration dans le code

Dans Project Settings → General → Your apps, copier la config **Web** :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "corail-vtc.firebaseapp.com",
  projectId: "corail-vtc",
  storageBucket: "corail-vtc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## 📦 Étape 3 : Installer Firebase SDK dans l'app mobile

### 3.1 Installer les packages

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npm install firebase
npm install @react-native-firebase/app @react-native-firebase/auth
```

### 3.2 Créer le fichier de configuration

Créer `src/services/firebase.ts` :

```typescript
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

// Configuration Firebase (copier depuis Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "corail-vtc.firebaseapp.com",
  projectId: "corail-vtc",
  storageBucket: "corail-vtc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Fonctions d'authentification
export const firebaseAuth = {
  // Login
  async signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Register
  async signUp(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Logout
  async signOut() {
    await signOut(auth);
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Get ID token for API calls
  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};

export { auth };
```

### 3.3 Mettre à jour le client API

Modifier `src/services/api.ts` :

```typescript
import { firebaseAuth } from './firebase';

class ApiClient {
  private baseUrl: string;

  constructor() {
    // URL du backend Databricks Apps (à mettre à jour après déploiement)
    this.baseUrl = __DEV__
      ? 'http://localhost:8000/api/v1'  // Dev local
      : 'https://corail-api-xxxxx.databricksapps.com/api/v1';  // Production
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await firebaseAuth.getIdToken();
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getRides(filters?: any) {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/rides`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch rides');
    }
    
    return response.json();
  }

  async createRide(rideData: any) {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/rides`, {
      method: 'POST',
      headers,
      body: JSON.stringify(rideData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create ride');
    }
    
    return response.json();
  }

  async claimRide(rideId: string) {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/rides/${rideId}/claim`, {
      method: 'POST',
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to claim ride');
    }
    
    return response.json();
  }

  async getMyRides(type: 'claimed' | 'published') {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}/my-rides?type=${type}`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch my rides');
    }
    
    return response.json();
  }
}

export const api = new ApiClient();
```

---

## 🎨 Étape 4 : Créer les écrans d'authentification

### 4.1 Écran de Login

Créer `src/screens/LoginScreen.tsx` :

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { firebaseAuth } from '../services/firebase';

export const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await firebaseAuth.signIn(email, password);
      Alert.alert('Succès', 'Connexion réussie !');
      onLoginSuccess();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient}>
        <View style={styles.content}>
          <Text style={styles.title}>Bienvenue sur Corail</Text>
          <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient colors={['#ff6b47', '#ff8a6d']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 40 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 20,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
```

### 4.2 Mettre à jour App.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { firebaseAuth } from './src/services/firebase';
import { LoginScreen } from './src/screens/LoginScreen';
// ... autres imports

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Écouter les changements d'état d'auth
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <SplashScreen />;  // Écran de chargement
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={() => setUser(firebaseAuth.getCurrentUser())} />;
  }

  // Reste de l'app...
  return (
    // ... ton app actuelle
  );
}
```

---

## ✅ Checklist finale

- [ ] Projet Firebase créé
- [ ] Authentication activée (Email/Password)
- [ ] Utilisateur de test créé
- [ ] `firebase-key.json` téléchargé et placé dans `/backend/`
- [ ] Config Firebase copiée dans `src/services/firebase.ts`
- [ ] Packages npm installés
- [ ] Écran de login créé
- [ ] API client mis à jour avec les tokens
- [ ] App.tsx mis à jour avec l'auth

---

## 🧪 Test

1. **Backend** : `cd backend && uvicorn app.main:app --reload`
2. **Mobile** : `cd .. && npx expo start`
3. Login avec `test@corail.com` / `test123456`
4. Vérifier que les API calls incluent le token Firebase

---

## 🔐 Sécurité

✅ **Bonnes pratiques** :
- Token vérifié côté serveur (Firebase Admin SDK)
- `firebase-key.json` dans `.gitignore`
- HTTPS uniquement en production
- Rotation des tokens Firebase automatique

⚠️ **À faire avant prod** :
- Restreindre les CORS
- Activer 2FA pour les admins
- Configurer les quotas Firebase
- Monitoring des tentatives de login

---

🎉 **C'est prêt ! Ton app est maintenant sécurisée avec Firebase !** 🔥

