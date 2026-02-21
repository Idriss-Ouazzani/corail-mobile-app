/**
 * Edge Function Supabase : Ajouter des crédits de manière sécurisée
 * 
 * Cette fonction s'exécute côté serveur avec la clé SERVICE_ROLE,
 * permettant de bypass RLS et d'effectuer des validations serveur.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

interface AddCreditsRequest {
  userId: string
  amount: number
  reason: string
  metadata?: Record<string, any>
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Valider le JWT utilisateur depuis le header x-user-token
    const userToken = req.headers.get('x-user-token')
    
    if (!userToken) {
      return new Response(
        JSON.stringify({ error: 'Missing user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Créer un client admin pour valider le JWT
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 3. Valider le JWT utilisateur
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(userToken)
    
    if (authError || !user) {
      console.error('❌ Invalid user token:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User authenticated:', user.id)
    
    // 4. Parse request
    const { userId, amount, reason, metadata }: AddCreditsRequest = await req.json()
    
    // 5. Vérifier que le userId correspond à l'utilisateur authentifié
    if (userId !== user.id) {
      console.error('❌ User ID mismatch:', { requested: userId, authenticated: user.id })
      return new Response(
        JSON.stringify({ error: 'Forbidden: User ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validation basique
    if (!userId || typeof amount !== 'number' || !reason) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, amount, reason' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validation des montants (éviter les montants négatifs sauf pour les débits explicites)
    if (amount === 0) {
      return new Response(
        JSON.stringify({ error: 'Amount cannot be zero' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que l'utilisateur existe dans la DB (supabaseAdmin déjà créé plus haut)
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !dbUser) {
      console.error('❌ User not found:', userId, userError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insérer la transaction de crédits (bypass RLS grâce à SERVICE_ROLE)
    // Note: On n'utilise pas 'metadata' car cette colonne n'existe pas dans la table
    const insertData: any = {
      user_id: userId,
      amount: amount,
      transaction_type: reason, // Le champ 'reason' correspond à 'transaction_type' dans la DB
      created_at: new Date().toISOString(),
    };

    // Ajouter ride_id et description depuis metadata si fourni
    if (metadata?.ride_id) {
      insertData.ride_id = metadata.ride_id;
    }
    if (metadata?.description) {
      insertData.description = metadata.description;
    }

    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('credits_ledger')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting credits:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to add credits', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculer le nouveau solde
    const { data: ledger, error: ledgerError } = await supabaseAdmin
      .from('credits_ledger')
      .select('amount')
      .eq('user_id', userId)

    let newBalance = 0
    if (!ledgerError && ledger) {
      newBalance = ledger.reduce((sum, entry) => sum + entry.amount, 0)
    }

    // Mettre à jour le solde dans users.credits
    await supabaseAdmin
      .from('users')
      .update({ credits: newBalance })
      .eq('id', userId)

    console.log('✅ Credits added successfully:', {
      userId,
      amount,
      reason,
      newBalance,
    })

    return new Response(
      JSON.stringify({
        success: true,
        transaction,
        newBalance,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

