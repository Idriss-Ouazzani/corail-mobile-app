/**
 * Estimation indicative de prix VTC/taxi en France
 *
 * Ce module fournit une fourchette indicative basée uniquement sur la distance (km).
 * Aucune donnée trafic ni durée n'est utilisée. Les valeurs sont PROVISOIRES et
 * purement informatives : elles ne fixent pas de prix et chaque chauffeur reste
 * libre de proposer son propre tarif.
 */

/** Minimum de course (règle indicative nationale provisoire). */
const MIN_FARE_EUR = 15;

/** Tarif bas indicatif (€/km). */
const RATE_LOW_EUR_PER_KM = 1.7;

/** Tarif haut indicatif (€/km). */
const RATE_HIGH_EUR_PER_KM = 2.5;

export type IndicativeRange = {
  low: number;
  high: number;
  currency: 'EUR';
};

/**
 * Arrondit au 0,50 € le plus proche.
 * Ex. : 31.2 → 31, 31.3 → 31.5, 31.8 → 32
 */
export function roundToFiftyCents(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * Calcule la fourchette indicative (min–max) à partir de la distance en km.
 * Règle : minimum 30 €, puis distance × tarif bas/haut ; fourchette d'au moins 1 €.
 */
export function computeIndicativeRange(distanceKm: number): IndicativeRange {
  const rawLow = Math.max(MIN_FARE_EUR, distanceKm * RATE_LOW_EUR_PER_KM);
  const rawHigh = Math.max(MIN_FARE_EUR, distanceKm * RATE_HIGH_EUR_PER_KM);
  const low = roundToFiftyCents(rawLow);
  let high = roundToFiftyCents(rawHigh);
  if (high < low + 1) {
    high = roundToFiftyCents(low + 1);
  }
  return { low, high, currency: 'EUR' };
}

/**
 * Formate un montant en euros (locale fr-FR).
 * Sans décimales si .00, sinon deux décimales (ex. 45,50 €).
 */
export function formatEUR(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const hasCents = Math.abs(rounded - Math.round(rounded)) > 0.001;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/**
 * Compare un prix saisi à la fourchette indicative (pour affichage chauffeur).
 * Retourne 'below' | 'above' | 'within'.
 */
export function getPriceHintStatus(
  priceEur: number,
  range: IndicativeRange
): 'below' | 'above' | 'within' {
  if (priceEur < range.low) return 'below';
  if (priceEur > range.high) return 'above';
  return 'within';
}
