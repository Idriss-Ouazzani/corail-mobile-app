/**
 * Supabase API Service - Remplace l'ancien apiClient Databricks
 * Toutes les fonctions de l'app migrées vers Supabase
 */

import { supabase } from '../lib/supabase';
import type { Ride } from '../types';

// ============================================================================
// HELPER: Get current user ID from Firebase token
// ============================================================================
let currentUserId: string | null = null;

export const setUserId = (userId: string) => {
  currentUserId = userId;
};

export const clearAuth = () => {
  currentUserId = null;
};

// ============================================================================
// USERS & VERIFICATION
// ============================================================================

export const getVerificationStatus = async () => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUserId)
    .single();

  if (error) {
    // User doesn't exist yet, create it automatically
    if (error.code === 'PGRST116') {
      console.log('🆕 Utilisateur non trouvé, création automatique dans Supabase...');
      
      // Créer l'utilisateur avec des valeurs par défaut
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: currentUserId,
          email: '', // Sera rempli lors de la vérification
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
      return newUser;
    }
    throw new Error(error.message);
  }

  return data;
};

export const submitVerification = async (verificationData: {
  full_name: string;
  phone: string;
  siren: string;
  professional_card_number: string;
  email?: string; // Optionnel mais recommandé
}) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: currentUserId,
      ...verificationData,
      verification_status: 'PENDING',
      verification_submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  
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
      creator:users!rides_creator_id_fkey(id, full_name, email, rating, total_reviews),
      picker:users!rides_picker_id_fkey(id, full_name, email)
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
      creator:users!rides_creator_id_fkey(id, full_name, email, rating, total_reviews),
      picker:users!rides_picker_id_fkey(id, full_name, email)
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
      picker:users!rides_picker_id_fkey(id, full_name, email, phone)
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

  // Add credit
  await supabase.from('credits_ledger').insert({
    user_id: currentUserId,
    amount: 1,
    transaction_type: 'PUBLISH_RIDE',
    ride_id: ride.id,
    description: 'Published ride on marketplace',
  });

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

  // Check credits
  const credits = await getCredits();
  if (credits.credits < 1) {
    throw new Error('Insufficient credits');
  }

  // Update ride
  const { data: ride, error: rideError } = await supabase
    .from('rides')
    .update({
      picker_id: currentUserId,
      status: 'CLAIMED',
    })
    .eq('id', rideId)
    .eq('status', 'PUBLISHED') // Only claim if still published
    .select()
    .single();

  if (rideError) throw new Error(rideError.message);

  // Deduct credit
  await supabase.from('credits_ledger').insert({
    user_id: currentUserId,
    amount: -1,
    transaction_type: 'CLAIM_RIDE',
    ride_id: rideId,
    description: 'Claimed ride from marketplace',
  });

  // Add activity log
  await supabase.from('activity_log').insert({
    user_id: currentUserId,
    action_type: 'RIDE_CLAIMED',
    description: 'Claimed ride',
    ride_id: rideId,
  });

  return ride;
};

export const completeRide = async (rideId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('rides')
    .update({
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
    })
    .eq('id', rideId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Bonus credit for completing
  await supabase.from('credits_ledger').insert({
    user_id: currentUserId,
    amount: 1,
    transaction_type: 'COMPLETE_RIDE_BONUS',
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

  return data;
};

export const deleteRide = async (rideId: string) => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('rides')
    .delete()
    .eq('id', rideId)
    .eq('creator_id', currentUserId); // Only creator can delete

  if (error) throw new Error(error.message);
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
  notes?: string;
  status?: string;
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

// ============================================================================
// CREDITS
// ============================================================================

export const getCredits = async () => {
  if (!currentUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .rpc('get_user_credits', { p_user_id: currentUserId });

  if (error) throw new Error(error.message);

  return { credits: data || 0 };
};

// ============================================================================
// BADGES
// ============================================================================

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

  return data.map((ub: any) => ({
    badge_id: ub.badge.id,
    badge_name: ub.badge.name,
    badge_description: ub.badge.description,
    badge_icon: ub.badge.icon,
    badge_color: ub.badge.color,
    badge_rarity: ub.badge.rarity,
    earned_at: ub.earned_at,
  }));
};

// ============================================================================
// GROUPS (À IMPLÉMENTER SI BESOIN)
// ============================================================================

export const listGroups = async () => {
  // TODO: Implement groups
  return [];
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

// ============================================================================
// ACTIVITY LOG
// ============================================================================

export const getRecentActivity = async (limit: number = 10) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // Récupérer les activités avec les détails des courses
  const { data: activities, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

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
  createPersonalRide,
  getPersonalRidesStats,
  getCredits,
  getUserBadges,
  listGroups,
  getPlanningEvents,
  getRecentActivity,
};

export default supabaseApi;

