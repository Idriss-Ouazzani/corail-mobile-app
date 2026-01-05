/**
 * AppDataContext - DEPRECATED - Remplacé par les Custom Hooks
 * 
 * ⚠️ Ce fichier est conservé temporairement pour compatibilité
 * 🎯 Utilisez maintenant les hooks : useRides, useCredits, useBadges, useGroups
 * 
 * Migration :
 * AVANT : const { rides, loadRides } = useAppData();
 * APRÈS : const { rides, loadRides } = useRides(userId, credits);
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useRides, usePersonalRides, useCredits, useBadges, useGroups } from '../hooks';
import type { Ride } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface AppDataContextType {
  // Rides
  rides: Ride[];
  personalRides: any[];
  loadingRides: boolean;
  loadRides: () => Promise<void>;
  loadPersonalRides: () => Promise<void>;
  
  // Credits
  userCredits: number;
  loadCredits: () => Promise<void>;
  
  // Badges
  userBadges: any[];
  loadBadges: () => Promise<void>;
  checkAndAwardUserBadges: () => Promise<void>;
  
  // Groups
  userGroups: any[];
  loadGroups: () => Promise<void>;
  
  // Cleanup
  clearAllData: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// ============================================================================
// PROVIDER - Maintenant un simple wrapper autour des hooks
// ============================================================================

interface AppDataProviderProps {
  children: ReactNode;
  userId: string | null;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children, userId }) => {
  // 🎯 Utiliser les Custom Hooks au lieu de gérer l'état manuellement
  const { credits: userCredits, loadCredits } = useCredits(userId);
  const { rides, loading: loadingRides, loadRides } = useRides(userId, userCredits);
  const { personalRides, loadPersonalRides } = usePersonalRides(userId);
  const { badges: userBadges, loadBadges, checkBadges } = useBadges(userId);
  const { groups: userGroups, loadGroups } = useGroups(userId);

  const clearAllData = () => {
    console.log('🧹 Nettoyage des données...');
    // Les hooks gèrent leur propre nettoyage
  };

  const value: AppDataContextType = {
    rides,
    personalRides,
    loadingRides,
    loadRides,
    loadPersonalRides,
    userCredits,
    loadCredits,
    userBadges,
    loadBadges,
    checkAndAwardUserBadges: checkBadges,
    userGroups,
    loadGroups,
    clearAllData,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};
