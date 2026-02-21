/**
 * incomingRidesRealtimeService - Gestion via Supabase Realtime
 * 
 * Alternative au polling : utilise les WebSockets Supabase
 * Plus efficace et temps réel
 */

import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import { RealtimeChannel } from '@supabase/supabase-js';

let ridesChannel: RealtimeChannel | null = null;
let groupRidesChannels: RealtimeChannel[] = [];
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
 * Démarrer l'écoute des nouvelles courses via Realtime
 */
export const startRealtimeListening = async (
  userId: string,
  onNewRide: (ride: any) => void
) => {
  console.log('🔔 Démarrage écoute Realtime nouvelles courses');
  
  onNewRideCallback = onNewRide;

  // 1) Écouter les nouvelles courses marketplace (PUBLIC)
  ridesChannel = supabase
    .channel('marketplace-rides')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'rides',
        filter: `status=eq.PUBLISHED,visibility=eq.PUBLIC`,
      },
      (payload) => {
        console.log('📢 Nouvelle course marketplace:', payload.new);
        handleNewRide(payload.new);
      }
    )
    .subscribe((status) => {
      console.log('📡 Realtime marketplace status:', status);
    });

  // 2) Écouter les nouvelles courses de mes groupes
  // Récupérer mes groupes
  const { data: userGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  const groupIds = userGroups?.map(g => g.group_id) || [];

  if (groupIds.length > 0) {
    // Créer un channel par groupe (limitation Supabase Realtime)
    groupIds.forEach((groupId) => {
      const channel = supabase
        .channel(`group-rides-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'rides',
            filter: `status=eq.PUBLISHED,group_id=eq.${groupId}`,
          },
          (payload) => {
            console.log(`📢 Nouvelle course groupe ${groupId}:`, payload.new);
            handleNewRide(payload.new);
          }
        )
        .subscribe((status) => {
          console.log(`📡 Realtime groupe ${groupId} status:`, status);
        });

      groupRidesChannels.push(channel);
    });
  }
};

/**
 * Arrêter l'écoute Realtime
 */
export const stopRealtimeListening = async () => {
  console.log('🔕 Arrêt écoute Realtime');
  
  if (ridesChannel) {
    await supabase.removeChannel(ridesChannel);
    ridesChannel = null;
  }

  for (const channel of groupRidesChannels) {
    await supabase.removeChannel(channel);
  }
  groupRidesChannels = [];
  
  onNewRideCallback = null;
};

/**
 * Gérer une nouvelle course détectée
 */
const handleNewRide = (ride: any) => {
  if (onNewRideCallback) {
    onNewRideCallback(ride);
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

