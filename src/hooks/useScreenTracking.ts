/**
 * useScreenTracking - Hook pour tracker automatiquement les changements d'écran
 * 
 * Extrait la logique d'analytics d'App.tsx pour simplifier le composant
 */

import { useEffect } from 'react';
import analytics from '../services/analytics';

interface UseScreenTrackingProps {
  currentScreen: string;
  user: any; // Firebase user
  verificationStatus: string | null;
}

/**
 * Hook qui track automatiquement les changements d'écran dans Firebase Analytics
 * Ne track que si l'utilisateur est connecté et vérifié
 */
export const useScreenTracking = ({
  currentScreen,
  user,
  verificationStatus,
}: UseScreenTrackingProps) => {
  
  useEffect(() => {
    // Ne tracker que si l'utilisateur est connecté et vérifié
    if (!user || verificationStatus !== 'VERIFIED') return;

    // Map des noms d'écrans pour Firebase Analytics
    const screenMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'courses': 'Courses',
      'tools': 'Tools',
      'profile': 'Profile',
    };
    
    const screenName = screenMap[currentScreen] || currentScreen;
    analytics.trackScreenView(screenName, `${screenName}Screen`);
  }, [currentScreen, user, verificationStatus]);

  // Ce hook n'expose rien, il gère juste les side-effects
};

