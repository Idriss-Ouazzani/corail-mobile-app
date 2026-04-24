/**
 * Service de gestion des tokens push Expo
 * Enregistre et met à jour les tokens dans Supabase pour les notifications push
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

/** `push_tokens.user_id` référence `public.users(id)` — pas toujours égal à `auth.uid()`. */
async function resolveUsersPrimaryKeyForPush(authOrRowUserId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${authOrRowUserId},supabase_auth_id.eq.${authOrRowUserId}`)
    .maybeSingle();
  if (error || !data?.id) return null;
  return String(data.id);
}

/** Après signup, la ligne `users` peut arriver quelques centaines de ms après la session. */
async function resolveUsersPrimaryKeyForPushWithRetry(
  authOrRowUserId: string,
  attempts = 6,
  delayMs = 400
): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    const id = await resolveUsersPrimaryKeyForPush(authOrRowUserId);
    if (id) return id;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

export interface PushToken {
  id: string;
  user_id: string;
  push_token: string;
  device_type: 'ios' | 'android' | 'web';
  device_name: string | null;
  app_version: string | null;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// OBTENIR LE TOKEN PUSH EXPO
// ============================================================================

/**
 * Obtenir le token push Expo pour l'appareil actuel
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Vérifier si c'est un appareil physique (requis pour Expo Push)
    if (!Device.isDevice) {
      console.warn('⚠️ Push notifications ne fonctionnent que sur des appareils physiques');
      return null;
    }

    // Obtenir les permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permissions push notifications refusées');
      return null;
    }

    // Obtenir le token Expo
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    console.log('✅ Expo Push Token obtenu:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('❌ Erreur obtention Expo Push Token:', error);
    return null;
  }
}

// ============================================================================
// ENREGISTREMENT DU TOKEN DANS SUPABASE
// ============================================================================

/**
 * Enregistrer ou mettre à jour le token push dans Supabase
 */
export async function registerPushToken(userId: string): Promise<boolean> {
  try {
    const rowUserId = await resolveUsersPrimaryKeyForPushWithRetry(userId);
    if (!rowUserId) {
      console.warn(
        '⚠️ Pas de ligne users pour ce compte — token push non enregistré (réessayez après chargement du profil).'
      );
      return false;
    }

    // Obtenir le token Expo
    const pushToken = await getExpoPushToken();
    if (!pushToken) {
      console.warn('⚠️ Pas de push token, enregistrement ignoré');
      return false;
    }

    // Informations sur l'appareil
    const deviceType = Platform.OS as 'ios' | 'android' | 'web';
    const deviceName = Device.deviceName || `${Platform.OS} ${Device.osVersion}`;
    const appVersion = Constants.expoConfig?.version || 'unknown';

    console.log('📱 Enregistrement token push:', {
      sessionUserId: userId,
      pushTokensUserId: rowUserId,
      deviceType,
      deviceName,
      appVersion,
    });

    // Désactiver les anciens tokens de cet appareil pour cet utilisateur
    await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', rowUserId)
      .eq('device_type', deviceType);

    // Insérer ou mettre à jour le token
    const { data, error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: rowUserId,
          push_token: pushToken,
          device_type: deviceType,
          device_name: deviceName,
          app_version: appVersion,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'push_token' }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur enregistrement token push:', error);
      return false;
    }

    console.log('✅ Token push enregistré dans Supabase:', data.id);

    // Même token sur users.expo_push_token (Edge send-ride-notification + anciens chemins)
    const { error: mirrorErr } = await supabase
      .from('users')
      .update({ expo_push_token: pushToken })
      .eq('id', rowUserId);
    if (mirrorErr) {
      console.warn('⚠️ Miroir expo_push_token users:', mirrorErr.message);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Corail',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B47',
      });
      await Notifications.setNotificationChannelAsync('urgent', {
        name: 'Courses & alertes',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B47',
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur registerPushToken:', error);
    return false;
  }
}

/**
 * Marquer le token comme inactif (déconnexion)
 */
export async function deactivatePushToken(userId: string): Promise<void> {
  try {
    const pushToken = await getExpoPushToken();
    if (!pushToken) return;

    const rowUserId = (await resolveUsersPrimaryKeyForPush(userId)) ?? userId;

    await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', rowUserId)
      .eq('push_token', pushToken);

    console.log('✅ Token push désactivé');
  } catch (error) {
    console.error('❌ Erreur désactivation token:', error);
  }
}

/**
 * Supprimer tous les tokens d'un utilisateur (suppression de compte)
 */
export async function deleteAllUserTokens(userId: string): Promise<void> {
  try {
    const rowUserId = await resolveUsersPrimaryKeyForPush(userId);
    const ids = [userId, rowUserId].filter((x): x is string => Boolean(x));
    const unique = [...new Set(ids)];

    await supabase.from('push_tokens').delete().in('user_id', unique);

    console.log('✅ Tous les tokens push supprimés pour user:', unique.join(', '));
  } catch (error) {
    console.error('❌ Erreur suppression tokens:', error);
  }
}

/**
 * Obtenir tous les tokens actifs d'un utilisateur.
 * Accepte soit l'UUID Supabase Auth, soit le `users.id` métier (les tokens sont souvent enregistrés avec auth.uid()).
 */
export async function getUserActiveTokens(userId: string): Promise<string[]> {
  try {
    const ids = new Set<string>([userId]);
    const { data: userRows } = await supabase
      .from('users')
      .select('id, supabase_auth_id')
      .or(`id.eq.${userId},supabase_auth_id.eq.${userId}`);

    if (userRows && userRows.length > 0) {
      for (const u of userRows) {
        if (u.id) ids.add(String(u.id));
        if (u.supabase_auth_id) ids.add(String(u.supabase_auth_id));
      }
    }

    const { data, error } = await supabase
      .from('push_tokens')
      .select('push_token')
      .in('user_id', [...ids])
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).map((t) => t.push_token);
  } catch (error) {
    console.error('❌ Erreur récupération tokens:', error);
    return [];
  }
}

// ============================================================================
// ENVOI DE NOTIFICATIONS PUSH (VIA EXPO API)
// ============================================================================

export interface PushNotificationMessage {
  to: string | string[]; // Token(s) Expo
  sound?: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

/**
 * Envoyer une notification push via l'API Expo
 */
export async function sendPushNotification(message: PushNotificationMessage): Promise<boolean> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: message.to,
        sound: message.sound || 'default',
        title: message.title,
        body: message.body,
        data: message.data || {},
        badge: message.badge,
        priority: message.priority || 'high',
        channelId: message.channelId || 'default',
      }),
    });

    const result = await response.json();
    
    if (result.data?.[0]?.status === 'ok') {
      console.log('✅ Push notification envoyée avec succès');
      return true;
    } else {
      console.error('❌ Erreur envoi push notification:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur sendPushNotification:', error);
    return false;
  }
}

/**
 * Envoyer une notification à un utilisateur spécifique
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // Récupérer tous les tokens actifs de l'utilisateur
    const tokens = await getUserActiveTokens(userId);
    
    if (tokens.length === 0) {
      console.warn('⚠️ Aucun token actif pour user:', userId);
      return false;
    }

    // Envoyer à tous les appareils de l'utilisateur
    return await sendPushNotification({
      to: tokens,
      title,
      body,
      data,
      priority: 'high',
    });
  } catch (error) {
    console.error('❌ Erreur sendPushToUser:', error);
    return false;
  }
}



