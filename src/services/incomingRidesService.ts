/**
 * incomingRidesService - Gestion des notifications de nouvelles courses
 * Polling régulier + Push notifications
 */

import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';

let pollingInterval: NodeJS.Timeout | null = null;
let lastCheckTimestamp: string | null = null;
let onNewRideCallback: ((ride: any) => void) | null = null;

// Configuration des notifications (priorité haute + son + vibration)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Démarrer l'écoute des nouvelles courses (polling toutes les 10 secondes)
 */
export const startListeningForNewRides = (
  userId: string,
  onNewRide: (ride: any) => void
) => {
  console.log('🔔 Démarrage écoute nouvelles courses');
  
  onNewRideCallback = onNewRide;
  lastCheckTimestamp = new Date().toISOString();

  // Polling toutes les 10 secondes
  pollingInterval = setInterval(() => {
    checkForNewRides(userId);
  }, 10000);

  // Check immédiat au démarrage
  checkForNewRides(userId);
};

/**
 * Arrêter l'écoute
 */
export const stopListeningForNewRides = () => {
  console.log('🔕 Arrêt écoute nouvelles courses');
  
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  onNewRideCallback = null;
};

/**
 * Vérifier s'il y a de nouvelles courses
 */
const checkForNewRides = async (userId: string) => {
  try {
    if (!lastCheckTimestamp) return;

    // Récupérer les courses du marketplace créées après le dernier check
    const { data: marketplaceRides, error: marketplaceError } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'AVAILABLE')
      .gt('created_at', lastCheckTimestamp)
      .order('created_at', { ascending: false });

    if (marketplaceError) {
      console.error('Erreur check marketplace:', marketplaceError);
    }

    // Récupérer les courses de groupes auxquels l'utilisateur appartient
    const { data: userGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const groupIds = userGroups?.map(g => g.group_id) || [];
    
    let groupRides: any[] = [];
    if (groupIds.length > 0) {
      const { data, error: groupError } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'AVAILABLE')
        .in('group_id', groupIds)
        .gt('created_at', lastCheckTimestamp)
        .order('created_at', { ascending: false });

      if (groupError) {
        console.error('Erreur check groupes:', groupError);
      } else {
        groupRides = data || [];
      }
    }

    // Mettre à jour le timestamp
    lastCheckTimestamp = new Date().toISOString();

    // Notifier pour chaque nouvelle course
    const allNewRides = [...(marketplaceRides || []), ...groupRides];
    
    if (allNewRides.length > 0) {
      console.log(`📢 ${allNewRides.length} nouvelle(s) course(s) détectée(s)`);
      
      allNewRides.forEach(ride => {
        if (onNewRideCallback) {
          onNewRideCallback(ride);
        }
      });
    }
  } catch (error) {
    console.error('Erreur checkForNewRides:', error);
  }
};

/**
 * Envoyer une notification locale (quand l'app est en arrière-plan)
 */
export const sendLocalNotification = async (ride: any) => {
  try {
    const price = ride.price_cents ? `${(ride.price_cents / 100).toFixed(2)}€` : '';
    const scheduledTime = new Date(ride.scheduled_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 Nouvelle course disponible !',
        body: `${ride.pickup_address} → ${ride.dropoff_address}\n${scheduledTime} • ${price}`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        data: { rideId: ride.id, type: 'new_ride' },
      },
      trigger: null, // Notification immédiate
    });
  } catch (error) {
    console.error('Erreur notification locale:', error);
  }
};

/**
 * Écouter les clics sur les notifications (pour ouvrir l'app sur la course)
 */
export const setupNotificationListener = (
  onNotificationTap: (rideId: string) => void
) => {
  // Quand l'utilisateur tape sur une notification
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as { type?: string; rideId?: string };
    if (data.type === 'new_ride' && typeof data.rideId === 'string') {
      onNotificationTap(data.rideId);
    }
  });

  return () => subscription.remove();
};

