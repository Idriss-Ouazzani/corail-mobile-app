"use client";

import { computeIndicativeRange, formatEUR } from "@/lib/pricing";

interface PriceHintProps {
  /** Distance en km (à vol d'oiseau ou itinéraire). Si null/undefined/≤0, le composant ne s'affiche pas. */
  distanceKm: number | null | undefined;
  /** Classe optionnelle pour le conteneur */
  className?: string;
}

/**
 * Affiche une estimation indicative de prix (fourchette) basée sur la distance.
 * Texte informatif uniquement ; ne fixe pas de prix.
 */
export function PriceHint({ distanceKm, className }: PriceHintProps) {
  if (distanceKm == null || distanceKm <= 0 || !Number.isFinite(distanceKm)) {
    return null;
  }

  const range = computeIndicativeRange(distanceKm);
  const lowStr = formatEUR(range.low);
  const highStr = formatEUR(range.high);

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-foreground">
        Estimation indicative : {lowStr} – {highStr}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Fourchette indicative basée sur la distance. Vous pouvez indiquer un budget ;
        les chauffeurs à proximité pourront l&apos;accepter ou vous faire une proposition.
      </p>
    </div>
  );
}
