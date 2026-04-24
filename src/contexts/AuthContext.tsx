/**
 * AuthContext - Gestion centralisée de l'authentification (Supabase)
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseAuth, type SupabaseUser } from '../services/supabaseAuth';
import { apiClient } from '../services/api';
import { logger } from '../services/logger';
import analytics from '../services/analytics';
import * as NotificationService from '../services/notifications';

function verificationSnapKey(userId: string) {
  return `@corail_verif_profile_snap_${userId}`;
}

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
  /** `public.users.id` (clé primaire) — peut différer de `user.id` (auth) pour comptes migrés */
  publicUsersRowId: string | null;

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
  const [publicUsersRowId, setPublicUsersRowId] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(true);
  const [driverVerificationStatus, setDriverVerificationStatus] = useState<string | null>(null);
  const previousVerificationStatusRef = useRef<string | null>(null);
  const previousDriverVerificationStatusRef = useRef<string | null>(null);
  const hadUserRef = useRef<boolean>(false);

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

      /**
       * Notif locale « Profil vérifié » : uniquement sur transition réelle (pas à chaque login / resume).
       * On persiste le dernier couple (users.verification_status | driver_verification) par compte.
       */
      const uid = user?.id;
      if (uid) {
        const snapKey = verificationSnapKey(uid);
        let prevSnap: string | null = null;
        try {
          prevSnap = await AsyncStorage.getItem(snapKey);
        } catch {
          /* ignore */
        }
        const parts = prevSnap?.split('|') ?? [];
        const prevUserFromSnap = parts[0] ?? null;
        const prevDriverFromSnap = parts.length > 1 ? parts[1] : null;
        const drvSeg = driverStatus ?? '';
        const newSnap = `${finalStatus}|${drvSeg}`;

        const userJustVerified =
          finalStatus === 'VERIFIED' && prevUserFromSnap != null && prevUserFromSnap !== 'VERIFIED';
        const driverJustApproved =
          driverStatus === 'approved' &&
          prevDriverFromSnap != null &&
          prevDriverFromSnap !== '' &&
          prevDriverFromSnap !== 'approved';

        if (userJustVerified || driverJustApproved) {
          try {
            await NotificationService.notifyVerificationAccepted();
          } catch (notifErr) {
            console.warn('⚠️ Notification vérification non envoyée:', notifErr);
          }
        }

        try {
          await AsyncStorage.setItem(snapKey, newSnap);
        } catch {
          /* ignore */
        }
      }

      setUserFullName(response.full_name || '');
      setUserPhone(response.phone || '');
      setUserSiren(''); // SIRET géré sur vtc_profiles, plus de siren sur users
      setUserProfessionalCard(response.professional_card_number || response.vtc_card_number || '');
      setUserPhotoUrl(response.photo_url || '');
      setVerificationSubmittedAt(response.verification_submitted_at);
      setIsAdmin(response.is_admin === true || response.is_admin === 'true');
      setHasAcceptedTerms(response.has_accepted_terms === true || response.has_accepted_terms === 'true');
      setPublicUsersRowId(response.id != null && String(response.id) !== '' ? String(response.id) : null);

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
      setPublicUsersRowId(null);
    } finally {
      setVerificationLoading(false);
    }
  };

  /**
   * Déconnexion
   */
  const signOut = async () => {
    try {
      previousVerificationStatusRef.current = null;
      previousDriverVerificationStatusRef.current = null;
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
      const hadUser = hadUserRef.current;
      hadUserRef.current = !!supabaseUser;

      setUser(supabaseUser);

      if (supabaseUser) {
        apiClient.setUserId(supabaseUser.id);
        logger.setUser(
          supabaseUser.id,
          supabaseUser.email || undefined,
          supabaseUser.displayName || undefined
        );
        console.log('✅ Utilisateur Supabase connecté:', supabaseUser.email);
      } else {
        apiClient.clearAuth();
        previousVerificationStatusRef.current = null;
        previousDriverVerificationStatusRef.current = null;
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
        setPublicUsersRowId(null);
        logger.clearUser();
        if (hadUser) {
          console.log('❌ Session expirée ou invalide - déconnexion. Reconnectez-vous.');
        }
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
    publicUsersRowId,
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

