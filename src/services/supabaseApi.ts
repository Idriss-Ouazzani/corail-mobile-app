/**
 * Supabase API Service - Remplace l'ancien apiClient Databricks
 * Toutes les fonctions de l'app migrées vers Supabase
 */

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import type { Ride } from '../types';
import { getQuoteUrl } from '../constants/urls';

// ============================================================================
// HELPER: Get current user ID from Supabase session
// ============================================================================
let currentUserId: string | null = null;

export const setUserId = (userId: string) => {
  currentUserId = userId;
};

export const clearAuth = () => {
  currentUserId = null;
};

// ============================================================================
// CREDITS: Secure Edge Function call
// ============================================================================

/**
 * Ajouter des crédits de manière sécurisée via Edge Function
 * Cette fonction appelle l'Edge Function qui utilise SERVICE_ROLE pour bypass RLS
 */
export const addCreditsSecure = async (
  amount: number,
  reason: string,
  metadata?: Record<string, any>
) => {
  if (!currentUserId) throw new Error('User not authenticated');

  try {
    // Récupérer les credentials depuis la config
    const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
    const ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;
    
    if (!SUPABASE_URL || !ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }
    
    // Récupérer le JWT utilisateur pour la validation côté serveur
    const { data: sessionData } = await supabase.auth.getSession();
    const userToken = sessionData.session?.access_token;
    
    if (!userToken) {
      throw new Error('User not authenticated');
    }
    
    // Appeler l'Edge Function avec ANON_KEY + JWT utilisateur
    const response = await fetch(`${SUPABASE_URL}/functions/v1/add-credits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'x-user-token': userToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: currentUserId,
        amount,
        reason,
        metadata,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, data);
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    if (data?.error) {
      console.error('❌ Edge Function returned error:', data.error);
      throw new Error(data.error);
    }

    return data;
  } catch (error: any) {
    console.error('❌ Failed to add credits:', error);
    throw error;
  }
};

// ============================================================================
// USERS & VERIFICATION
// ============================================================================

export const getVerificationStatus = async () => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`id.eq.${currentUserId},supabase_auth_id.eq.${currentUserId}`)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    // User doesn't exist yet, create it automatically
    console.log('🆕 Utilisateur non trouvé, création automatique dans Supabase...');

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: currentUserId,
        email: '',
        verification_status: 'UNVERIFIED',
        is_admin: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création utilisateur:', createError);
      throw new Error(createError.message);
    }

    console.log('✅ Utilisateur créé automatiquement dans Supabase');
    return { ...newUser, driver_verification_status: null };
  }

  // Charger le statut de vérification chauffeur (vtc_profiles) pour le gating réseau
  const { data: vtcProfile } = await supabase
    .from('vtc_profiles')
    .select('driver_verification_status, driver_verification_submitted_at, driver_verification_rejection_reason, verification_vtc_card_status, verification_id_card_status, verification_insurance_status, verification_vtc_card_url, verification_id_card_url, verification_insurance_url, verification_vtc_card_admin_notes, verification_id_card_admin_notes, verification_insurance_admin_notes')
    .eq('user_id', currentUserId)
    .limit(1)
    .maybeSingle();

  return {
    ...data,
    driver_verification_status: vtcProfile?.driver_verification_status ?? null,
    driver_verification_submitted_at: vtcProfile?.driver_verification_submitted_at ?? null,
    driver_verification_rejection_reason: vtcProfile?.driver_verification_rejection_reason ?? null,
    verification_vtc_card_status: vtcProfile?.verification_vtc_card_status ?? 'missing',
    verification_id_card_status: vtcProfile?.verification_id_card_status ?? 'missing',
    verification_insurance_status: vtcProfile?.verification_insurance_status ?? 'missing',
    verification_vtc_card_url: vtcProfile?.verification_vtc_card_url ?? null,
    verification_id_card_url: vtcProfile?.verification_id_card_url ?? null,
    verification_insurance_url: vtcProfile?.verification_insurance_url ?? null,
    verification_vtc_card_admin_notes: vtcProfile?.verification_vtc_card_admin_notes ?? null,
    verification_id_card_admin_notes: vtcProfile?.verification_id_card_admin_notes ?? null,
    verification_insurance_admin_notes: vtcProfile?.verification_insurance_admin_notes ?? null,
  };
};

export const submitVerification = async (verificationData: {
  full_name: string;
  phone: string;
  siren?: string; // Optionnel : plus demandé à l'inscription ; SIRET configuré plus tard pour facturation
  professional_card_number: string;
  email?: string; // Optionnel mais recommandé
}) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('users')
    .update({
      full_name: verificationData.full_name,
      phone: verificationData.phone,
      siren: verificationData.siren ?? '',
      professional_card_number: verificationData.professional_card_number,
      verification_status: 'PENDING',
      verification_submitted_at: new Date().toISOString(),
    })
    .eq('id', currentUserId)
    .select()
    .single();

  if (error) {
    console.error('❌ Erreur submitVerification:', error);
    throw new Error(error.message);
  }
  
  console.log('✅ Vérification soumise pour:', verificationData.email || currentUserId);
  return data;
};

export const getPendingVerifications = async () => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, phone, professional_card_number, siren, verification_submitted_at')
    .eq('verification_status', 'PENDING')
    .order('verification_submitted_at', { ascending: true });

  if (error) throw new Error(error.message);
  
  console.log('✅ Vérifications en attente:', data?.length || 0);
  return data || [];
};

export const reviewVerification = async (userId: string, review: { status: 'VERIFIED' | 'REJECTED', rejection_reason?: string }) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const updateData: any = {
    verification_status: review.status,
  };

  if (review.status === 'REJECTED' && review.rejection_reason) {
    updateData.rejection_reason = review.rejection_reason;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  console.log(`✅ Vérification ${review.status} pour:`, userId);
  return data;
};

export const createUser = async (userData: {
  id: string;
  email: string;
  full_name?: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error && error.code !== '23505') { // Ignore duplicate key error
    throw new Error(error.message);
  }
  return data;
};

// ============================================================================
// RIDES (MARKETPLACE)
// ============================================================================

export const getRides = async (): Promise<Ride[]> => {
  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      creator:users!rides_creator_id_fkey(id, full_name, email, rating, total_reviews, phone),
      picker:users!rides_picker_id_fkey(id, full_name, email, phone, rating, total_reviews)
    `)
    .in('status', ['PUBLISHED', 'CLAIMED', 'IN_PROGRESS'])
    .order('scheduled_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as any;
};

export const getMyRides = async (type: 'claimed' | 'published'): Promise<Ride[]> => {
  if (!currentUserId) throw new Error('User not authenticated');

  let query = supabase
    .from('rides')
    .select(`
      *,
      creator:users!rides_creator_id_fkey(id, full_name, email, rating, total_reviews, phone),
      picker:users!rides_picker_id_fkey(id, full_name, email, phone, rating, total_reviews)
    `);

  if (type === 'claimed') {
    query = query.eq('picker_id', currentUserId);
  } else {
    query = query.eq('creator_id', currentUserId);
  }

  query = query.order('scheduled_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as any;
};

export const getRide = async (rideId: string): Promise<Ride> => {
  const { data, error } = await supabase
    .from('rides')
    .select(`
      *,
      creator:users!rides_creator_id_fkey(id, full_name, email, rating, total_reviews, phone),
      picker:users!rides_picker_id_fkey(id, full_name, email, phone, rating, total_reviews)
    `)
    .eq('id', rideId)
    .single();

  if (error) throw new Error(error.message);
  return data as any;
};

export const createRide = async (rideData: {
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  price_cents: number;
  visibility?: 'PUBLIC' | 'GROUP';
  vehicle_type?: string;
  distance_km?: number;
  duration_minutes?: number;
  group_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  notes?: string;
}): Promise<Ride> => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Insert ride
  const { data: ride, error: rideError } = await supabase
    .from('rides')
    .insert({
      ...rideData,
      creator_id: currentUserId,
      status: 'PUBLISHED',
    })
    .select()
    .single();

  if (rideError) throw new Error(rideError.message);

  // +1 crédit uniquement si publication en public (groupe = 0)
  if (rideData.visibility === 'PUBLIC') {
    await addCreditsSecure(1, 'PUBLISH_RIDE', {
      ride_id: ride.id,
      description: 'Published ride on public marketplace',
    });
  }

  // Add activity log
  await supabase.from('activity_log').insert({
    user_id: currentUserId,
    action_type: 'RIDE_PUBLISHED',
    description: `Published ride from ${rideData.pickup_address}`,
    ride_id: ride.id,
  });

  return ride as any;
};

export const claimRide = async (rideId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Fetch ride: client = 0 crédit, groupe = 0 crédit, annonces publiques = 1 crédit
  const { data: existingRide, error: fetchError } = await supabase
    .from('rides')
    .select('id, source, status, visibility')
    .eq('id', rideId)
    .single();
  if (fetchError || !existingRide) throw new Error('Course introuvable');
  if (existingRide.status !== 'PUBLISHED') throw new Error('Course non disponible');

  const isClientRide = existingRide.source === 'client';
  const isGroupRide = (existingRide.visibility || 'PUBLIC') === 'GROUP';
  const costsCredit = !isClientRide && !isGroupRide;

  if (costsCredit) {
    const credits = await getCredits();
    if (credits.credits < 1) {
      throw new Error('Insufficient credits');
    }
  }

  // Update ride
  const { data: ride, error: rideError } = await supabase
    .from('rides')
    .update({
      picker_id: currentUserId,
      status: 'CLAIMED',
    })
    .eq('id', rideId)
    .eq('status', 'PUBLISHED')
    .select()
    .single();

  if (rideError) throw new Error(rideError.message);

  if (costsCredit) {
    try {
      await addCreditsSecure(-1, 'CLAIM_RIDE', {
        ride_id: rideId,
        description: 'Claimed ride from public marketplace',
      });
      console.log('✅ Crédit déduit (annonces publiques)');
    } catch (creditError: any) {
      console.error('❌ Erreur déduction crédit:', creditError);
      throw creditError;
    }
  } else {
    console.log('✅ Annonces groupe ou demande client : aucun crédit déduit');
  }

  // Add activity log
  await supabase.from('activity_log').insert({
    user_id: currentUserId,
    action_type: 'RIDE_CLAIMED',
    description: 'Claimed ride',
    ride_id: rideId,
  });

  // 🔔 Return ride with creator info for notification
  return {
    ...ride,
    creator_id: ride.creator_id,
    picker_id: currentUserId,
  };
};

export const completeRide = async (
  rideId: string,
  rating?: { stars: number; comment?: string | null }
) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Récupérer la course pour vérifier la date et creator_id
  const { data: ride, error: fetchError } = await supabase
    .from('rides')
    .select('scheduled_at, creator_id')
    .eq('id', rideId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!ride) throw new Error('Course non trouvée');

  // Vérifier que la date est passée
  const now = new Date();
  const scheduledAt = new Date(ride.scheduled_at);
  if (scheduledAt > now) {
    throw new Error('Impossible de terminer une course future. Attendez la date prévue.');
  }

  const updatePayload: Record<string, unknown> = {
    status: 'COMPLETED',
    completed_at: new Date().toISOString(),
  };
  if (rating && rating.stars >= 1 && rating.stars <= 5) {
    updatePayload.rating_by_picker_stars = rating.stars;
    updatePayload.rating_by_picker_comment = rating.comment?.trim() || null;
    updatePayload.rating_by_picker_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('rides')
    .update(updatePayload)
    .eq('id', rideId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Bonus credit for completing (via secure Edge Function)
  await addCreditsSecure(1, 'COMPLETE_RIDE_BONUS', {
    ride_id: rideId,
    description: 'Bonus for completing ride',
  });

  // Activity log
  await supabase.from('activity_log').insert({
    user_id: currentUserId,
    action_type: 'RIDE_COMPLETED',
    description: 'Completed ride',
    ride_id: rideId,
  });

  // Notifier l'auteur (créateur) si notation fournie et qu'il est un utilisateur Corail
  if (rating?.stars && ride.creator_id && String(ride.creator_id) !== String(currentUserId)) {
    try {
      const { default: NotificationService } = await import('./notifications');
      const { data: pickerUser } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', currentUserId)
        .single();
      const pickerName = (pickerUser as { full_name?: string } | null)?.full_name || 'Un chauffeur';
      await NotificationService.notifyCreatorRated(
        ride.creator_id,
        pickerName,
        rating.stars,
        rating.comment?.trim() || null
      );
    } catch (notifErr) {
      console.warn('⚠️ Notification notation non envoyée:', notifErr);
    }
  }

  // Notifier le créateur que la course est terminée (push)
  if (data?.creator_id && String(data.creator_id) !== String(currentUserId)) {
    try {
      const { default: NotificationService } = await import('./notifications');
      const { data: pickerUser } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', currentUserId)
        .single();
      const pickerName = (pickerUser as { full_name?: string } | null)?.full_name || 'Un chauffeur';
      await NotificationService.notifyRideCompletedToCreator(
        data.creator_id,
        (data.pickup_address as string) || '',
        (data.dropoff_address as string) || '',
        pickerName
      );
    } catch (notifErr) {
      console.warn('⚠️ Notification course terminée non envoyée:', notifErr);
    }
  }

  return data;
};

/**
 * Mettre à jour le prix d'une course après prise en charge (demande client).
 * Le chauffeur peut proposer un autre tarif que le budget client.
 */
export const updateRidePriceAfterClaim = async (rideId: string, priceCents: number) => {
  if (!currentUserId) throw new Error('User not authenticated');
  const { data, error } = await supabase
    .from('rides')
    .update({
      price_cents: Math.round(priceCents),
      updated_at: new Date().toISOString(),
    })
    .eq('id', rideId)
    .eq('picker_id', currentUserId)
    .eq('status', 'CLAIMED')
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteRide = async (rideId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Récupérer la course pour vérifier son statut
  const { data: ride, error: fetchError } = await supabase
    .from('rides')
    .select('*')
    .eq('id', rideId)
    .eq('creator_id', currentUserId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!ride) throw new Error('Course non trouvée ou vous n\'êtes pas le créateur');

  // Supprimer la course
  const { error: deleteError } = await supabase
    .from('rides')
    .delete()
    .eq('id', rideId)
    .eq('creator_id', currentUserId);

  if (deleteError) throw new Error(deleteError.message);

  // Si la course n'avait pas été prise (PUBLISHED), rembourser le crédit
  if (ride.status === 'PUBLISHED') {
    await addCreditsSecure(-1, 'ADMIN_ADJUSTMENT', {
      ride_id: rideId,
      description: 'Refund for deleting unpicked ride',
    });
    console.log('💰 Crédit remboursé après suppression course non prise');
  }

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: currentUserId,
    action_type: 'RIDE_DELETED',
    description: `Deleted ride (${ride.status})`,
    ride_id: rideId,
  });

  return { success: true, refunded: ride.status === 'PUBLISHED' };
};

// ============================================================================
// PERSONAL RIDES
// ============================================================================

export const listPersonalRides = async (filters?: {
  status?: string;
  limit?: number;
}): Promise<any[]> => {
  if (!currentUserId) throw new Error('User not authenticated');

  let query = supabase
    .from('personal_rides')
    .select('*')
    .eq('driver_id', currentUserId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
};

export const getPersonalRide = async (rideId: string): Promise<any> => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_rides')
    .select('*')
    .eq('id', rideId)
    .eq('driver_id', currentUserId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const createPersonalRide = async (rideData: {
  source: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at?: string;
  price_cents?: number;
  distance_km?: number;
  duration_minutes?: number;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  notes?: string;
  status?: string;
  quote_id?: string | null;
  quote_token?: string | null;
  quote_status?: 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REFUSED' | null;
}) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_rides')
    .insert({
      ...rideData,
      driver_id: currentUserId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Activity log
  await supabase.from('activity_log').insert({
    user_id: currentUserId,
    action_type: 'PERSONAL_RIDE_ADDED',
    description: `Added ${rideData.source} ride`,
    ride_id: data.id,
  });

  return data;
};

/**
 * Publier une course personnelle sur le marketplace
 */
export const publishPersonalRide = async (
  personalRideId: string,
  options: {
    visibility: 'PUBLIC' | 'GROUP';
    vehicle_type: 'STANDARD' | 'ELECTRIC' | 'VAN' | 'PREMIUM' | 'LUXURY';
    group_id?: string;
    client_name: string;
    client_phone?: string;
    client_email?: string;
  }
) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // 1. Valider que les infos client sont fournies
  if (!options.client_name) {
    throw new Error('Le nom du client est obligatoire');
  }
  
  if (!options.client_phone && !options.client_email) {
    throw new Error('Au moins un contact (téléphone ou email) est requis');
  }

  // 2. Récupérer la course personnelle
  const { data: personalRide, error: fetchError } = await supabase
    .from('personal_rides')
    .select('*')
    .eq('id', personalRideId)
    .eq('driver_id', currentUserId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!personalRide) throw new Error('Course personnelle non trouvée');

  // 3. Mettre à jour la course personnelle avec les infos client
  const { error: updateError } = await supabase
    .from('personal_rides')
    .update({
      client_name: options.client_name,
      client_phone: options.client_phone || null,
      client_email: options.client_email || null,
    })
    .eq('id', personalRideId);

  if (updateError) {
    console.warn('⚠️ Erreur mise à jour course personnelle:', updateError);
  }

  // 4. Créer une course marketplace avec les données de la course personnelle
  const { data: newRide, error: createError } = await supabase
    .from('rides')
    .insert({
      creator_id: currentUserId,
      pickup_address: personalRide.pickup_address,
      dropoff_address: personalRide.dropoff_address,
      scheduled_at: personalRide.scheduled_at,
      price_cents: personalRide.price_cents,
      distance_km: personalRide.distance_km,
      duration_minutes: personalRide.duration_minutes,
      client_name: options.client_name,
      client_phone: options.client_phone || null,
      client_email: options.client_email || null,
      visibility: options.visibility,
      vehicle_type: options.vehicle_type,
      status: 'PUBLISHED',
      group_id: options.group_id,
    })
    .select()
    .single();

  if (createError) throw new Error(createError.message);

  // 4. +1 crédit uniquement si publication en public (pas en groupe)
  if (options.visibility === 'PUBLIC') {
    console.log('🔵 Ajout crédit (publication en public)');
    try {
      await addCreditsSecure(1, 'PUBLISH_RIDE', {
        ride_id: newRide.id,
        description: `Published personal ride ${personalRideId} to public marketplace`,
      });
      console.log('✅ Crédit ajouté');
    } catch (creditError: any) {
      console.error('❌ Erreur ajout crédit:', creditError);
      throw creditError;
    }
  } else {
    console.log('✅ Publication en groupe : pas de crédit ajouté');
  }

  // 5. Supprimer la course personnelle (elle est maintenant publiée)
  const { error: deleteError } = await supabase
    .from('personal_rides')
    .delete()
    .eq('id', personalRideId);

  if (deleteError) console.warn('⚠️ Erreur suppression course personnelle:', deleteError);

  // 5. Activity log
  await supabase.from('activity_log').insert({
    user_id: currentUserId,
    action_type: 'RIDE_PUBLISHED',
    description: `Published personal ride to marketplace as ${options.visibility}`,
    ride_id: newRide.id,
  });

  return newRide;
};

export const getPersonalRidesStats = async () => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_rides')
    .select('*')
    .eq('driver_id', currentUserId);

  if (error) throw new Error(error.message);

  // Calculate stats
  const bySource: any = {};
  let totalRevenue = 0;
  let totalDistance = 0;

  data.forEach((ride: any) => {
    if (!bySource[ride.source]) {
      bySource[ride.source] = {
        source: ride.source,
        total_rides: 0,
        completed_rides: 0,
        revenue_eur: 0,
        total_distance_km: 0,
        avg_price_eur: 0,
      };
    }

    bySource[ride.source].total_rides++;
    if (ride.status === 'COMPLETED') {
      bySource[ride.source].completed_rides++;
    }
    if (ride.price_cents) {
      bySource[ride.source].revenue_eur += ride.price_cents / 100;
      totalRevenue += ride.price_cents / 100;
    }
    if (ride.distance_km) {
      bySource[ride.source].total_distance_km += ride.distance_km;
      totalDistance += ride.distance_km;
    }
  });

  // Calculate averages
  Object.values(bySource).forEach((source: any) => {
    if (source.total_rides > 0) {
      source.avg_price_eur = source.revenue_eur / source.total_rides;
    }
  });

  return {
    by_source: Object.values(bySource),
    totals: {
      total_rides: data.length,
      completed_rides: data.filter((r: any) => r.status === 'COMPLETED').length,
      total_revenue_eur: totalRevenue,
      total_distance_km: totalDistance,
    },
  };
};

export const deletePersonalRide = async (personalRideId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('personal_rides')
    .delete()
    .eq('id', personalRideId)
    .eq('driver_id', currentUserId); // Ensure user owns the ride

  if (error) throw new Error(error.message);

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: currentUserId,
    action_type: 'RIDE_DELETED',
    description: 'Deleted personal ride',
    ride_id: personalRideId,
  });

  return { success: true };
};

/**
 * Mettre à jour une course personnelle (status, etc.)
 */
export const updatePersonalRide = async (personalRideId: string, updates: any) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_rides')
    .update(updates)
    .eq('id', personalRideId)
    .eq('driver_id', currentUserId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Si le statut change vers COMPLETED, log l'activité
  if (updates.status === 'COMPLETED') {
    await supabase.from('activity_log').insert({
      user_id: currentUserId,
      action_type: 'RIDE_COMPLETED',
      description: 'Completed personal ride',
      ride_id: personalRideId,
    });
  } else if (updates.status === 'CANCELLED') {
    await supabase.from('activity_log').insert({
      user_id: currentUserId,
      action_type: 'RIDE_CANCELLED',
      description: 'Cancelled personal ride',
      ride_id: personalRideId,
    });
  }

  return data;
};

/**
 * Terminer une course personnelle
 * (seulement si la date est passée)
 */
export const completePersonalRide = async (personalRideId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Récupérer la course pour vérifier la date
  const { data: ride, error: fetchError } = await supabase
    .from('personal_rides')
    .select('scheduled_at')
    .eq('id', personalRideId)
    .eq('driver_id', currentUserId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!ride) throw new Error('Course non trouvée');

  // Vérifier que la date est passée
  const now = new Date();
  const scheduledAt = new Date(ride.scheduled_at);
  if (scheduledAt > now) {
    throw new Error('Impossible de terminer une course future. Attendez la date prévue.');
  }

  // Mettre à jour le statut
  const { data, error } = await supabase
    .from('personal_rides')
    .update({
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
    })
    .eq('id', personalRideId)
    .eq('driver_id', currentUserId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: currentUserId,
    action_type: 'RIDE_COMPLETED',
    description: 'Completed personal ride',
    ride_id: personalRideId,
  });

  return data;
};

// ============================================================================
// CREDITS
// ============================================================================

export const getCredits = async () => {
  if (!currentUserId) throw new Error('User not authenticated');

  console.log('📊 [getCredits] Lecture directe depuis users.credits pour:', currentUserId);
  
  // Lire directement depuis users.credits (pas de cache)
  const { data, error } = await supabase
    .from('users')
    .select('credits')
    .eq('id', currentUserId)
    .single();

  if (error) {
    console.error('❌ [getCredits] Erreur lecture:', error);
    throw new Error(error.message);
  }

  const credits = data?.credits || 0;
  console.log('📊 [getCredits] Crédits actuels en DB:', credits);
  return { credits };
};

/** Persiste le fait que l'utilisateur a vu l'onboarding crédits (ne plus afficher). */
export const setCreditsOnboardingSeen = async () => {
  if (!currentUserId) return;
  await supabase
    .from('users')
    .update({ credits_onboarding_seen: true })
    .eq('id', currentUserId);
};

// ============================================================================
// BADGES
// ============================================================================

export const getAllBadges = async () => {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('rarity', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export const getUserBadges = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw new Error(error.message);

  // Format pour correspondre à l'interface Badge (utilisée par BadgeCard)
  return data.map((ub: any) => ({
    id: ub.badge.id,
    name: ub.badge.name,
    description: ub.badge.description,
    icon: ub.badge.icon,
    color: ub.badge.color,
    rarity: ub.badge.rarity,
    earned_at: ub.earned_at,
  }));
};

/**
 * Stats publiques d'un créateur (apporteur d'affaires) : publications, courses prises, badges.
 * Utilisé dans la fiche Détails de la course pour afficher un mini-profil.
 */
export const getCreatorProfileStats = async (userId: string): Promise<{
  publicationsCount: number;
  ridesTakenCount: number;
  badges: Array<{ id: string; name: string; icon?: string; color?: string }>;
}> => {
  const [pubRes, takenRes, badges] = await Promise.all([
    supabase.from('rides').select('id', { count: 'exact', head: true }).eq('creator_id', userId),
    supabase.from('rides').select('id', { count: 'exact', head: true }).not('picker_id', 'is', null).eq('picker_id', userId),
    getUserBadges(userId),
  ]);
  const publicationsCount = pubRes.count ?? 0;
  const ridesTakenCount = takenRes.count ?? 0;
  return {
    publicationsCount,
    ridesTakenCount,
    badges: badges.map((b: any) => ({ id: b.id, name: b.name, icon: b.icon, color: b.color })),
  };
};

// ============================================================================
// GROUPS
// ============================================================================

export const listGroups = async () => {
  if (!currentUserId) throw new Error('User not authenticated');
  
  console.log('🔍 Chargement des groupes pour userId:', currentUserId);
  
  // Récupérer tous les groupes dont l'utilisateur est membre
  const { data: membershipData, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', currentUserId);

  if (membershipError) {
    console.error('❌ Erreur récupération memberships:', membershipError);
    throw new Error(membershipError.message);
  }

  if (!membershipData || membershipData.length === 0) {
    console.log('📭 Aucun groupe trouvé pour cet utilisateur');
    return [];
  }

  const groupIds = membershipData.map(m => m.group_id);
  console.log('📋 IDs des groupes dont l\'utilisateur est membre:', groupIds);

  // Récupérer les détails de ces groupes
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members(count)
    `)
    .in('id', groupIds);

  if (error) {
    console.error('❌ Erreur Supabase listGroups:', error);
    throw new Error(error.message);
  }

  console.log('📦 Groupes bruts de Supabase:', JSON.stringify(data, null, 2));
  console.log('📊 Nombre de groupes trouvés:', data?.length || 0);

  const mappedGroups = data.map((group: any) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    memberCount: group.group_members[0]?.count || 0,
    color: group.color,
    icon: group.icon,
  })) || [];
  
  console.log('✅ Groupes mappés:', JSON.stringify(mappedGroups, null, 2));
  
  return mappedGroups;
};

export const getGroup = async (groupId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members(count)
    `)
    .eq('id', groupId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    memberCount: (data as any).group_members?.[0]?.count ?? 0,
    color: data.color,
    icon: data.icon,
  };
};

export const createGroup = async (groupData: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_public?: boolean;
}) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error} = await supabase
    .from('groups')
    .insert({
      name: groupData.name,
      description: groupData.description || '',
      creator_id: currentUserId,
      is_public: groupData.is_public || false,
      icon: groupData.icon || 'people',
      color: groupData.color || '#0ea5e9',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Ajouter le créateur comme membre ADMIN du groupe
  await supabase.from('group_members').insert({
    group_id: data.id,
    user_id: currentUserId,
    role: 'ADMIN',
  });

  return data;
};

export const getGroupMembers = async (groupId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      user:users!group_members_user_id_fkey(
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq('group_id', groupId);

  if (error) throw new Error(error.message);

  return data.map((member: any) => ({
    id: member.user.id,
    name: member.user.full_name,
    email: member.user.email,
    phone: member.user.phone,
    role: member.role,
    isAdmin: member.role === 'ADMIN',
    isCurrentUser: member.user.id === currentUserId,
    joined_at: member.joined_at,
  }));
};

export const inviteToGroup = async (params: {
  groupId: string;
  email?: string;
  phone?: string;
}) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Vérifier si l'utilisateur est admin du groupe
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', params.groupId)
    .eq('user_id', currentUserId)
    .single();

  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Vous devez être administrateur pour inviter des membres');
  }

  // Récupérer les infos du groupe et de l'inviteur pour la notification
  const [groupResult, inviterResult] = await Promise.all([
    supabase.from('groups').select('name').eq('id', params.groupId).single(),
    supabase.from('users').select('full_name').eq('id', currentUserId).single(),
  ]);

  // Chercher si l'utilisateur existe déjà
  let inviteeId = null;
  if (params.email) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', params.email)
      .single();
    if (existingUser) inviteeId = existingUser.id;
  }

  // Créer l'invitation
  const { data, error } = await supabase
    .from('group_invitations')
    .insert({
      group_id: params.groupId,
      inviter_id: currentUserId,
      invitee_email: params.email,
      invitee_phone: params.phone,
      invitee_id: inviteeId,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Return data with notification info
  return {
    ...data,
    invitee_id: inviteeId,
    group_id: params.groupId,
    group_name: groupResult.data?.name,
    inviter_name: inviterResult.data?.full_name,
  };
};

export const getMyGroupInvitations = async () => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', currentUserId)
    .single();

  const { data, error } = await supabase
    .from('group_invitations')
    .select(`
      *,
      group:groups(*),
      inviter:users!group_invitations_inviter_id_fkey(full_name)
    `)
    .or(`invitee_id.eq.${currentUserId},invitee_email.eq.${user?.email}`)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
};

export const respondToInvitation = async (invitationId: string, accept: boolean) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data: invitation, error: invError } = await supabase
    .from('group_invitations')
    .select('*')
    .eq('id', invitationId)
    .single();

  if (invError) throw new Error(invError.message);

  // Mettre à jour l'invitation
  const { error: updateError } = await supabase
    .from('group_invitations')
    .update({
      status: accept ? 'ACCEPTED' : 'REFUSED',
      responded_at: new Date().toISOString(),
      invitee_id: currentUserId,
    })
    .eq('id', invitationId);

  if (updateError) throw new Error(updateError.message);

  // Si accepté, ajouter l'utilisateur au groupe
  if (accept) {
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: invitation.group_id,
        user_id: currentUserId,
        role: 'MEMBER',
      });

    if (memberError) throw new Error(memberError.message);
  }

  return { success: true };
};

export const leaveGroup = async (groupId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Vérifier que l'utilisateur n'est pas le seul admin
  const { data: admins } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('role', 'ADMIN');

  if (admins && admins.length === 1 && admins[0].user_id === currentUserId) {
    throw new Error('Vous êtes le seul administrateur. Nommez un autre admin avant de quitter');
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', currentUserId);

  if (error) throw new Error(error.message);

  return { success: true };
};

export const removeMemberFromGroup = async (groupId: string, userId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Vérifier si l'utilisateur actuel est admin
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', currentUserId)
    .single();

  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Vous devez être administrateur pour retirer des membres');
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  return { success: true };
};

export const getGroupPendingInvitations = async (groupId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Vérifier si l'utilisateur actuel est membre du groupe
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', currentUserId)
    .single();

  if (!membership) {
    throw new Error('Vous devez être membre du groupe pour voir les invitations');
  }

  const { data, error } = await supabase
    .from('group_invitations')
    .select(`
      *,
      inviter:users!group_invitations_inviter_id_fkey(full_name)
    `)
    .eq('group_id', groupId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((invitation: any) => ({
    id: invitation.id,
    invitee_email: invitation.invitee_email,
    invitee_phone: invitation.invitee_phone,
    inviter_name: invitation.inviter.full_name,
    created_at: invitation.created_at,
  }));
};

export const cancelGroupInvitation = async (invitationId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Vérifier que l'utilisateur est l'inviteur ou un admin du groupe
  const { data: invitation } = await supabase
    .from('group_invitations')
    .select('group_id, inviter_id')
    .eq('id', invitationId)
    .single();

  if (!invitation) throw new Error('Invitation introuvable');

  if (invitation.inviter_id !== currentUserId) {
    // Vérifier si admin
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', invitation.group_id)
      .eq('user_id', currentUserId)
      .single();

    if (!membership || membership.role !== 'ADMIN') {
      throw new Error('Vous devez être administrateur ou l\'inviteur pour annuler cette invitation');
    }
  }

  const { error } = await supabase
    .from('group_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) throw new Error(error.message);

  return { success: true };
};

// ============================================================================
// PLANNING
// ============================================================================

export const getPlanningEvents = async (params: {
  start_date: string;
  end_date: string;
}) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('planning_events')
    .select('*')
    .eq('user_id', currentUserId)
    .gte('start_time', params.start_date)
    .lte('end_time', params.end_date)
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

export const createPlanningEvent = async (event: {
  title: string;
  event_type: 'RIDE' | 'MEETING' | 'MAINTENANCE' | 'PERSONAL' | 'OTHER';
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
  ride_id?: string;
}) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('planning_events')
    .insert({
      user_id: currentUserId,
      title: event.title,
      event_type: event.event_type,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location ?? null,
      notes: event.notes ?? null,
      ride_id: event.ride_id ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// ============================================================================
// ACTIVITY LOG
// ============================================================================

export const getRecentActivity = async (limit: number = 10, offset: number = 0) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Récupérer les activités avec les détails des courses (pagination avec offset)
  const { data: activities, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  // Enrichir avec les détails des courses
  const enrichedActivities = await Promise.all(
    activities.map(async (activity: any) => {
      if (activity.ride_id) {
        // Essayer de récupérer depuis rides
        const { data: ride } = await supabase
          .from('rides')
          .select('pickup_address, dropoff_address, price_cents, visibility')
          .eq('id', activity.ride_id)
          .single();

        if (ride) {
          return {
            ...activity,
            pickup_address: ride.pickup_address,
            dropoff_address: ride.dropoff_address,
            price_cents: ride.price_cents,
            ride_visibility: ride.visibility,
          };
        }

        // Si pas dans rides, essayer personal_rides
        const { data: personalRide } = await supabase
          .from('personal_rides')
          .select('pickup_address, dropoff_address, price_cents')
          .eq('id', activity.ride_id)
          .single();

        if (personalRide) {
          return {
            ...activity,
            pickup_address: personalRide.pickup_address,
            dropoff_address: personalRide.dropoff_address,
            price_cents: personalRide.price_cents,
          };
        }
      }

      return activity;
    })
  );

  return enrichedActivities;
};

// ============================================================================
// EXPORT
// ============================================================================


// ============================================================================
// QUOTES (DEVIS)
// ============================================================================

export const createQuote = async (quoteData: {
  client_name: string;
  client_phone?: string;
  client_email?: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:MM:SS
  price_cents: number;
  notes?: string | null;
}) => {
  if (!currentUserId) {
    console.error('❌ createQuote - Pas de currentUserId !');
    throw new Error('User not authenticated');
  }

  // Valider qu'au moins un contact est fourni
  if (!quoteData.client_phone && !quoteData.client_email) {
    throw new Error('Au moins un contact (téléphone ou email) est requis');
  }

  console.log('🔍 createQuote - currentUserId:', currentUserId);
  console.log('🔍 createQuote - quoteData:', JSON.stringify(quoteData, null, 2));

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      driver_id: currentUserId,
      ...quoteData,
      valid_until: validUntil.toISOString().split('T')[0],
      status: 'SENT',
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating quote:', error);
    throw new Error(error.message);
  }

  console.log('✅ Quote created:', data.id);
  console.log('📦 Quote data:', JSON.stringify(data, null, 2));

  // Envoi SMS au client si numéro fourni (Edge Function send-quote-sms à déployer avec Twilio/etc.)
  if (quoteData.client_phone && data?.id) {
    try {
      const token = (data as any).token;
      const quoteUrl = token ? getQuoteUrl(token) : '';
      await supabase.functions.invoke('send-quote-sms', {
        body: {
          to: quoteData.client_phone.replace(/\s/g, ''),
          clientName: quoteData.client_name,
          quoteUrl,
          quoteId: data.id,
        },
      });
    } catch (smsError) {
      console.warn('⚠️ SMS non envoyé (Edge Function send-quote-sms absente ou erreur):', smsError);
    }
  }

  return data;
};

/**
 * Envoyer un devis par email via Resend.io (Edge Function)
 */
export const sendQuoteEmail = async (emailData: {
  clientEmail: string;
  clientName: string;
  quoteUrl: string;
  price: string;
  date: string;
  time: string;
  pickupAddress: string;
  dropoffAddress: string;
  driverName?: string;
}) => {
  console.log('📧 sendQuoteEmail - Envoi email via Edge Function:', emailData.clientEmail);
  console.log('📧 Données envoyées:', JSON.stringify(emailData, null, 2));

  // Utiliser fetch directement au lieu de supabase.functions.invoke pour plus de contrôle
  const { SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: anonKey } = await import('../lib/supabase');
  
  console.log('📧 Supabase URL:', supabaseUrl);
  console.log('📧 Anon Key:', anonKey ? 'Present' : 'Missing');

  const url = `${supabaseUrl}/functions/v1/send-quote-email`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(emailData),
    });

    console.log('📧 HTTP Status:', response.status);
    console.log('📧 HTTP OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Quote email sent successfully:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Fetch error:', error);
    throw error;
  }
};

export const listQuotes = async (filters?: {
  status?: 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REFUSED' | 'EXPIRED';
  limit?: number;
}) => {
  if (!currentUserId) {
    console.error('❌ listQuotes - Pas de currentUserId !');
    throw new Error('User not authenticated');
  }

  console.log('🔍 listQuotes - currentUserId:', currentUserId);
  console.log('🔍 listQuotes - filters:', filters);

  let query = supabase
    .from('quotes')
    .select('*')
    .eq('driver_id', currentUserId)
    .order('created_at', { ascending: false});

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error listing quotes:', error);
    return { data: [], error };
  }

  console.log(`✅ Loaded ${data?.length || 0} quotes`);
  console.log('📦 Quotes data:', JSON.stringify(data, null, 2));
  
  return { data: data || [], error: null };
};

export const getQuote = async (quoteId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .eq('driver_id', currentUserId)
    .single();

  if (error) {
    console.error('❌ Error getting quote:', error);
    throw new Error(error.message);
  }

  return data;
};

export const getQuoteByToken = async (token: string) => {
  // Accès public - pas besoin d'auth
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      *,
      users!quotes_driver_id_fkey (
        full_name,
        company_name,
        phone
      )
    `)
    .eq('token', token)
    .single();

  if (error) {
    console.error('❌ Error getting quote by token:', error);
    throw new Error(error.message);
  }

  // Marquer comme vu
  await supabase.rpc('mark_quote_viewed', { p_token: token });

  return data;
};

// ============================================================================
// INVOICES
// ============================================================================

export const listInvoices = async (filters?: {
  status?: 'ISSUED';
  limit?: number;
}) => {
  if (!currentUserId) {
    console.error('❌ listInvoices - Pas de currentUserId !');
    throw new Error('User not authenticated');
  }

  console.log('🔍 listInvoices - currentUserId:', currentUserId);
  console.log('🔍 listInvoices - filters:', filters);

  // Récupérer d'abord le vtc_profile_id de l'utilisateur
  const { data: vtcProfile, error: profileError } = await supabase
    .from('vtc_profiles')
    .select('id')
    .eq('user_id', currentUserId)
    .limit(1)
    .maybeSingle();

  if (profileError) {
    console.error('❌ Error getting VTC profile:', profileError);
    return { data: [], error: profileError };
  }

  if (!vtcProfile) {
    console.log('ℹ️ No VTC profile found for user');
    return { data: [], error: null };
  }

  let query = supabase
    .from('invoices')
    .select('*')
    .eq('vtc_profile_id', vtcProfile.id)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error listing invoices:', error);
    return { data: [], error };
  }

  console.log(`✅ Loaded ${data?.length || 0} invoices`);
  console.log('📦 Invoices data:', JSON.stringify(data, null, 2));
  
  return { data: data || [], error: null };
};

export const getInvoiceByRide = async (sourceType: 'RIDE' | 'PERSONAL', sourceId: string) => {
  if (!currentUserId) {
    console.error('❌ getInvoiceByRide - Pas de currentUserId !');
    throw new Error('User not authenticated');
  }

  console.log('🔍 getInvoiceByRide -', { sourceType, sourceId });

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('❌ Error getting invoice:', error);
    return null;
  }

  return data;
};

export const createInvoice = async (sourceType: 'RIDE' | 'PERSONAL', sourceId: string) => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  // Récupérer d'abord le vtc_profile_id de l'utilisateur
  let { data: vtcProfile, error: profileError } = await supabase
    .from('vtc_profiles')
    .select('id')
    .eq('user_id', currentUserId)
    .limit(1)
    .maybeSingle();

  // Si pas de profil VTC, en créer un automatiquement
  if (!profileError && !vtcProfile) {
    profileError = { message: 'No profile', code: 'PGRST116', details: '', hint: '' };
  }
  if (profileError && profileError.code === 'PGRST116') {
    console.log('ℹ️ Pas de profil VTC, création automatique...');
    try {
      // Récupérer les infos de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', currentUserId)
        .single();

      if (userError) throw userError;

      // Créer un profil VTC minimal
      const slug = userData.full_name
        ? userData.full_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : `chauffeur-${currentUserId.slice(0, 8)}`;

      const { data: newProfile, error: createError } = await supabase
        .from('vtc_profiles')
        .insert({
          user_id: currentUserId,
          slug,
          display_name: userData.full_name || 'Chauffeur privé',
          is_public: false,
        })
        .select('id')
        .single();

      if (createError) throw createError;

      vtcProfile = newProfile;
      console.log('✅ Profil VTC créé automatiquement:', vtcProfile.id);
    } catch (error) {
      console.error('❌ Erreur création profil VTC:', error);
      throw new Error('Impossible de créer le profil VTC nécessaire pour les factures');
    }
  } else if (profileError || !vtcProfile) {
    throw new Error('Erreur lors de la récupération du profil VTC');
  }

  console.log('🧾 createInvoice - Params:', { sourceType, sourceId, vtcProfileId: vtcProfile.id });

  const { data, error } = await supabase.rpc('create_invoice', {
    p_source_type: sourceType,
    p_source_id: sourceId,
    p_vtc_profile_id: vtcProfile.id,
  });

  if (error) {
    console.error('❌ Error creating invoice (RPC):', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }

  console.log('✅ Invoice created (RPC response):', JSON.stringify(data, null, 2));
  console.log('✅ Type of data:', typeof data, 'Is array:', Array.isArray(data));

  // La RPC retourne un tableau (RETURNS TABLE), on prend le premier élément
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('La RPC n\'a pas retourné de données');
  }

  // Extraire les données de la facture (peut être un tableau ou un objet)
  const invoiceData = Array.isArray(data) ? data[0] : data;
  console.log('✅ Invoice data extracted:', JSON.stringify(invoiceData, null, 2));

  if (!invoiceData || !invoiceData.id) {
    throw new Error('Données de facture invalides');
  }

  // Récupérer la facture complète avec TOUTES les colonnes depuis la table
  const { data: fullInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceData.id)
    .single();

  if (fetchError) {
    console.error('❌ Error fetching full invoice:', fetchError);
    throw new Error('Facture créée mais impossible de la récupérer: ' + fetchError.message);
  }

  console.log('✅ Full invoice fetched:', JSON.stringify(fullInvoice, null, 2));
  
  if (!fullInvoice.public_token) {
    console.error('❌ Invoice sans public_token!', fullInvoice);
    throw new Error('Facture créée mais sans token public');
  }

  console.log('✅ Public token:', fullInvoice.public_token);
  return fullInvoice;
};

// ============================================================================
// VTC PUBLIC PROFILE
// ============================================================================

export const getMyVTCProfile = async () => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('vtc_profiles')
    .select('*')
    .eq('user_id', currentUserId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
};

export const createVTCProfile = async (profileData: any) => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('vtc_profiles')
    .insert({
      user_id: currentUserId,
      ...profileData,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Duplicate slug
      throw new Error('Cet identifiant est déjà utilisé. Choisissez-en un autre.');
    }
    throw new Error(error.message);
  }

  console.log('✅ VTC Profile created:', data.slug);
  return data;
};

export const updateVTCProfile = async (profileData: any) => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const { data: existing } = await supabase
    .from('vtc_profiles')
    .select('id, slug')
    .eq('user_id', currentUserId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('vtc_profiles')
      .update(profileData)
      .eq('user_id', currentUserId);
    if (error) {
      if (error.code === '23505') throw new Error('Cet identifiant est déjà utilisé. Choisissez-en un autre.');
      throw new Error(error.message);
    }
    // Re-fetch au cas où RETURNING serait filtré par RLS
    const { data, error: fetchError } = await supabase
      .from('vtc_profiles')
      .select()
      .eq('user_id', currentUserId)
      .limit(1)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!data) throw new Error('Profil introuvable après mise à jour.');
    console.log('✅ VTC Profile updated:', data?.slug);
    return data;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('full_name')
    .or(`id.eq.${currentUserId},supabase_auth_id.eq.${currentUserId}`)
    .limit(1)
    .maybeSingle();

  const slug = userData?.full_name
    ? userData.full_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `chauffeur-${currentUserId.slice(0, 8)}`
    : `chauffeur-${currentUserId.slice(0, 8)}`;

  const { data, error } = await supabase
    .from('vtc_profiles')
    .insert({
      user_id: currentUserId,
      slug,
      display_name: userData?.full_name || 'Chauffeur privé',
      is_public: false,
      ...profileData,
    })
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') throw new Error('Cet identifiant est déjà utilisé. Choisissez-en un autre.');
    throw new Error(error.message);
  }
  if (!data) throw new Error('Profil créé mais impossible de le récupérer.');
  console.log('✅ VTC Profile created:', data?.slug);
  return data;
};

// ============================================================================
// DRIVER VERIFICATION (Profil vérifié – documents)
// ============================================================================

export const getDriverVerification = async () => {
  if (!currentUserId) throw new Error('User not authenticated');
  const { data, error } = await supabase
    .from('vtc_profiles')
    .select('driver_verification_status, driver_verification_submitted_at, driver_verification_reviewed_at, driver_verification_rejection_reason, verification_vtc_card_url, verification_id_card_url, verification_insurance_url, verification_vtc_card_status, verification_id_card_status, verification_insurance_status, verification_vtc_card_admin_notes, verification_id_card_admin_notes, verification_insurance_admin_notes')
    .eq('user_id', currentUserId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

/** Décoder base64 en binaire (comme photo de profil). */
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

/** Upload un document de vérification. docType: vtc_card | id_card | insurance.
 *  Préfère file.base64 (du picker avec base64: true) ; sinon lecture URI via FileSystem. */
export const uploadDriverVerificationDocument = async (
  docType: 'vtc_card' | 'id_card' | 'insurance',
  file: { uri: string; type?: string; name?: string; base64?: string }
) => {
  if (!currentUserId) throw new Error('User not authenticated');
  const ext = file.name?.split('.').pop() || (file.type?.includes('pdf') ? 'pdf' : 'jpg');
  const path = `${currentUserId}/${docType}/${Date.now()}.${ext}`;
  const contentType = file.type || 'image/jpeg';

  let base64: string;
  if (file.base64?.trim()) {
    base64 = file.base64.trim();
  } else {
    base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
  }
  const fileData = base64ToUint8Array(base64);
  if (fileData.length === 0) {
    throw new Error('Fichier vide ou inaccessible. Réessayez en choisissant une autre image (base64 préféré).');
  }

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('driver-verification')
    .upload(path, fileData, { contentType, upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  // Comme pour la photo de profil : générer une URL signée longue durée et la stocker en base
  const { data: signedData, error: signError } = await supabase.storage
    .from('driver-verification')
    .createSignedUrl(uploadData.path, 315360000); // 10 ans
  if (signError || !signedData?.signedUrl) {
    console.warn('createSignedUrl failed, storing path:', signError?.message);
  }
  const urlToStore = signedData?.signedUrl ?? uploadData.path;
  const columnUrl = docType === 'vtc_card' ? 'verification_vtc_card_url' : docType === 'id_card' ? 'verification_id_card_url' : 'verification_insurance_url';
  const columnStatus = docType === 'vtc_card' ? 'verification_vtc_card_status' : docType === 'id_card' ? 'verification_id_card_status' : 'verification_insurance_status';
  const { data: profile, error: updateError } = await supabase
    .from('vtc_profiles')
    .update({ [columnUrl]: urlToStore, [columnStatus]: 'uploaded' })
    .eq('user_id', currentUserId)
    .select()
    .limit(1)
    .maybeSingle();
  if (updateError || !profile) throw new Error(updateError?.message || 'Profil VTC introuvable.');
  return { path: uploadData.path, profile };
};

/** Soumettre la vérification (passe en pending). Tous les docs doivent être uploaded. */
export const submitDriverVerification = async () => {
  if (!currentUserId) throw new Error('User not authenticated');
  const { data: profile, error: fetchError } = await supabase
    .from('vtc_profiles')
    .select('verification_vtc_card_status, verification_id_card_status, verification_insurance_status')
    .eq('user_id', currentUserId)
    .limit(1)
    .maybeSingle();
  if (fetchError || !profile) throw new Error('Profil VTC introuvable. Complétez d\'abord votre Page Pro.');
  if (profile.verification_vtc_card_status !== 'uploaded' && profile.verification_vtc_card_status !== 'approved') throw new Error('Téléversez la carte professionnelle chauffeur.');
  if (profile.verification_id_card_status !== 'uploaded' && profile.verification_id_card_status !== 'approved') throw new Error('Téléversez la pièce d\'identité.');
  if (profile.verification_insurance_status !== 'uploaded' && profile.verification_insurance_status !== 'approved') throw new Error('Téléversez l\'attestation d\'assurance RC Pro.');
  const { data, error } = await supabase
    .from('vtc_profiles')
    .update({
      driver_verification_status: 'pending',
      driver_verification_submitted_at: new Date().toISOString(),
      driver_verification_rejection_reason: null,
    })
    .eq('user_id', currentUserId)
    .select()
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error(error?.message || 'Profil introuvable.');
  return data;
};

// ============================================================================
// ADMIN: Driver verification review
// ============================================================================

const mapVtcProfileToPendingVerification = (row: any) => ({
  id: row.id,
  user_id: row.user_id,
  driver_verification_submitted_at: row.driver_verification_submitted_at,
  verification_vtc_card_status: row.verification_vtc_card_status ?? 'missing',
  verification_id_card_status: row.verification_id_card_status ?? 'missing',
  verification_insurance_status: row.verification_insurance_status ?? 'missing',
  verification_vtc_card_url: row.verification_vtc_card_url,
  verification_id_card_url: row.verification_id_card_url,
  verification_insurance_url: row.verification_insurance_url,
  user: {
    id: row.user_id,
    full_name: row.driver_full_name ?? row.user?.full_name ?? null,
    email: row.driver_email ?? row.user?.email ?? null,
  },
});

/** Liste des profils en attente de vérification (admin). RPC en priorité ; si 0 résultat ou RPC absente, requête directe (RLS 052 autorise les admins). */
export const listPendingDriverVerifications = async () => {
  if (!currentUserId) throw new Error('User not authenticated');

  const directQuery = async () => {
    const { data, error } = await supabase
      .from('vtc_profiles')
      .select(`
        id,
        user_id,
        driver_verification_submitted_at,
        verification_vtc_card_status,
        verification_id_card_status,
        verification_insurance_status,
        verification_vtc_card_url,
        verification_id_card_url,
        verification_insurance_url,
        user:users!vtc_profiles_user_id_fkey(id, full_name, email)
      `)
      .eq('driver_verification_status', 'pending')
      .order('driver_verification_submitted_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => mapVtcProfileToPendingVerification({
      ...row,
      driver_full_name: row.user?.full_name,
      driver_email: row.user?.email,
    }));
  };

  const { data: rpcData, error: rpcError } = await supabase.rpc('list_pending_driver_verifications', {});
  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    return rpcData.map((row: any) => mapVtcProfileToPendingVerification(row));
  }
  if (!rpcError && Array.isArray(rpcData)) {
    console.log('RPC list_pending_driver_verifications a retourné 0 ligne (vérification admin ?), tentative requête directe.');
  } else if (rpcError) {
    console.warn('RPC list_pending_driver_verifications:', rpcError.code, rpcError.message);
  }
  return directQuery();
};

/** URL signée pour afficher un document (admin ou propriétaire). */
export const getDriverVerificationDocumentSignedUrl = async (path: string, expiresIn = 3600) => {
  const { data, error } = await supabase.storage
    .from('driver-verification')
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data?.signedUrl || null;
};

/**
 * URL signée via Edge Function (service role) — contourne les RLS Storage.
 * À utiliser côté admin quand createSignedUrl échoue (permissions).
 */
export const getDriverVerificationDocumentSignedUrlAdmin = async (path: string): Promise<string | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Non authentifié');
  const pathNorm = path.replace(/^\//, '').trim();
  if (!pathNorm) return null;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-signed-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'x-user-token': token,
    },
    body: JSON.stringify({ path: pathNorm }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error ?? `HTTP ${res.status}`;
    console.warn('[AdminPanel] admin-create-signed-url', res.status, msg);
    throw new Error(msg);
  }
  return json?.url ?? null;
};

/** Approuver ou rejeter un document (admin). Si les 3 sont approuvés, passe le profil en approved. */
export const reviewDriverVerificationDocument = async (
  vtcProfileId: string,
  docType: 'vtc_card' | 'id_card' | 'insurance',
  status: 'approved' | 'rejected',
  adminNotes?: string | null
) => {
  if (!currentUserId) throw new Error('User not authenticated');
  const colStatus = docType === 'vtc_card' ? 'verification_vtc_card_status' : docType === 'id_card' ? 'verification_id_card_status' : 'verification_insurance_status';
  const colNotes = docType === 'vtc_card' ? 'verification_vtc_card_admin_notes' : docType === 'id_card' ? 'verification_id_card_admin_notes' : 'verification_insurance_admin_notes';
  const update: Record<string, unknown> = { [colStatus]: status, [colNotes]: adminNotes ?? null };
  const { data: profile, error: updateError } = await supabase
    .from('vtc_profiles')
    .update(update)
    .eq('id', vtcProfileId)
    .select('verification_vtc_card_status, verification_id_card_status, verification_insurance_status')
    .single();
  if (updateError) throw new Error(updateError.message);
  const allApproved =
    profile.verification_vtc_card_status === 'approved' &&
    profile.verification_id_card_status === 'approved' &&
    profile.verification_insurance_status === 'approved';
  if (allApproved) {
    await supabase
      .from('vtc_profiles')
      .update({
        driver_verification_status: 'approved',
        driver_verification_reviewed_at: new Date().toISOString(),
        driver_verification_rejection_reason: null,
      })
      .eq('id', vtcProfileId);
  }
  return { profile, allApproved };
};

/** Rejeter le profil global (admin). */
export const rejectDriverVerification = async (vtcProfileId: string, reason: string) => {
  if (!currentUserId) throw new Error('User not authenticated');
  const { data, error } = await supabase
    .from('vtc_profiles')
    .update({
      driver_verification_status: 'rejected',
      driver_verification_reviewed_at: new Date().toISOString(),
      driver_verification_rejection_reason: reason,
    })
    .eq('id', vtcProfileId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteVTCProfile = async () => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('vtc_profiles')
    .delete()
    .eq('user_id', currentUserId);

  if (error) {
    throw new Error(error.message);
  }

  console.log('✅ VTC Profile deleted');
  return { success: true };
};

// ============================================================================
// CONVERT PUBLISHED TO PERSONAL
// ============================================================================

export const convertPublishedToPersonal = async (rideId: string) => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  try {
    // 1. Récupérer la course publiée
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('creator_id', currentUserId)
      .single();

    if (fetchError || !ride) {
      throw new Error('Course non trouvée ou vous n\'êtes pas le créateur');
    }

    if (ride.picker_id) {
      throw new Error('Cette course a déjà été prise par quelqu\'un');
    }

    // 2. Créer la course personnelle
    // Mapping des champs de rides vers personal_rides
    const personalRide = {
      driver_id: currentUserId,
      source: 'OTHER', // Valeur autorisée par la contrainte CHECK
      pickup_address: ride.pickup_address,
      dropoff_address: ride.dropoff_address,
      scheduled_at: ride.scheduled_at || ride.pickup_time,
      price_cents: ride.price_cents || (ride.price ? ride.price * 100 : null),
      distance_km: ride.distance_km,
      duration_minutes: ride.duration_minutes,
      status: 'SCHEDULED',
      notes: ride.notes ? `${ride.notes}\n(Récupérée depuis le marketplace)` : 'Récupérée depuis le marketplace',
    };

    const { error: createError } = await supabase
      .from('personal_rides')
      .insert(personalRide);

    if (createError) {
      throw new Error(createError.message);
    }

    // 3. Supprimer la course publiée
    const { error: deleteError } = await supabase
      .from('rides')
      .delete()
      .eq('id', rideId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // 4. Retirer le crédit gagné lors de la publication (via Edge Function sécurisée)
    await addCreditsSecure(-1, 'ADMIN_ADJUSTMENT', {
      ride_id: rideId,
      description: 'Converted published ride back to personal',
    });

    // 5. Logger l'activité
    await supabase.from('activity_log').insert({
      user_id: currentUserId,
      action: 'CONVERTED_TO_PERSONAL',
      entity_type: 'RIDE',
      entity_id: rideId,
      metadata: {
        pickup: ride.pickup_address,
        dropoff: ride.dropoff_address,
        credit_refunded: -1,
      },
    });

    console.log('✅ Course convertie en personnelle et crédit retiré');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erreur conversion course:', error);
    throw error;
  }
};

// ============================================================================
// DRIVER RIDE REQUESTS (demandes depuis la page publique)
// ============================================================================

export const getDriverRideRequestsPendingCount = async (): Promise<number> => {
  if (!currentUserId) return 0;
  const { count, error } = await supabase
    .from('driver_ride_requests')
    .select('*', { count: 'exact', head: true })
    .eq('driver_id', currentUserId)
    .eq('status', 'PENDING');
  if (error) {
    console.warn('getDriverRideRequestsPendingCount:', error);
    return 0;
  }
  return count ?? 0;
};

export const getDriverRideRequests = async () => {
  if (!currentUserId) return [];
  const { data, error } = await supabase
    .from('driver_ride_requests')
    .select('*')
    .eq('driver_id', currentUserId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getDriverRideRequests:', error);
    return [];
  }
  return data ?? [];
};

export const getDriverRideRequestById = async (id: string) => {
  if (!currentUserId) throw new Error('User not authenticated');
  const { data, error } = await supabase
    .from('driver_ride_requests')
    .select('*')
    .eq('id', id)
    .eq('driver_id', currentUserId)
    .single();
  if (error || !data) throw new Error('Demande introuvable');
  return data;
};

export const acceptDriverRideRequest = async (requestId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');
  const request = await getDriverRideRequestById(requestId);
  if (request.status !== 'PENDING') {
    throw new Error('Cette demande a déjà été traitée');
  }
  const { error: updateError } = await supabase
    .from('driver_ride_requests')
    .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('driver_id', currentUserId);
  if (updateError) throw new Error(updateError.message);

  const { data: insertedRide, error: insertError } = await supabase
    .from('personal_rides')
    .insert({
      driver_id: currentUserId,
      source: 'DIRECT_CLIENT',
      pickup_address: request.pickup_address,
      dropoff_address: request.dropoff_address,
      scheduled_at: request.scheduled_at,
      price_cents: request.price_cents,
      distance_km: request.distance_km,
      client_name: request.client_name,
      client_phone: request.client_phone,
      client_email: request.client_email,
      notes: request.notes ? `${request.notes}\n(Demande depuis page publique)` : 'Demande depuis page publique',
      status: 'SCHEDULED',
    })
    .select('id')
    .single();
  if (insertError) {
    await supabase.from('driver_ride_requests').update({ status: 'PENDING', updated_at: new Date().toISOString() }).eq('id', requestId).eq('driver_id', currentUserId);
    throw new Error(insertError.message);
  }

  // Email automatique au client : réservation acceptée (Resend)
  const clientEmail = request.client_email?.trim();
  console.log('📧 [Booking accepted] client_email sur la demande:', clientEmail ?? '(vide)');
  if (clientEmail) {
    try {
      const { data: driver } = await supabase
        .from('users')
        .select('full_name, phone')
        .eq('id', currentUserId)
        .single();
      const payload = {
        clientEmail,
        clientName: request.client_name?.trim() || 'Client',
        driverName: (driver as { full_name?: string } | null)?.full_name || 'Votre chauffeur',
        driverPhone: (driver as { phone?: string } | null)?.phone || '',
        scheduledAt: request.scheduled_at,
        pickupAddress: request.pickup_address,
        dropoffAddress: request.dropoff_address,
        priceCents: request.price_cents ?? undefined,
        reservationId: (insertedRide as { id?: string } | null)?.id,
      };
      const url = `${SUPABASE_URL}/functions/v1/send-booking-accepted-email`;
      console.log('📧 [Booking accepted] Appel Edge Function:', url, '→', payload.clientEmail);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn('⚠️ [Booking accepted] Edge Function HTTP', res.status, body);
      } else {
        console.log('📧 [Booking accepted] Email:', body.error ? 'échec' : 'ok', body);
      }
    } catch (emailErr) {
      console.warn('⚠️ [Booking accepted] Erreur envoi email (non bloquant):', emailErr);
    }
  } else {
    console.log('📧 Pas d’email client sur la demande, envoi réservation acceptée ignoré');
  }

  return { success: true };
};

export const refuseDriverRideRequest = async (requestId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');
  const request = await getDriverRideRequestById(requestId);
  if (request.status !== 'PENDING') {
    throw new Error('Cette demande a déjà été traitée');
  }
  const CREATOR_ID_CLIENT_WEB = 'corail-landing';
  if (request.fallback_to_marketplace) {
    const { error: rideError } = await supabase.from('rides').insert({
      creator_id: CREATOR_ID_CLIENT_WEB,
      pickup_address: request.pickup_address,
      dropoff_address: request.dropoff_address,
      scheduled_at: request.scheduled_at,
      price_cents: request.price_cents ?? 0,
      distance_km: request.distance_km,
      notes: request.notes,
      client_name: request.client_name,
      client_email: request.client_email,
      client_phone: request.client_phone,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      source: 'client',
    });
    if (rideError) console.warn('refuseDriverRideRequest: could not publish to marketplace', rideError);
  }
  const { error: updateError } = await supabase
    .from('driver_ride_requests')
    .update({ status: 'REFUSED', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('driver_id', currentUserId);
  if (updateError) throw new Error(updateError.message);
  return { success: true };
};

// ============================================================================
// USER PROFILE
// ============================================================================

export const updateUserPhoto = async (photoUrl: string) => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('users')
    .update({ photo_url: photoUrl })
    .eq('id', currentUserId);

  if (error) {
    throw new Error(error.message);
  }

  console.log('✅ User photo updated');
  return { success: true };
};

/**
 * Mise à jour du profil utilisateur (SIRET/SIREN, téléphone, carte pro)
 * Permet de compléter ou modifier ces infos après l'inscription.
 */
export const updateUserProfile = async (updates: {
  siren?: string;
  phone?: string;
  professional_card_number?: string;
}) => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const updateData: Record<string, string> = {};
  if (updates.siren !== undefined) updateData.siren = updates.siren.trim();
  if (updates.phone !== undefined) updateData.phone = updates.phone.trim();
  if (updates.professional_card_number !== undefined) updateData.professional_card_number = updates.professional_card_number.trim();

  if (Object.keys(updateData).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', currentUserId);

  if (error) {
    throw new Error(error.message);
  }

  console.log('✅ User profile updated');
  return { success: true };
};

// ============================================================================
// RGPD - EXPORT & DELETE
// ============================================================================

/**
 * RGPD Article 20 : Droit à la portabilité des données
 * Exporte toutes les données utilisateur au format JSON et envoie par email
 */
export const requestDataExport = async () => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  try {
    console.log('📤 Demande d\'export de données pour:', currentUserId);

    // Appeler une fonction Supabase Edge Function qui va générer et envoyer l'export
    const { data, error } = await supabase.functions.invoke('export-user-data', {
      body: { userId: currentUserId },
    });

    if (error) {
      // Si la fonction Edge n'existe pas encore, on fait un export simple
      console.warn('⚠️ Edge Function non disponible, export basique...');
      
      // Récupérer toutes les données de l'utilisateur
      const [
        user,
        rides,
        personalRides,
        credits,
        activity,
        groups,
        inAppNotifications,
        driverRideRequests,
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', currentUserId).single(),
        supabase.from('rides').select('*').or(`creator_id.eq.${currentUserId},picker_id.eq.${currentUserId}`),
        supabase.from('personal_rides').select('*').eq('driver_id', currentUserId),
        supabase.from('credits').select('*').eq('user_id', currentUserId),
        supabase.from('activity_log').select('*').eq('user_id', currentUserId),
        supabase.from('group_members').select('*, groups(*)').eq('user_id', currentUserId),
        supabase.from('in_app_notifications').select('*').eq('user_id', currentUserId),
        supabase.from('driver_ride_requests').select('*').eq('driver_id', currentUserId),
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user_id: currentUserId,
        user_profile: user.data,
        marketplace_rides: rides.data || [],
        personal_rides: personalRides.data || [],
        credits_history: credits.data || [],
        activity_log: activity.data || [],
        groups: groups.data || [],
        in_app_notifications: inAppNotifications.data || [],
        driver_ride_requests: driverRideRequests.data || [],
      };

      // Log l'export pour traitement manuel
      await supabase.from('activity_log').insert({
        user_id: currentUserId,
        activity_type: 'DATA_EXPORT_REQUESTED',
        details: { export_size: JSON.stringify(exportData).length },
      });

      console.log('✅ Export de données enregistré');
      return { success: true, message: 'Votre demande d\'export a été enregistrée. Vous recevrez un email sous 24h.' };
    }

    console.log('✅ Export de données lancé');
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Erreur export données:', error);
    throw new Error(error.message || 'Impossible d\'exporter vos données');
  }
};

/**
 * RGPD Article 17 : Droit à l'effacement
 * Supprime définitivement le compte et toutes les données associées
 */
export const deleteAccount = async () => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  try {
    console.log('🗑️ Suppression du compte:', currentUserId);

    // Log de l'action avant suppression
    await supabase.from('activity_log').insert({
      user_id: currentUserId,
      activity_type: 'ACCOUNT_DELETION_REQUESTED',
      details: { timestamp: new Date().toISOString() },
    });

    // Appeler une fonction Supabase qui va gérer la suppression en cascade
    const { data, error } = await supabase.functions.invoke('delete-user-account', {
      body: { userId: currentUserId },
    });

    if (error) {
      // Si la fonction Edge n'existe pas, on fait une suppression basique
      console.warn('⚠️ Edge Function non disponible, suppression basique...');
      
      // Supprimer dans l'ordre (en respectant les foreign keys)
      await Promise.all([
        // Supprimer les activités
        supabase.from('activity_log').delete().eq('user_id', currentUserId),
        // Notifications in-app
        supabase.from('in_app_notifications').delete().eq('user_id', currentUserId),
        // Demandes de réservation directe (Page Pro)
        supabase.from('driver_ride_requests').delete().eq('driver_id', currentUserId),
        // Supprimer les courses personnelles
        supabase.from('personal_rides').delete().eq('driver_id', currentUserId),
        // Supprimer les invitations de groupes
        supabase.from('group_invitations').delete().eq('invitee_id', currentUserId),
        // Quitter tous les groupes
        supabase.from('group_members').delete().eq('user_id', currentUserId),
        // Anonymiser les courses marketplace créées
        supabase.from('rides').update({ creator_id: 'DELETED_USER' }).eq('creator_id', currentUserId),
        // Anonymiser les courses prises
        supabase.from('rides').update({ picker_id: null }).eq('picker_id', currentUserId),
        // Supprimer les crédits
        supabase.from('credits').delete().eq('user_id', currentUserId),
        // Supprimer les devis
        supabase.from('quotes').delete().eq('created_by', currentUserId),
        // Supprimer le profil VTC
        supabase.from('vtc_profiles').delete().eq('user_id', currentUserId),
      ]);

      // Supprimer l'utilisateur en dernier
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', currentUserId);

      if (userError) {
        throw new Error(userError.message);
      }
    }

    console.log('✅ Compte supprimé avec succès');
    
    // Déconnecter l'utilisateur
    clearAuth();
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erreur suppression compte:', error);
    throw new Error(error.message || 'Impossible de supprimer votre compte');
  }
};

/**
 * Accepter les termes et conditions (RGPD)
 * Enregistre que l'utilisateur a accepté les CGU et la politique de confidentialité
 */
export const acceptTerms = async () => {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  try {
    console.log('✅ Acceptation des termes pour:', currentUserId);

    const { error } = await supabase
      .from('users')
      .update({
        has_accepted_terms: true,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq('id', currentUserId);

    if (error) {
      throw new Error(error.message);
    }

    // Log de l'acceptation
    await supabase.from('activity_log').insert({
      user_id: currentUserId,
      activity_type: 'TERMS_ACCEPTED',
      details: { timestamp: new Date().toISOString() },
    });

    console.log('✅ Termes acceptés avec succès');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erreur acceptation termes:', error);
    throw new Error(error.message || "Impossible d'enregistrer l'acceptation des termes");
  }
};


// ============================================================================
// IN-APP NOTIFICATIONS (centre de notifications, cloche + pastille)
// ============================================================================

export interface InAppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  target_ride_id: string | null;
  target_personal_ride_id?: string | null;
  target_screen: string | null;
  read_at: string | null;
  created_at: string;
}

export const listInAppNotifications = async (limit = 50): Promise<InAppNotification[]> => {
  if (!currentUserId) return [];
  const { data, error } = await supabase.rpc('list_my_in_app_notifications', { lim: limit });
  if (error) {
    console.error('[notifications] listInAppNotifications RPC error:', error.message, error);
    // Fallback: requête directe (RLS 058 autorise user_id = auth.uid() ou users.id)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (fallbackError) {
      console.error('[notifications] listInAppNotifications fallback error:', fallbackError.message);
      return [];
    }
    if (__DEV__) {
      console.log('[notifications] listInAppNotifications (fallback):', (fallbackData || []).length, 'items');
    }
    return (fallbackData || []) as InAppNotification[];
  }
  const list = Array.isArray(data) ? data : [];
  if (__DEV__ && list.length > 0) {
    console.log('[notifications] listInAppNotifications:', list.length, 'items');
  }
  return list as InAppNotification[];
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  if (!currentUserId) return 0;
  const { data, error } = await supabase.rpc('get_my_unread_notifications_count');
  if (error) {
    console.error('[notifications] getUnreadNotificationsCount RPC error:', error.message, error);
    // Fallback: count direct (RLS 058)
    const { count, error: fallbackError } = await supabase
      .from('in_app_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .is('read_at', null);
    if (fallbackError) {
      console.error('[notifications] getUnreadNotificationsCount fallback error:', fallbackError.message);
      return 0;
    }
    const fallbackCount = count ?? 0;
    if (__DEV__) {
      console.log('[notifications] getUnreadNotificationsCount (fallback):', fallbackCount);
    }
    return fallbackCount;
  }
  // PostgREST peut renvoyer un scalaire en number, string, ou dans un tableau
  const n = Array.isArray(data) && data.length > 0 ? Number(data[0]) : Number(data);
  const count = Number.isFinite(n) ? n : 0;
  if (__DEV__) {
    console.log('[notifications] getUnreadNotificationsCount:', count, '(raw:', data, ')');
  }
  return count;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  if (!currentUserId) return;
  await supabase
    .from('in_app_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  if (!currentUserId) return;
  await supabase.rpc('mark_all_my_notifications_read');
};

/** Insère une notification in-app (cloche) pour l'utilisateur connecté (course imminente, résumé quotidien, etc.). */
export const insertInAppNotification = async (payload: {
  type: string;
  title: string;
  body?: string | null;
  target_ride_id?: string | null;
  target_screen?: string | null;
  target_personal_ride_id?: string | null;
}): Promise<string | null> => {
  if (!currentUserId) return null;
  const { data, error } = await supabase.rpc('insert_my_in_app_notification', {
    p_type: payload.type,
    p_title: payload.title,
    p_body: payload.body ?? null,
    p_target_ride_id: payload.target_ride_id ?? null,
    p_target_screen: payload.target_screen ?? null,
    p_target_personal_ride_id: payload.target_personal_ride_id ?? null,
  });
  if (error) {
    if (__DEV__) console.warn('[notifications] insertInAppNotification:', error.message);
    return null;
  }
  return data ? String(data) : null;
};


export const supabaseApi = {
  setUserId,
  clearAuth,
  getVerificationStatus,
  submitVerification,
  getPendingVerifications,
  reviewVerification,
  createUser,
  getRides,
  getMyRides,
  getRide,
  createRide,
  claimRide,
  completeRide,
  deleteRide,
  listPersonalRides,
  getPersonalRide,
  createPersonalRide,
  publishPersonalRide,
  deletePersonalRide,
  updatePersonalRide,
  completePersonalRide,
  getPersonalRidesStats,
  getCredits,
  getAllBadges,
  getUserBadges,
  listGroups,
  getGroup,
  createGroup,
  getGroupMembers,
  inviteToGroup,
  getMyGroupInvitations,
  respondToInvitation,
  leaveGroup,
  removeMemberFromGroup,
  getGroupPendingInvitations,
  cancelGroupInvitation,
  getPlanningEvents,
  createPlanningEvent,
  getRecentActivity,
  createQuote,
  sendQuoteEmail,
  listQuotes,
  getQuote,
  getQuoteByToken,
  listInvoices,
  getInvoiceByRide,
  createInvoice,
  getMyVTCProfile,
  createVTCProfile,
  updateVTCProfile,
  deleteVTCProfile,
  getDriverVerification,
  uploadDriverVerificationDocument,
  submitDriverVerification,
  listPendingDriverVerifications,
  getDriverVerificationDocumentSignedUrl,
  getDriverVerificationDocumentSignedUrlAdmin,
  reviewDriverVerificationDocument,
  rejectDriverVerification,
  updateUserPhoto,
  updateUserProfile,
  convertPublishedToPersonal,
  getDriverRideRequestsPendingCount,
  getDriverRideRequests,
  getDriverRideRequestById,
  acceptDriverRideRequest,
  refuseDriverRideRequest,
  requestDataExport,
  deleteAccount,
  acceptTerms,
  listInAppNotifications,
  getUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
  insertInAppNotification,
};

export default supabaseApi;

