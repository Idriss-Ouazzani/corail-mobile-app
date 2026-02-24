"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon, Clock, Euro, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete, type AddressSuggestion } from "./AddressAutocomplete";
import { calculateDistanceKm } from "@/lib/distance";
import { computeIndicativeRange, formatEUR, roundToFiftyCents } from "@/lib/pricing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
})();

type Props = {
  driverId: string;
  driverDisplayName: string;
};

export function BookingFormChauffeur({ driverId, driverDisplayName }: Props) {
  const [departureAddress, setDepartureAddress] = useState<AddressSuggestion | null>(null);
  const [departureLabel, setDepartureLabel] = useState("");
  const [arrivalAddress, setArrivalAddress] = useState<AddressSuggestion | null>(null);
  const [arrivalLabel, setArrivalLabel] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [budgetChoice, setBudgetChoice] = useState<"median" | "custom" | null>(null);
  const [budget, setBudget] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [fallbackToMarketplace, setFallbackToMarketplace] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const distanceKm =
    departureAddress?.coordinates && arrivalAddress?.coordinates && date && time
      ? calculateDistanceKm(
          { lat: departureAddress.coordinates.lat, lon: departureAddress.coordinates.lon },
          { lat: arrivalAddress.coordinates.lat, lon: arrivalAddress.coordinates.lon }
        )
      : null;
  const indicativeRange = distanceKm != null && distanceKm > 0 ? computeIndicativeRange(distanceKm) : null;
  const medianEur = indicativeRange ? roundToFiftyCents((indicativeRange.low + indicativeRange.high) / 2) : 0;
  const budgetValue = budget !== "" ? parseFloat(budget.replace(",", ".")) : null;
  const effectiveBudget = budgetChoice === "median" ? String(medianEur) : budget;
  const firstName = driverDisplayName.split(" ")[0] || driverDisplayName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departureAddress?.label || !arrivalAddress?.label || !date || !time) {
      setSubmitError("Veuillez remplir les adresses, la date et l'heure.");
      setSubmitStatus("error");
      return;
    }
    if (!termsAccepted) {
      setSubmitError("Veuillez accepter les CGU et la politique de confidentialité.");
      setSubmitStatus("error");
      return;
    }
    const email = clientEmail.trim();
    const phone = clientPhone.trim().replace(/\s/g, "");
    if (!email) {
      setSubmitError("L'email est obligatoire pour recevoir la confirmation de réservation.");
      setSubmitStatus("error");
      return;
    }
    const budgetNum = parseFloat((effectiveBudget || "0").replace(",", "."));
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setSubmitError("Veuillez indiquer un budget.");
      setSubmitStatus("error");
      return;
    }
    setSubmitError(null);
    setSubmitStatus("loading");
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    try {
      const res = await fetch("/api/driver-ride-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_address: departureAddress.label,
          dropoff_address: arrivalAddress.label,
          scheduled_at: scheduledAt.toISOString(),
          price_cents: Math.round(budgetNum * 100),
          distance_km: distanceKm ?? undefined,
          notes: notes.trim() || undefined,
          client_name: clientName.trim() || undefined,
          client_email: email || undefined,
          client_phone: phone || undefined,
          preferred_driver_id: driverId,
          fallback_to_marketplace: fallbackToMarketplace,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || "Une erreur est survenue.");
        setSubmitStatus("error");
        return;
      }
      setSubmitStatus("success");
    } catch (err: unknown) {
      setSubmitError("Erreur réseau. Réessayez.");
      setSubmitStatus("error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-center text-[var(--muted-foreground)] mb-6">
        Votre demande sera envoyée à <strong className="text-[var(--foreground)]">{driverDisplayName}</strong>. Il pourra l&apos;accepter ou la refuser.
      </p>
      <form
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-lg space-y-6 overflow-hidden min-w-0 max-w-full"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <AddressAutocomplete
            label="Adresse de départ"
            placeholder="Ex: 10 Place du Capitole"
            value={departureLabel}
            onSelectAddress={(addr) => {
              setDepartureAddress(addr);
              setDepartureLabel(addr.label);
            }}
            onChangeText={setDepartureLabel}
          />
          <AddressAutocomplete
            label="Adresse d'arrivée"
            placeholder="Ex: Aéroport"
            value={arrivalLabel}
            onSelectAddress={(addr) => {
              setArrivalAddress(addr);
              setArrivalLabel(addr.label);
            }}
            onChangeText={setArrivalLabel}
          />
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-3 sm:gap-4 min-w-0">
          <div className="min-w-0 w-full overflow-hidden">
            <Label className="text-sm text-[var(--muted-foreground)]">Date</Label>
            <div className="mt-1 min-w-0 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] h-12 flex items-center">
              <input
                type="date"
                min={format(new Date(), "yyyy-MM-dd")}
                value={date ? format(date, "yyyy-MM-dd") : ""}
                onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full min-w-0 h-full px-3 py-0 rounded-xl border-0 bg-transparent text-[var(--foreground)] text-sm box-border [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="min-w-0 w-full overflow-hidden">
            <Label className="text-sm text-[var(--muted-foreground)]">Heure</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="mt-1 h-12 rounded-xl bg-[var(--background)] min-w-0 w-full max-w-full">
                <Clock className="w-4 h-4 mr-2 text-[var(--muted-foreground)]" />
                <SelectValue placeholder="Heure" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          {indicativeRange ? (
            <>
              <p className="text-sm text-[var(--muted-foreground)]">
                Fourchette indicative : {formatEUR(indicativeRange.low)} – {formatEUR(indicativeRange.high)}.
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={() => { setBudgetChoice("median"); setBudget(""); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                    budgetChoice === "median" ? "bg-[var(--primary)]/20 border-[var(--primary)]" : "border-[var(--border)]"
                  }`}
                >
                  Prix médian {formatEUR(medianEur)}
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetChoice("custom")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                    budgetChoice === "custom" ? "bg-[var(--primary)]/20 border-[var(--primary)]" : "border-[var(--border)]"
                  }`}
                >
                  Autre budget
                </button>
                {budgetChoice === "custom" && (
                  <div className="relative w-full min-w-[120px] max-w-[160px]">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                    <Input
                      type="number"
                      placeholder="45"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-9 pr-3 h-10 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <Label className="text-sm text-[var(--muted-foreground)]">Budget indicatif (€)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Euro className="w-4 h-4 text-[var(--muted-foreground)]" />
                <Input
                  type="number"
                  placeholder="Ex: 45"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="h-12 rounded-xl flex-1"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Label className="text-sm text-[var(--muted-foreground)]">Vos coordonnées</Label>
          <Input placeholder="Nom (facultatif)" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-12 rounded-xl" />
          <Input type="email" placeholder="Email *" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="h-12 rounded-xl" />
          <Input type="tel" placeholder="Téléphone *" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="h-12 rounded-xl" />
        </div>

        <div>
          <Label className="text-sm text-[var(--muted-foreground)]">Notes (facultatif)</Label>
          <textarea
            rows={2}
            placeholder="Informations pour le chauffeur..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] resize-none"
          />
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] min-w-0">
          <Checkbox
            id="fallback"
            checked={fallbackToMarketplace}
            onCheckedChange={(c) => setFallbackToMarketplace(c === true)}
            className="mt-0.5 shrink-0 size-5 border-2 border-[var(--primary)]/80 bg-[var(--background)]"
          />
          <Label htmlFor="fallback" className="text-sm leading-relaxed cursor-pointer">
            Si {firstName} n&apos;est pas disponible, acceptez-vous qu&apos;on vous propose un autre chauffeur du réseau ?
          </Label>
        </div>

        <div className="p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-2 text-sm text-[var(--muted-foreground)]">
          <p>Mode de paiement : à régler directement auprès du chauffeur.</p>
          <p>Pour toute modification ou annulation, contactez directement votre chauffeur.</p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] min-w-0">
          <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c === true)} className="mt-0.5 shrink-0 size-5 border-2 border-[var(--primary)]/80 bg-[var(--background)]" />
          <label htmlFor="terms" className="text-sm text-[var(--muted-foreground)] leading-relaxed cursor-pointer min-w-0 flex-1 font-normal block">
            J&apos;accepte les <Link href="/cgu" className="text-[var(--primary)] underline" target="_blank" rel="noopener noreferrer">CGU</Link> et la{" "}
            <Link href="/confidentialite" className="text-[var(--primary)] underline" target="_blank" rel="noopener noreferrer">Politique de confidentialité</Link>.
          </label>
        </div>

        {submitStatus === "success" && (
          <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-700 dark:text-green-400 text-center">
            Votre demande a été envoyée à {driverDisplayName}. Il vous recontactera pour confirmer.
          </div>
        )}
        {submitStatus === "error" && submitError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-center">
            {submitError}
          </div>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={submitStatus === "loading"}
          className="w-full h-14 rounded-xl font-medium"
        >
          {submitStatus === "loading" ? "Envoi…" : "Envoyer ma demande"}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </form>
    </div>
  );
}
