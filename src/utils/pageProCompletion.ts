/**
 * Calcul de complétion et éligibilité à l'activation pour Ma Page Pro.
 * Pondération : 10 points par critère (total 100).
 * Seuil d'activation : >= 70% ET champs obligatoires remplis.
 */

const WEIGHTS = {
  photo: 10,
  bio: 10,
  zone_city: 10,
  slug: 10,
  vehicle_brand: 10,
  vehicle_model: 10,
  vehicle_year: 10,
  vehicle_seats: 10,
  services: 10,   // au moins 1
  amenities: 10,  // au moins 1
} as const;

export interface PageProFormData {
  photoUrl: string;
  bio: string;
  zoneCity: string;
  slug: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleSeats: number | null;
  services: string[];
  amenities: string[];
}

const ACTIVATION_THRESHOLD = 70;

/** Champs obligatoires pour activer (tous doivent être ok) */
const REQUIRED_FOR_ACTIVATION: (keyof PageProFormData)[] = [
  'slug',
  'zoneCity',
  'bio',
  'vehicleBrand',
  'vehicleModel',
  'vehicleYear',
  'vehicleSeats',
];

const MISSING_LABELS: Record<string, string> = {
  photo: 'Ajoutez une photo',
  bio: 'Renseignez la bio / présentation',
  zone_city: 'Indiquez votre ville',
  slug: 'Définissez le lien de votre page',
  vehicle_brand: 'Indiquez la marque du véhicule',
  vehicle_model: 'Indiquez le modèle du véhicule',
  vehicle_year: 'Indiquez l\'année du véhicule',
  vehicle_seats: 'Renseignez le nombre de places',
  services: 'Ajoutez au moins un service',
  amenities: 'Ajoutez au moins un équipement',
};

export function getCompletionScore(data: PageProFormData): number {
  let score = 0;
  if (data.photoUrl?.trim()) score += WEIGHTS.photo;
  if (data.bio?.trim()) score += WEIGHTS.bio;
  if (data.zoneCity?.trim()) score += WEIGHTS.zone_city;
  if (data.slug?.trim()) score += WEIGHTS.slug;
  if (data.vehicleBrand?.trim()) score += WEIGHTS.vehicle_brand;
  if (data.vehicleModel?.trim()) score += WEIGHTS.vehicle_model;
  if (data.vehicleYear?.trim()) score += WEIGHTS.vehicle_year;
  if (data.vehicleSeats != null && data.vehicleSeats >= 2 && data.vehicleSeats <= 7) score += WEIGHTS.vehicle_seats;
  if (data.services.length >= 1) score += WEIGHTS.services;
  if (data.amenities.length >= 1) score += WEIGHTS.amenities;
  return Math.min(100, score);
}

export function getMissingForActivation(data: PageProFormData): string[] {
  const missing: string[] = [];
  if (!data.photoUrl?.trim()) missing.push(MISSING_LABELS.photo);
  if (!data.bio?.trim()) missing.push(MISSING_LABELS.bio);
  if (!data.zoneCity?.trim()) missing.push(MISSING_LABELS.zone_city);
  if (!data.slug?.trim()) missing.push(MISSING_LABELS.slug);
  if (!data.vehicleBrand?.trim()) missing.push(MISSING_LABELS.vehicle_brand);
  if (!data.vehicleModel?.trim()) missing.push(MISSING_LABELS.vehicle_model);
  if (!data.vehicleYear?.trim()) missing.push(MISSING_LABELS.vehicle_year);
  if (data.vehicleSeats == null || data.vehicleSeats < 2 || data.vehicleSeats > 7) missing.push(MISSING_LABELS.vehicle_seats);
  if (data.services.length < 1) missing.push(MISSING_LABELS.services);
  if (data.amenities.length < 1) missing.push(MISSING_LABELS.amenities);
  return missing;
}

export function isEligibleForActivation(data: PageProFormData): boolean {
  const score = getCompletionScore(data);
  if (score < ACTIVATION_THRESHOLD) return false;
  const missing = getMissingForActivation(data);
  return missing.length === 0;
}

export function getPageProStatus(data: PageProFormData, isPublic: boolean): 'inactive' | 'incomplete' | 'active' {
  if (!isPublic) return 'inactive';
  const score = getCompletionScore(data);
  if (score >= ACTIVATION_THRESHOLD && getMissingForActivation(data).length === 0) return 'active';
  return 'incomplete';
}
