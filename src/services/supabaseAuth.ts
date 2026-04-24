/**
 * Supabase Authentication Service pour Corail
 * Authentification Supabase
 */

import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface SupabaseUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

/**
 * Service d'authentification Supabase
 */
export const supabaseAuth = {
  /**
   * Se connecter avec email et mot de passe
   */
  async signIn(email: string, password: string): Promise<SupabaseUser> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Aucun utilisateur retourné');

      return this.mapUser(data.user);
    } catch (error: any) {
      const msg = error?.message ?? '';
      const isNetworkError = msg.includes('Network request failed') || msg.includes('AuthRetryableFetchError');
      if (isNetworkError) {
        console.warn('⚠️ Supabase signIn: pas de connexion réseau');
      } else {
        console.error('Supabase signIn error:', error);
      }
      throw new Error(this.getErrorMessage(msg || error?.code));
    }
  },

  /**
   * Créer un nouveau compte
   */
  async signUp(email: string, password: string, fullName?: string): Promise<SupabaseUser> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Aucun utilisateur retourné');

      console.log('✅ Compte Supabase créé:', data.user.email);
      
      return this.mapUser(data.user);
    } catch (error: any) {
      console.error('Supabase signUp error:', error);
      throw new Error(this.getErrorMessage(error.message || error.code));
    }
  },

  /**
   * Se connecter avec Google (OAuth)
   */
  async signInWithGoogle(): Promise<void> {
    try {
      console.log('[Supabase] 🔵 Tentative de connexion Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      
      console.log('[Supabase] ✅ Redirection vers Google OAuth');
      // La redirection va se faire automatiquement
    } catch (error: any) {
      console.error('[Supabase] ❌ Erreur Google Sign-In:', error);
      throw new Error(error.message || 'Erreur lors de la connexion avec Google');
    }
  },

  /**
   * Se déconnecter
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ Déconnexion Supabase réussie');
    } catch (error: any) {
      console.error('Supabase signOut error:', error);
      throw error;
    }
  },

  /**
   * Obtenir l'utilisateur actuellement connecté
   */
  async getCurrentUser(): Promise<SupabaseUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;
      
      return this.mapUser(user);
    } catch (error) {
      console.error('Erreur getting current user:', error);
      return null;
    }
  },

  /**
   * Obtenir la session actuelle.
   * Si le refresh token est invalide (révoqué/expiré), on signe out pour nettoyer le stockage et éviter les erreurs en boucle.
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        const msg = error?.message ?? '';
        if (msg.includes('Refresh Token') || msg.includes('refresh_token')) {
          await supabase.auth.signOut();
          return null;
        }
        throw error;
      }
      return session;
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message ?? '';
      if (msg.includes('Refresh Token') || msg.includes('refresh_token')) {
        await supabase.auth.signOut();
        return null;
      }
      console.error('Erreur getting session:', error);
      return null;
    }
  },

  /**
   * Obtenir le token d'accès pour les appels API
   */
  async getIdToken(): Promise<string | null> {
    try {
      const session = await this.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Erreur getting ID token:', error);
      return null;
    }
  },

  /**
   * Écouter les changements d'état d'authentification
   */
  onAuthStateChanged(callback: (user: SupabaseUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ? this.mapUser(session.user) : null;
      callback(user);
    });

    return () => subscription.unsubscribe();
  },

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      console.log('✅ Email de réinitialisation envoyé');
    } catch (error: any) {
      console.error('Erreur reset password:', error);
      throw new Error(this.getErrorMessage(error.message || error.code));
    }
  },

  /**
   * Mettre à jour le mot de passe
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      console.log('✅ Mot de passe mis à jour');
    } catch (error: any) {
      console.error('Erreur update password:', error);
      throw new Error(this.getErrorMessage(error.message || error.code));
    }
  },

  /**
   * Mapper un User Supabase vers notre format
   */
  mapUser(user: User): SupabaseUser {
    return {
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.full_name || '',
      photoURL: user.user_metadata?.avatar_url || '',
    };
  },

  /**
   * Convertir les messages d'erreur Supabase en messages lisibles
   */
  getErrorMessage(errorMessage: string): string {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'Email ou mot de passe incorrect',
      'Email not confirmed': 'Veuillez confirmer votre email',
      'User already registered': 'Cet email est déjà utilisé',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
      'Unable to validate email address': 'Adresse email invalide',
      'Email rate limit exceeded': 'Trop de tentatives. Réessayez plus tard',
      'Signups not allowed': 'Les inscriptions sont temporairement désactivées',
      'User not found': 'Aucun compte trouvé avec cet email',
      'Network request failed': 'Pas de connexion internet. Vérifiez le réseau et réessayez.',
      'AuthRetryableFetchError': 'Pas de connexion internet. Vérifiez le réseau et réessayez.',
    };

    // Chercher une correspondance dans le message d'erreur
    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.includes(key)) {
        return value;
      }
    }

    return 'Une erreur est survenue. Réessayez.';
  }
};

// Export du type User pour la compatibilité
export type { SupabaseUser as User };

