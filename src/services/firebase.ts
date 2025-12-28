/**
 * Firebase Authentication Service pour Corail VTC
 */
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  OAuthCredential,
  User,
  UserCredential
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Nécessaire pour que le navigateur se ferme après l'authentification
WebBrowser.maybeCompleteAuthSession();

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA_a2hHGNOTKusVjTFLwYxaUVAhQdFZq-s",
  authDomain: "corail-vtc.firebaseapp.com",
  projectId: "corail-vtc",
  storageBucket: "corail-vtc.firebasestorage.app",
  messagingSenderId: "767162545254",
  appId: "1:767162545254:web:28a4046932ec60e16729a7"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Service d'authentification Firebase
 */
export const firebaseAuth = {
  /**
   * Se connecter avec email et mot de passe
   */
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Firebase signIn error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  /**
   * Créer un nouveau compte
   */
  async signUp(email: string, password: string): Promise<User> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Firebase signUp error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  /**
   * Se connecter avec Google
   * Note: Fonctionne uniquement sur le web avec Expo Go
   * Pour mobile natif, il faut configurer expo-auth-session avec les Client IDs
   */
  async signInWithGoogle(): Promise<User> {
    try {
      console.log('[Firebase] 🔵 Tentative de connexion Google...');
      
      if (Platform.OS === 'web') {
        // Pour le web, utiliser signInWithPopup
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        const result = await signInWithPopup(auth, provider);
        console.log('[Firebase] ✅ Connexion Google réussie (web):', result.user.email);
        return result.user;
      } else {
        // Pour mobile, retourner une erreur explicite
        // TODO: Implémenter avec expo-auth-session si nécessaire
        throw new Error(
          'Connexion Google non disponible sur mobile avec Expo Go. ' +
          'Utilisez l\'email/mot de passe ou compilez l\'app en standalone.'
        );
      }
    } catch (error: any) {
      console.error('[Firebase] ❌ Erreur Google Sign-In:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Connexion annulée');
      }
      if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Connexion annulée');
      }
      
      throw new Error(error.message || 'Erreur lors de la connexion avec Google');
    }
  },

  /**
   * Se déconnecter
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Firebase signOut error:', error);
      throw error;
    }
  },

  /**
   * Obtenir l'utilisateur actuellement connecté
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Obtenir le token Firebase ID pour les appels API
   */
  async getIdToken(): Promise<string | null> {
    try {
      console.log('[Firebase] 🔍 getIdToken() appelé');
      const user = auth.currentUser;
      console.log('[Firebase] 👤 Utilisateur actuel:', user ? `${user.email} (${user.uid})` : 'null');
      
      if (!user) {
        console.warn('[Firebase] ⚠️ Pas d\'utilisateur connecté');
        return null;
      }
      
      console.log('[Firebase] 🔐 Récupération du token...');
      const token = await user.getIdToken();
      console.log('[Firebase] ✅ Token récupéré, longueur:', token.length);
      return token;
    } catch (error) {
      console.error('[Firebase] ❌ Erreur getting ID token:', error);
      return null;
    }
  },

  /**
   * Écouter les changements d'état d'authentification
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Convertir les codes d'erreur Firebase en messages lisibles
   */
  getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-email': 'Adresse email invalide',
      'auth/user-disabled': 'Ce compte a été désactivé',
      'auth/user-not-found': 'Aucun compte trouvé avec cet email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/email-already-in-use': 'Cet email est déjà utilisé',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion',
      'auth/invalid-credential': 'Email ou mot de passe incorrect',
      'auth/popup-closed-by-user': 'Connexion annulée',
      'auth/cancelled-popup-request': 'Connexion annulée',
      'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet email',
    };

    return errorMessages[errorCode] || 'Une erreur est survenue. Réessayez.';
  }
};

export { auth };
export type { User };

