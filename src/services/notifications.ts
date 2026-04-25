/**
 * Service de notifications push et locales
 * Gère les rappels de courses, alertes crédits, nouvelles courses, etc.
 */

import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as PushTokenService from './pushTokens';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
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
    // Nettoyer les anciennes notifications planifiées au démarrage
    // Cela évite les notifications obsolètes (ex: crédits faibles alors que l'utilisateur a maintenant >2 crédits)
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🧹 Notifications planifiées nettoyées au démarrage');
    } catch (cleanupError) {
      console.warn('⚠️ Erreur nettoyage notifications:', cleanupError);
    }
    
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

    // Calculer le nombre de secondes jusqu'au rappel
    const secondsUntilReminder = Math.floor((reminderTime.getTime() - Date.now()) / 1000);
    
    // Ne pas planifier si c'est dans le passé ou trop proche (< 10 secondes)
    if (secondsUntilReminder < 10) {
      console.log('⏰ Reminder trop proche, pas de notification');
      return;
    }

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
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntilReminder, repeats: false },
    });

    console.log(`✅ Notification planifiée pour ${reminderTime.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Erreur planification notification:', error);
  }
}

/**
 * 1b. Rappel de course 1 minute avant (démarrage imminent)
 */
export async function scheduleRideImminentReminder(
  rideId: string,
  scheduledAt: string,
  pickupAddress: string,
  dropoffAddress: string
): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || !prefs.rideReminders) return;

  try {
    const rideTime = new Date(scheduledAt);
    const reminderTime = new Date(rideTime.getTime() - 60 * 1000); // 1 minute avant
    
    // Calculer le nombre de secondes jusqu'au rappel
    const secondsUntilReminder = Math.floor((reminderTime.getTime() - Date.now()) / 1000);

    // Ne pas planifier si c'est trop proche (< 5 secondes) ou dans le passé
    if (secondsUntilReminder < 5) {
      console.log('⏰ Démarrage imminent trop proche, pas de notification');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚀 Démarrage imminent de votre course',
        body: `${pickupAddress} → ${dropoffAddress}`,
        data: { rideId, type: 'ride_imminent' },
        sound: true,
        priority: 'high',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntilReminder, repeats: false },
    });

    console.log(`✅ Notification "démarrage imminent" planifiée pour ${reminderTime.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Erreur planification notification imminent:', error);
  }
}

/**
 * 2. Résumé quotidien à 9h du matin
 * Envoyé uniquement si la personne a des courses prévues ce jour-là.
 * @param ridesCount Nombre de courses pour le jour cible
 * @param forDate Jour concerné (à 9h). Si absent, on planifie pour demain 9h.
 */
export async function scheduleDailySummary(ridesCount: number, forDate?: Date): Promise<void> {
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

    const target = forDate ? new Date(forDate) : new Date();
    if (!forDate) {
      target.setDate(target.getDate() + 1);
    }
    target.setHours(9, 0, 0, 0);

    const secondsUntil = Math.floor((target.getTime() - Date.now()) / 1000);
    if (secondsUntil < 10) {
      console.log('⏰ Résumé quotidien 9h trop proche, pas de notification');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Planning du jour',
        body: `Vous avez ${ridesCount} course${ridesCount > 1 ? 's' : ''} prévue${ridesCount > 1 ? 's' : ''} aujourd'hui.`,
        data: { type: 'daily_summary' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntil, repeats: false },
    });

    console.log(`✅ Résumé quotidien planifié pour ${target.toLocaleDateString('fr-FR')} à 9h (${ridesCount} course(s))`);
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
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
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
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
    });

    await AsyncStorage.setItem('@qr_notification_sent', 'true');
    console.log('✅ Notification QR Code envoyée');
  } catch (error) {
    console.error('❌ Erreur notification QR:', error);
  }
}

/**
 * 5. Alerte crédits faibles (uniquement si 0 ou 1 crédit)
 */
export async function notifyLowCredits(credits: number): Promise<void> {
  const prefs = await getNotificationPreferences();
  // Ne notifier QUE si crédits === 0 ou crédits === 1
  if (!prefs.enabled || !prefs.lowCredits || credits < 0 || credits >= 2) return;

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
        title: 'Équilibre faible',
        body: credits === 0 
          ? 'Solde à zéro. Publiez des courses pour en gagner.'
          : `Plus que ${credits}. Publiez des courses pour en gagner.`,
        data: { type: 'low_credits' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
    });

    await AsyncStorage.setItem('@low_credits_notif', new Date().toISOString());
    console.log('✅ Notification crédits faibles envoyée');
  } catch (error) {
    console.error('❌ Erreur notification crédits:', error);
  }
}

/**
 * 5b. Rappel devis en attente de réponse client
 */
export async function notifyPendingQuoteResponses(count: number): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || count <= 0) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Devis en attente',
        body: `${count} devis attend${count > 1 ? 'ent' : ''} encore une réponse client.`,
        data: { type: 'quote_pending_followup', count },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
    });
  } catch (error) {
    console.error('❌ Erreur notification devis en attente:', error);
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
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
    });

    console.log(`✅ Notification badge envoyée: ${badgeName}`);
  } catch (error) {
    console.error('❌ Erreur notification badge:', error);
  }
}

/**
 * 7. Invitation à un groupe - LOCAL + PUSH
 */
export async function notifyGroupInvitation(
  inviteeUserId: string,
  groupName: string, 
  inviterName: string,
  options?: { inviterUserId?: string | null }
): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled || !prefs.groupInvitations) return;

  if (
    options?.inviterUserId != null &&
    String(options.inviterUserId) === String(inviteeUserId)
  ) {
    return;
  }

  try {
    // Push uniquement vers l’appareil de l’invité (pas de notif locale : elle s’afficherait sur le téléphone de l’inviteur).

    await PushTokenService.sendPushToUser(
      inviteeUserId,
      '👥 Invitation groupe',
      `${inviterName} vous a invité à rejoindre "${groupName}"`,
      { type: 'group_invitation' }
    );

    console.log(`✅ Notification push invitation groupe envoyée`);
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
    
    // Calculer le nombre de secondes jusqu'au rappel
    const secondsUntilReminder = Math.floor((reminderTime.getTime() - Date.now()) / 1000);

    // Ne pas planifier si c'est dans le passé ou trop proche
    if (secondsUntilReminder < 10) return;

    // Ne pas planifier si c'est dans le passé
    if (reminderTime.getTime() <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Terminer la course ?',
        body: 'Pensez à marquer votre course comme terminée pour gagner un crédit bonus',
        data: { rideId, type: 'complete_reminder' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntilReminder, repeats: false },
    });

    console.log(`✅ Rappel "terminer course" planifié`);
  } catch (error) {
    console.error('❌ Erreur notification terminer course:', error);
  }
}

/**
 * 9. Course réclamée (pour le créateur) - LOCAL + PUSH
 */
export async function notifyRideClaimed(
  creatorUserId: string,
  pickupAddress: string, 
  pickerName: string
): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled) return;

  try {
    // Notification locale (si l'app est ouverte)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Course prise !',
        body: `${pickerName} a pris votre course (${pickupAddress})`,
        data: { type: 'ride_claimed' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
    });

    // Push notification (si l'app est fermée/background)
    await PushTokenService.sendPushToUser(
      creatorUserId,
      '🎉 Course prise !',
      `${pickerName} a pris votre course (${pickupAddress})`,
      { type: 'ride_claimed' }
    );

    console.log('✅ Notifications course réclamée envoyées (local + push)');
  } catch (error) {
    console.error('❌ Erreur notification course réclamée:', error);
  }
}

/**
 * 10. Course terminée par un chauffeur (pour le créateur) - PUSH
 */
export async function notifyRideCompletedToCreator(
  creatorUserId: string,
  pickupAddress: string,
  dropoffAddress: string,
  driverName: string
): Promise<void> {
  try {
    await PushTokenService.sendPushToUser(
      creatorUserId,
      '✅ Course terminée',
      `${driverName} a terminé la course: ${pickupAddress} → ${dropoffAddress}`,
      { type: 'ride_completed_by_driver' }
    );

    console.log('✅ Push notification course terminée envoyée au créateur');
  } catch (error) {
    console.error('❌ Erreur notification course terminée:', error);
  }
}

/**
 * Course annulée par le créateur (pour le picker) - PUSH
 */
export async function notifyRideCancelledToPicker(
  pickerId: string,
  pickupAddress?: string,
  dropoffAddress?: string
): Promise<void> {
  try {
    const segment = pickupAddress && dropoffAddress ? ` ${pickupAddress} → ${dropoffAddress}` : '';
    await PushTokenService.sendPushToUser(
      pickerId,
      '❌ Course annulée',
      `La course a été supprimée par le créateur.${segment}`,
      { type: 'ride_cancelled_by_creator' }
    );
    console.log('✅ Push course annulée envoyée au picker');
  } catch (error) {
    console.error('❌ Erreur notification course annulée:', error);
  }
}

/**
 * Profil vérifié (notification locale)
 */
export async function notifyVerificationAccepted(): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.enabled) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Profil vérifié',
        body: 'Votre profil professionnel a été vérifié. Vous avez accès au marketplace.',
        data: { type: 'verification_accepted' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
    });
    console.log('✅ Notification profil vérifié envoyée');
  } catch (error) {
    console.error('❌ Erreur notification vérification:', error);
  }
}

/**
 * 11. Notation reçue (pour l'auteur de la publication) - PUSH
 */
export async function notifyCreatorRated(
  creatorUserId: string,
  driverName: string,
  stars: number,
  comment?: string | null
): Promise<void> {
  try {
    const starsLabel = `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`;
    const body = comment
      ? `${driverName} vous a noté ${starsLabel} : "${comment.slice(0, 60)}${comment.length > 60 ? '…' : ''}"`
      : `${driverName} vous a noté ${starsLabel}`;
    await PushTokenService.sendPushToUser(
      creatorUserId,
      '⭐ Nouvelle notation',
      body,
      { type: 'ride_rating_received' }
    );
    console.log('✅ Push notation envoyée au créateur');
  } catch (error) {
    console.error('❌ Erreur notification notation:', error);
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
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
    });

    console.log('✅ Notification test envoyée');
  } catch (error) {
    console.error('❌ Erreur notification test:', error);
    throw error;
  }
}

/**
 * Test : notification "devis accepté" – au tap, l'app ouvre l'écran Mes Devis
 */
export async function sendTestQuoteNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Devis accepté',
        body: 'Un client a accepté votre devis. Appuyez pour ouvrir Mes Devis.',
        data: { type: 'quote_accepted', quote_id: 'test-quote-123' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
    });
    console.log('✅ Notification devis test envoyée');
  } catch (error) {
    console.error('❌ Erreur notification devis test:', error);
    throw error;
  }
}
