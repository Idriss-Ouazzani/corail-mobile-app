/**
 * Badge Service - Attribution automatique des badges selon les conditions
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// HELPER: Attribuer un badge à un utilisateur (si pas déjà attribué)
// ============================================================================

async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    // Vérifier si l'utilisateur a déjà ce badge
    const { data: existing, error: checkError } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single();

    if (existing) {
      console.log(`🏆 Badge ${badgeId} déjà attribué`);
      return false;
    }

    // Attribuer le badge
    const { error: insertError } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error(`❌ Erreur attribution badge ${badgeId}:`, insertError);
      return false;
    }

    console.log(`✨ Nouveau badge attribué: ${badgeId}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur awardBadge:', error);
    return false;
  }
}

// ============================================================================
// VÉRIFICATIONS DES CONDITIONS DES BADGES
// ============================================================================

/**
 * Vérifier et attribuer le badge "early-adopter" (Pionnier)
 * Condition: Utilisateur rejoint avant janvier 2026
 */
async function checkEarlyAdopterBadge(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.log('⚠️ Utilisateur non trouvé pour early-adopter');
      return false;
    }

    const userCreatedAt = new Date(user.created_at);
    const cutoffDate = new Date('2026-01-01T00:00:00Z');

    if (userCreatedAt < cutoffDate) {
      console.log('✅ Éligible au badge early-adopter');
      return await awardBadge(userId, 'early-adopter');
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur checkEarlyAdopterBadge:', error);
    return false;
  }
}

/**
 * Vérifier et attribuer le badge "first-ride" (Première course)
 * Condition: 1 course publiée
 */
async function checkFirstRideBadge(userId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId);

    if (error) {
      console.error('❌ Erreur comptage courses:', error);
      return false;
    }

    if ((count ?? 0) >= 1) {
      console.log('✅ Éligible au badge first-ride');
      return await awardBadge(userId, 'first-ride');
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur checkFirstRideBadge:', error);
    return false;
  }
}

/**
 * Vérifier et attribuer le badge "ten-rides" (10 courses)
 * Condition: 10 courses publiées
 */
async function checkTenRidesBadge(userId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId);

    if (error) {
      console.error('❌ Erreur comptage courses:', error);
      return false;
    }

    if ((count ?? 0) >= 10) {
      console.log('✅ Éligible au badge ten-rides');
      return await awardBadge(userId, 'ten-rides');
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur checkTenRidesBadge:', error);
    return false;
  }
}

/**
 * Vérifier et attribuer le badge "fifty-rides" (50 courses)
 * Condition: 50 courses publiées
 */
async function checkFiftyRidesBadge(userId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId);

    if (error) {
      console.error('❌ Erreur comptage courses:', error);
      return false;
    }

    if ((count ?? 0) >= 50) {
      console.log('✅ Éligible au badge fifty-rides');
      return await awardBadge(userId, 'fifty-rides');
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur checkFiftyRidesBadge:', error);
    return false;
  }
}

/**
 * Vérifier et attribuer le badge "hundred-rides" (100 courses)
 * Condition: 100 courses publiées
 */
async function checkHundredRidesBadge(userId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId);

    if (error) {
      console.error('❌ Erreur comptage courses:', error);
      return false;
    }

    if ((count ?? 0) >= 100) {
      console.log('✅ Éligible au badge hundred-rides');
      return await awardBadge(userId, 'hundred-rides');
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur checkHundredRidesBadge:', error);
    return false;
  }
}

/**
 * Vérifier et attribuer le badge "five-star-driver" (Conducteur 5 étoiles)
 * Condition: Note moyenne >= 5.0
 */
async function checkFiveStarDriverBadge(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('rating, total_reviews')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return false;
    }

    // Vérifier si le conducteur a au moins 5 avis et une note de 5.0
    if (user.total_reviews >= 5 && user.rating === 5.0) {
      console.log('✅ Éligible au badge five-star-driver');
      return await awardBadge(userId, 'five-star-driver');
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur checkFiveStarDriverBadge:', error);
    return false;
  }
}

/**
 * Vérifier et attribuer le badge "night-owl" (Noctambule)
 * Condition: 20 courses de nuit (22h-6h)
 */
async function checkNightOwlBadge(userId: string): Promise<boolean> {
  try {
    const { data: rides, error } = await supabase
      .from('rides')
      .select('scheduled_at')
      .eq('creator_id', userId);

    if (error || !rides) {
      return false;
    }

    // Compter les courses de nuit (22h-6h)
    const nightRides = rides.filter((ride) => {
      const hour = new Date(ride.scheduled_at).getHours();
      return hour >= 22 || hour < 6;
    });

    if (nightRides.length >= 20) {
      console.log('✅ Éligible au badge night-owl');
      return await awardBadge(userId, 'night-owl');
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur checkNightOwlBadge:', error);
    return false;
  }
}

/**
 * Vérifier et attribuer le badge "weekend-warrior" (Champion du week-end)
 * Condition: 30 courses le week-end
 */
async function checkWeekendWarriorBadge(userId: string): Promise<boolean> {
  try {
    const { data: rides, error } = await supabase
      .from('rides')
      .select('scheduled_at')
      .eq('creator_id', userId);

    if (error || !rides) {
      return false;
    }

    // Compter les courses du week-end (samedi et dimanche)
    const weekendRides = rides.filter((ride) => {
      const day = new Date(ride.scheduled_at).getDay();
      return day === 0 || day === 6; // 0 = Dimanche, 6 = Samedi
    });

    if (weekendRides.length >= 30) {
      console.log('✅ Éligible au badge weekend-warrior');
      return await awardBadge(userId, 'weekend-warrior');
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur checkWeekendWarriorBadge:', error);
    return false;
  }
}

/**
 * Vérifier et attribuer le badge "sharing-is-caring" (Entraide)
 * Condition: Avoir partagé 5 courses avec d'autres chauffeurs
 */
async function checkSharingIsCaringBadge(userId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .eq('visibility', 'GROUP');

    if (error) {
      return false;
    }

    if ((count ?? 0) >= 5) {
      console.log('✅ Éligible au badge sharing-is-caring');
      return await awardBadge(userId, 'sharing-is-caring');
    }

    return false;
  } catch (error) {
    console.error('❌ Erreur checkSharingIsCaringBadge:', error);
    return false;
  }
}

// ============================================================================
// FONCTION PRINCIPALE: Vérifier TOUS les badges pour un utilisateur
// ============================================================================

/**
 * Vérifie toutes les conditions de badges et attribue les badges manquants
 * À appeler après:
 * - Login de l'utilisateur
 * - Création d'une course
 * - Complétion d'une course
 * - Mise à jour de la note
 */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  console.log('🏆 Vérification des badges pour:', userId);

  try {
    // Vérifier chaque badge en parallèle
    await Promise.all([
      checkEarlyAdopterBadge(userId),
      checkFirstRideBadge(userId),
      checkTenRidesBadge(userId),
      checkFiftyRidesBadge(userId),
      checkHundredRidesBadge(userId),
      checkFiveStarDriverBadge(userId),
      checkNightOwlBadge(userId),
      checkWeekendWarriorBadge(userId),
      checkSharingIsCaringBadge(userId),
    ]);

    console.log('✅ Vérification des badges terminée');
  } catch (error) {
    console.error('❌ Erreur checkAndAwardBadges:', error);
  }
}

export default { checkAndAwardBadges };

