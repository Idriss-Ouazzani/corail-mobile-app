/**
 * Service de notifications push et locales
 * Gère les rappels de courses, alertes crédits, nouvelles courses, etc.
 */

import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  enabled: boolean;
  rideReminders: boolean; // 1h avant une course
  dailySummary: boolean; // Résumé quotidien
  newRidesAvailable: boolean; // Nouvelles courses marketplace
  lowCredits: boolean; // Alerte crédits < 2
  badgesEarned: boolean; // Nouveau badge
  groupInvitations: boolean; // Invitations groupes
  rideCompleted: boolean; // Rappel terminer course
}

const PREFS_KEY = '@notification_preferences';

// ============================================================================
// PERMISSIONS
// ============================================================================

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permissions notifications refusées');
      return false;
    }

    console.log('✅ Permissions notifications accordées');

    // Configuration iOS
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B47',
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur permissions notifications:', error);
    return false;
  }
}

// ============================================================================
// PRÉFÉRENCES
// ============================================================================

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const prefs = await AsyncStorage.getItem(PREFS_KEY);
    if (prefs) {
      return JSON.parse(prefs);
    }
  } catch (error) {
    console.error('Erreur lecture préférences:', error);
  }

  // Préférences par défaut (tout activé)
  return {
    enabled: true,
    rideReminders: true,
    dailySummary: true,
    newRidesAvailable: true,
    lowCredits: true,
    badgesEarned: true,
    groupInvitations: true,
    rideCompleted: true,
  };
}

export async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    console.log('✅ Préférences notifications sauvegardées');
  } catch (error) {
    console.error('❌ Erreur sauvegarde préférences:', error);
  }
}

// ============================================================================
// NOTIFICATIONS LOCALES
// ============================================================================

/**
 * 1. Rappel de course 1h avant
 */
export async function scheduleRideReminder(
  rideId: string,
  scheduledAt: string,
  pickupAddress: string,
  dropoffAddress: string
): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || !prefs.rideReminders) return;

  try {
    const rideTime = new Date(scheduledAt);
    const reminderTime = new Date(rideTime.getTime() - 60 * 60 * 1000); // 1h avant

    // Ne pas planifier si c'est dans le passé
    if (reminderTime.getTime() <= Date.now()) {
      console.log('⏰ Reminder trop proche, pas de notification');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 Course dans 1 heure',
        body: `${pickupAddress} → ${dropoffAddress}`,
        data: { rideId, type: 'ride_reminder' },
        sound: true,
      },
      trigger: reminderTime, // Passer directement la Date
    });

    console.log(`✅ Notification planifiée pour ${reminderTime.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Erreur planification notification:', error);
  }
}

/**
 * 2. Résumé quotidien (8h du matin)
 */
export async function scheduleDailySummary(ridesCount: number): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || !prefs.dailySummary || ridesCount === 0) return;

  try {
    // Annuler l'ancienne notification quotidienne
    const scheduledNotifs = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduledNotifs) {
      if (notif.content.data?.type === 'daily_summary') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Planifier pour 8h demain matin
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Planning du jour',
        body: `Vous avez ${ridesCount} course${ridesCount > 1 ? 's' : ''} prévue${ridesCount > 1 ? 's' : ''} aujourd'hui`,
        data: { type: 'daily_summary' },
        sound: true,
      },
      trigger: tomorrow, // Passer directement la Date
    });

    console.log(`✅ Résumé quotidien planifié pour demain 8h`);
  } catch (error) {
    console.error('❌ Erreur résumé quotidien:', error);
  }
}

/**
 * 3. Nouvelles courses disponibles
 */
export async function notifyNewRidesAvailable(count: number): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || !prefs.newRidesAvailable) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🆕 Nouvelles courses !',
        body: `${count} nouvelle${count > 1 ? 's' : ''} course${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''} sur la marketplace`,
        data: { type: 'new_rides' },
        sound: true,
      },
      trigger: { seconds: 1 }, // Immédiat
    });

    console.log(`✅ Notification nouvelles courses envoyée (${count})`);
  } catch (error) {
    console.error('❌ Erreur notification nouvelles courses:', error);
  }
}

/**
 * 4. QR Code prêt
 */
export async function notifyQRCodeReady(): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled) return;

  try {
    // Vérifier si déjà envoyée
    const sent = await AsyncStorage.getItem('@qr_notification_sent');
    if (sent === 'true') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ QR Code professionnel',
        body: 'Votre QR Code est prêt ! Partagez-le avec vos clients',
        data: { type: 'qr_ready' },
        sound: true,
      },
      trigger: { seconds: 1 }, // Immédiat
    });

    await AsyncStorage.setItem('@qr_notification_sent', 'true');
    console.log('✅ Notification QR Code envoyée');
  } catch (error) {
    console.error('❌ Erreur notification QR:', error);
  }
}

/**
 * 5. Alerte crédits faibles
 */
export async function notifyLowCredits(credits: number): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || !prefs.lowCredits || credits >= 2) return;

  try {
    // Éviter le spam : max 1 notif par jour
    const lastSent = await AsyncStorage.getItem('@low_credits_notif');
    if (lastSent) {
      const lastDate = new Date(lastSent);
      const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 1) return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Crédits faibles',
        body: credits === 0 
          ? 'Vous n\'avez plus de crédits ! Publiez des courses pour en gagner'
          : `Plus que ${credits} crédit${credits > 1 ? 's' : ''}. Pensez à publier des courses !`,
        data: { type: 'low_credits' },
        sound: true,
      },
      trigger: { seconds: 1 },
    });

    await AsyncStorage.setItem('@low_credits_notif', new Date().toISOString());
    console.log('✅ Notification crédits faibles envoyée');
  } catch (error) {
    console.error('❌ Erreur notification crédits:', error);
  }
}

/**
 * 6. Nouveau badge débloqué
 */
export async function notifyBadgeEarned(badgeName: string, badgeDescription: string): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || !prefs.badgesEarned) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Nouveau badge !',
        body: `${badgeName} : ${badgeDescription}`,
        data: { type: 'badge_earned' },
        sound: true,
      },
      trigger: { seconds: 1 },
    });

    console.log(`✅ Notification badge envoyée: ${badgeName}`);
  } catch (error) {
    console.error('❌ Erreur notification badge:', error);
  }
}

/**
 * 7. Invitation à un groupe
 */
export async function notifyGroupInvitation(groupName: string, inviterName: string): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || !prefs.groupInvitations) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '👥 Invitation groupe',
        body: `${inviterName} vous a invité à rejoindre "${groupName}"`,
        data: { type: 'group_invitation' },
        sound: true,
      },
      trigger: { seconds: 1 },
    });

    console.log(`✅ Notification invitation groupe envoyée`);
  } catch (error) {
    console.error('❌ Erreur notification groupe:', error);
  }
}

/**
 * 8. Rappel terminer une course
 */
export async function notifyCompleteRide(rideId: string, scheduledAt: string): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || !prefs.rideCompleted) return;

  try {
    const rideTime = new Date(scheduledAt);
    const reminderTime = new Date(rideTime.getTime() + 2 * 60 * 60 * 1000); // 2h après

    // Ne pas planifier si c'est dans le passé
    if (reminderTime.getTime() <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Terminer la course ?',
        body: 'Pensez à marquer votre course comme terminée pour gagner un crédit bonus',
        data: { rideId, type: 'complete_reminder' },
        sound: true,
      },
      trigger: reminderTime, // Passer directement la Date
    });

    console.log(`✅ Rappel "terminer course" planifié`);
  } catch (error) {
    console.error('❌ Erreur notification terminer course:', error);
  }
}

/**
 * 9. Course réclamée (pour le créateur)
 */
export async function notifyRideClaimed(pickupAddress: string, pickerName: string): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Course prise !',
        body: `${pickerName} a pris votre course (${pickupAddress})`,
        data: { type: 'ride_claimed' },
        sound: true,
      },
      trigger: { seconds: 1 },
    });

    console.log('✅ Notification course réclamée envoyée');
  } catch (error) {
    console.error('❌ Erreur notification course réclamée:', error);
  }
}

// ============================================================================
// GESTION
// ============================================================================

/**
 * Annuler toutes les notifications d'une course
 */
export async function cancelRideNotifications(rideId: string): Promise<void> {
  try {
    const scheduledNotifs = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notif of scheduledNotifs) {
      if (notif.content.data?.rideId === rideId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    console.log(`✅ Notifications annulées pour course ${rideId}`);
  } catch (error) {
    console.error('❌ Erreur annulation notifications:', error);
  }
}

/**
 * Annuler toutes les notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Toutes les notifications annulées');
  } catch (error) {
    console.error('❌ Erreur annulation toutes notifications:', error);
  }
}

/**
 * Obtenir le nombre de notifications planifiées
 */
export async function getScheduledNotificationsCount(): Promise<number> {
  try {
    const notifs = await Notifications.getAllScheduledNotificationsAsync();
    return notifs.length;
  } catch (error) {
    console.error('❌ Erreur comptage notifications:', error);
    return 0;
  }
}

/**
 * Test : envoyer une notification immédiate
 */
export async function sendTestNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Notification test',
        body: 'Les notifications fonctionnent correctement !',
        data: { type: 'test' },
        sound: true,
      },
      trigger: { seconds: 1 }, // Immédiat
    });

    console.log('✅ Notification test envoyée');
  } catch (error) {
    console.error('❌ Erreur notification test:', error);
    throw error;
  }
}

