/**
 * Calcul de distance géographique (formule de Haversine)
 * 
 * Calcule la distance "à vol d'oiseau" entre deux points GPS
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Convertit des degrés en radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcule la distance entre deux coordonnées GPS (en kilomètres)
 * Utilise la formule de Haversine
 * 
 * @param point1 - Premier point {lat, lon}
 * @param point2 - Deuxième point {lat, lon}
 * @returns Distance en kilomètres
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Rayon de la Terre en kilomètres
  
  const lat1 = toRadians(point1.lat);
  const lat2 = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLon = toRadians(point2.lon - point1.lon);
  
  const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
}

/**
 * Formate une distance pour l'affichage
 * 
 * @param distanceKm - Distance en kilomètres
 * @returns Distance formatée (ex: "12.5 km", "< 1 km")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return '< 1 km';
  }
  
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Extrait les coordonnées d'une course (pickup)
 * Fallback sur des coordonnées par défaut si non disponibles
 * 
 * @param ride - Course avec coordonnées
 * @returns Coordonnées {lat, lon} ou null si indisponibles
 */
export function extractRideCoordinates(ride: any): Coordinates | null {
  // Priorité 1 : Coordonnées du pickup
  if (ride.pickup_lat && ride.pickup_lon) {
    return {
      lat: ride.pickup_lat,
      lon: ride.pickup_lon,
    };
  }
  
  // Priorité 2 : Coordonnées du dropoff (si pas de pickup)
  if (ride.dropoff_lat && ride.dropoff_lon) {
    return {
      lat: ride.dropoff_lat,
      lon: ride.dropoff_lon,
    };
  }
  
  return null;
}

