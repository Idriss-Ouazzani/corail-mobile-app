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
import { isSameCorailUser } from '../utils/isSameCorailUser';

let ridesChannel: RealtimeChannel | null = null;
let groupRidesChannels: RealtimeChannel[] = [];
let onNewRideCallback: ((ride: any) => void) | null = null;
let currentUserId: string | null = null;
/** `public.users.id` si différent de l’UUID auth (comptes migrés) */
let canonicalUsersTableId: string | null = null;

const MAX_RECONNECT_ATTEMPTS = 4;
const RECONNECT_DELAYS_MS = [2000, 4000, 8000, 12000];
let marketplaceReconnectAttempt = 0;
const groupReconnectAttempts: Record<string, number> = {};
let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

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
  onNewRide: (ride: any) => void,
  options?: { usersTableId?: string | null }
) => {
  console.log('🚀 Initialisation système hybride de notifications');
  
  currentUserId = userId;
  canonicalUsersTableId = options?.usersTableId ?? null;
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
  
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
  marketplaceReconnectAttempt = 0;
  Object.keys(groupReconnectAttempts).forEach((k) => delete groupReconnectAttempts[k]);
  
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
  canonicalUsersTableId = null;
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
      .or(`id.eq.${userId},supabase_auth_id.eq.${userId}`);
    
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

  const handlePayload = (payload: { new: any }) => {
    const row = payload.new;
    console.log('📢 [REALTIME] Course reçue:', {
      id: row.id,
      status: row.status,
      visibility: row.visibility,
      creator_id: row.creator_id,
    });
    if (row.visibility !== 'PUBLIC') {
      if (__DEV__) console.log('⚠️ Course ignorée (pas PUBLIC):', row.visibility);
      return;
    }
    console.log('✅ Course PUBLIC valide, traitement...');
    handleNewRide(row);
  };

  // 1. Écouter les nouvelles courses marketplace (INSERT + UPDATE → PUBLISHED)
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
      (payload) => handlePayload(payload as { new: any })
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides',
        filter: 'status=eq.PUBLISHED',
      },
      (payload) => {
        // Course passée à PUBLISHED (ex. créée depuis le site puis publiée)
        if (__DEV__) console.log('📢 [REALTIME] Course mise à jour → PUBLISHED:', payload.new?.id);
        handlePayload(payload as { new: any });
      }
    )
    .subscribe((status, err) => {
      if (__DEV__) console.log('📡 Realtime marketplace status:', status);
      if (err && status !== 'CHANNEL_ERROR') {
        console.warn('⚠️ Erreur canal marketplace:', err);
      }
      if (status === 'SUBSCRIBED') {
        marketplaceReconnectAttempt = 0;
        if (__DEV__) console.log('✅ Canal marketplace connecté');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const attempt = marketplaceReconnectAttempt++;
        if (attempt < MAX_RECONNECT_ATTEMPTS && currentUserId && !reconnectTimeoutId) {
          const delay = RECONNECT_DELAYS_MS[attempt] ?? 12000;
          console.warn(`Connexion marketplace interrompue. Réessai dans ${delay / 1000}s… (${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          const ch = ridesChannel;
          ridesChannel = null;
          if (ch) supabase.removeChannel(ch).catch(() => {});
          reconnectTimeoutId = setTimeout(() => {
            reconnectTimeoutId = null;
            startRealtimeListening(currentUserId!);
          }, delay);
        } else if (attempt >= MAX_RECONNECT_ATTEMPTS && __DEV__) {
          console.warn('Connexion marketplace indisponible:', status);
        }
      }
    });

  // 2. Écouter les nouvelles courses de mes groupes
  // Même utilisateur peut être enregistré comme users.id (legacy) ou auth.uid() — les deux doivent matcher.
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${userId},supabase_auth_id.eq.${userId}`)
    .maybeSingle();
  const canonicalUserId = userRow?.id ?? userId;
  canonicalUsersTableId = userRow?.id ?? canonicalUsersTableId ?? null;
  const memberUserIds = [...new Set([userId, canonicalUserId].filter(Boolean))];
  const memberOr = memberUserIds.map((id) => `user_id.eq.${id}`).join(',');
  const { data: userGroups } = await supabase.from('group_members').select('group_id').or(memberOr);

  const groupIds = userGroups?.map((g) => g.group_id) || [];
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
          if (__DEV__) console.log(`📡 Realtime groupe ${groupId} status:`, status);
          if (err && status !== 'CHANNEL_ERROR') {
            console.warn(`⚠️ Erreur canal groupe ${groupId}:`, err);
          }
          if (status === 'SUBSCRIBED') {
            groupReconnectAttempts[groupId] = 0;
            if (__DEV__) console.log(`✅ Canal groupe ${groupId} connecté`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            const attempt = (groupReconnectAttempts[groupId] ?? 0);
            groupReconnectAttempts[groupId] = attempt + 1;
            if (attempt < MAX_RECONNECT_ATTEMPTS && currentUserId && !reconnectTimeoutId) {
              const delay = RECONNECT_DELAYS_MS[attempt] ?? 12000;
              console.warn(`Connexion groupe ${groupId} interrompue. Réessai dans ${delay / 1000}s… (${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);
              const idx = groupRidesChannels.findIndex((c) => c === channel);
              if (idx !== -1) groupRidesChannels.splice(idx, 1);
              supabase.removeChannel(channel).catch(() => {});
              reconnectTimeoutId = setTimeout(() => {
                reconnectTimeoutId = null;
                startRealtimeListening(currentUserId!);
              }, delay);
            } else if (attempt >= MAX_RECONNECT_ATTEMPTS && __DEV__) {
              console.warn(`Connexion groupe ${groupId} indisponible:`, status);
            }
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
  const own = currentUserId ? isSameCorailUser(ride.creator_id, currentUserId, canonicalUsersTableId) : false;
  console.log('🔍 [handleNewRide] Traitement course:', {
    rideId: ride.id,
    creatorId: ride.creator_id,
    currentUserId,
    canonicalUsersTableId,
    isOwnRide: own,
  });
  
  // Ignorer si c'est ma propre course (auth.uid ou public.users.id legacy)
  if (own) {
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

