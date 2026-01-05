/**
 * useNotifications - Hook pour gérer l'initialisation des notifications
 * 
 * Extrait la logique de notifications d'App.tsx pour simplifier le composant
 */

import { useEffect } from 'react';
import * as NotificationService from '../services/notifications';
import * as PushTokenService from '../services/pushTokens';

interface UseNotificationsProps {
  user: any; // Firebase user
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
          const tokenRegistered = await PushTokenService.registerPushToken(user.uid);
          if (tokenRegistered) {
            console.log('✅ Push token enregistré');
          }
          
          // Vérifier les crédits pour alerte si faible
          if (userCredits < 2) {
            await NotificationService.notifyLowCredits(userCredits);
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
      PushTokenService.deactivatePushToken(user.uid).catch(err => {
        console.error('❌ Erreur désactivation push token:', err);
      });
    };
  }, [user]);

  // Ce hook n'expose rien, il gère juste les side-effects
};

