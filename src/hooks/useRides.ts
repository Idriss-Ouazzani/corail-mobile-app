/**
 * useRides - Custom Hook pour gérer les courses (marketplace + claimed)
 * 
 * 🎯 Ce hook centralise TOUTE la logique métier des courses :
 * - Chargement des courses
 * - Prise de course (claim)
 * - Suppression de course
 * - Complétion de course
 * - Filtrage et tri
 * 
 * 💡 Avantages :
 * - Réutilisable dans n'importe quel composant
 * - Testable isolément
 * - Réduit la complexité de App.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '../services/api';
import * as NotificationService from '../services/notifications';
import type { Ride } from '../types';

export function useRides(currentUserId: string | null, userCredits: number) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger toutes les courses (marketplace + mes courses claimed/published dont COMPLETED)
   */
  const loadRides = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des courses...');
      const [marketplace, myClaimed, myPublished] = await Promise.all([
        apiClient.getRides(),
        apiClient.getMyRides('claimed'),
        apiClient.getMyRides('published'),
      ]);
      const byId = new Map<string, Ride>();
      [...marketplace, ...myClaimed, ...myPublished].forEach((r: any) => byId.set(r.id, r as Ride));
      const merged = Array.from(byId.values());
      setRides(merged);
      console.log('✅ Courses chargées:', merged.length, '(dont mes courses terminées)');
    } catch (err: any) {
      console.error('❌ Erreur chargement courses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  /**
   * Prendre une course (claim)
   */
  const claimRide = useCallback(async (rideId: string) => {
    try {
      // Vérifier les crédits
      if (userCredits < 1) {
        Alert.alert(
          'Crédits insuffisants',
          'Vous avez besoin d\'au moins 1 crédit pour prendre une course. Publiez des courses pour gagner des crédits !',
          [{ text: 'OK' }]
        );
        return false;
      }

      const ride = rides.find(r => r.id === rideId);
      if (!ride) {
        Alert.alert('Erreur', 'Course introuvable');
        return false;
      }

      console.log('🎯 Prise de course:', rideId);
      await apiClient.claimRide(rideId);
      
      // Planifier notifications + ajout dans la cloche
      await NotificationService.scheduleRideReminder(
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
      
      await NotificationService.notifyCompleteRide(
        ride.id,
        ride.scheduled_at
      );
      
      // Recharger les courses
      await loadRides();
      
      Alert.alert(
        'Course prise !',
        `Vous avez pris la course. -1 crédit`,
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (err: any) {
      console.error('❌ Erreur prise course:', err);
      Alert.alert('Erreur', err.message || 'Impossible de prendre la course');
      return false;
    }
  }, [rides, userCredits, loadRides]);

  /**
   * Supprimer une course
   */
  const deleteRide = useCallback(async (rideId: string) => {
    try {
      console.log('🗑️ Suppression course:', rideId);
      await apiClient.deleteRide(rideId);
      
      // Supprimer localement
      setRides(prev => prev.filter(r => r.id !== rideId));
      
      Alert.alert('Succès', 'Course supprimée');
      return true;
    } catch (err: any) {
      console.error('❌ Erreur suppression course:', err);
      Alert.alert('Erreur', 'Impossible de supprimer la course');
      return false;
    }
  }, []);

  /**
   * Marquer une course comme terminée
   */
  const completeRide = useCallback(async (rideId: string) => {
    try {
      console.log('✅ Complétion course:', rideId);
      await apiClient.completeRide(rideId);
      await loadRides();
      
      Alert.alert('Succès', 'Course terminée ! L\'auteur de la course a reçu un crédit bonus.');
      return true;
    } catch (err: any) {
      console.error('❌ Erreur complétion course:', err);
      Alert.alert('Erreur', 'Impossible de terminer la course');
      return false;
    }
  }, [loadRides]);

  /**
   * Filtrer les courses par critères
   */
  const getFilteredRides = useCallback((filters: {
    visibility?: 'all' | 'public' | 'groups';
    status?: string;
    creatorId?: string;
    pickerId?: string;
  }) => {
    let filtered = [...rides];

    if (filters.visibility && filters.visibility !== 'all') {
      filtered = filtered.filter(r => {
        if (filters.visibility === 'public') return r.visibility === 'PUBLIC';
        if (filters.visibility === 'groups') return r.visibility === 'GROUP';
        return true;
      });
    }

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.creatorId) {
      filtered = filtered.filter(r => r.creator_id === filters.creatorId);
    }

    if (filters.pickerId) {
      filtered = filtered.filter(r => r.picker_id === filters.pickerId);
    }

    return filtered;
  }, [rides]);

  // Charger au montage
  useEffect(() => {
    if (currentUserId) {
      loadRides();
    }
  }, [currentUserId, loadRides]);

  // ✅ Le système Realtime est maintenant initialisé dans App.tsx
  // pour avoir accès à la modal d'incoming ride
  // On garde juste loadRides disponible pour être appelé par App.tsx

  return {
    rides,
    loading,
    error,
    loadRides,
    claimRide,
    deleteRide,
    completeRide,
    getFilteredRides,
  };
}

