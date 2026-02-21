import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { computeIndicativeRange, formatEUR, getPriceHintStatus } from '../lib/pricing';

interface PriceHintChauffeurProps {
  /** Distance du trajet en km (déjà calculée). */
  distanceKm: number | null | undefined;
  /** Prix saisi par le chauffeur (€). Si non renseigné ou 0, on n'affiche que la fourchette. */
  priceEur: number | null | undefined;
}

/**
 * Calcule la position du prix sur la barre (0–100 %).
 */
function getPositionPercent(priceEur: number, low: number, high: number): number {
  const span = high - low;
  if (span <= 0) return 50;
  if (priceEur <= low) return 0;
  if (priceEur >= high) return 100;
  return Math.round(((priceEur - low) / span) * 100);
}

/**
 * Affiche la fourchette indicative avec une barre et un repère pour le prix saisi.
 * Formulation professionnelle (vouvoiement). Purement informatif : ne bloque jamais la saisie.
 */
export function PriceHintChauffeur({ distanceKm, priceEur }: PriceHintChauffeurProps) {
  if (distanceKm == null || distanceKm <= 0 || !Number.isFinite(distanceKm)) {
    return null;
  }

  const range = computeIndicativeRange(distanceKm);
  const lowStr = formatEUR(range.low);
  const highStr = formatEUR(range.high);

  const hasPrice = priceEur != null && Number.isFinite(priceEur) && priceEur > 0;
  const status = hasPrice ? getPriceHintStatus(priceEur, range) : null;
  const positionPercent = hasPrice ? getPositionPercent(priceEur, range.low, range.high) : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Fourchette indicative</Text>
      <View style={styles.barWrap}>
        <View style={styles.bar}>
          {positionPercent != null && (
            <View
              style={[
                styles.barMarker,
                { left: `${positionPercent}%`, marginLeft: -10 },
              ]}
            />
          )}
        </View>
        <View style={styles.barLabels}>
          <Text style={styles.barLabel}>{range.low} €</Text>
          <Text style={styles.barLabel}>{range.high} €</Text>
        </View>
      </View>
      <Text style={styles.helper}>
        Le tarif reste à votre libre appréciation.
      </Text>
      {status === 'below' && (
        <Text style={styles.warning}>En dessous de la fourchette indicative</Text>
      )}
      {status === 'above' && (
        <Text style={styles.warning}>Au-dessus de la fourchette indicative</Text>
      )}
      {status === 'within' && (
        <Text style={styles.within}>Dans la fourchette indicative</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  barWrap: {
    marginBottom: 10,
  },
  bar: {
    height: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 8,
    overflow: 'visible' as const,
    position: 'relative' as const,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  barMarker: {
    position: 'absolute' as const,
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  helper: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  warning: {
    fontSize: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  within: {
    fontSize: 12,
    color: '#10b981',
  },
});
