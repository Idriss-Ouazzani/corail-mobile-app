/**
 * useNotifications - Hook pour gérer l'initialisation des notifications
 * 
 * Extrait la logique de notifications d'App.tsx pour simplifier le composant
 */

import { useEffect } from 'react';
import * as NotificationService from '../services/notifications';
import * as PushTokenService from '../services/pushTokens';
import { apiClient } from '../services/api';

interface UseNotificationsProps {
  user: any; // Supabase user
  userCredits: number;
  verificationStatus: string | null;
}

/**
 * Hook qui initialise automatiquement les notifications quand :
 * - L'utilisateur se connecte
 * - Les crédits sont faibles (< 2)
 * - Le statut de vérification change
 */
export const useNotifications = ({
  user,
  userCredits,
  verificationStatus,
}: UseNotificationsProps) => {
  
  // 🔔 Initialiser les notifications quand l'utilisateur se connecte
  useEffect(() => {
    if (!user) return;

    const initializeNotifications = async () => {
      try {
        const hasPermission = await NotificationService.requestNotificationPermissions();
        if (hasPermission) {
          console.log('✅ Notifications activées');
          
          // 📱 Enregistrer le push token dans Supabase
          const tokenRegistered = await PushTokenService.registerPushToken(user.id);
          if (tokenRegistered) {
            console.log('✅ Push token enregistré');
          }
          
          // Vérifier les crédits faibles en relisant la valeur serveur
          // (évite les faux positifs au démarrage quand le state local est encore à 0)
          if (userCredits >= 0 && userCredits < 2) {
            try {
              const fresh = await apiClient.getCredits();
              const freshCredits = typeof fresh === 'object' && fresh?.credits !== undefined
                ? Number(fresh.credits)
                : Number(fresh);
              if (Number.isFinite(freshCredits) && freshCredits >= 0 && freshCredits < 2) {
                await NotificationService.notifyLowCredits(freshCredits);
              }
            } catch (e) {
              console.warn('Low credits check skipped (fresh read failed):', e);
            }
          }
          
          // Notifier QR Code prêt (une seule fois)
          if (verificationStatus === 'VERIFIED') {
            await NotificationService.notifyQRCodeReady();
          }
        }
      } catch (error) {
        console.error('❌ Erreur initialisation notifications:', error);
      }
    };

    initializeNotifications();
  }, [user, userCredits, verificationStatus]);
  
  // 🧹 Désactiver le push token à la déconnexion
  useEffect(() => {
    if (!user) return;
    
    return () => {
      // Cleanup: marquer le token comme inactif quand le composant se démonte
      PushTokenService.deactivatePushToken(user.id).catch(err => {
        console.error('❌ Erreur désactivation push token:', err);
      });
    };
  }, [user]);

  // Ce hook n'expose rien, il gère juste les side-effects
};

