/**
 * Supabase Edge Function - send-ride-notification
 * 
 * Envoi automatique de push notifications quand une nouvelle course est créée
 * 
 * Trigger : À appeler depuis un trigger PostgreSQL ou depuis le client après création de course
 * 
 * Deploy:
 * supabase functions deploy send-ride-notification --no-verify-jwt
 * 
 * Test local:
 * supabase functions serve send-ride-notification
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Types
interface RideNotificationPayload {
  rideId: string
  visibility?: 'PUBLIC' | 'GROUP'
  groupId?: string
}

interface PushMessage {
  to: string
  sound: 'default'
  title: string
  body: string
  data: {
    rideId: string
    type: 'new_ride'
  }
  priority: 'high'
  channelId: 'urgent'
}

serve(async (req) => {
  try {
    // Parse request
    const payload: RideNotificationPayload = await req.json()
    const { rideId, visibility, groupId } = payload

    console.log('📢 Nouvelle course détectée:', { rideId, visibility, groupId })

    // Init Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer les détails de la course
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single()

    if (rideError || !ride) {
      throw new Error(`Course introuvable: ${rideError?.message}`)
    }

    // Déterminer les destinataires
    let targetUserIds: string[] = []

    if (visibility === 'GROUP' && groupId) {
      // Notifier uniquement les membres du groupe
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .neq('user_id', ride.creator_id) // Exclure le créateur

      targetUserIds = members?.map(m => m.user_id) || []
      console.log(`👥 Groupe: ${members?.length || 0} membres`)
    } else {
      // Notifier tous les chauffeurs vérifiés (marketplace public)
      const { data: verifiedUsers } = await supabase
        .from('users')
        .select('id')
        .eq('verification_status', 'VERIFIED')
        .neq('id', ride.creator_id) // Exclure le créateur

      targetUserIds = verifiedUsers?.map(u => u.id) || []
      console.log(`🌐 Public: ${verifiedUsers?.length || 0} chauffeurs`)
    }

    if (targetUserIds.length === 0) {
      console.log('⚠️ Aucun destinataire trouvé')
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Récupérer les tokens push
    const { data: users } = await supabase
      .from('users')
      .select('expo_push_token')
      .in('id', targetUserIds)
      .not('expo_push_token', 'is', null)

    if (!users || users.length === 0) {
      console.log('⚠️ Aucun token push trouvé')
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Formater le message
    const scheduledTime = new Date(ride.scheduled_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const price = ride.price_cents ? `${(ride.price_cents / 100).toFixed(2)}€` : ''
    const pickupCity = ride.pickup_address.split(',').pop()?.trim() || ride.pickup_address

    const body = `${pickupCity} → ${scheduledTime}${price ? ' • ' + price : ''}`

    // Construire les messages
    const messages: PushMessage[] = users
      .filter(u => u.expo_push_token)
      .map(user => ({
        to: user.expo_push_token!,
        sound: 'default',
        title: '🚗 Nouvelle course disponible !',
        body,
        data: {
          rideId: ride.id,
          type: 'new_ride',
        },
        priority: 'high',
        channelId: 'urgent',
      }))

    console.log(`📤 Envoi de ${messages.length} notifications`)

    // Envoyer via Expo Push API
    const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const expoPushResult = await expoPushResponse.json()
    console.log('✅ Expo Push API:', expoPushResult)

    // Log des notifications envoyées (pour analytics)
    const notificationLogs = targetUserIds.map(userId => ({
      user_id: userId,
      ride_id: rideId,
      notification_type: 'new_ride',
      sent_at: new Date().toISOString(),
    }))

    await supabase
      .from('notification_logs')
      .insert(notificationLogs)
      .catch(err => console.warn('⚠️ Erreur log notifications:', err))

    return new Response(
      JSON.stringify({
        success: true,
        sent: messages.length,
        results: expoPushResult,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Erreur:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

