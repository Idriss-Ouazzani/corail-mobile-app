/**
 * useRideActions - Logique métier pour les actions sur les courses
 * Extrait de App.tsx pour améliorer la maintenabilité
 */

import { useCallback } from 'react';
import { apiClient } from '../services/api';
import * as NotificationService from '../services/notifications';
import { haptic } from '../services/haptic';
import { toast } from '../services/toast';
import { logger } from '../services/logger';
import analytics from '../services/analytics';

interface UseRideActionsProps {
  currentUserId: string;
  userName: string; // For notifications
  userCredits: number;
  verificationStatus: string | null; // Verification status for marketplace access
  loadRides: () => Promise<void>;
  loadPersonalRides: () => Promise<void>;
  loadCredits: () => Promise<void>;
}

/**
 * Hook custom pour gérer toutes les actions sur les courses
 * (create, claim, delete, complete)
 */
export function useRideActions(props: UseRideActionsProps) {
  const {
    currentUserId,
    userName,
    userCredits,
    verificationStatus,
    loadRides,
    loadPersonalRides,
    loadCredits,
  } = props;

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Supprimer une course (marketplace)
   */
  const handleDeleteRide = useCallback(async (rideId: string, visibility: string) => {
    try {
      console.log('🗑️ Suppression de la course:', rideId);
      
      // Supprimer de la base de données (remboursement automatique si PUBLISHED)
      const result = await apiClient.deleteRide(rideId);
      console.log('✅ Course supprimée avec succès', result);
      
      // 📊 Analytics: Track ride deleted (non-blocking)
      try {
        await analytics.trackRideDeleted({
          rideId: rideId,
          visibility: visibility,
          reason: 'user_action',
        });
      } catch (analyticsError) {
        console.warn('⚠️ Analytics error (non-blocking):', analyticsError);
      }
      
      // Petit délai pour laisser l'Edge Function terminer
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recharger les données (rides + crédits si remboursé)
      await loadRides();
      await loadCredits();
      console.log('✅ Rides et crédits rechargés après suppression');
      
      toast.rideDeleted();
    } catch (error: any) {
      logger.error('Erreur suppression course', error, {
        action: 'deleteRide',
        rideId: rideId
      });
      toast.error('Erreur', error.message || 'Impossible de supprimer la course');
      throw error; // Propager l'erreur pour que le composant puisse gérer
    }
  }, [loadRides, loadCredits]);

  /**
   * Terminer une course (marquer comme complétée)
   */
  const handleCompleteRide = useCallback(async (rideId: string, priceCents: number, distanceKm?: number, durationMinutes?: number) => {
    try {
      console.log('✅ Terminer la course:', rideId);
      
      // Terminer la course
      await apiClient.completeRide(rideId);
      console.log('✅ Course terminée avec succès');
      
      // 📊 Analytics: Track ride completed (non-blocking)
      try {
        await analytics.trackRideCompleted({
          rideId: rideId,
          priceCents: priceCents,
          distanceKm: distanceKm,
          durationMinutes: durationMinutes,
          bonusEarned: 1,
        });
        
        await analytics.trackCreditEarned({
          amount: 1,
          reason: 'ride_completed',
          newBalance: userCredits + 1,
        });
      } catch (analyticsError) {
        console.warn('⚠️ Analytics error (non-blocking):', analyticsError);
      }
      
      // Recharger les crédits et les rides
      await loadCredits();
      await loadRides();
      await loadPersonalRides();
      
      toast.success('Course terminée !', 'Le créateur a reçu un crédit bonus');
    } catch (error: any) {
      console.error('❌ Erreur terminer course:', error);
      toast.error('Erreur', error.message || 'Impossible de terminer la course');
      throw error;
    }
  }, [userCredits, loadCredits, loadRides, loadPersonalRides]);

  /**
   * Réclamer une course (claim)
   */
  const handleClaimRide = useCallback(async (ride: any) => {
    try {
      // 🔐 Vérifier le statut de vérification avant de prendre une course
      if (verificationStatus !== 'VERIFIED') {
        haptic.warning();
        toast.warning(
          '⏳ Vérification en cours',
          'Votre profil doit être vérifié pour prendre des courses sur la marketplace'
        );
        return null;
      }

      // 🪸 Vérifier les crédits avant de prendre la course
      if (userCredits < 1) {
        haptic.warning();
        toast.insufficientCredits();
        return null; // Retourner null pour indiquer qu'on n'a pas pu claim
      }

      // Prendre la course
      haptic.heavy();
      const claimStartTime = Date.now();
      const claimedRide = await apiClient.claimRide(ride.id);
      console.log('✅ Course réclamée avec succès');
      haptic.success();
      
      // 📊 Analytics: Track ride claimed (non-blocking)
      try {
        await analytics.trackRideClaimed({
          rideId: ride.id,
          visibility: ride.visibility || 'PUBLIC',
          priceCents: ride.price_cents,
          creditsSpent: 1,
          timeToClaimSeconds: Math.floor((claimStartTime - new Date(ride.created_at).getTime()) / 1000),
        });
        
        await analytics.trackCreditSpent({
          amount: 1,
          reason: 'ride_claimed',
          newBalance: userCredits - 1,
        });
      } catch (analyticsError) {
        console.warn('⚠️ Analytics error (non-blocking):', analyticsError);
      }
      
      // 🔔 Notifier le créateur que sa course a été prise (PUSH)
      if (claimedRide.creator_id && claimedRide.creator_id !== currentUserId) {
        await NotificationService.notifyRideClaimed(
          claimedRide.creator_id,
          ride.pickup_address,
          userName
        );
      }
      
      // 🔔 Planifier notification de rappel 1h avant
      await NotificationService.scheduleRideReminder(
        ride.id,
        ride.scheduled_at,
        ride.pickup_address,
        ride.dropoff_address
      );
      
      // 🔔 Planifier rappel pour terminer la course
      await NotificationService.notifyCompleteRide(
        ride.id,
        ride.scheduled_at
      );
      
      // Délai pour laisser l'Edge Function terminer ET la DB se propager
      console.log('⏳ Attente 1500ms avant rechargement...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Recharger les crédits et les rides (FORCE REFRESH)
      console.log('🔄 [handleClaimRide] Rechargement crédits...');
      await loadCredits();
      console.log('🔄 [handleClaimRide] Rechargement rides...');
      await loadRides();
      await loadPersonalRides();
      console.log('✅ [handleClaimRide] Tout rechargé après claim');
      
      // Recharger la course spécifique pour voir les infos client mises à jour
      const updatedRide = await apiClient.getRide(ride.id);
      
      toast.rideClaimed();
      toast.creditSpent();
      
      return updatedRide; // Retourner la course mise à jour
    } catch (error: any) {
      logger.error('Erreur réclamation course', error, {
        action: 'claimRide',
        rideId: ride?.id,
        userCredits
      });
      toast.error('Erreur', error.message || 'Impossible de réclamer la course');
      throw error;
    }
  }, [userCredits, loadCredits, loadRides, loadPersonalRides]);

  /**
   * Créer une course (marketplace ou personnelle)
   */
  const handleCreateRide = useCallback(async (ride: any) => {
    try {
      haptic.medium();
      console.log('📤 Envoi de la course au backend:', ride);
      
      // 🔀 Si visibility === 'PERSONAL', créer une personal_ride
      if (ride.visibility === 'PERSONAL') {
        const response = await apiClient.createPersonalRide({
          source: 'OTHER',
          pickup_address: ride.pickup_address,
          dropoff_address: ride.dropoff_address,
          scheduled_at: ride.scheduled_at,
          price_cents: ride.price_cents,
          distance_km: ride.distance_km,
          duration_minutes: ride.duration_minutes,
          client_name: ride.client_name,
          client_phone: ride.client_phone,
          client_email: ride.client_email,
          quote_id: ride.quote_id,
          quote_token: ride.quote_token,
          quote_status: ride.quote_status,
          notes: ride.notes,
          status: 'SCHEDULED',
        });
        
        haptic.success();
        console.log('✅ Course personnelle créée avec succès:', response);
        
        // 🔄 Recharger la liste des courses personnelles
        await loadPersonalRides();
        
        // 📊 Analytics: Track personal ride created (non-blocking)
        try {
          await analytics.trackPersonalRideCreated({
            rideId: response.id,
            source: 'OTHER',
            priceCents: ride.price_cents,
            hasQuote: !!ride.quote_id,
          });
        } catch (analyticsError) {
          console.warn('⚠️ Analytics error (non-blocking):', analyticsError);
        }
        
        // 🔔 Planifier notification de rappel 1h avant
        await NotificationService.scheduleRideReminder(
          response.id,
          ride.scheduled_at,
          ride.pickup_address,
          ride.dropoff_address
        );
        
        // Recharger les courses personnelles
        await loadPersonalRides();
        
        toast.rideCreated();
      } else {
        // Sinon, créer une course normale (marketplace)
        const response = await apiClient.createRide({
          pickup_address: ride.pickup_address,
          dropoff_address: ride.dropoff_address,
          scheduled_at: ride.scheduled_at,
          price_cents: ride.price_cents,
          visibility: ride.visibility,
          vehicle_type: ride.vehicle_type,
          distance_km: ride.distance_km,
          duration_minutes: ride.duration_minutes,
          client_name: ride.client_name,
          client_phone: ride.client_phone,
          client_email: ride.client_email,
          group_id: ride.group_ids && ride.group_ids.length > 0 ? ride.group_ids[0] : undefined,
          ...(ride.notes ? { notes: ride.notes } : {}),
        });
        
        console.log('✅ Course marketplace créée avec succès:', response);
        
        // 📊 Analytics: Track ride published (non-blocking)
        try {
          await analytics.trackRidePublished({
            rideId: response.id,
            visibility: ride.visibility,
            vehicleType: ride.vehicle_type,
            priceCents: ride.price_cents,
            distanceKm: ride.distance_km,
            creditsEarned: 1,
          });
          
          await analytics.trackCreditEarned({
            amount: 1,
            reason: 'ride_published',
            newBalance: userCredits + 1,
          });
        } catch (analyticsError) {
          console.warn('⚠️ Analytics error (non-blocking):', analyticsError);
        }
        
        // Recharger les données (rides + crédits)
        await loadRides();
        await loadCredits();
        console.log('✅ Données rechargées - course et crédits mis à jour');
        
        // 🔔 Planifier notification de rappel 1h avant (pour le créateur aussi)
        await NotificationService.scheduleRideReminder(
          response.id,
          ride.scheduled_at,
          ride.pickup_address,
          ride.dropoff_address
        );
        
        toast.rideCreated();
        toast.creditEarned();
      }
    } catch (error: any) {
      haptic.error();
      logger.error('Erreur création course', error, { 
        action: 'createRide',
      });
      toast.error('Erreur', error.message || 'Impossible de créer la course');
      throw error;
    }
  }, [userCredits, loadRides, loadPersonalRides, loadCredits]);

  return {
    handleDeleteRide,
    handleCompleteRide,
    handleClaimRide,
    handleCreateRide,
  };
}

