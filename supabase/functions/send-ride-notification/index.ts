/**
 * Supabase Edge Function - send-ride-notification
 *
 * Envoie des push Expo quand une course est créée (appel client après INSERT ou service role).
 * Lit les tokens depuis push_tokens (table utilisée par l’app) ET users.expo_push_token (legacy / hybrid).
 *
 * Deploy:
 * supabase functions deploy send-ride-notification --no-verify-jwt
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

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
    type: 'new_ride' | 'ride_in_group' | 'client_devis'
  }
  priority: 'high'
  /** Canal Android : doit exister côté app (voir notifications.ts / pushTokens) */
  channelId: string
}

const EXPO_BATCH = 99

async function resolveCreatorPk(
  supabase: ReturnType<typeof createClient>,
  creatorId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${creatorId},supabase_auth_id.eq.${creatorId}`)
    .maybeSingle()
  return data?.id ?? null
}

/** Récupère tous les tokens Expo pour une liste d’utilisateurs (clé primaire users.id). */
async function collectExpoTokens(
  supabase: ReturnType<typeof createClient>,
  userPrimaryIds: string[]
): Promise<Set<string>> {
  const tokens = new Set<string>()
  const ids = [...new Set(userPrimaryIds.filter(Boolean))]
  if (ids.length === 0) return tokens

  const { data: userRows } = await supabase
    .from('users')
    .select('id, expo_push_token, supabase_auth_id')
    .in('id', ids)

  const authIds = (userRows ?? [])
    .map((u: { supabase_auth_id?: string | null }) => u.supabase_auth_id)
    .filter((x): x is string => !!x)

  const idOrList = [...new Set([...ids, ...authIds])]

  for (const u of userRows ?? []) {
    const row = u as { expo_push_token?: string | null }
    if (row.expo_push_token) tokens.add(row.expo_push_token)
  }

  const { data: ptRows } = await supabase
    .from('push_tokens')
    .select('push_token')
    .in('user_id', idOrList)
    .eq('is_active', true)

  for (const p of ptRows ?? []) {
    if (p.push_token) tokens.add(p.push_token)
  }

  return tokens
}

serve(async (req) => {
  try {
    const payload: RideNotificationPayload = await req.json()
    const { rideId } = payload

    console.log('📢 send-ride-notification payload:', payload)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single()

    if (rideError || !ride) {
      throw new Error(`Course introuvable: ${rideError?.message}`)
    }

    const isGroupRide = ride.visibility === 'GROUP' && ride.group_id
    const creatorPk = await resolveCreatorPk(supabase, ride.creator_id as string)

    let recipientUserIds: string[] = []

    if (isGroupRide) {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', ride.group_id)

      const raw = [...new Set((members ?? []).map((m) => m.user_id).filter(Boolean))] as string[]
      if (raw.length === 0) {
        console.log('⚠️ Groupe sans membres')
        return new Response(JSON.stringify({ success: true, sent: 0, reason: 'no_members' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      const orParts = raw.flatMap((id) => [`id.eq.${id}`, `supabase_auth_id.eq.${id}`])
      const { data: userRows } = await supabase
        .from('users')
        .select('id, supabase_auth_id')
        .or(orParts.join(','))

      const seen = new Set<string>()
      const rid = String(ride.creator_id ?? '')
      for (const u of userRows ?? []) {
        const row = u as { id: string }
        if (creatorPk && row.id === creatorPk) continue
        if (rid && String(row.id) === rid) continue
        if (seen.has(row.id)) continue
        seen.add(row.id)
        recipientUserIds.push(row.id)
      }
      console.log(`👥 Groupe ${ride.group_id}: ${recipientUserIds.length} destinataires push (hors créateur)`)
    } else if (ride.visibility === 'PUBLIC') {
      const { data: verified } = await supabase
        .from('users')
        .select('id')
        .eq('verification_status', 'VERIFIED')

      const rid = String(ride.creator_id ?? '')
      const rows = (verified ?? []).filter((u) => {
        if (creatorPk && u.id === creatorPk) return false
        if (rid && String(u.id) === rid) return false
        return true
      })
      recipientUserIds = [...new Set(rows.map((u) => u.id))]
      console.log(`🌐 Public: ${recipientUserIds.length} chauffeurs vérifiés (hors créateur)`)
    } else {
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'unsupported_visibility' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (recipientUserIds.length === 0) {
      console.log('⚠️ Aucun destinataire')
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const tokenSet = await collectExpoTokens(supabase, recipientUserIds)
    const tokenList = [...tokenSet]

    if (tokenList.length === 0) {
      console.log('⚠️ Aucun token push (push_tokens + users.expo_push_token vides)')
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: 'no_push_tokens', recipients: recipientUserIds.length }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const scheduledTime = new Date(ride.scheduled_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const price = ride.price_cents != null && Number(ride.price_cents) > 0
      ? `${(Number(ride.price_cents) / 100).toFixed(2)}€`
      : ''
    const lo = ride.indicative_low_cents != null ? Number(ride.indicative_low_cents) / 100 : null
    const hi = ride.indicative_high_cents != null ? Number(ride.indicative_high_cents) / 100 : null
    const rangeHint =
      lo != null && hi != null && Number.isFinite(lo) && Number.isFinite(hi)
        ? ` • ~${lo.toFixed(0)}–${hi.toFixed(0)}€`
        : ''
    const pickupCity = ride.pickup_address.split(',').pop()?.trim() || ride.pickup_address
    const isClientDevis =
      String(ride.source || '') === 'client' && (!ride.price_cents || Number(ride.price_cents) <= 0)

    let body = `${pickupCity} → ${scheduledTime}`
    if (isClientDevis) {
      body += rangeHint || ' • devis à proposer'
    } else {
      body += price ? ` • ${price}` : rangeHint
    }

    const pushType: 'ride_in_group' | 'new_ride' | 'client_devis' = isGroupRide
      ? 'ride_in_group'
      : isClientDevis
        ? 'client_devis'
        : 'new_ride'
    const pushTitle = isGroupRide
      ? '👥 Nouvelle course dans votre groupe'
      : isClientDevis
        ? '🪸 Nouvelle demande de devis'
        : '🚗 Nouvelle course disponible !'

    const buildMessages = (tokens: string[]): PushMessage[] =>
      tokens.map((to) => ({
        to,
        sound: 'default',
        title: pushTitle,
        body,
        data: {
          rideId: ride.id,
          type: pushType,
        },
        priority: 'high' as const,
        channelId: 'default',
      }))

    let totalSent = 0
    const expoResults: unknown[] = []

    for (let i = 0; i < tokenList.length; i += EXPO_BATCH) {
      const batch = tokenList.slice(i, i + EXPO_BATCH)
      const messages = buildMessages(batch)
      const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      })
      const expoPushResult = await expoPushResponse.json()
      expoResults.push(expoPushResult)
      console.log(`✅ Expo batch ${i / EXPO_BATCH + 1}:`, JSON.stringify(expoPushResult).slice(0, 500))
      totalSent += batch.length
    }

    const notificationLogs = recipientUserIds.map((userId) => ({
      user_id: userId,
      ride_id: rideId,
      notification_type: 'new_ride',
      sent_at: new Date().toISOString(),
    }))

    await supabase
      .from('notification_logs')
      .insert(notificationLogs)
      .catch((err) => console.warn('⚠️ notification_logs:', err))

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        tokens: tokenList.length,
        results: expoResults,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ send-ride-notification:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
