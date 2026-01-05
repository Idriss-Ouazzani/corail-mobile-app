/**
 * AuthContext - Gestion centralisée de l'authentification
 * 
 * Extrait de App.tsx pour améliorer la maintenabilité
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firebaseAuth } from '../services/firebase';
import { apiClient } from '../services/api';
import { logger } from '../services/logger';
import analytics from '../services/analytics';
import type { User as FirebaseUser } from 'firebase/auth';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  // État utilisateur
  user: FirebaseUser | null;
  authLoading: boolean;
  
  // Données de vérification
  verificationStatus: string | null;
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
  // États Firebase
  const [user, setUser] = useState<FirebaseUser | null>(null);
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

  // ============================================================================
  // FONCTIONS
  // ============================================================================

  /**
   * Charger le statut de vérification depuis Supabase
   */
  const loadVerificationStatus = async () => {
    try {
      setVerificationLoading(true);
      
      console.log('🔍 [DEBUG APK] loadVerificationStatus START');
      console.log('🔍 [DEBUG APK] user.email:', user?.email);
      console.log('🔍 [DEBUG APK] user.uid:', user?.uid);
      
      // S'assurer que l'utilisateur existe dans Supabase avec son email Firebase
      if (user?.email) {
        console.log('🔍 Vérification utilisateur Supabase pour:', user.email);
        
        // Essayer de créer l'utilisateur s'il n'existe pas
        try {
          await apiClient.createUser({
            id: user.uid,
            email: user.email,
            full_name: user.displayName || '',
          });
          console.log('✅ Utilisateur créé/mis à jour dans Supabase');
        } catch (createError: any) {
          // Ignorer l'erreur si l'utilisateur existe déjà (duplicate key)
          console.log('🔍 [DEBUG APK] createUser error:', createError.message);
          if (!createError.message?.includes('duplicate') && !createError.message?.includes('already exists')) {
            console.warn('⚠️ Erreur création utilisateur (peut-être déjà existant):', createError.message);
          }
        }
      }
      
      console.log('🔍 [DEBUG APK] Calling getVerificationStatus...');
      const response = await apiClient.getVerificationStatus();
      console.log('🔍 [DEBUG APK] Response received:', response ? 'Yes' : 'No');
      console.log('🔍 [DEBUG APK] response.verification_status:', response?.verification_status);
      console.log('🔍 [DEBUG APK] response.full_name:', response?.full_name);
      console.log('🔍 [DEBUG APK] response.email:', response?.email);
      
      console.log('📊 AuthContext - Données utilisateur BDD:', JSON.stringify(response, null, 2));
      
      const finalStatus = response.verification_status || 'UNVERIFIED';
      console.log('🔍 [DEBUG APK] Setting verificationStatus to:', finalStatus);
      
      setVerificationStatus(finalStatus);
      setUserFullName(response.full_name || '');
      setUserPhone(response.phone || '');
      setUserSiren(response.siren || '');
      setUserProfessionalCard(response.professional_card_number || response.vtc_card_number || '');
      setUserPhotoUrl(response.photo_url || '');
      setVerificationSubmittedAt(response.verification_submitted_at);
      setIsAdmin(response.is_admin === true || response.is_admin === 'true');
      setHasAcceptedTerms(response.has_accepted_terms === true || response.has_accepted_terms === 'true');
      
      console.log('✅ AuthContext - Données chargées - Nom:', response.full_name, '| Email:', response.email, '| Tél:', response.phone, '| VTC:', response.professional_card_number || response.vtc_card_number, '| Photo:', response.photo_url ? 'Oui' : 'Non');
      console.log('🔍 [DEBUG APK] loadVerificationStatus SUCCESS - Status:', finalStatus);
      
      // 📊 Analytics: Set user properties
      if (user) {
        await analytics.setUserProperties({
          userId: user.uid,
          isAdmin: response.is_admin === true || response.is_admin === 'true',
          verificationStatus: response.verification_status || 'UNVERIFIED',
          totalCredits: 0, // Will be updated by AppDataContext
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement statut vérification:', error);
      console.error('🔍 [DEBUG APK] loadVerificationStatus ERROR:', error.message);
      console.error('🔍 [DEBUG APK] Error stack:', error.stack);
      // Par défaut, si l'utilisateur n'existe pas, on considère qu'il n'est pas vérifié
      setVerificationStatus('UNVERIFIED');
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
      // 📊 Analytics: Clear user properties
      await analytics.clearUserProperties();
      
      await firebaseAuth.signOut();
      console.log('✅ Déconnexion réussie');
    } catch (error: any) {
      console.error('❌ Erreur déconnexion:', error);
      throw error;
    }
  };

  // ============================================================================
  // EFFETS
  // ============================================================================

  /**
   * Écouter les changements d'état d'authentification Firebase
   */
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Configurer l'API client avec le user ID
        apiClient.setUserId(firebaseUser.uid);
        
        // 🎯 Configurer Sentry avec l'utilisateur
        logger.setUser(
          firebaseUser.uid,
          firebaseUser.email || undefined,
          firebaseUser.displayName || undefined
        );
        
        console.log('✅ Utilisateur connecté:', firebaseUser.email);
      } else {
        // 🧹 Nettoyer toutes les données de la session précédente
        apiClient.clearAuth();
        setVerificationStatus(null);
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
        
        console.log('❌ Utilisateur déconnecté - Cache nettoyé');
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

