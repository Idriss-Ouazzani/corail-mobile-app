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
import { isSameCorailUser } from '../utils/isSameCorailUser';
import { getQuoteUrl } from '../constants/urls';

interface UseRideActionsProps {
  currentUserId: string;
  publicUsersRowId?: string | null;
  userName: string;
  userCredits: number;
  verificationStatus: string | null;
  /** Profil chauffeur vérifié (documents) – accès marketplace / publication réseau */
  isDriverVerified?: boolean;
  loadRides: () => Promise<void>;
  loadPersonalRides: () => Promise<void>;
  loadCredits: () => Promise<void>;
  /** Après publication marketplace (public / groupe) : ex. rafraîchir pastille cloche */
  onAfterNetworkRideCreated?: () => void | Promise<void>;
}

export function useRideActions(props: UseRideActionsProps) {
  const {
    currentUserId,
    publicUsersRowId = null,
    userName,
    userCredits,
    verificationStatus,
    isDriverVerified = false,
    loadRides,
    loadPersonalRides,
    loadCredits,
    onAfterNetworkRideCreated,
  } = props;

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Supprimer une course (marketplace).
   * ride optionnel : si fourni avec picker_id, envoie une push au picker (course annulée).
   */
  const handleDeleteRide = useCallback(async (
    rideId: string,
    visibility: string,
    ride?: { picker_id?: string; pickup_address?: string; dropoff_address?: string }
  ) => {
    try {
      console.log('🗑️ Suppression de la course:', rideId);
      
      // Supprimer de la base de données (remboursement automatique si PUBLISHED)
      const result = await apiClient.deleteRide(rideId);
      console.log('✅ Course supprimée avec succès', result);

      // Notifier le picker (course annulée par le créateur)
      if (ride?.picker_id) {
        try {
          await NotificationService.notifyRideCancelledToPicker(
            ride.picker_id,
            ride.pickup_address,
            ride.dropoff_address
          );
        } catch (notifErr) {
          console.warn('⚠️ Notification course annulée non envoyée:', notifErr);
        }
      }
      
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
   * Terminer une course (marquer comme complétée).
   * rating : étoiles (1-5) + commentaire optionnel, envoyé à l'auteur (notification si chauffeur Corail).
   */
  const handleCompleteRide = useCallback(async (
    rideId: string,
    priceCents: number,
    distanceKm?: number,
    durationMinutes?: number,
    rating?: { stars: number; comment?: string | null }
  ) => {
    try {
      console.log('✅ Terminer la course:', rideId, rating ? `avec note ${rating.stars}` : '');
      
      await apiClient.completeRide(rideId, rating);
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
  const handleClaimRide = useCallback(async (ride: any, proposedPriceCents?: number) => {
    try {
      // 🔐 Profil chauffeur vérifié requis pour prendre une course sur le réseau
      if (!isDriverVerified) {
        haptic.warning();
        toast.warning(
          'Profil vérifié requis',
          'Sans profil vérifié, vous ne pouvez pas prendre de course publiée par un autre chauffeur.'
        );
        return null;
      }

      // 🪸 Crédits : annonces publiques = -1, groupe ou demande client = 0
      const isClientRide = ride.source === 'client';
      const isGroupRide = (ride.visibility || 'PUBLIC') === 'GROUP';
      const costsCredit = !isClientRide && !isGroupRide;
      if (costsCredit && userCredits < 1) {
        haptic.warning();
        toast.insufficientCredits();
        return null;
      }

      const needsQuotePrice = isClientRide && ((ride.price_cents ?? 0) <= 0);
      if (needsQuotePrice && (!proposedPriceCents || proposedPriceCents < 100)) {
        haptic.warning();
        toast.warning('Montant requis', 'Saisissez un montant puis envoyez le devis au client.');
        return null;
      }

      // Prendre la course
      haptic.heavy();
      const claimStartTime = Date.now();
      const claimedRide = await apiClient.claimRide(ride.id);
      console.log('✅ Course réclamée avec succès');
      haptic.success();
      
      const creditsSpent = costsCredit ? 1 : 0;
      try {
        await analytics.trackRideClaimed({
          rideId: ride.id,
          visibility: ride.visibility || 'PUBLIC',
          priceCents: ride.price_cents,
          creditsSpent,
          timeToClaimSeconds: Math.floor((claimStartTime - new Date(ride.created_at).getTime()) / 1000),
        });
        if (creditsSpent > 0) {
          await analytics.trackCreditSpent({
            amount: 1,
            reason: 'ride_claimed',
            newBalance: userCredits - 1,
          });
        }
      } catch (analyticsError) {
        console.warn('⚠️ Analytics error (non-blocking):', analyticsError);
      }
      
      if (isClientRide) {
        const finalPrice = proposedPriceCents ?? (ride.price_cents ?? 0);
        if (finalPrice < 100) {
          throw new Error('Montant invalide pour envoyer le devis');
        }

        await apiClient.updateRidePriceAfterClaim(ride.id, finalPrice);

        const sched = new Date(ride.scheduled_at);
        const scheduledDate = sched.toISOString().split('T')[0];
        const scheduledTime = `${String(sched.getHours()).padStart(2, '0')}:${String(sched.getMinutes()).padStart(2, '0')}:00`;

        const quote = await apiClient.createQuote({
          client_name: ride.client_name?.trim?.() || 'Client',
          client_phone: ride.client_phone || undefined,
          client_email: ride.client_email || undefined,
          pickup_address: ride.pickup_address,
          dropoff_address: ride.dropoff_address,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          price_cents: Math.round(finalPrice),
          notes: ride.notes ? `${ride.notes}\n(Devis annonce client)` : 'Devis annonce client',
          source_ride_id: ride.id,
        });

        if (ride.client_email && quote?.token) {
          await apiClient.sendQuoteEmail({
            clientEmail: ride.client_email,
            clientName: ride.client_name?.trim?.() || 'Client',
            quoteUrl: getQuoteUrl(quote.token),
            price: (finalPrice / 100).toFixed(2),
            date: sched.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: sched.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            pickupAddress: ride.pickup_address,
            dropoffAddress: ride.dropoff_address,
            driverName: userName || undefined,
          });
        }
      } else if (claimedRide.creator_id && !isSameCorailUser(claimedRide.creator_id, currentUserId, publicUsersRowId)) {
        // 🔔 Notifier le créateur que sa course a été prise (PUSH)
        await NotificationService.notifyRideClaimed(
          claimedRide.creator_id,
          ride.pickup_address,
          userName
        );
      }
      
      // 🔔 Rappels 1 h avant, 1 min avant (démarrage), puis “terminer la course”
      await NotificationService.scheduleRideReminder(
        ride.id,
        ride.scheduled_at,
        ride.pickup_address,
        ride.dropoff_address
      );
      await NotificationService.scheduleRideImminentReminder(
        ride.id,
        ride.scheduled_at,
        ride.pickup_address,
        ride.dropoff_address
      );
      await apiClient.insertInAppNotification({
        type: 'ride_reminder',
        title: 'Course dans 1 heure',
        body: `${ride.pickup_address} → ${ride.dropoff_address}`,
        target_ride_id: ride.id,
      });
      
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
      
      if (isClientRide) {
        toast.success('Devis envoyé', 'La course apparaît dans Mes courses > Devis en attente.');
      } else {
        toast.rideClaimed();
      }
      if (creditsSpent > 0) toast.creditSpent();

      return updatedRide;
    } catch (error: any) {
      logger.error('Erreur réclamation course', error, {
        action: 'claimRide',
        rideId: ride?.id,
        userCredits
      });
      toast.error('Erreur', error.message || 'Impossible de réclamer la course');
      throw error;
    }
  }, [
    userCredits,
    isDriverVerified,
    currentUserId,
    publicUsersRowId,
    userName,
    loadCredits,
    loadRides,
    loadPersonalRides,
  ]);

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
        
        await NotificationService.scheduleRideReminder(
          response.id,
          ride.scheduled_at,
          ride.pickup_address,
          ride.dropoff_address
        );
        await NotificationService.scheduleRideImminentReminder(
          response.id,
          ride.scheduled_at,
          ride.pickup_address,
          ride.dropoff_address
        );
        await apiClient.insertInAppNotification({
          type: 'ride_reminder',
          title: 'Course dans 1 heure',
          body: `${ride.pickup_address} → ${ride.dropoff_address}`,
          target_ride_id: response.id,
        });
        
        // Recharger les courses personnelles
        await loadPersonalRides();
        
        toast.rideCreated();
      } else {
        // Réseau (public ou groupe) : même règle que la prise de course — profil chauffeur validé obligatoire.
        if (!isDriverVerified) {
          haptic.warning();
          toast.warning(
            'Profil vérifié requis',
            'Sans profil vérifié, vous ne pouvez publier que des courses personnelles (saisies par vous).'
          );
          return;
        }
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

        const isPublicRide = ride.visibility === 'PUBLIC';
        
        // 📊 Analytics: Track ride published (non-blocking) — +1 crédit côté serveur uniquement pour PUBLIC
        try {
          await analytics.trackRidePublished({
            rideId: response.id,
            visibility: ride.visibility,
            vehicleType: ride.vehicle_type,
            priceCents: ride.price_cents,
            distanceKm: ride.distance_km,
            creditsEarned: isPublicRide ? 1 : 0,
          });
          
          if (isPublicRide) {
            await analytics.trackCreditEarned({
              amount: 1,
              reason: 'ride_published',
              newBalance: userCredits + 1,
            });
          }
        } catch (analyticsError) {
          console.warn('⚠️ Analytics error (non-blocking):', analyticsError);
        }
        
        // Recharger les données (rides + crédits)
        await loadRides();
        await loadCredits();
        console.log('✅ Données rechargées - course et crédits mis à jour');

        try {
          await Promise.resolve(onAfterNetworkRideCreated?.());
        } catch (_) {}
        
        await NotificationService.scheduleRideReminder(
          response.id,
          ride.scheduled_at,
          ride.pickup_address,
          ride.dropoff_address
        );
        await NotificationService.scheduleRideImminentReminder(
          response.id,
          ride.scheduled_at,
          ride.pickup_address,
          ride.dropoff_address
        );
        await apiClient.insertInAppNotification({
          type: 'ride_reminder',
          title: 'Course dans 1 heure',
          body: `${ride.pickup_address} → ${ride.dropoff_address}`,
          target_ride_id: response.id,
        });
        
        toast.rideCreated();
        if (isPublicRide) {
          toast.creditEarned();
        }
      }
    } catch (error: any) {
      haptic.error();
      logger.error('Erreur création course', error, { 
        action: 'createRide',
      });
      toast.error('Erreur', error.message || 'Impossible de créer la course');
      throw error;
    }
  }, [userCredits, isDriverVerified, loadRides, loadPersonalRides, loadCredits, onAfterNetworkRideCreated]);

  return {
    handleDeleteRide,
    handleCompleteRide,
    handleClaimRide,
    handleCreateRide,
  };
}

