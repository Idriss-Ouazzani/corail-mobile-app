/**
 * Google Maps API Service
 * 
 * Gère les appels à Google Maps API (Directions + Static Maps)
 * 
 * Configuration:
 * 1. Créer une clé API sur https://console.cloud.google.com/
 * 2. Activer les APIs :
 *    - Directions API
 *    - Maps Static API
 * 3. Remplacer GOOGLE_MAPS_API_KEY ci-dessous
 */

import { logger } from './logger';

// ⚠️ IMPORTANT: Remplacer par votre clé API Google Maps
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

export interface RouteInfo {
  distance: string; // "12.5 km"
  duration: string; // "18 min"
  distanceMeters: number; // 12500
  durationSeconds: number; // 1080
}

/**
 * Calcule l'itinéraire entre deux adresses avec Google Directions API
 */
export async function calculateRoute(
  origin: string,
  destination: string
): Promise<RouteInfo | null> {
  try {
    const originEncoded = encodeURIComponent(origin);
    const destinationEncoded = encodeURIComponent(destination);
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originEncoded}&destination=${destinationEncoded}&mode=driving&language=fr&key=${GOOGLE_MAPS_API_KEY}`;
    
    logger.debug('[MapsAPI] Calculating route', { origin, destination });
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0].legs[0];
      
      const routeInfo: RouteInfo = {
        distance: route.distance.text,
        duration: route.duration.text,
        distanceMeters: route.distance.value,
        durationSeconds: route.duration.value,
      };
      
      logger.info('[MapsAPI] Route calculated successfully', routeInfo);
      return routeInfo;
    } else {
      logger.warn('[MapsAPI] No route found', { status: data.status });
      return null;
    }
  } catch (error) {
    logger.error('[MapsAPI] Error calculating route', error, { origin, destination });
    return null;
  }
}

/**
 * Génère l'URL d'une carte statique avec itinéraire
 * 
 * @param origin - Adresse de départ
 * @param destination - Adresse d'arrivée
 * @param width - Largeur de l'image (défaut: 600)
 * @param height - Hauteur de l'image (défaut: 300)
 */
export function getStaticMapUrl(
  origin: string,
  destination: string,
  width: number = 600,
  height: number = 300
): string {
  const originEncoded = encodeURIComponent(origin);
  const destinationEncoded = encodeURIComponent(destination);
  
  // Markers: A = départ (vert), B = arrivée (rouge)
  const markers = [
    `markers=color:green%7Clabel:A%7C${originEncoded}`,
    `markers=color:red%7Clabel:B%7C${destinationEncoded}`,
  ].join('&');
  
  // Path entre les deux points (bleu)
  const path = `path=color:0x0ea5e9ff%7Cweight:4%7C${originEncoded}%7C${destinationEncoded}`;
  
  const url = `https://maps.googleapis.com/maps/api/staticmap?size=${width}x${height}&${markers}&${path}&key=${GOOGLE_MAPS_API_KEY}`;
  
  logger.debug('[MapsAPI] Generated static map URL', { origin, destination, width, height });
  
  return url;
}

/**
 * Vérifie si une clé API est configurée
 */
export function isApiKeyConfigured(): boolean {
  return GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE';
}

/**
 * Formate la distance (en mètres) de manière lisible
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formate la durée (en secondes) de manière lisible
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }
  return `${minutes} min`;
}



