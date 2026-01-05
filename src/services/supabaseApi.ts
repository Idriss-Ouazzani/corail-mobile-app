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
  console.log('🔍 [DEBUG APK] ============================================');
  console.log('🔍 [DEBUG APK] setUserId() called');
  console.log('🔍 [DEBUG APK] New userId:', userId);
  currentUserId = userId;
  console.log('🔍 [DEBUG APK] currentUserId updated to:', currentUserId);
  console.log('🔍 [DEBUG APK] ============================================');
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
    const { data, error } = await supabase.functions.invoke('add-credits', {
      body: {
        userId: currentUserId,
        amount,
        reason,
        metadata,
      },
    });

    if (error) {
      console.error('❌ Error calling add-credits function:', error);
      throw error;
    }

    if (data?.error) {
      console.error('❌ Edge Function returned error:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ Credits added successfully:', data);
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
  console.log('🔍 [DEBUG APK] getVerificationStatus() called');
  console.log('🔍 [DEBUG APK] currentUserId =', currentUserId);
  
  if (!currentUserId) {
    console.error('🔍 [DEBUG APK] ERROR: currentUserId is null!');
    throw new Error('User not authenticated');
  }

  console.log('🔍 [DEBUG APK] Querying Supabase users table with id:', currentUserId);
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUserId)
    .single();
  
  console.log('🔍 [DEBUG APK] Supabase query result - data:', data ? 'EXISTS' : 'NULL');
  console.log('🔍 [DEBUG APK] Supabase query result - error:', error ? error.message : 'NONE');

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

  // Add credit (via secure Edge Function)
  await addCreditsSecure(1, 'PUBLISH_RIDE', {
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

  // Deduct credit (via secure Edge Function)
  await addCreditsSecure(-1, 'CLAIM_RIDE', {
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

  // 🔔 Return ride with creator info for notification
  return {
    ...ride,
    creator_id: ride.creator_id,
    picker_id: currentUserId,
  };
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
  }
) => {
  if (!currentUserId) throw new Error('User not authenticated');

  // 1. Récupérer la course personnelle
  const { data: personalRide, error: fetchError } = await supabase
    .from('personal_rides')
    .select('*')
    .eq('id', personalRideId)
    .eq('driver_id', currentUserId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!personalRide) throw new Error('Course personnelle non trouvée');

  // 2. Créer une course marketplace avec les données de la course personnelle
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
      visibility: options.visibility,
      vehicle_type: options.vehicle_type,
      status: 'PUBLISHED',
      group_id: options.group_id,
    })
    .select()
    .single();

  if (createError) throw new Error(createError.message);

  // 3. Ajouter +1 crédit pour la publication (via secure Edge Function)
  await addCreditsSecure(1, 'PUBLISH_RIDE', {
    ride_id: newRide.id,
    description: `Published personal ride ${personalRideId} to marketplace`,
  });

  // 4. Supprimer la course personnelle (elle est maintenant publiée)
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


// ============================================================================
// QUOTES (DEVIS)
// ============================================================================

export const createQuote = async (quoteData: {
  client_name: string;
  client_phone: string;
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

  console.log('🔍 createQuote - currentUserId:', currentUserId);
  console.log('🔍 createQuote - quoteData:', JSON.stringify(quoteData, null, 2));

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      driver_id: currentUserId,
      ...quoteData,
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
  
  // TODO: Envoyer SMS au client via Edge Function
  // Pour l'instant, juste retourner le devis
  return data;
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
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    throw new Error(error.message);
  }

  return data;
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

  // UPSERT : crée si n'existe pas, met à jour sinon
  const { data, error } = await supabase
    .from('vtc_profiles')
    .upsert(
      {
        user_id: currentUserId,
        ...profileData,
      },
      {
        onConflict: 'user_id', // Utilise user_id comme clé unique
      }
    )
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Duplicate slug
      throw new Error('Cet identifiant est déjà utilisé. Choisissez-en un autre.');
    }
    throw new Error(error.message);
  }

  console.log('✅ VTC Profile upserted:', data.slug);
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
    await addCreditsSecure(-1, 'CONVERT_TO_PERSONAL', {
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
      const [user, rides, personalRides, credits, activity, groups] = await Promise.all([
        supabase.from('users').select('*').eq('id', currentUserId).single(),
        supabase.from('rides').select('*').or(`creator_id.eq.${currentUserId},picker_id.eq.${currentUserId}`),
        supabase.from('personal_rides').select('*').eq('driver_id', currentUserId),
        supabase.from('credits').select('*').eq('user_id', currentUserId),
        supabase.from('activity_log').select('*').eq('user_id', currentUserId),
        supabase.from('group_members').select('*, groups(*)').eq('user_id', currentUserId),
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
  getPersonalRidesStats,
  getCredits,
  getAllBadges,
  getUserBadges,
  listGroups,
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
  getRecentActivity,
  createQuote,
  listQuotes,
  getQuote,
  getQuoteByToken,
  getMyVTCProfile,
  createVTCProfile,
  updateVTCProfile,
  deleteVTCProfile,
  updateUserPhoto,
  convertPublishedToPersonal,
  requestDataExport,
  deleteAccount,
  acceptTerms,
};

export default supabaseApi;

