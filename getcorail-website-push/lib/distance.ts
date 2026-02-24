/**
 * Distance à vol d'oiseau entre deux points GPS (formule de Haversine).
 * Utilisé pour une estimation indicative ; l'itinéraire réel peut différer.
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcule la distance entre deux coordonnées en kilomètres.
 */
export function calculateDistanceKm(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Rayon de la Terre en km
  const lat1 = toRadians(point1.lat);
  const lat2 = toRadians(point2.lat);
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lon - point1.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 décimale
}
