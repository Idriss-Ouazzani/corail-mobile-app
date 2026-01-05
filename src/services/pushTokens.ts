/**
 * Service de gestion des tokens push Expo
 * Enregistre et met à jour les tokens dans Supabase pour les notifications push
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

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
      userId,
      deviceType,
      deviceName,
      appVersion,
    });

    // Désactiver les anciens tokens de cet appareil pour cet utilisateur
    await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('device_type', deviceType);

    // Insérer ou mettre à jour le token
    const { data, error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
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

    await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
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
    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);

    console.log('✅ Tous les tokens push supprimés pour user:', userId);
  } catch (error) {
    console.error('❌ Erreur suppression tokens:', error);
  }
}

/**
 * Obtenir tous les tokens actifs d'un utilisateur
 */
export async function getUserActiveTokens(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('push_token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).map(t => t.push_token);
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

