import { describe, it, expect } from "vitest";
import {
  computeIndicativeRange,
  formatEUR,
  roundToFiftyCents,
  getPriceHintStatus,
} from "./pricing";

describe("roundToFiftyCents", () => {
  it("arrondit au 0,50 € le plus proche", () => {
    expect(roundToFiftyCents(31)).toBe(31);
    expect(roundToFiftyCents(31.2)).toBe(31);
    expect(roundToFiftyCents(31.25)).toBe(31.5);
    expect(roundToFiftyCents(31.3)).toBe(31.5);
    expect(roundToFiftyCents(31.8)).toBe(32);
  });
});

describe("computeIndicativeRange", () => {
  it("1 km : minimum 15 €, fourchette au moins 1 €", () => {
    const r = computeIndicativeRange(1);
    expect(r.currency).toBe("EUR");
    expect(r.low).toBe(15);
    expect(r.high).toBeGreaterThanOrEqual(r.low + 1);
    expect(r.high).toBe(16);
  });

  it("5 km : minimum 15 €", () => {
    const r = computeIndicativeRange(5);
    expect(r.low).toBe(15);
    expect(r.high).toBeGreaterThanOrEqual(16);
  });

  it("10 km : calcul sur la distance", () => {
    const r = computeIndicativeRange(10);
    expect(r.low).toBe(17); // 10*1.7 = 17
    expect(r.high).toBe(25); // 10*2.5 = 25
  });

  it("22 km : calcul sur la distance", () => {
    const r = computeIndicativeRange(22);
    expect(r.low).toBe(37.5); // 22*1.7 = 37.4 → 37.5
    expect(r.high).toBe(55);   // 22*2.5 = 55
  });

  it("80 km : fourchette large", () => {
    const r = computeIndicativeRange(80);
    expect(r.low).toBe(136);  // 80*1.7 = 136
    expect(r.high).toBe(200); // 80*2.5 = 200
  });
});

describe("formatEUR", () => {
  it("affiche sans décimales si entier", () => {
    expect(formatEUR(30)).toMatch(/30\s*€/);
    expect(formatEUR(136)).toMatch(/136\s*€/);
  });

  it("affiche les centimes si besoin", () => {
    const s = formatEUR(37.5);
    expect(s).toMatch(/37[,\s]50\s*€/);
  });
});

describe("getPriceHintStatus", () => {
  const range = { low: 30, high: 50, currency: "EUR" as const };

  it("retourne below si prix < low", () => {
    expect(getPriceHintStatus(25, range)).toBe("below");
  });

  it("retourne above si prix > high", () => {
    expect(getPriceHintStatus(55, range)).toBe("above");
  });

  it("retourne within si prix dans la fourchette", () => {
    expect(getPriceHintStatus(40, range)).toBe("within");
    expect(getPriceHintStatus(30, range)).toBe("within");
    expect(getPriceHintStatus(50, range)).toBe("within");
  });
});
