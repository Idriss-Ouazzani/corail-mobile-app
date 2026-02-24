/**
 * AuthContext - Gestion centralisée de l'authentification (Supabase)
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabaseAuth, type SupabaseUser } from '../services/supabaseAuth';
import { apiClient } from '../services/api';
import { logger } from '../services/logger';
import analytics from '../services/analytics';
import * as NotificationService from '../services/notifications';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  // État utilisateur
  user: SupabaseUser | null;
  authLoading: boolean;
  
  // Données de vérification
  verificationStatus: string | null;
  /** Statut vérification chauffeur (documents) : not_started | pending | approved | rejected. Gating marketplace / Page Pro. */
  driverVerificationStatus: string | null;
  /** true si driver_verification_status === 'approved' (accès réseau, réservations site) */
  isDriverVerified: boolean;
  verificationLoading: boolean;
  userFullName: string;
  userPhone: string;
  userSiren: string;
  userProfessionalCard: string;
  userPhotoUrl: string;
  verificationSubmittedAt: string | undefined;
  isAdmin: boolean;
  hasAcceptedTerms: boolean;
  
  // Fonctions
  loadVerificationStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // États Supabase Auth
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // États de vérification
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userSiren, setUserSiren] = useState<string>('');
  const [userProfessionalCard, setUserProfessionalCard] = useState<string>('');
  const [userPhotoUrl, setUserPhotoUrl] = useState<string>('');
  const [verificationSubmittedAt, setVerificationSubmittedAt] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(true);
  const [driverVerificationStatus, setDriverVerificationStatus] = useState<string | null>(null);
  const previousVerificationStatusRef = useRef<string | null>(null);
  const previousDriverVerificationStatusRef = useRef<string | null>(null);

  // ============================================================================
  // FONCTIONS
  // ============================================================================

  /**
   * Charger le statut de vérification depuis Supabase
   */
  const loadVerificationStatus = async () => {
    try {
      setVerificationLoading(true);
      
      // Note: Avec Supabase Auth, l'utilisateur est automatiquement créé
      // dans public.users via le trigger handle_new_user()
      // Mais on le vérifie quand même au cas où
      if (user?.email) {
        console.log('🔍 Vérification profil utilisateur pour:', user.email);
      }
      
      const response = await apiClient.getVerificationStatus();
      
      console.log('🔍 [AuthContext] Response complète:', response);
      
      const finalStatus = response.verification_status || 'UNVERIFIED';
      const previousStatus = previousVerificationStatusRef.current;
      
      console.log('🔍 [AuthContext] verificationStatus:', finalStatus);
      console.log('🔍 [AuthContext] has_accepted_terms:', response.has_accepted_terms);
      
      setVerificationStatus(finalStatus);
      previousVerificationStatusRef.current = finalStatus;

      const driverStatus = response.driver_verification_status ?? null;
      setDriverVerificationStatus(driverStatus);
      const prevDriver = previousDriverVerificationStatusRef.current;
      previousDriverVerificationStatusRef.current = driverStatus;

      // Notification "Profil vérifié" (compte user)
      if (finalStatus === 'VERIFIED' && previousStatus != null && previousStatus !== 'VERIFIED') {
        try {
          await NotificationService.notifyVerificationAccepted();
        } catch (notifErr) {
          console.warn('⚠️ Notification vérification non envoyée:', notifErr);
        }
      }
      // Notification "Profil vérifié" chauffeur (documents approuvés)
      if (driverStatus === 'approved' && prevDriver != null && prevDriver !== 'approved') {
        try {
          await NotificationService.notifyVerificationAccepted();
        } catch (notifErr) {
          console.warn('⚠️ Notification vérification chauffeur non envoyée:', notifErr);
        }
      }

      setUserFullName(response.full_name || '');
      setUserPhone(response.phone || '');
      setUserSiren(response.siren || '');
      setUserProfessionalCard(response.professional_card_number || response.vtc_card_number || '');
      setUserPhotoUrl(response.photo_url || '');
      setVerificationSubmittedAt(response.verification_submitted_at);
      setIsAdmin(response.is_admin === true || response.is_admin === 'true');
      setHasAcceptedTerms(response.has_accepted_terms === true || response.has_accepted_terms === 'true');
      
      // 📊 Analytics: Set user properties (wrapped in try/catch to prevent breaking the auth flow)
      if (user) {
        try {
          await analytics.setUserProperties({
            userId: user.id,
            isAdmin: response.is_admin === true || response.is_admin === 'true',
            verificationStatus: response.verification_status || 'UNVERIFIED',
            totalCredits: 0, // Will be updated by AppDataContext
          });
        } catch (analyticsError: any) {
          console.warn('⚠️ Analytics error (non-blocking):', analyticsError);
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement statut vérification:', error);
      // Par défaut, si l'utilisateur n'existe pas, on considère qu'il n'est pas vérifié
      setVerificationStatus('UNVERIFIED');
      setDriverVerificationStatus(null);
      setIsAdmin(false);
    } finally {
      setVerificationLoading(false);
    }
  };

  /**
   * Déconnexion
   */
  const signOut = async () => {
    try {
      await supabaseAuth.signOut();
      console.log('✅ Déconnexion réussie');
      await analytics.clearUserProperties();
    } catch (error: any) {
      console.error('❌ Erreur déconnexion:', error);
      throw error;
    }
  };

  // ============================================================================
  // EFFETS
  // ============================================================================

  /**
   * Écouter les changements d'état d'authentification Supabase
   */
  useEffect(() => {
    const unsubscribe = supabaseAuth.onAuthStateChanged((supabaseUser) => {
      setUser(supabaseUser);
      
      if (supabaseUser) {
        // Configurer l'API client avec le user ID
        apiClient.setUserId(supabaseUser.id);
        
        // 🎯 Configurer Sentry avec l'utilisateur
        logger.setUser(
          supabaseUser.id,
          supabaseUser.email || undefined,
          supabaseUser.displayName || undefined
        );
        
        console.log('✅ Utilisateur Supabase connecté:', supabaseUser.email);
      } else {
        // 🧹 Nettoyer toutes les données de la session précédente
        apiClient.clearAuth();
        setVerificationStatus(null);
        setDriverVerificationStatus(null);
        setUserFullName('');
        setUserPhone('');
        setUserSiren('');
        setUserProfessionalCard('');
        setUserPhotoUrl('');
        setVerificationSubmittedAt(undefined);
        setIsAdmin(false);
        setHasAcceptedTerms(false);
        setVerificationLoading(true);
        
        // 🧹 Nettoyer l'utilisateur dans Sentry
        logger.clearUser();
        
        console.log('❌ Utilisateur Supabase déconnecté - Cache nettoyé');
      }
      
      setAuthLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  /**
   * Charger le statut de vérification quand l'utilisateur se connecte
   */
  useEffect(() => {
    if (user) {
      loadVerificationStatus();
    }
  }, [user]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const value: AuthContextType = {
    user,
    authLoading,
    verificationStatus,
    driverVerificationStatus,
    isDriverVerified: driverVerificationStatus === 'approved',
    verificationLoading,
    userFullName,
    userPhone,
    userSiren,
    userProfessionalCard,
    userPhotoUrl,
    verificationSubmittedAt,
    isAdmin,
    hasAcceptedTerms,
    loadVerificationStatus,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour accéder au contexte d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

