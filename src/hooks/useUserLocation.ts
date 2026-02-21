/**
 * Hook pour gérer la géolocalisation de l'utilisateur
 */

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '../utils/distance';

interface UseUserLocationResult {
  location: Coordinates | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestLocation: () => Promise<void>;
}

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Demander la permission et obtenir la position au montage
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setHasPermission(false);
        setError('Permission de géolocalisation refusée');
        setLoading(false);
        return;
      }

      setHasPermission(true);

      // Obtenir la position actuelle
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Équilibre entre précision et batterie
      });

      setLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });

      console.log('📍 Position obtenue:', {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
    } catch (err: any) {
      console.error('❌ Erreur géolocalisation:', err);
      setError(err.message || 'Impossible d\'obtenir la position');
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    loading,
    error,
    hasPermission,
    requestLocation,
  };
}

