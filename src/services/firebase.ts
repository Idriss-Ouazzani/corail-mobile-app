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
  User,
  UserCredential
} from 'firebase/auth';

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
      const user = auth.currentUser;
      if (!user) return null;
      
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('Error getting ID token:', error);
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
    };

    return errorMessages[errorCode] || 'Une erreur est survenue. Réessayez.';
  }
};

export { auth };
export type { User };

