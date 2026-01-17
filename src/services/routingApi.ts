/**
 * Routing API - Service pour calculer les itinéraires et distances
 * Utilise OSRM (Open Source Routing Machine) basé sur OpenStreetMap
 */

import { logger } from './logger';

const OSRM_BASE_URL = 'https://router.project-osrm.org';

export interface RouteDetails {
  distance_km: number;
  duration_minutes: number;
  distance_meters: number;
  duration_seconds: number;
}

/**
 * Calcule la distance et la durée entre deux points
 * @param pickupLon Longitude du point de départ
 * @param pickupLat Latitude du point de départ
 * @param dropoffLon Longitude du point d'arrivée
 * @param dropoffLat Latitude du point d'arrivée
 * @returns Détails de l'itinéraire (distance et durée)
 */
export async function calculateRoute(
  pickupLon: number,
  pickupLat: number,
  dropoffLon: number,
  dropoffLat: number
): Promise<RouteDetails | null> {
  try {
    // Format : lon,lat;lon,lat (OSRM utilise lon,lat et non lat,lon)
    const coordinates = `${pickupLon},${pickupLat};${dropoffLon},${dropoffLat}`;
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=false&steps=false`;

    logger.debug('[OSRM] Calcul itinéraire', {
      pickup: { lat: pickupLat, lon: pickupLon },
      dropoff: { lat: dropoffLat, lon: dropoffLon },
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Corail-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      logger.error('[OSRM] Aucun itinéraire trouvé', { code: data.code });
      return null;
    }

    const route = data.routes[0];
    const distanceMeters = route.distance; // en mètres
    const durationSeconds = route.duration; // en secondes

    const result: RouteDetails = {
      distance_meters: Math.round(distanceMeters),
      duration_seconds: Math.round(durationSeconds),
      distance_km: Math.round(distanceMeters / 1000 * 10) / 10, // Arrondi à 1 décimale
      duration_minutes: Math.round(durationSeconds / 60),
    };

    logger.debug('[OSRM] Itinéraire calculé', result);

    return result;
  } catch (error: any) {
    logger.error('[OSRM] Erreur calcul itinéraire', {
      error: error.message,
      pickup: { lat: pickupLat, lon: pickupLon },
      dropoff: { lat: dropoffLat, lon: dropoffLon },
    });
    return null;
  }
}

/**
 * Estime le prix basé sur la distance
 * Formule simple : prix de base + prix au km
 * @param distanceKm Distance en kilomètres
 * @param basePrice Prix de base (défaut: 5€)
 * @param pricePerKm Prix par kilomètre (défaut: 1.5€)
 * @returns Prix estimé en euros
 */
export function estimatePrice(
  distanceKm: number,
  basePrice: number = 5,
  pricePerKm: number = 1.5
): number {
  const estimatedPrice = basePrice + (distanceKm * pricePerKm);
  // Arrondir au 0.50€ près
  return Math.round(estimatedPrice * 2) / 2;
}



