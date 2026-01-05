/**
 * Push Notifications Service
 * Gère l'enregistrement du push token et la réception des notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Demander les permissions et enregistrer le push token
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  try {
    // Vérifier si c'est un appareil physique
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications: simulateur détecté, fonctionnalité désactivée');
      return null;
    }

    // Demander les permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permission pour les notifications refusée');
      return null;
    }

    // Obtenir le push token
    let token: string;
    
    try {
      // Essayer d'obtenir le token avec le projectId depuis la config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (projectId) {
        console.log('🔍 Project ID trouvé:', projectId);
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        token = tokenData.data;
      } else {
        // Pas de projectId configuré, essayer sans (fonctionne en développement)
        console.log('ℹ️ Pas de projectId configuré, tentative sans projectId...');
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
      }
      
      console.log('✅ Push token obtenu:', token);
    } catch (tokenError: any) {
      // Si l'obtention du token échoue, ce n'est pas grave en développement
      console.log('⚠️ Impossible d\'obtenir le push token:', tokenError.message);
      console.log('ℹ️ Les notifications push ne seront pas disponibles.');
      console.log('ℹ️ Pour activer les push notifications, créez un projet Expo:');
      console.log('ℹ️   1. Exécutez: npx expo login');
      console.log('ℹ️   2. Exécutez: npx eas init');
      return null;
    }

    // Enregistrer le token dans Supabase
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('❌ Erreur enregistrement push token:', error);
      return null;
    }

    console.log('✅ Push token enregistré dans Supabase');

    // Configuration Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B47',
      });
    }

    return token;
  } catch (error: any) {
    console.log('ℹ️ Push notifications non configurées:', error.message);
    console.log('ℹ️ L\'application fonctionnera normalement sans notifications push.');
    return null;
  }
}

/**
 * Configurer les listeners de notifications
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Notification reçue pendant que l'app est au premier plan
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📬 Notification reçue:', notification);
    onNotificationReceived?.(notification);
  });

  // Utilisateur a interagi avec la notification
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Utilisateur a cliqué sur la notification:', response);
    onNotificationResponse?.(response);
    
    // Gérer les actions selon le type de notification
    const data = response.notification.request.content.data;
    
    if (data.type === 'quote_accepted' || data.type === 'quote_refused') {
      // TODO: Naviguer vers l'écran des devis
      console.log('📊 Ouvrir le devis:', data.quote_id);
    }
  });

  // Fonction de nettoyage
  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Envoyer une notification locale de test
 */
export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧪 Test de notification',
      body: 'Les notifications fonctionnent correctement !',
      data: { type: 'test' },
    },
    trigger: { seconds: 1 },
  });
}

