/**
 * usePersonalRides - Custom Hook pour gérer les courses personnelles
 * 
 * 🎯 Gère les courses privées (non publiées sur le marketplace)
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '../services/api';

interface PersonalRide {
  id: string;
  driver_id: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  price_cents: number;
  status: string;
  quote_id?: string;
  quote_token?: string;
  quote_status?: string;
  [key: string]: any;
}

export function usePersonalRides(currentUserId: string | null) {
  const [personalRides, setPersonalRides] = useState<PersonalRide[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPersonalRides = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      console.log('🔄 Chargement courses personnelles...');
      const data = await apiClient.listPersonalRides({ limit: 100 });
      setPersonalRides(data);
      console.log('✅ Courses perso chargées:', data.length);
    } catch (err: any) {
      console.error('❌ Erreur chargement courses perso:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const createPersonalRide = useCallback(async (rideData: any) => {
    try {
      console.log('📝 Création course personnelle...');
      await apiClient.createPersonalRide(rideData);
      await loadPersonalRides();
      return true;
    } catch (err: any) {
      console.error('❌ Erreur création course perso:', err);
      Alert.alert('Erreur', 'Impossible de créer la course');
      return false;
    }
  }, [loadPersonalRides]);

  const publishPersonalRide = useCallback(async (
    rideId: string, 
    options: { visibility: string; vehicle_type: string }
  ) => {
    try {
      console.log('📤 Publication course personnelle:', rideId);
      await apiClient.publishPersonalRide(rideId, options);
      await loadPersonalRides();
      
      Alert.alert('Succès', 'Course publiée ! +1 crédit');
      return true;
    } catch (err: any) {
      console.error('❌ Erreur publication:', err);
      Alert.alert('Erreur', 'Impossible de publier la course');
      return false;
    }
  }, [loadPersonalRides]);

  const deletePersonalRide = useCallback(async (rideId: string) => {
    try {
      console.log('🗑️ Suppression course perso:', rideId);
      await apiClient.deletePersonalRide(rideId);
      setPersonalRides(prev => prev.filter(r => r.id !== rideId));
      return true;
    } catch (err: any) {
      console.error('❌ Erreur suppression:', err);
      Alert.alert('Erreur', 'Impossible de supprimer la course');
      return false;
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadPersonalRides();
    }
  }, [currentUserId, loadPersonalRides]);

  return {
    personalRides,
    loading,
    loadPersonalRides,
    createPersonalRide,
    publishPersonalRide,
    deletePersonalRide,
  };
}

