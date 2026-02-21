/**
 * incomingRidesHybridService - Service HYBRIDE combinant Realtime + Push
 * 
 * ✅ Realtime (WebSockets) : détection instantanée quand l'app est ouverte
 * ✅ Push Notifications : notifications quand l'app est fermée
 * 
 * Meilleur des deux mondes !
 */

import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import { RealtimeChannel } from '@supabase/supabase-js';

let ridesChannel: RealtimeChannel | null = null;
let groupRidesChannels: RealtimeChannel[] = [];
let onNewRideCallback: ((ride: any) => void) | null = null;
let currentUserId: string | null = null;

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
 * Initialiser le système hybride (Realtime + Push)
 */
export const initializeHybridSystem = async (
  userId: string,
  onNewRide: (ride: any) => void
) => {
  console.log('🚀 Initialisation système hybride de notifications');
  
  currentUserId = userId;
  onNewRideCallback = onNewRide;

  // 1. Demander les permissions et enregistrer le token push
  await registerPushToken(userId);

  // 2. Démarrer l'écoute Realtime
  await startRealtimeListening(userId);

  console.log('✅ Système hybride initialisé');
};

/**
 * Arrêter le système
 */
export const stopHybridSystem = async () => {
  console.log('🔕 Arrêt système hybride');
  
  if (ridesChannel) {
    await supabase.removeChannel(ridesChannel);
    ridesChannel = null;
  }

  for (const channel of groupRidesChannels) {
    await supabase.removeChannel(channel);
  }
  groupRidesChannels = [];
  
  onNewRideCallback = null;
  currentUserId = null;
};

/**
 * Enregistrer le token push Expo
 */
const registerPushToken = async (userId: string) => {
  try {
    // Demander les permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('⚠️ Permission notifications refusée');
      return;
    }
    
    // Obtenir le token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('📱 Expo Push Token:', token);
    
    // Sauvegarder dans Supabase
    const { error } = await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', userId);
    
    if (error) {
      console.error('❌ Erreur enregistrement token:', error);
    } else {
      console.log('✅ Token push enregistré dans Supabase');
    }
  } catch (error) {
    console.error('❌ Erreur registerPushToken:', error);
  }
};

/**
 * Démarrer l'écoute Realtime (pour app ouverte)
 */
const startRealtimeListening = async (userId: string) => {
  console.log('📡 Démarrage écoute Realtime');

  // ✅ Arrêter les anciens canaux d'abord (éviter les doublons)
  if (ridesChannel) {
    console.log('🔄 Arrêt ancien canal marketplace');
    await supabase.removeChannel(ridesChannel);
    ridesChannel = null;
  }
  
  for (const channel of groupRidesChannels) {
    console.log('🔄 Arrêt ancien canal groupe');
    await supabase.removeChannel(channel);
  }
  groupRidesChannels = [];

  // Créer un identifiant unique pour éviter les conflits de canaux
  const timestamp = Date.now();
  console.log('🔑 Canal unique ID:', timestamp);

  // 1. Écouter les nouvelles courses marketplace (PUBLIC)
  ridesChannel = supabase
    .channel(`marketplace-rides-${timestamp}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'rides',
        filter: 'status=eq.PUBLISHED',
      },
      (payload) => {
        console.log('📢 [REALTIME] Nouvelle course reçue:', {
          id: payload.new.id,
          status: payload.new.status,
          visibility: payload.new.visibility,
          creator_id: payload.new.creator_id
        });
        
        // Filtrer côté client : ignorer si ce n'est pas PUBLIC
        if (payload.new.visibility !== 'PUBLIC') {
          console.log('⚠️ Course ignorée (pas PUBLIC):', payload.new.visibility);
          return;
        }
        
        console.log('✅ Course PUBLIC valide, traitement...');
        console.log('🔍 [REALTIME] creator_id:', payload.new.creator_id, '| currentUserId:', currentUserId);
        handleNewRide(payload.new);
      }
    )
    .subscribe((status, err) => {
      console.log('📡 Realtime marketplace status:', status);
      if (err) {
        console.error('❌ Erreur canal marketplace:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Canal marketplace CONNECTÉ !');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('❌ Échec connexion marketplace:', status);
      }
    });

  // 2. Écouter les nouvelles courses de mes groupes
  const { data: userGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  const groupIds = userGroups?.map(g => g.group_id) || [];
  console.log(`👥 Écoute de ${groupIds.length} groupe(s)`);

  if (groupIds.length > 0) {
    // Créer un channel par groupe
    groupIds.forEach((groupId) => {
      const channel = supabase
        .channel(`group-rides-${groupId}-${timestamp}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'rides',
            filter: 'status=eq.PUBLISHED',
          },
          (payload) => {
            console.log(`📢 [REALTIME] Nouvelle course groupe reçue:`, payload.new);
            
            // Filtrer côté client : ignorer si ce n'est pas ce groupe
            if (payload.new.group_id !== groupId) {
              console.log('⚠️ Course ignorée (pas pour ce groupe):', payload.new.group_id);
              return;
            }
            
            console.log('🔍 [REALTIME] creator_id:', payload.new.creator_id, '| currentUserId:', currentUserId);
            handleNewRide(payload.new);
          }
        )
        .subscribe((status, err) => {
          console.log(`📡 Realtime groupe ${groupId} status:`, status);
          if (err) {
            console.error(`❌ Erreur canal groupe ${groupId}:`, err);
          }
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Canal groupe ${groupId} CONNECTÉ !`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`❌ Échec connexion groupe ${groupId}:`, status);
          }
        });

      groupRidesChannels.push(channel);
    });
  }
};

/**
 * Gérer une nouvelle course détectée
 */
const handleNewRide = (ride: any) => {
  console.log('🔍 [handleNewRide] Traitement course:', {
    rideId: ride.id,
    creatorId: ride.creator_id,
    currentUserId,
    isOwnRide: ride.creator_id === currentUserId,
  });
  
  // Ignorer si c'est ma propre course
  if (ride.creator_id === currentUserId) {
    console.log('⚠️ Course créée par moi-même, ignorée');
    return;
  }

  console.log('✅ Course d\'un autre chauffeur → Affichage du modal !');
  
  // Notifier le callback
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
    const scheduledDate = new Date(ride.scheduled_at);
    const scheduledTime = scheduledDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const scheduledDateStr = scheduledDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });

    const pickupCity = ride.pickup_address?.split(',').pop()?.trim() || ride.pickup_address;
    const dropoffCity = ride.dropoff_address?.split(',').pop()?.trim() || ride.dropoff_address;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 Nouvelle course Corail',
        body: `📍 ${pickupCity} → ${dropoffCity}\n🕐 ${scheduledDateStr} à ${scheduledTime}${price ? ' • ' + price : ''}`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        data: { rideId: ride.id, type: 'new_ride' },
      },
      trigger: null, // Notification immédiate
    });

    console.log('📬 Notification locale envoyée');
  } catch (error) {
    console.error('❌ Erreur notification locale:', error);
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
      console.log('📱 Notification tapée, rideId:', data.rideId);
      onNotificationTap(data.rideId);
    }
  });

  return () => subscription.remove();
};

/**
 * Tester le système (pour debug)
 */
export const testNotification = async () => {
  const testRide = {
    id: 'test-' + Date.now(),
    pickup_address: 'Gare Matabiau, 31000 Toulouse',
    dropoff_address: 'Aéroport Toulouse-Blagnac, 31700 Blagnac',
    scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    price_cents: 4500,
    creator_name: 'Jean Dupont',
    creator_id: 'test-user',
  };

  await sendLocalNotification(testRide);
};

