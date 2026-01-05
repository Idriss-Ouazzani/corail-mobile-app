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
import NotificationService from '../services/notifications';

interface Ride {
  id: string;
  creator_id: string;
  picker_id?: string;
  status: string;
  visibility: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  price_cents: number;
  distance_km?: number;
  duration_minutes?: number;
  vehicle_type?: string;
  [key: string]: any;
}

export function useRides(currentUserId: string | null, userCredits: number) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger toutes les courses
   */
  const loadRides = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des courses...');
      const data = await apiClient.getRides();
      setRides(data);
      console.log('✅ Courses chargées:', data.length);
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
      
      // Planifier notifications
      await NotificationService.scheduleRideReminder(
        ride.id,
        ride.scheduled_at,
        ride.pickup_address,
        ride.dropoff_address
      );
      
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
      
      Alert.alert('Succès', 'Course terminée ! +1 crédit');
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

